import { describe, expect, it } from 'vitest'
import { placesById } from '../../data/places'
import { createCalendar } from '../export'

describe('calendar download', () => {
  it('exports Athens-local time and warns about unverified holiday meals', () => {
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
        },
      ],
      placesById,
    )
    expect(ics).toContain('DTSTART;TZID=Europe/Athens:20261225T130000')
    expect(ics).toContain('DTEND;TZID=Europe/Athens:20261225T140000')
    expect(ics).toContain('Holiday hours unconfirmed')
    expect(ics).toContain('BEGIN:VEVENT')
  })
})
