import type { CurrencyCode, PriceQuote } from '../types'

const checkedOn = '2026-09-29'

export function listedRange(
  amount: number,
  currency: CurrencyCode,
  sourceUrl: string,
  note = 'Midpoint of a third-party per-person price band; not a menu quote.',
): PriceQuote {
  return { amount, currency, sourceUrl, checkedOn, basis: 'listed-range-midpoint', note }
}

export function menuEstimate(
  amount: number,
  currency: CurrencyCode,
  sourceUrl: string,
  note = 'Illustrative one-person meal budget based on a menu or inexpensive listing; not a measured average or guaranteed bill.',
): PriceQuote {
  return { amount, currency, sourceUrl, checkedOn, basis: 'menu-estimate', note }
}
