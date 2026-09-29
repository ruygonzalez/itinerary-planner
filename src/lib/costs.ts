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

export function stopBudget(
  place: Place,
  date: string,
  events: ScheduledStop[],
  lookup: Record<string, Place>,
  settings: PlanSettings,
  quote: ExchangeQuote,
  ignoreId?: string,
) {
  const remaining = events.filter((event) => event.date === date && event.id !== ignoreId)
  const costs = dayCosts(remaining, lookup, quote)
  const isMeal = place.kind === 'food'
  const spentUsd = isMeal ? costs.mealsUsd : costs.activitiesUsd
  const capUsd = isMeal ? settings.maxMealsUsd : settings.maxActivitiesUsd
  const priceUsd = stopCostUsd(place, quote)
  return {
    category: isMeal ? 'meal' as const : 'activity' as const,
    spentUsd, capUsd, priceUsd,
    remainingUsd: capUsd - spentUsd,
    totalUsd: priceUsd === null ? null : spentUsd + priceUsd,
    exceeded: priceUsd !== null && spentUsd + priceUsd > capUsd + 0.00001,
  }
}
