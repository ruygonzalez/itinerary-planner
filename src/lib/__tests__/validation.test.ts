import { describe, expect, it } from 'vitest'
import { placesById } from '../../data/places'
import { snapshotRates } from '../../services/exchange'
import type { ScheduledStop, TravelMatrix } from '../../types'
import { defaultSettings } from '../storage'
import { validatePlacement } from '../validation'

const dates = { startDate: '2026-12-22', endDate: '2026-12-25' }
const lookup = placesById
const stop = (placeId: string, date: string, start: number): ScheduledStop => ({
  id: placeId + date,
  placeId,
  date,
  start,
  duration: lookup[placeId].duration,
  pinned: true,
  origin: 'manual',
})
const route: TravelMatrix = {
  ids: ['acropolis', 'acropolis-museum', 'plaka'],
  minutes: [
    [0, 20, 300],
    [20, 0, 10],
    [300, 10, 0],
  ],
  meters: [
    [0, 1500, 10000],
    [1500, 0, 700],
    [10000, 700, 0],
  ],
  source: 'osm-foot',
}

describe('manual drop and move validation', () => {
  it('rejects confirmed closures, overlaps, travel conflicts, and duplicate sights', () => {
    const events = [stop('acropolis', '2026-12-23', 540)]
    const base = { ...dates, events, lookup, matrix: route }
    expect(
      validatePlacement({ ...base, place: lookup.acropolis, date: '2026-12-25', start: 540 }).message,
    ).toMatch(/closed/)
    expect(
      validatePlacement({ ...base, place: lookup.acropolis, date: '2026-12-23', start: 540 }).message,
    ).toMatch(/already/)
    expect(
      validatePlacement({ ...base, place: lookup['acropolis-museum'], date: '2026-12-23', start: 600 }).message,
    ).toMatch(/overlaps/)
    expect(
      validatePlacement({ ...base, place: lookup['acropolis-museum'], date: '2026-12-23', start: 660 }).message,
    ).toMatch(/23 min to walk/)
    expect(
      validatePlacement({ ...base, place: lookup['acropolis-museum'], date: '2026-12-23', start: 675 }).ok,
    ).toBe(true)
  })

  it('checks only immediate neighbors for walking time', () => {
    const events = [
      stop('acropolis', '2026-12-23', 540),
      stop('acropolis-museum', '2026-12-23', 780),
    ]
    expect(
      validatePlacement({
        ...dates,
        events,
        lookup,
        matrix: route,
        place: lookup.plaka,
        date: '2026-12-23',
        start: 900,
      }).ok,
    ).toBe(true)
  })

  it('allows an unconfirmed holiday meal but marks it tentative', () => {
    const result = validatePlacement({
      ...dates,
      events: [],
      lookup,
      place: lookup['rhino-vegan'],
      date: '2026-12-25',
      start: 780,
    })
    expect(result).toMatchObject({ ok: true, tentative: true, meal: 'lunch' })
  })

  it('assigns breakfast by time and rejects a restaurant outside its meal window', () => {
    const bakery = lookup['takis-bakery']
    expect(validatePlacement({
      ...dates, events: [], lookup, place: bakery, date: '2026-12-22', start: 495,
    })).toMatchObject({ ok: true, meal: 'breakfast' })
    expect(validatePlacement({
      ...dates, events: [], lookup, place: bakery, date: '2026-12-22', start: 765,
    }).ok).toBe(false)
  })

  it('rejects an attraction already scheduled on another day but allows a restaurant again', () => {
    const events = [stop('acropolis', '2026-12-22', 540), stop('takis-bakery', '2026-12-22', 495)]
    const base = { ...dates, events, lookup, settings: defaultSettings(), quote: snapshotRates }
    expect(validatePlacement({
      ...base, place: lookup.acropolis, date: '2026-12-23', start: 540,
    })).toMatchObject({ ok: false, reason: 'duplicate' })
    expect(validatePlacement({
      ...base, place: lookup['takis-bakery'], date: '2026-12-23', start: 495,
    })).toMatchObject({ ok: true, meal: 'breakfast' })
  })

  it('blocks a paid drop only on the day that exceeds its USD activity cap', () => {
    const existing = stop('acropolis-museum', '2026-12-23', 540)
    const base = {
      ...dates, events: [existing], lookup, quote: snapshotRates,
      settings: { ...defaultSettings(), maxActivitiesUsd: 30 },
      place: lookup.cycladic, start: 720,
    }
    const expensiveDay = validatePlacement({ ...base, date: '2026-12-23' })
    expect(expensiveDay).toMatchObject({ ok: false, reason: 'budget' })
    expect(expensiveDay.message).toMatch(/per person.*over the.*daily limit/)
    expect(validatePlacement({ ...base, date: '2026-12-24' }).ok).toBe(true)
    expect(validatePlacement({
      ...base, date: '2026-12-23', place: lookup['acropolis-museum'],
      start: 555, ignoreId: existing.id,
    }).ok).toBe(true)
  })

  it('includes walking at the activity even on a day with no transfers', () => {
    const settings = { ...defaultSettings(), maxWalkingMeters: 500, distanceUnit: 'miles' as const }
    const result = validatePlacement({
      ...dates, events: [], lookup, quote: snapshotRates, settings,
      place: lookup.acropolis, date: '2026-12-22', start: 540,
    })
    expect(result).toMatchObject({ ok: false, reason: 'walking' })
    expect(result.message).toContain('mi')
    expect(validatePlacement({
      ...dates, events: [], lookup, quote: snapshotRates, settings,
      place: lookup['takis-bakery'], date: '2026-12-22', start: 495,
    }).ok).toBe(true)
  })

  it('applies the same caps to meal drops and paid stops moved between days', () => {
    expect(validatePlacement({
      ...dates, events: [], lookup, quote: snapshotRates,
      settings: { ...defaultSettings(), maxMealsUsd: 5 },
      place: lookup['takis-bakery'], date: '2026-12-22', start: 495,
    })).toMatchObject({ ok: false, reason: 'budget' })
    const moving = stop('acropolis', '2026-12-22', 540)
    const museum = stop('acropolis-museum', '2026-12-23', 540)
    expect(validatePlacement({
      ...dates, events: [moving, museum], lookup, quote: snapshotRates,
      settings: { ...defaultSettings(), maxActivitiesUsd: 35 },
      ignoreId: moving.id, place: lookup.acropolis, date: '2026-12-23', start: 720,
    })).toMatchObject({ ok: false, reason: 'budget' })
  })
})
