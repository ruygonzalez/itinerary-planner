import { describe, expect, it } from 'vitest'
import { places, placesById } from '../../data/places'
import { datesInRange } from '../dates'
import { generateItinerary } from '../generator'
import { getAvailability } from '../hours'
import { estimatedMatrix } from '../../services/routing'
import { validatePlacement } from '../validation'
import type { PlanSettings, ScheduledStop } from '../../types'

const dates = datesInRange('2026-12-22', '2026-12-25')
const matrix = estimatedMatrix(places)
const settings: PlanSettings = {
  pace: 'balanced',
  interest: 'all',
  includeTentativeMeals: true,
  savedIds: [],
}
const generate = (seed: number, overrides: Partial<PlanSettings> = {}, pinned: ScheduledStop[] = []) =>
  generateItinerary({
    dates,
    places,
    pinned,
    settings: { ...settings, ...overrides },
    matrix,
    seed,
  })

describe('random-restart multi-day itinerary', () => {
  it('schedules every stop inside hours with enough walking time', () => {
    const events = generate(42)
    expect(events.length).toBeGreaterThan(10)
    expect(new Set(events.map((event) => event.date))).toEqual(new Set(dates))
    for (const event of events) {
      const place = placesById[event.placeId]
      expect(getAvailability(place, event.date).status).not.toBe('closed')
      expect(
        validatePlacement({
          place,
          date: event.date,
          start: event.start,
          events,
          lookup: placesById,
          matrix,
          startDate: dates[0],
          endDate: dates.at(-1)!,
          ignoreId: event.id,
        }).ok,
      ).toBe(true)
    }
    for (const date of dates) {
      const food = events.filter(
        (event) => event.date === date && placesById[event.placeId].kind === 'food',
      )
      expect(new Set(food.map((event) => event.placeId)).size).toBe(food.length)
    }
    const mealCounts = new Map<string, number>()
    for (const event of events.filter((stop) => placesById[stop.placeId].kind === 'food')) {
      mealCounts.set(event.placeId, (mealCounts.get(event.placeId) ?? 0) + 1)
    }
    expect(Math.max(...mealCounts.values())).toBeLessThanOrEqual(2)
  }, 30000)

  it('preserves pinned stops and changes the unpinned mix across seeds', () => {
    const pinned: ScheduledStop = {
      id: 'my-acropolis',
      placeId: 'acropolis',
      date: '2026-12-22',
      start: 540,
      duration: 105,
      pinned: true,
      origin: 'manual',
    }
    const variants = [1, 2, 3].map((seed) => generate(seed, {}, [pinned]))
    expect(variants.every((events) => events.some((event) => event.id === pinned.id))).toBe(true)
    const signatures = variants.map((events) =>
      events.map((event) => [event.date, event.placeId, event.start].join(':')).join('|'),
    )
    expect(new Set(signatures).size).toBeGreaterThan(1)
  }, 30000)

  it('can omit unverified Christmas meals when asked', () => {
    const events = generate(72, { includeTentativeMeals: false })
    expect(
      events.filter(
        (event) =>
          event.date === '2026-12-25' && placesById[event.placeId].kind === 'food',
      ),
    ).toHaveLength(0)
  }, 30000)
})
