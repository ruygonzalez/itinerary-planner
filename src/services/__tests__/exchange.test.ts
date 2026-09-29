import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchUsdExchange, initialExchangeQuote, snapshotRates, toUsd } from '../exchange'

beforeEach(() => { localStorage.clear(); vi.unstubAllGlobals() })

describe('per-person currency conversion', () => {
  it('uses validated current USD rates and caches them for a day', async () => {
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      result: 'success', time_last_update_utc: 'Tue, 29 Sep 2026 00:02:31 +0000',
      rates: { EUR: 0.8, EGP: 50, TRY: 40 },
    }), { status: 200 }))
    vi.stubGlobal('fetch', request)
    const first = await fetchUsdExchange()
    expect(first).toMatchObject({ source: 'live', asOf: '2026-09-29' })
    expect(toUsd(500, 'EGP', first)).toBe(10)
    expect(toUsd(400, 'TRY', first)).toBe(10)
    expect(toUsd(8, 'EUR', first)).toBe(10)
    expect(initialExchangeQuote().source).toBe('cached')
    expect((await fetchUsdExchange()).source).toBe('cached')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('labels an offline snapshot rather than silently claiming fresh rates', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await fetchUsdExchange()).toEqual(snapshotRates)
  })
})
