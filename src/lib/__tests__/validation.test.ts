import { describe, expect, it } from 'vitest'
import { placesById } from '../../data/places'
import type { ScheduledStop, TravelMatrix } from '../../types'
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
      validatePlacement({ ...base, place: lookup.acropolis, date: '2026-12-22', start: 540 }).message,
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
    expect(result).toMatchObject({ ok: true, tentative: true })
  })
})
