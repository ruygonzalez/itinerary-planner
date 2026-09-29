import { beforeEach, describe, expect, it } from 'vitest'
import { placesById } from '../../data/places'
import { defaultSnapshot, loadSnapshot, saveSnapshot } from '../storage'

beforeEach(() => localStorage.clear())

describe('three independent, persistent city legs', () => {
  it('has the requested inclusive default dates and budget settings', () => {
    const defaults = defaultSnapshot()
    expect(defaults.plans.athens.endDate).toBe('2026-12-24')
    expect(defaults.plans.cairo.startDate).toBe('2026-12-24')
    expect(defaults.plans.istanbul.endDate).toBe('2026-12-29')
    expect(defaults.plans.cairo.settings.maxMealsUsd).toBe(35)
    expect(defaults.plans.cairo.settings.maxWalkingMeters).toBe(10000)
    saveSnapshot(defaults)
    expect(loadSnapshot()).toEqual(defaults)
  })

  it('retains existing Athens drafts when migrating from the first version', () => {
    localStorage.setItem('atlas-athens-planner-v1', JSON.stringify({
      version: 1, startDate: '2026-12-22', endDate: '2026-12-25', activeDate: '2026-12-22',
      events: [{ id: 'my-breakfast', placeId: 'koulouri', date: '2026-12-22',
        start: 495, duration: 30, pinned: true, origin: 'manual' }],
      settings: { pace: 'easy', interest: 'history', includeTentativeMeals: true, savedIds: ['acropolis'] },
    }))
    const migrated = loadSnapshot()
    expect(migrated.plans.athens.endDate).toBe('2026-12-25')
    expect(migrated.plans.athens.events[0].meal).toBe('breakfast')
    expect(migrated.plans.athens.settings.savedIds).toContain('acropolis')
    expect(migrated.plans.cairo.startDate).toBe('2026-12-24')
  })

  it('defaults older settings and refreshes generated cross-day duplicates', () => {
    const original = defaultSnapshot()
    const first = {
      id: 'pinned-acropolis', placeId: 'acropolis', date: '2026-12-22',
      start: 540, duration: placesById.acropolis.duration, pinned: true, origin: 'manual' as const,
    }
    saveSnapshot({
      ...original,
      plans: {
        ...original.plans,
        athens: {
          ...original.plans.athens, generatedOnce: true,
          events: [first, { ...first, id: 'old-generated', date: '2026-12-23', origin: 'generated', pinned: false }],
        },
      },
    })
    const saved = JSON.parse(localStorage.getItem('atlas-three-cities-v2')!)
    delete saved.plans.athens.settings.maxWalkingMeters
    delete saved.plans.athens.settings.distanceUnit
    localStorage.setItem('atlas-three-cities-v2', JSON.stringify(saved))
    const restored = loadSnapshot().plans.athens
    expect(restored.settings).toMatchObject({ maxWalkingMeters: 10000, distanceUnit: 'km' })
    expect(restored.generatedOnce).toBe(false)
    expect(restored.events).toHaveLength(2)
    expect(restored.events[0].pinned).toBe(true)
  })
})
