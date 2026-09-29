import type { CityId, CityPlan, DistanceUnit, Pace, PlanSettings, PlannerSnapshot, ScheduledStop } from '../types'
import { MAX_WALKING_METERS } from './distance'
import { allPlacesById, destinationById, destinations } from '../data/destinations'
import { dateRangeError, datesInRange } from './dates'
import { resolveMealSlot } from './meals'

const storageKey = 'atlas-three-cities-v2'
const athensLegacyKey = 'atlas-athens-planner-v1'
const cityIds = new Set<CityId>(['athens', 'cairo', 'istanbul'])
const paces = new Set<Pace>(['easy', 'balanced', 'full'])
const interests = new Set(['all', 'history', 'art', 'outdoors', 'food'])
const distanceUnits = new Set<DistanceUnit>(['steps', 'feet', 'miles', 'km'])

export function defaultSettings(): PlanSettings {
  return {
    pace: 'balanced', interest: 'all', includeTentativeMeals: true,
    savedIds: [], maxMealsUsd: 35, maxActivitiesUsd: 65,
    maxWalkingMeters: 10000, distanceUnit: 'km',
  }
}

function defaultPlan(id: CityId): CityPlan {
  const { start, end } = destinationById[id].dates
  return {
    startDate: start, endDate: end, activeDate: start,
    events: [], settings: defaultSettings(), generatedOnce: false,
  }
}

export function defaultSnapshot(): PlannerSnapshot {
  return {
    version: 2, selectedCity: 'athens',
    plans: {
      athens: defaultPlan('athens'),
      cairo: defaultPlan('cairo'),
      istanbul: defaultPlan('istanbul'),
    },
  }
}

function safeStop(value: unknown, cityId: CityId, validDates: Set<string>): ScheduledStop | null {
  if (!value || typeof value !== 'object') return null
  const stop = value as Partial<ScheduledStop>
  const place = allPlacesById[stop.placeId ?? '']
  if (!place || place.cityId !== cityId || typeof stop.id !== 'string' ||
    !validDates.has(stop.date ?? '') || typeof stop.start !== 'number' ||
    !Number.isFinite(stop.start) || stop.start < 420 ||
    stop.start + place.duration > 1320 || stop.duration !== place.duration ||
    typeof stop.pinned !== 'boolean' ||
    (stop.origin !== 'manual' && stop.origin !== 'generated')) return null
  return {
    id: stop.id, date: stop.date!, start: stop.start, duration: place.duration,
    placeId: place.id, pinned: stop.pinned, origin: stop.origin,
    meal: place.kind === 'food' ? resolveMealSlot(place, stop.start, stop.meal) ?? undefined : undefined,
  }
}

function safeSettings(value: Partial<PlanSettings> | undefined, cityId: CityId): PlanSettings {
  const defaults = defaultSettings()
  const cap = (candidate: unknown, fallback: number) =>
    typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0 && candidate <= 5000
      ? candidate : fallback
  return {
    pace: value && paces.has(value.pace!) ? value.pace! : defaults.pace,
    interest: value && interests.has(value.interest!) ? value.interest! : defaults.interest,
    includeTentativeMeals: typeof value?.includeTentativeMeals === 'boolean'
      ? value.includeTentativeMeals : defaults.includeTentativeMeals,
    savedIds: Array.isArray(value?.savedIds)
      ? value.savedIds.filter((id): id is string =>
        typeof id === 'string' && allPlacesById[id]?.cityId === cityId)
      : [],
    maxMealsUsd: cap(value?.maxMealsUsd, defaults.maxMealsUsd),
    maxActivitiesUsd: cap(value?.maxActivitiesUsd, defaults.maxActivitiesUsd),
    maxWalkingMeters: typeof value?.maxWalkingMeters === 'number' &&
      Number.isFinite(value.maxWalkingMeters) && value.maxWalkingMeters >= 0 &&
      value.maxWalkingMeters <= MAX_WALKING_METERS
      ? value.maxWalkingMeters : defaults.maxWalkingMeters,
    distanceUnit: distanceUnits.has(value?.distanceUnit as DistanceUnit)
      ? value!.distanceUnit! : defaults.distanceUnit,
  }
}

function safePlan(value: Partial<CityPlan> | undefined, cityId: CityId): CityPlan {
  const fallback = defaultPlan(cityId)
  if (!value?.startDate || !value.endDate || dateRangeError(value.startDate, value.endDate)) return fallback
  const validDates = new Set(datesInRange(value.startDate, value.endDate))
  const events = Array.isArray(value.events)
    ? value.events.flatMap((event) => {
        const stop = safeStop(event, cityId, validDates)
        return stop ? [stop] : []
      })
    : []
  const activityCounts = new Map<string, number>()
  for (const event of events) {
    if (allPlacesById[event.placeId].kind !== 'food') {
      activityCounts.set(event.placeId, (activityCounts.get(event.placeId) ?? 0) + 1)
    }
  }
  const needsRefresh = events.some((event) =>
    event.origin === 'generated' && (activityCounts.get(event.placeId) ?? 0) > 1)
  return {
    startDate: value.startDate,
    endDate: value.endDate,
    activeDate: validDates.has(value.activeDate ?? '') ? value.activeDate! : value.startDate,
    events,
    settings: safeSettings(value.settings, cityId),
    generatedOnce: needsRefresh ? false :
      typeof value.generatedOnce === 'boolean' ? value.generatedOnce : events.length > 0,
  }
}

export function loadSnapshot(): PlannerSnapshot {
  const fallback = defaultSnapshot()
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const stored = JSON.parse(raw) as Partial<PlannerSnapshot>
      if (stored.version === 2 && stored.plans) {
        return {
          version: 2,
          selectedCity: cityIds.has(stored.selectedCity!) ? stored.selectedCity! : 'athens',
          plans: Object.fromEntries(destinations.map((city) => [
            city.id, safePlan(stored.plans?.[city.id], city.id),
          ])) as PlannerSnapshot['plans'],
        }
      }
    }
    const legacy = localStorage.getItem(athensLegacyKey)
    if (legacy) {
      const old = JSON.parse(legacy) as Partial<CityPlan> & { version?: number }
      if (old.version === 1) fallback.plans.athens = safePlan(old, 'athens')
    }
  } catch {}
  return fallback
}

export function saveSnapshot(snapshot: PlannerSnapshot): void {
  try { localStorage.setItem(storageKey, JSON.stringify(snapshot)) } catch {}
}
