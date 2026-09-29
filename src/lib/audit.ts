import type { CityId, DistanceUnit, Place, PlanSettings, RequiredMeal, ScheduledStop, TravelMatrix } from '../types'
import { dayCosts, type DayCosts } from './costs'
import { formatDistance } from './distance'
import { fitsOpeningHours, getAvailability } from './hours'
import { isRequiredMeal, MAX_MEAL_WALK_METERS, MAX_MEAL_WALK_MINUTES, mealWindows, requiredMeals } from './meals'
import { dayWalking, getTravelLeg, type DailyWalking } from './travel'
import { formatUsd, type ExchangeQuote } from '../services/exchange'

export interface ConstraintIssue {
  code: string
  severity: 'error' | 'caution'
  message: string
  stopIds?: string[]
}

export interface DayAudit {
  date: string
  costs: DayCosts
  walking: DailyWalking
  meals: Record<RequiredMeal, number>
  attractions: number
  issues: ConstraintIssue[]
  complete: boolean
}

interface AuditInput {
  date: string
  cityId: CityId
  events: ScheduledStop[]
  lookup: Record<string, Place>
  settings: PlanSettings
  matrix?: TravelMatrix | null
  quote: ExchangeQuote
}

export function mealProximityIssues(
  events: ScheduledStop[],
  lookup: Record<string, Place>,
  matrix?: TravelMatrix | null,
  requireNeighbors = true,
  unit: DistanceUnit = 'km',
): ConstraintIssue[] {
  const ordered = [...events].sort((a, b) => a.start - b.start)
  const attractions = ordered.filter((event) => lookup[event.placeId]?.kind !== 'food')
  const issues: ConstraintIssue[] = []
  for (const meal of ordered.filter((event) => isRequiredMeal(event.meal))) {
    const slot = meal.meal as RequiredMeal
    const place = lookup[meal.placeId]
    if (!place) continue
    const before = attractions.filter((event) => event.start + event.duration <= meal.start).at(-1)
    const after = attractions.find((event) => event.start >= meal.start + meal.duration)
    const neighbors = [
      { event: before, side: 'before', required: slot !== 'breakfast' },
      { event: after, side: 'after', required: slot !== 'dinner' },
    ] as const
    for (const { event, side, required } of neighbors) {
      if (!event) {
        if (requireNeighbors && required) issues.push({
          code: `meal-${side}-missing`, severity: 'error', stopIds: [meal.id],
          message: `${slot[0].toUpperCase() + slot.slice(1)} needs an activity ${side} it.`,
        })
        continue
      }
      const attraction = lookup[event.placeId]
      const leg = side === 'before'
        ? getTravelLeg(attraction, place, matrix)
        : getTravelLeg(place, attraction, matrix)
      if (leg.minutes > MAX_MEAL_WALK_MINUTES || leg.meters > MAX_MEAL_WALK_METERS) {
        issues.push({
          code: 'meal-too-far', severity: 'error', stopIds: [meal.id, event.id],
          message: slot[0].toUpperCase() + slot.slice(1) + ' at ' + place.name + ' is ' +
            leg.minutes + ' min / ' + formatDistance(leg.meters, unit) + ' from ' +
            attraction.name + ' ' + side + ' it (limit ' + MAX_MEAL_WALK_MINUTES +
            ' min and ' + formatDistance(MAX_MEAL_WALK_METERS, unit) + ').',
        })
      }
    }
  }
  return issues
}

