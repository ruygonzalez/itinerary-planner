import { describe, expect, it } from 'vitest'
import { placesById } from '../../data/places'
import { distanceInUnit, distanceToMeters, formatDistance, roundedDistance } from '../distance'
import { dayWalking, expectedOnsiteWalk } from '../travel'

describe('walking estimates and distance units', () => {
  it('converts distances without changing the underlying daily limit', () => {
    expect(distanceInUnit(1609.344, 'miles')).toBe(1)
    expect(distanceToMeters(1, 'miles')).toBe(1609)
    expect(distanceToMeters(1000, 'steps')).toBe(762)
    expect(roundedDistance(10000, 'km')).toBe(10)
    expect(formatDistance(1609, 'feet')).toBe('5,279 ft')
  })

  it('counts walking inside an activity as well as walking between locations', () => {
    expect(expectedOnsiteWalk(placesById['takis-bakery'])).toEqual({ minutes: 0, meters: 0 })
    expect(expectedOnsiteWalk(placesById.monastiraki)).toEqual({ minutes: 10, meters: 350 })
    const one = [{
      id: 'one', placeId: 'acropolis', date: '2026-12-22', start: 540,
      duration: placesById.acropolis.duration, pinned: true, origin: 'manual' as const,
    }]
    const walking = dayWalking(one, placesById)
    expect(walking.onSite.meters).toBeGreaterThan(0)
    expect(walking.transfers.meters).toBe(0)
    expect(walking.meters).toBe(walking.onSite.meters)
  })
})
