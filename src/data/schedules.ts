import type { OpeningRules, SeasonalHours, TimeWindow, WeeklyHours } from '../types'

const checkedOn = '2026-09-29'

export const W = (open: number, close: number): TimeWindow[] => [{ open, close }]

export const everyDay = (open: number, close: number): WeeklyHours =>
  Object.fromEntries(Array.from({ length: 7 }, (_, day) => [day, W(open, close)]))

export const onDays = (days: number[], open: number, close: number): WeeklyHours =>
  Object.fromEntries(days.map((day) => [day, W(open, close)]))

export const combine = (...schedules: WeeklyHours[]): WeeklyHours =>
  Object.assign({}, ...schedules)

export const season = (
  from: string,
  through: string,
  weekly: WeeklyHours,
): SeasonalHours => ({ from, through, weekly })

const stateClosures = ['01-01', '03-25', '05-01', '12-25', '12-26']
const heritageSummer: SeasonalHours[] = [
  season('04-01', '08-31', everyDay(480, 1200)),
  season('09-01', '09-15', everyDay(480, 1170)),
  season('09-16', '09-30', everyDay(480, 1140)),
  season('10-01', '10-15', everyDay(480, 1110)),
  season('10-16', '10-31', everyDay(480, 1080)),
]

export function official(
  sourceUrl: string,
  weekly: WeeklyHours,
  extra: Partial<OpeningRules> = {},
): OpeningRules {
  return {
    weekly,
    kind: 'official',
    sourceUrl,
    sourceLabel: 'Official visitor information',
    checkedOn,
    ...extra,
  }
}

export function heritage(sourceUrl: string, winterClose: number): OpeningRules {
  return official(sourceUrl, everyDay(480, winterClose), {
    seasons: heritageSummer,
    annualClosures: stateClosures,
    movableClosures: ['orthodox-easter'],
    lastEntryMinutes: 20,
  })
}

export function publicWalk(
  sourceUrl: string,
  weekly: WeeklyHours,
  note: string,
  extra: Partial<OpeningRules> = {},
): OpeningRules {
  return {
    weekly,
    kind: 'suggested',
    sourceUrl,
    sourceLabel: 'Public outdoor place; suggested planning window',
    checkedOn,
    note,
    ...extra,
  }
}

export function listedRestaurant(sourceUrl: string, weekly: WeeklyHours): OpeningRules {
  return {
    weekly,
    kind: 'listed',
    sourceUrl,
    sourceLabel: 'Tripadvisor regular hours (holiday hours unverified)',
    checkedOn,
    holidayUnconfirmed: true,
  }
}
