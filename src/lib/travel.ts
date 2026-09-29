import type { Place, ScheduledStop, TravelLeg, TravelMatrix } from '../types'

const radians = (degrees: number) => (degrees * Math.PI) / 180
const hillIds = new Set(['acropolis', 'areopagus', 'philopappos', 'lycabettus'])

export function straightLineMeters(a: Place, b: Place): number {
  const deltaLat = radians(b.coordinates.lat - a.coordinates.lat)
  const deltaLng = radians(b.coordinates.lng - a.coordinates.lng)
  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(a.coordinates.lat)) *
      Math.cos(radians(b.coordinates.lat)) *
      Math.sin(deltaLng / 2) ** 2
  return 2 * 6371000 * Math.asin(Math.sqrt(haversine))
}

export function estimatedLeg(a: Place, b: Place): TravelLeg {
  if (a.id === b.id) return { minutes: 0, meters: 0, source: 'estimate' }
  const hillFactor = hillIds.has(b.id) ? 1.12 : 1
  const meters = Math.round(straightLineMeters(a, b) * 1.42 * hillFactor)
  return {
    minutes: Math.max(5, Math.ceil(meters / 70) + 3),
    meters,
    source: 'estimate',
  }
}

export function getTravelLeg(a: Place, b: Place, matrix?: TravelMatrix | null): TravelLeg {
  if (a.id === b.id) return { minutes: 0, meters: 0, source: matrix?.source ?? 'estimate' }
  if (matrix?.source === 'osm-foot') {
    const from = matrix.ids.indexOf(a.id)
    const to = matrix.ids.indexOf(b.id)
    const minutes = matrix.minutes[from]?.[to]
    const meters = matrix.meters[from]?.[to]
    if (Number.isFinite(minutes) && Number.isFinite(meters)) {
      return {
        minutes: Math.max(5, Math.ceil(minutes) + 3),
        meters: Math.round(meters),
        source: 'osm-foot',
      }
    }
  }
  return estimatedLeg(a, b)
}

export function dayWalking(
  stops: ScheduledStop[],
  lookup: Record<string, Place>,
  matrix?: TravelMatrix | null,
): { minutes: number; meters: number } {
  const ordered = [...stops].sort((a, b) => a.start - b.start)
  return ordered.slice(1).reduce(
    (total, stop, index) => {
      const before = lookup[ordered[index].placeId]
      const after = lookup[stop.placeId]
      if (!before || !after) return total
      const leg = getTravelLeg(before, after, matrix)
      return { minutes: total.minutes + leg.minutes, meters: total.meters + leg.meters }
    },
    { minutes: 0, meters: 0 },
  )
}
