import type { Place, TravelMatrix } from '../types'
import { estimatedLeg } from '../lib/travel'

const cacheVersion = 'atlas-foot-v2-'
const maxCacheAge = 7 * 24 * 60 * 60 * 1000

interface CachedMatrix {
  key: string
  storedAt: number
  matrix: TravelMatrix
}

function matrixKey(places: Place[]): string {
  return places
    .map((place) => [place.id, place.coordinates.lng, place.coordinates.lat].join(':'))
    .join('|')
}

export function estimatedMatrix(places: Place[]): TravelMatrix {
  return {
    ids: places.map(({ id }) => id),
    minutes: places.map((from) => places.map((to) => estimatedLeg(from, to).minutes)),
    meters: places.map((from) => places.map((to) => estimatedLeg(from, to).meters)),
    source: 'estimate',
  }
}

function validSquare(values: unknown, size: number): values is number[][] {
  return (
    Array.isArray(values) &&
    values.length === size &&
    values.every(
      (row) =>
        Array.isArray(row) &&
        row.length === size &&
        row.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0),
    )
  )
}

function readCache(key: string, size: number, cityId: string): TravelMatrix | null {
  try {
    const value = localStorage.getItem(cacheVersion + cityId)
    if (!value) return null
    const cached = JSON.parse(value) as CachedMatrix
    if (
      cached.key !== key ||
      Date.now() - cached.storedAt > maxCacheAge ||
      cached.matrix?.source !== 'osm-foot' ||
      cached.matrix.ids.length !== size ||
      !validSquare(cached.matrix.minutes, size) ||
      !validSquare(cached.matrix.meters, size)
    ) {
      return null
    }
    return cached.matrix
  } catch {
    return null
  }
}

export async function fetchWalkingMatrix(places: Place[]): Promise<TravelMatrix> {
  if (!places.length) return estimatedMatrix(places)
  const cityId = places[0].cityId
  const key = matrixKey(places)
  const cached = readCache(key, places.length, cityId)
  if (cached) return cached

  const coordinates = places
    .map(({ coordinates: { lng, lat } }) => [lng, lat].join(','))
    .join(';')
  const url =
    'https://routing.openstreetmap.de/routed-foot/table/v1/driving/' +
    coordinates +
    '?annotations=duration,distance'
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 9000)

  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) throw new Error('Walking route service unavailable')
    const data: unknown = await response.json()
    const result = data as {
      code?: string
      durations?: unknown
      distances?: unknown
    }
    if (
      result.code !== 'Ok' ||
      !validSquare(result.durations, places.length) ||
      !validSquare(result.distances, places.length)
    ) {
      throw new Error('Incomplete walking route table')
    }
    const matrix: TravelMatrix = {
      ids: places.map(({ id }) => id),
      minutes: result.durations.map((row) => row.map((seconds) => seconds / 60)),
      meters: result.distances,
      source: 'osm-foot',
    }
    try {
      localStorage.setItem(
        cacheVersion + cityId,
        JSON.stringify({ key, storedAt: Date.now(), matrix } satisfies CachedMatrix),
      )
    } catch {}
    return matrix
  } catch {
    return estimatedMatrix(places)
  } finally {
    clearTimeout(timeout)
  }
}
