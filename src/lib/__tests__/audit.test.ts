import { describe, expect, it } from 'vitest'
import { destinationById } from '../../data/destinations'
import { snapshotRates } from '../../services/exchange'
import { estimatedMatrix } from '../../services/routing'
import { auditDay, overlappingCityDates } from '../audit'
import { defaultSettings } from '../storage'
import type { ScheduledStop } from '../../types'

const cairo = destinationById.cairo
const date = '2026-12-26'
const matrix = estimatedMatrix(cairo.places)
const stop = (id: string, start: number, meal?: ScheduledStop['meal']): ScheduledStop => ({
  id: id + start, placeId: id, start, meal, date,
  duration: cairo.lookup[id].duration, pinned: true, origin: 'manual',
})
const valid: ScheduledStop[] = [
  stop('cairo-el-abd', 495, 'breakfast'),
  stop('cairo-tahrir', 570),
  stop('cairo-abou-tarek', 765, 'lunch'),
  stop('cairo-egyptian-museum', 855),
  stop('cairo-eish-malh', 1110, 'dinner'),
]
const check = (events: ScheduledStop[], changes = {}) => auditDay({
  date, cityId: cairo.id, events, lookup: cairo.lookup, matrix,
  settings: { ...defaultSettings(), ...changes }, quote: snapshotRates,
})

describe('visible manual-itinerary requirements', () => {
  it('accepts exactly one open, nearby breakfast/lunch/dinner under separate caps', () => {
    const audit = check(valid)
    expect(audit.complete).toBe(true)
    expect(audit.meals).toEqual({ breakfast: 1, lunch: 1, dinner: 1 })
  })

  it('flags missing meals, distant meals, extra meals and hard USD caps', () => {
    const missing = check(valid.filter((event) => event.meal !== 'lunch'))
    expect(missing.complete).toBe(false)
    expect(missing.issues.map((issue) => issue.code)).toContain('meal-count-lunch')

    const distant = check(valid.map((event) => event.meal === 'dinner'
      ? { ...event, placeId: 'cairo-zooba' } : event))
    expect(distant.issues.map((issue) => issue.code)).toContain('meal-too-far')

    const doubleDinner = check([...valid, stop('cairo-zooba', 1200, 'dinner')])
    expect(doubleDinner.issues.map((issue) => issue.code)).toContain('meal-count-dinner')

    const expensive = check(valid, { maxActivitiesUsd: 3, maxMealsUsd: 3 })
    expect(expensive.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      'meal-budget', 'activity-budget',
    ]))
  })

  it('flags unpriced admission instead of claiming a budget is satisfied', () => {
    const unpriced = check([...valid, stop('cairo-gem', 570)])
    expect(unpriced.issues.map((issue) => issue.code)).toContain('unknown-cost')
  })

  it('calls out the shared Athens/Cairo departure date', () => {
    expect(overlappingCityDates([
      { cityId: 'athens', dates: ['2026-12-22', '2026-12-24'] },
      { cityId: 'cairo', dates: ['2026-12-24', '2026-12-25'] },
      { cityId: 'istanbul', dates: ['2026-12-27'] },
    ])).toEqual([{ date: '2026-12-24', cities: ['athens', 'cairo'] }])
  })
})
