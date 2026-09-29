import { beforeEach, describe, expect, it, vi } from 'vitest'
import { places } from '../../data/places'
import { estimatedMatrix, fetchWalkingMatrix } from '../../services/routing'

beforeEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('walking route service', () => {
  it('uses and caches a valid OSM foot-route table', async () => {
    const sample = places.slice(0, 2)
    const request = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'Ok',
          durations: [[0, 720], [750, 0]],
          distances: [[0, 890], [910, 0]],
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', request)
    const first = await fetchWalkingMatrix(sample)
    expect(first.source).toBe('osm-foot')
    expect(first.minutes[0][1]).toBe(12)
    expect(request).toHaveBeenCalledTimes(1)
    expect(String(request.mock.calls[0][0])).toContain('routed-foot/table/v1/driving/')
    expect((await fetchWalkingMatrix(sample)).source).toBe('osm-foot')
    expect(request).toHaveBeenCalledTimes(1)
  })

  it('falls back safely when the service cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const matrix = await fetchWalkingMatrix(places.slice(0, 2))
    expect(matrix.source).toBe('estimate')
    expect(matrix.minutes[0][1]).toBeGreaterThan(0)
    expect(estimatedMatrix(places.slice(0, 2)).ids).toHaveLength(2)
  })
})
