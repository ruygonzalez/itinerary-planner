import { describe, expect, it } from 'vitest'
import { allPlacesById } from '../../data/destinations'
import { createCalendar } from '../export'

describe('calendar download', () => {
  it('exports independent local time zones and warns about unverified holiday meals', () => {
    const ics = createCalendar(
      [
        {
          id: 'meal-1',
          placeId: 'rhino-vegan',
          date: '2026-12-25',
          start: 780,
          duration: 60,
          pinned: true,
          origin: 'manual',
          meal: 'lunch',
        },
        { id: 'cairo-1', placeId: 'cairo-tahrir', date: '2026-12-25', start: 600, duration: 40, pinned: true, origin: 'manual' },
        { id: 'istanbul-1', placeId: 'istanbul-gulhane', date: '2026-12-28', start: 600, duration: 55, pinned: true, origin: 'manual' },
      ],
      allPlacesById,
    )
    expect(ics).toContain('DTSTART;TZID=Europe/Athens:20261225T130000')
    expect(ics).toContain('DTEND;TZID=Europe/Athens:20261225T140000')
    expect(ics).toContain('DTSTART;TZID=Africa/Cairo:20261225T100000')
    expect(ics).toContain('DTSTART;TZID=Europe/Istanbul:20261228T100000')
    expect(ics).toContain('Holiday hours unconfirmed')
    expect(ics).toContain('BEGIN:VEVENT')
  })
})
