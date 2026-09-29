import { describe, expect, it } from 'vitest'
import { placesById } from '../../data/places'
import { fitsOpeningHours, getAvailability } from '../hours'

describe('published and tentative opening hours', () => {
  it('keeps state archaeological sites closed on Christmas Day', () => {
    for (const id of ['acropolis', 'ancient-agora', 'roman-agora', 'national-museum']) {
      expect(getAvailability(placesById[id], '2026-12-25').status).toBe('closed')
    }
    expect(getAvailability(placesById.acropolis, '2026-12-22').windows).toEqual([
      { open: 480, close: 1020 },
    ])
    expect(getAvailability(placesById['roman-agora'], '2026-12-23').windows).toEqual([
      { open: 480, close: 900 },
    ])
  })

  it('applies the Acropolis Museum Christmas Eve exception before normal Thursday hours', () => {
    const museum = placesById['acropolis-museum']
    const eve = getAvailability(museum, '2026-12-24')
    expect(eve.windows).toEqual([{ open: 540, close: 900 }])
    expect(fitsOpeningHours(eve, 810, 90)).toBe(true)
    expect(fitsOpeningHours(eve, 825, 90)).toBe(false)
    expect(getAvailability(museum, '2026-12-25').status).toBe('closed')
  })

  it('handles Tuesday late opening, weekly closures, and changing seasons', () => {
    expect(getAvailability(placesById['national-museum'], '2026-12-22').windows).toEqual([
      { open: 780, close: 1200 },
    ])
    expect(getAvailability(placesById.cycladic, '2026-12-22').status).toBe('closed')
    expect(getAvailability(placesById.acropolis, '2027-04-01').windows).toEqual([
      { open: 480, close: 1200 },
    ])
    expect(getAvailability(placesById['acropolis-museum'], '2026-12-18').windows).toEqual([
      { open: 540, close: 1320 },
    ])
  })

  it('never presents regular restaurant holiday hours as confirmed', () => {
    expect(getAvailability(placesById.falafellas, '2026-12-25').status).toBe('tentative')
    expect(getAvailability(placesById.falafellas, '2026-12-27').status).toBe('closed')
    expect(getAvailability(placesById.plaka, '2026-12-25').status).toBe('flexible')
  })
})
