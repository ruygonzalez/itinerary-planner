import type { Availability, MovableHoliday, Place, TimeWindow, WeeklyHours } from '../types'
import { addDays, isWithinSeason, monthDay, orthodoxEaster, timeLabel, weekday } from './dates'

function movableHoliday(date: string, holiday: MovableHoliday): boolean {
  const easter = orthodoxEaster(Number(date.slice(0, 4)))
  const offsets: Record<MovableHoliday, number> = {
    'orthodox-easter': 0,
    'easter-monday': 1,
    'clean-monday': -48,
    'holy-spirit-monday': 50,
  }
  return addDays(easter, offsets[holiday]) === date
}

function regularHours(place: Place, date: string): WeeklyHours {
  const day = monthDay(date)
  const season = place.hours.seasons?.find(({ from, through }) =>
    isWithinSeason(day, from, through),
  )
  return season?.weekly ?? place.hours.weekly
}

function hoursDescription(windows: TimeWindow[]): string {
  return windows.map(({ open, close }) => timeLabel(open) + '–' + timeLabel(close)).join(', ')
}

const holidayCautionDays = new Set(['12-24', '12-25', '12-26', '12-31', '01-01'])

export function getAvailability(place: Place, date: string): Availability {
  const common = {
    sourceUrl: place.hours.sourceUrl,
    lastEntryMinutes: place.hours.lastEntryMinutes ?? 0,
  }
  const day = monthDay(date)

  if (
    place.hours.annualClosures?.includes(day) ||
    place.hours.movableClosures?.some((holiday) => movableHoliday(date, holiday))
  ) {
    return {
      ...common,
      status: 'closed',
      windows: [],
      label: 'Closed on this holiday',
      note: 'The venue lists this date as a closure.',
    }
  }

  const windows =
    place.hours.annualOverrides?.[day] ?? regularHours(place, date)[weekday(date)] ?? []

  if (!windows.length) {
    return {
      ...common,
      status: 'closed',
      windows: [],
      label: 'Closed ' + dateLabelWeekday(date),
      note: 'Closed on this day of the week.',
    }
  }

  if (
    place.hours.holidayUnconfirmed &&
    (holidayCautionDays.has(day) || movableHoliday(date, 'orthodox-easter'))
  ) {
    return {
      ...common,
      status: 'tentative',
      windows,
      label: 'Holiday hours unconfirmed',
      note:
        'These are regular listed hours, not a confirmed holiday schedule. Check directly before going.',
    }
  }

  if (place.hours.kind === 'suggested') {
    return {
      ...common,
      status: 'flexible',
      windows,
      label: 'Flexible public walk',
      note: place.hours.note ?? 'Public outdoor area; the time window is a planning suggestion.',
    }
  }

  return {
    ...common,
    status: 'open',
    windows,
    label: hoursDescription(windows),
    note: place.hours.note ?? 'Published regular hours; recheck before visiting.',
  }
}

function dateLabelWeekday(date: string): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return names[weekday(date)] ?? 'today'
}

export function fitsOpeningHours(
  availability: Availability,
  start: number,
  duration: number,
): boolean {
  return availability.windows.some(
    ({ open, close }) =>
      start >= open &&
      start + duration <= close &&
      start <= close - availability.lastEntryMinutes,
  )
}

export function nextOpenSlots(
  place: Place,
  date: string,
  earliest: number,
  latest: number,
): number[] {
  const availability = getAvailability(place, date)
  if (availability.status === 'closed') return []
  const slots: number[] = []
  for (let start = Math.ceil(earliest / 15) * 15; start <= latest; start += 15) {
    if (fitsOpeningHours(availability, start, place.duration)) slots.push(start)
  }
  return slots
}
