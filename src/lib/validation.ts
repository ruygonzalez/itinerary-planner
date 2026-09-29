import type { CityId, MealSlot, Place, ScheduledStop, TravelMatrix } from '../types'
import { getAvailability, fitsOpeningHours, nextOpenSlots } from './hours'
import { getTravelLeg } from './travel'
import { dateRangeError, datesInRange, timeLabel } from './dates'
import { mealWindows, resolveMealSlot } from './meals'

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
}

export interface PlacementResult {
  ok: boolean
  message: string
  tentative: boolean
  meal?: MealSlot
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
}: PlacementInput): PlacementResult {
  const invalid = (message: string): PlacementResult => ({
    ok: false,
    message,
    tentative: false,
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
    return invalid(place.name + ' is closed on this date.')
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
    )
  }

  const remaining = events.filter((event) => event.id !== ignoreId)
  if (place.kind !== 'food' && remaining.some((event) => event.date === date && event.placeId === place.id)) {
    return invalid('This activity is already planned for that day.')
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
        }).ok,
    ) ?? null
  )
}
