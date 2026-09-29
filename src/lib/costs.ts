import type { Place, PlanSettings, ScheduledStop } from '../types'
import { toUsd, type ExchangeQuote } from '../services/exchange'

export function stopCostUsd(place: Place, quote: ExchangeQuote): number | null {
  if (place.cost === 'free') return 0
  if (!place.price || !Number.isFinite(place.price.amount)) return null
  return toUsd(place.price.amount, place.price.currency, quote)
}

export interface DayCosts {
  mealsUsd: number
  activitiesUsd: number
  unpriced: Place[]
}

export function dayCosts(
  stops: ScheduledStop[],
  lookup: Record<string, Place>,
  quote: ExchangeQuote,
): DayCosts {
  return stops.reduce<DayCosts>((total, stop) => {
    const place = lookup[stop.placeId]
    if (!place) return total
    const amount = stopCostUsd(place, quote)
    if (amount === null) total.unpriced.push(place)
    else if (place.kind === 'food') total.mealsUsd += amount
    else total.activitiesUsd += amount
    return total
  }, { mealsUsd: 0, activitiesUsd: 0, unpriced: [] })
}

export function withinDailyCaps(costs: DayCosts, settings: PlanSettings): boolean {
  return costs.unpriced.length === 0 &&
    costs.mealsUsd <= settings.maxMealsUsd + 0.00001 &&
    costs.activitiesUsd <= settings.maxActivitiesUsd + 0.00001
}
