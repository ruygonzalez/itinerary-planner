import { beforeEach, describe, expect, it } from 'vitest'
import { defaultSnapshot, loadSnapshot, saveSnapshot } from '../storage'

beforeEach(() => localStorage.clear())

describe('three independent, persistent city legs', () => {
  it('has the requested inclusive default dates and budget settings', () => {
    const defaults = defaultSnapshot()
    expect(defaults.plans.athens.endDate).toBe('2026-12-24')
    expect(defaults.plans.cairo.startDate).toBe('2026-12-24')
    expect(defaults.plans.istanbul.endDate).toBe('2026-12-29')
    expect(defaults.plans.cairo.settings.maxMealsUsd).toBe(35)
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
})
