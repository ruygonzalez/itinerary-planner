import { describe, expect, it } from 'vitest'
import { destinations } from '../../data/destinations'
import { auditDay } from '../audit'
import { datesInRange } from '../dates'
import { generateItinerary } from '../generator'
import { snapshotRates } from '../../services/exchange'
import { estimatedMatrix } from '../../services/routing'
import { defaultSettings } from '../storage'
import type { ScheduledStop } from '../../types'

const setup = (city: (typeof destinations)[number]) => ({
  cityId: city.id,
  dates: datesInRange(city.dates.start, city.dates.end),
  places: city.places,
  matrix: estimatedMatrix(city.places),
  quote: snapshotRates,
  settings: defaultSettings(),
})

describe('multi-city randomized itinerary', () => {
  for (const city of destinations) {
    it(`fills each ${city.name} day with exactly three nearby, open and affordable meals`, () => {
      const input = setup(city)
      for (const seed of [1, 42, 719]) {
        const result = generateItinerary({ ...input, pinned: [], seed })
        expect(result.failedDates).toEqual([])
        expect(result.events.length).toBeGreaterThanOrEqual(input.dates.length * 5)
        const activities = result.events.filter((event) => city.lookup[event.placeId].kind !== 'food')
        expect(new Set(activities.map((event) => event.placeId)).size).toBe(activities.length)
        for (const date of input.dates) {
          const audit = auditDay({
            date, cityId: city.id, events: result.events, lookup: city.lookup,
            settings: input.settings, matrix: input.matrix, quote: input.quote,
          })
          expect(audit.issues.filter((issue) => issue.severity === 'error')).toEqual([])
          expect(audit.meals).toEqual({ breakfast: 1, lunch: 1, dinner: 1 })
          expect(audit.costs.mealsUsd).toBeLessThanOrEqual(input.settings.maxMealsUsd)
          expect(audit.costs.activitiesUsd).toBeLessThanOrEqual(input.settings.maxActivitiesUsd)
          expect(audit.walking.meters).toBeLessThanOrEqual(input.settings.maxWalkingMeters)
        }
      }
    }, 60000)
  }

  it('can build a complete Cairo Saturday without other days', () => {
    const city = destinations[1]
    const result = generateItinerary({ ...setup(city), dates: ['2026-12-26'], pinned: [], seed: 1 })
    expect(result.failedDates).toEqual([])
  })

  it('accepts a feasible Cairo downtown meal/activity chain', () => {
    const city = destinations[1]
    const plan = [
      ['cairo-el-abd', 495, 'breakfast'],
      ['cairo-tahrir', 570, undefined],
      ['cairo-abou-tarek', 765, 'lunch'],
      ['cairo-egyptian-museum', 855, undefined],
      ['cairo-eish-malh', 1110, 'dinner'],
    ] as const
    const events: ScheduledStop[] = plan.map(([placeId, start, meal], index) => ({
      id: `manual-${index}`, placeId, date: '2026-12-26', start,
      duration: city.lookup[placeId].duration, pinned: true, origin: 'manual', meal,
    }))
    const audit = auditDay({
      date: '2026-12-26', cityId: city.id, events, lookup: city.lookup,
      settings: defaultSettings(), matrix: estimatedMatrix(city.places), quote: snapshotRates,
    })
    expect(audit.issues.filter((issue) => issue.severity === 'error')).toEqual([])
  })

  it('keeps pinned stops and produces a different compliant mix for different seeds', () => {
    const city = destinations[0]
    const pinned: ScheduledStop = {
      id: 'my-acropolis', placeId: 'acropolis', date: '2026-12-22',
      start: 540, duration: 105, pinned: true, origin: 'manual',
    }
    const results = [11, 51, 81].map((seed) =>
      generateItinerary({ ...setup(city), pinned: [pinned], seed }))
    expect(results.every((result) => result.events.some((event) => event.id === pinned.id))).toBe(true)
    expect(results.every((result) => !result.failedDates.length)).toBe(true)
    expect(new Set(results.map((result) => result.events.map((event) =>
      `${event.date}:${event.placeId}:${event.start}`).join('|'))).size).toBeGreaterThan(1)
  }, 60000)

  it('never invents an over-budget or tentative-holiday meal itinerary', () => {
    const athens = destinations[0]
    const cheap = generateItinerary({
      ...setup(athens), settings: { ...defaultSettings(), maxMealsUsd: 0 },
      pinned: [], seed: 12,
    })
    expect(cheap.failedDates).toEqual(setup(athens).dates)
    expect(cheap.events).toEqual([])

    const withoutUnconfirmed = generateItinerary({
      ...setup(athens), settings: { ...defaultSettings(), includeTentativeMeals: false },
      pinned: [], seed: 13,
    })
    expect(withoutUnconfirmed.failedDates).toContain('2026-12-24')
    expect(withoutUnconfirmed.events.some((event) => event.date === '2026-12-24')).toBe(false)
  }, 60000)

  it('does not generate an itinerary with a walking allowance too small for any activity', () => {
    const athens = destinations[0]
    const result = generateItinerary({
      ...setup(athens), settings: { ...defaultSettings(), maxWalkingMeters: 10 },
      pinned: [], seed: 21,
    })
    expect(result.failedDates).toEqual(setup(athens).dates)
    expect(result.events).toEqual([])
  }, 60000)
})
