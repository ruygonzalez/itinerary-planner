export const DEFAULT_START = '2026-12-22'
export const DEFAULT_END = '2026-12-25'
export const MAX_DAYS = 14

const oneDay = 24 * 60 * 60 * 1000

export function parseDate(date: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const parsed = new Date(date + 'T12:00:00Z')
  return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date
    ? null
    : parsed
}

export function addDays(date: string, count: number): string {
  const parsed = parseDate(date)
  if (!parsed) throw new Error('Invalid date')
  return new Date(parsed.getTime() + count * oneDay).toISOString().slice(0, 10)
}

export function daysBetween(start: string, end: string): number {
  const first = parseDate(start)
  const last = parseDate(end)
  if (!first || !last) return NaN
  return Math.round((last.getTime() - first.getTime()) / oneDay)
}

export function dateRangeError(start: string, end: string): string | null {
  if (!parseDate(start) || !parseDate(end)) return 'Choose two valid dates.'
  const difference = daysBetween(start, end)
  if (difference < 0) return 'The end date must be on or after the start date.'
  if (difference >= MAX_DAYS) return 'Choose up to 14 days at a time.'
  return null
}

export function datesInRange(start: string, end: string): string[] {
  if (dateRangeError(start, end)) return []
  return Array.from({ length: daysBetween(start, end) + 1 }, (_, index) =>
    addDays(start, index),
  )
}

export function weekday(date: string): number {
  return parseDate(date)?.getUTCDay() ?? -1
}

export function monthDay(date: string): string {
  return date.slice(5)
}

export function isWithinSeason(day: string, from: string, through: string): boolean {
  return from <= through ? day >= from && day <= through : day >= from || day <= through
}

export function dateLabel(date: string, options?: Intl.DateTimeFormatOptions): string {
  const parsed = parseDate(date)
  if (!parsed) return date
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    ...options,
  }).format(parsed)
}

export function timeLabel(minutes: number): string {
  const hour = Math.floor(minutes / 60) % 24
  const minute = minutes % 60
  return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0')
}

export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (!hours) return remainder + ' min'
  return remainder ? hours + ' hr ' + remainder + ' min' : hours + ' hr'
}

export function minuteFromTime(value: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return null
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function roundToQuarter(minutes: number): number {
  return Math.round(minutes / 15) * 15
}

// The official sites list Orthodox Easter as a closure. For 1900–2099 the
// Julian-to-Gregorian difference is 13 days; the rest of the algorithm is the
// Julian computus, deliberately independent of the viewer's time zone.
export function orthodoxEaster(year: number): string {
  const a = year % 4
  const b = year % 7
  const c = year % 19
  const d = (19 * c + 15) % 30
  const e = (2 * a + 4 * b - d + 34) % 7
  const month = Math.floor((d + e + 114) / 31)
  const day = ((d + e + 114) % 31) + 1
  const offset = Math.floor(year / 100) - Math.floor(year / 400) - 2
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10)
}