export function auditDay({ date, cityId, events, lookup, settings, matrix, quote }: AuditInput): DayAudit {
  const ordered = events.filter((event) => event.date === date).sort((a, b) => a.start - b.start)
  const costs = dayCosts(ordered, lookup, quote)
  const walking = dayWalking(ordered, lookup, matrix)
  const meals: Record<RequiredMeal, number> = { breakfast: 0, lunch: 0, dinner: 0 }
  const issues: ConstraintIssue[] = []
  const attractions = ordered.filter((event) => lookup[event.placeId]?.kind !== 'food').length
  const activityCounts = new Map<string, number>()
  for (const event of events) {
    if (lookup[event.placeId]?.kind !== 'food') {
      activityCounts.set(event.placeId, (activityCounts.get(event.placeId) ?? 0) + 1)
    }
  }

  for (const event of ordered) {
    const place = lookup[event.placeId]
    if (!place || place.cityId !== cityId) {
      issues.push({ code: 'city-mismatch', severity: 'error', message: 'A stop does not belong to this city.', stopIds: [event.id] })
      continue
    }
    if (place.kind !== 'food' && (activityCounts.get(place.id) ?? 0) > 1) {
      issues.push({
        code: 'duplicate-activity', severity: 'error',
        message: place.name + ' appears more than once in this city itinerary. Keep only one visit.',
        stopIds: [event.id],
      })
    }
    const availability = getAvailability(place, date)
    if (availability.status === 'closed' || !fitsOpeningHours(availability, event.start, event.duration)) {
      issues.push({ code: 'closed', severity: 'error', message: `${place.name} is outside its listed opening window.`, stopIds: [event.id] })
    } else if (availability.status === 'tentative') {
      issues.push({ code: 'holiday-unconfirmed', severity: 'caution', message: `Confirm ${place.name} holiday hours before relying on this stop.`, stopIds: [event.id] })
    }
    if (place.kind === 'food') {
      if (isRequiredMeal(event.meal)) {
        meals[event.meal] += 1
        const window = mealWindows[event.meal]
        if (!place.mealSlots?.includes(event.meal) || event.start < window.earliest || event.start > window.latest) {
          issues.push({ code: 'meal-window', severity: 'error', message: `${place.name} does not serve ${event.meal} at this time.`, stopIds: [event.id] })
        }
      } else if (event.meal !== 'snack' || !place.mealSlots?.includes('snack')) {
        issues.push({ code: 'meal-role', severity: 'error', message: `Assign ${place.name} to breakfast, lunch or dinner.`, stopIds: [event.id] })
      }
    }
  }

  for (const meal of requiredMeals) {
    if (meals[meal] !== 1) issues.push({
      code: `meal-count-${meal}`, severity: 'error',
      message: `Exactly one ${meal} is required (currently ${meals[meal]}).`,
    })
  }
  if (attractions < 2) issues.push({
    code: 'activity-count', severity: 'error',
    message: `Plan at least two non-meal activities around lunch (currently ${attractions}).`,
  })

  issues.push(...mealProximityIssues(ordered, lookup, matrix, true, settings.distanceUnit))
  for (let index = 1; index < ordered.length; index += 1) {
    const from = ordered[index - 1]
    const to = ordered[index]
    if (!lookup[from.placeId] || !lookup[to.placeId]) continue
    const travel = getTravelLeg(lookup[from.placeId], lookup[to.placeId], matrix)
    if (from.start + from.duration + travel.minutes > to.start) {
      issues.push({ code: 'transfer-conflict', severity: 'error', message: `Allow ${travel.minutes} min between ${lookup[from.placeId].name} and ${lookup[to.placeId].name}.`, stopIds: [from.id, to.id] })
    }
  }
  if (costs.unpriced.length) issues.push({
    code: 'unknown-cost', severity: 'error',
    message: `No verified admission/meal estimate for ${[...new Set(costs.unpriced.map((place) => place.name))].join(', ')}; the budget cannot be checked.`,
  })
  if (costs.mealsUsd > settings.maxMealsUsd + 0.00001) issues.push({
    code: 'meal-budget', severity: 'error',
    message: `Meals are about ${formatUsd(costs.mealsUsd)} per person, over the ${formatUsd(settings.maxMealsUsd)} daily limit.`,
  })
  if (costs.activitiesUsd > settings.maxActivitiesUsd + 0.00001) issues.push({
    code: 'activity-budget', severity: 'error',
    message: `Activities are about ${formatUsd(costs.activitiesUsd)} per person, over the ${formatUsd(settings.maxActivitiesUsd)} daily limit.`,
  })
  if (walking.meters > settings.maxWalkingMeters + 0.00001) issues.push({
    code: 'walking-budget', severity: 'error',
    message: 'This day needs about ' + formatDistance(walking.meters, settings.distanceUnit) +
      ' of walking between and at activities (' + walking.minutes + ' min), over the ' +
      formatDistance(settings.maxWalkingMeters, settings.distanceUnit) + ' daily limit.',
  })
  return {
    date, costs, walking, meals, attractions, issues,
    complete: !issues.some((issue) => issue.severity === 'error'),
  }
}

export function overlappingCityDates(
  ranges: { cityId: CityId; dates: string[] }[],
): { date: string; cities: CityId[] }[] {
  const byDate = new Map<string, CityId[]>()
  for (const range of ranges) for (const date of range.dates) {
    byDate.set(date, [...(byDate.get(date) ?? []), range.cityId])
  }
  return [...byDate].filter(([, ids]) => ids.length > 1).map(([date, cities]) => ({ date, cities }))
}
