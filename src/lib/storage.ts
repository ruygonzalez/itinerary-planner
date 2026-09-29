import type { Pace, PlannerSnapshot, ScheduledStop } from '../types'
import { placesById } from '../data/places'
import { dateRangeError, datesInRange, DEFAULT_END, DEFAULT_START } from './dates'

const storageKey = 'atlas-athens-planner-v1'
const paces = new Set<Pace>(['easy', 'balanced', 'full'])
const interests = new Set(['all', 'history', 'art', 'outdoors', 'food'])

export function defaultSnapshot(): PlannerSnapshot {
  return {
    version: 1,
    startDate: DEFAULT_START,
    endDate: DEFAULT_END,
    activeDate: DEFAULT_START,
    events: [],
    settings: {
      pace: 'balanced',
      interest: 'all',
      includeTentativeMeals: true,
      savedIds: [],
    },
  }
}

function safeStop(value: unknown, dates: Set<string>): value is ScheduledStop {
  if (!value || typeof value !== 'object') return false
  const stop = value as Partial<ScheduledStop>
  const place = placesById[stop.placeId ?? '']
  return Boolean(
    place &&
      typeof stop.id === 'string' &&
      dates.has(stop.date ?? '') &&
      typeof stop.start === 'number' &&
      Number.isFinite(stop.start) &&
      stop.start >= 480 &&
      stop.start + place.duration <= 1260 &&
      stop.duration === place.duration &&
      typeof stop.pinned === 'boolean' &&
      (stop.origin === 'manual' || stop.origin === 'generated'),
  )
}

export function loadSnapshot(): PlannerSnapshot {
  const fallback = defaultSnapshot()
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return fallback
    const stored = JSON.parse(raw) as Partial<PlannerSnapshot>
    if (
      stored.version !== 1 ||
      !stored.startDate ||
      !stored.endDate ||
      dateRangeError(stored.startDate, stored.endDate)
    ) {
      return fallback
    }
    const dates = datesInRange(stored.startDate, stored.endDate)
    const dateSet = new Set(dates)
    const settings = stored.settings
    return {
      version: 1,
      startDate: stored.startDate,
      endDate: stored.endDate,
      activeDate: dateSet.has(stored.activeDate ?? '') ? stored.activeDate! : dates[0],
      events: Array.isArray(stored.events)
        ? stored.events.filter((event) => safeStop(event, dateSet))
        : [],
      settings: {
        pace: settings && paces.has(settings.pace) ? settings.pace : fallback.settings.pace,
        interest:
          settings && interests.has(settings.interest)
            ? settings.interest
            : fallback.settings.interest,
        includeTentativeMeals:
          typeof settings?.includeTentativeMeals === 'boolean'
            ? settings.includeTentativeMeals
            : true,
        savedIds: Array.isArray(settings?.savedIds)
          ? settings.savedIds.filter(
              (id): id is string => typeof id === 'string' && Boolean(placesById[id]),
            )
          : [],
      },
    }
  } catch {
    return fallback
  }
}

export function saveSnapshot(snapshot: PlannerSnapshot): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(snapshot))
  } catch {
    // The planner remains usable if storage is blocked or full.
  }
}
