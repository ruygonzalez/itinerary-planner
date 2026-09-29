import type { CurrencyCode } from '../types'

export interface ExchangeQuote {
  perUsd: Record<CurrencyCode, number>
  asOf: string
  source: 'live' | 'cached' | 'snapshot'
}

export const exchangeSourceUrl = 'https://open.er-api.com/v6/latest/USD'
const storageKey = 'atlas-usd-rates-v1'
const maxCacheAge = 24 * 60 * 60 * 1000

export const snapshotRates: ExchangeQuote = {
  perUsd: { EUR: 0.879241, EGP: 52.070874, TRY: 48.997476 },
  asOf: '2026-09-29',
  source: 'snapshot',
}

interface CachedExchange {
  storedAt: number
  quote: ExchangeQuote
}

function validRate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}

function readCache(): CachedExchange | null {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return null
    const parsed = JSON.parse(stored) as CachedExchange
    if (
      !Number.isFinite(parsed.storedAt) ||
      !parsed.quote ||
      !/^\d{4}-\d{2}-\d{2}$/.test(parsed.quote.asOf) ||
      !(['EUR', 'EGP', 'TRY'] as const).every((currency) => validRate(parsed.quote.perUsd?.[currency]))
    ) return null
    return parsed
  } catch {
    return null
  }
}

export function initialExchangeQuote(): ExchangeQuote {
  const cached = readCache()
  return cached ? { ...cached.quote, source: 'cached' } : snapshotRates
}

export async function fetchUsdExchange(): Promise<ExchangeQuote> {
  const cached = readCache()
  if (cached && Date.now() - cached.storedAt < maxCacheAge) {
    return { ...cached.quote, source: 'cached' }
  }
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 8500)
  try {
    const response = await fetch(exchangeSourceUrl, { signal: controller.signal })
    if (!response.ok) throw new Error('Exchange feed unavailable')
    const result: unknown = await response.json()
    const data = result as { result?: string; time_last_update_utc?: string; rates?: Record<string, unknown> }
    if (
      data.result !== 'success' ||
      !data.time_last_update_utc ||
      !(['EUR', 'EGP', 'TRY'] as const).every((currency) => validRate(data.rates?.[currency]))
    ) throw new Error('Incomplete exchange rates')
    const asOf = new Date(data.time_last_update_utc).toISOString().slice(0, 10)
    const quote: ExchangeQuote = {
      perUsd: {
        EUR: data.rates!.EUR as number,
        EGP: data.rates!.EGP as number,
        TRY: data.rates!.TRY as number,
      },
      asOf,
      source: 'live',
    }
    try { localStorage.setItem(storageKey, JSON.stringify({ storedAt: Date.now(), quote } satisfies CachedExchange)) } catch {}
    return quote
  } catch {
    return cached ? { ...cached.quote, source: 'cached' } : snapshotRates
  } finally {
    clearTimeout(timeout)
  }
}

export function toUsd(amount: number, currency: CurrencyCode, quote: ExchangeQuote): number {
  return amount / quote.perUsd[currency]
}

export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}
