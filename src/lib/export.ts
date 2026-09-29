import type { Place, ScheduledStop } from '../types'
import { getAvailability } from './hours'

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
}

function icsDate(date: string, minutes: number): string {
  const hour = String(Math.floor(minutes / 60)).padStart(2, '0')
  const minute = String(minutes % 60).padStart(2, '0')
  return date.replace(/-/g, '') + 'T' + hour + minute + '00'
}

export function createCalendar(
  events: ScheduledStop[],
  lookup: Record<string, Place>,
): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Atlas Athens//Itinerary Planner//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Atlas Athens',
    'X-WR-TIMEZONE:Europe/Athens',
  ]
  for (const event of [...events].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)) {
    const place = lookup[event.placeId]
    if (!place) continue
    const availability = getAvailability(place, event.date)
    const reminder =
      availability.status === 'tentative' ? 'Holiday hours unconfirmed; contact the venue. ' : ''
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + escapeIcs(event.id) + '@atlas-athens.local',
      'DTSTART;TZID=Europe/Athens:' + icsDate(event.date, event.start),
      'DTEND;TZID=Europe/Athens:' + icsDate(event.date, event.start + event.duration),
      'SUMMARY:' + escapeIcs(place.name),
      'LOCATION:' + escapeIcs(place.area + ', Athens, Greece'),
      'DESCRIPTION:' + escapeIcs(reminder + place.tagline + ' Hours: ' + place.hours.sourceUrl),
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n') + '\r\n'
}

export function downloadCalendar(events: ScheduledStop[], lookup: Record<string, Place>): void {
  const blob = new Blob([createCalendar(events, lookup)], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'atlas-athens-itinerary.ics'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
