import { describe, expect, it } from 'vitest'
import {
  addDays,
  dateRangeError,
  datesInRange,
  orthodoxEaster,
  parseDate,
  weekday,
} from '../dates'
import { destinations } from '../../data/destinations'

describe('city-local calendar dates', () => {
  it('includes both ends of each three-day city leg', () => {
    expect(destinations.map((city) => datesInRange(city.dates.start, city.dates.end))).toEqual([
      ['2026-12-22', '2026-12-23', '2026-12-24'],
      ['2026-12-24', '2026-12-25', '2026-12-26'],
      ['2026-12-27', '2026-12-28', '2026-12-29'],
    ])
    expect(datesInRange('2026-12-22', '2026-12-25')).toEqual([
      '2026-12-22',
      '2026-12-23',
      '2026-12-24',
      '2026-12-25',
    ])
    expect(weekday('2026-12-22')).toBe(2)
    expect(weekday('2026-12-25')).toBe(5)
  })

  it('rejects rollover dates, reversed ranges, and trips longer than 14 days', () => {
    expect(parseDate('2026-02-30')).toBeNull()
    expect(dateRangeError('2026-12-25', '2026-12-22')).toMatch(/end date/)
    expect(dateRangeError('2026-12-01', '2026-12-15')).toMatch(/14 days/)
    expect(dateRangeError('2026-12-22', '2026-12-22')).toBeNull()
  })

  it('computes Orthodox Easter without the viewer time zone', () => {
    expect(orthodoxEaster(2026)).toBe('2026-04-12')
    expect(addDays(orthodoxEaster(2026), -48)).toBe('2026-02-23')
  })
})
