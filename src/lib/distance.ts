import type { DistanceUnit } from '../types'

export const distanceUnits: Record<DistanceUnit, { label: string; symbol: string; meters: number; step: number }> = {
  km: { label: 'Kilometers', symbol: 'km', meters: 1000, step: 0.1 },
  miles: { label: 'Miles', symbol: 'mi', meters: 1609.344, step: 0.1 },
  feet: { label: 'Feet', symbol: 'ft', meters: 0.3048, step: 100 },
  steps: { label: 'Steps (approx.)', symbol: 'steps', meters: 0.762, step: 100 },
}

export const MAX_WALKING_METERS = 50000

export function distanceInUnit(meters: number, unit: DistanceUnit): number {
  return meters / distanceUnits[unit].meters
}

export function distanceToMeters(amount: number, unit: DistanceUnit): number {
  return Math.round(amount * distanceUnits[unit].meters)
}

export function roundedDistance(meters: number, unit: DistanceUnit): number {
  const digits = unit === 'km' || unit === 'miles' ? 2 : 0
  return Number(distanceInUnit(meters, unit).toFixed(digits))
}

export function formatDistance(meters: number, unit: DistanceUnit): string {
  const amount = roundedDistance(meters, unit)
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: unit === 'km' || unit === 'miles' ? 2 : 0 }).format(amount) +
    ' ' + distanceUnits[unit].symbol
}
