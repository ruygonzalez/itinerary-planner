import type { CityId, MealSlot, Place, PlanSettings, ScheduledStop, TravelMatrix } from '../types'
import { stopBudget } from './costs'
import { formatDistance } from './distance'
import { getAvailability, fitsOpeningHours, nextOpenSlots } from './hours'
import { dayWalking, getTravelLeg } from './travel'
import { dateLabel, dateRangeError, datesInRange, timeLabel } from './dates'
import { mealWindows, resolveMealSlot } from './meals'
import { formatUsd, type ExchangeQuote } from '../services/exchange'

export const DAY_START = 7 * 60
export const DAY_END = 22 * 60

export interface PlacementInput {
  place: Place
  date: string
  start: number
  events: ScheduledStop[]
  lookup: Record<string, Place>
  matrix?: TravelMatrix | null
  startDate: string
  endDate: string
  ignoreId?: string
  cityId?: CityId
  meal?: MealSlot
  settings?: PlanSettings
  quote?: ExchangeQuote
}

export interface PlacementResult {
  ok: boolean
  message: string
  tentative: boolean
  meal?: MealSlot
  reason?: 'budget' | 'walking' | 'duplicate' | 'hours' | 'time'
}

export function validatePlacement({
  place,
  date,
  start,
  events,
  lookup,
  matrix,
  startDate,
  endDate,
  ignoreId,
  cityId,
  meal,
  settings,
  quote,
}: PlacementInput): PlacementResult {
  const invalid = (message: string, reason: PlacementResult['reason'] = 'time'): PlacementResult => ({
    ok: false,
    message,
    tentative: false,
    reason,
  })
  if (dateRangeError(startDate, endDate) || !datesInRange(startDate, endDate).includes(date)) {
    return invalid('Choose a day within your selected trip.')
  }
  if ((cityId && place.cityId !== cityId) || lookup[place.id]?.cityId !== place.cityId) {
    return invalid('That stop belongs to a different city.')
  }
  if (
    !Number.isFinite(start) ||
    start < DAY_START ||
    start + place.duration > DAY_END
  ) {
    return invalid('Use a time between 07:00 and 22:00.')
  }

  const resolvedMeal = place.kind === 'food' ? resolveMealSlot(place, start, meal) : null
  if (place.kind === 'food' && !resolvedMeal) {
    return invalid('Choose a time for a meal this restaurant serves (breakfast 07:30–10:00, lunch 12:00–14:00, dinner 18:00–20:30).')
  }
  if (place.kind !== 'food' && meal) return invalid('Only restaurants can be assigned a meal.')

  const availability = getAvailability(place, date)
  if (availability.status === 'closed') {
    return invalid(place.name + ' is closed on this date.', 'hours')
  }
  if (!fitsOpeningHours(availability, start, place.duration)) {
    return invalid(
      place.name +
        ' does not fit its ' +
        (availability.status === 'flexible' ? 'suggested visit window.' : 'listed hours.') +
        ' Try ' +
        availability.windows
          .map((window) => timeLabel(window.open) + '–' + timeLabel(window.close))
          .join(' or ') +
      '.',
      'hours',
    )
  }

  const remaining = events.filter((event) => event.id !== ignoreId)
  if (place.kind !== 'food' && remaining.some((event) => event.placeId === place.id)) {
    return invalid(place.name + ' is already in your itinerary. Move its existing stop instead.', 'duplicate')
  }

  if (settings && quote) {
    const budget = stopBudget(place, date, events, lookup, settings, quote, ignoreId)
    if (budget.exceeded) {
      return invalid(
        place.name + ' would bring ' + budget.category + ' spending on ' +
        dateLabel(date, { weekday: 'short', month: 'short', day: 'numeric' }) + ' to ' +
        formatUsd(budget.totalUsd!) + ' per person — ' +
        formatUsd(budget.totalUsd! - budget.capUsd) + ' over the ' +
        formatUsd(budget.capUsd) + ' daily limit. Choose another day or change the limit.',
        'budget',
      )
    }
  }

  const sameDay = remaining
    .filter((event) => event.date === date)
    .sort((a, b) => a.start - b.start)

  for (const event of sameDay) {
    const existing = lookup[event.placeId]
    if (!existing) continue
    const eventEnd = event.start + event.duration
    const end = start + place.duration
    if (start < eventEnd && event.start < end) {
      return invalid('That time overlaps with ' + existing.name + '.')
    }
  }

  const before = sameDay.filter((event) => event.start + event.duration <= start).at(-1)
  const after = sameDay.find((event) => event.start >= start + place.duration)
  if (before && lookup[before.placeId]) {
    const previous = lookup[before.placeId]
    const leg = getTravelLeg(previous, place, matrix)
    if (before.start + before.duration + leg.minutes > start) {
      return invalid(
        'Allow ' + leg.minutes + ' min to walk from ' + previous.name + ' to ' + place.name + '.',
      )
    }
  }
  if (after && lookup[after.placeId]) {
    const next = lookup[after.placeId]
    const leg = getTravelLeg(place, next, matrix)
    if (start + place.duration + leg.minutes > after.start) {
      return invalid(
        'Allow ' + leg.minutes + ' min to walk from ' + place.name + ' to ' + next.name + '.',
      )
    }
  }

  if (settings) {
    const candidate: ScheduledStop = {
      id: ignoreId ?? 'placement-preview', placeId: place.id, date, start,
      duration: place.duration, pinned: true, origin: 'manual', meal: resolvedMeal ?? undefined,
    }
    const walking = dayWalking([...sameDay, candidate], lookup, matrix)
    if (walking.meters > settings.maxWalkingMeters + 0.00001) {
      return invalid(
        place.name + ' would require about ' + formatDistance(walking.meters, settings.distanceUnit) +
        ' of walking between and at stops on ' + dateLabel(date, { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' (' + walking.minutes + ' min), beyond your ' +
        formatDistance(settings.maxWalkingMeters, settings.distanceUnit) +
        ' daily limit. Try another day or raise the limit.',
        'walking',
      )
    }
  }

  return {
    ok: true,
    message:
      availability.status === 'tentative'
        ? 'Added tentatively. Confirm the holiday hours before you go.'
        : 'Added to your itinerary.',
    tentative: availability.status === 'tentative',
    meal: resolvedMeal ?? undefined,
  }
}

export function suggestStart(
  place: Place,
  date: string,
  events: ScheduledStop[],
  lookup: Record<string, Place>,
  matrix: TravelMatrix | null,
  startDate: string,
  endDate: string,
  settings?: PlanSettings,
  quote?: ExchangeQuote,
): number | null {
  const preferred = place.kind !== 'food'
    ? 9 * 60 + 30
    : place.mealSlots?.includes('breakfast')
      ? mealWindows.breakfast.target
      : place.mealSlots?.includes('lunch')
        ? mealWindows.lunch.target
        : place.mealSlots?.includes('dinner')
          ? mealWindows.dinner.target
          : 15 * 60
  const choices = nextOpenSlots(place, date, DAY_START, DAY_END - place.duration).sort(
    (a, b) => Math.abs(a - preferred) - Math.abs(b - preferred),
  )
  return (
    choices.find(
      (start) =>
        validatePlacement({
          place,
          date,
          start,
          events,
          lookup,
          matrix,
          startDate,
          endDate,
          settings,
          quote,
        }).ok,
    ) ?? null
  )
}
