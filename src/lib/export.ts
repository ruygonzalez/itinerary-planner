import type { Place, ScheduledStop } from '../types'
import { getAvailability } from './hours'
import { destinationById } from '../data/destinations'

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
    'PRODID:-//Atlas Three Cities//Itinerary Planner//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Atlas · Athens / Cairo / Istanbul',
  ]
  for (const event of [...events].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start)) {
    const place = lookup[event.placeId]
    if (!place) continue
    const destination = destinationById[place.cityId]
    const timeZone = destination.country.timeZone
    const availability = getAvailability(place, event.date)
    const reminder =
      availability.status === 'tentative' ? 'Holiday hours unconfirmed; contact the venue. ' : ''
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + escapeIcs(event.id) + '@atlas-itinerary.local',
      'DTSTART;TZID=' + timeZone + ':' + icsDate(event.date, event.start),
      'DTEND;TZID=' + timeZone + ':' + icsDate(event.date, event.start + event.duration),
      'SUMMARY:' + escapeIcs((event.meal ? event.meal[0].toUpperCase() + event.meal.slice(1) + ' · ' : '') + place.name),
      'LOCATION:' + escapeIcs(place.area + ', ' + destination.name + ', ' + destination.country.name),
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
  link.download = 'atlas-three-cities-itinerary.ics'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
