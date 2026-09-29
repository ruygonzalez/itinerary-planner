import { DndContext } from '@dnd-kit/core'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { destinations } from '../../data/destinations'
import { snapshotRates } from '../../services/exchange'
import type { ScheduledStop } from '../../types'
import { DiscoverPanel } from '../DiscoverPanel'

const city = destinations[0]
const base = {
  places: city.places, city, quote: snapshotRates, date: '2026-12-22', savedIds: [],
  onSave: vi.fn(), onDetails: vi.fn(), onAdd: vi.fn(),
}

describe('Discover availability', () => {
  it('hides activities scheduled on any city day but keeps repeatable restaurants', () => {
    const scheduled: ScheduledStop[] = [
      { id: 'museum', placeId: 'acropolis', date: '2026-12-23', start: 540,
        duration: city.lookup.acropolis.duration, pinned: true, origin: 'manual' },
      { id: 'meal', placeId: 'falafellas', date: '2026-12-23', start: 720,
        duration: city.lookup.falafellas.duration, pinned: true, origin: 'manual', meal: 'lunch' },
    ]
    const view = render(<DndContext><DiscoverPanel {...base} events={scheduled} /></DndContext>)
    expect(screen.queryByRole('button', { name: 'Add The Acropolis to itinerary' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Falafellas to itinerary' })).toBeInTheDocument()
    view.rerender(<DndContext><DiscoverPanel {...base} events={scheduled.slice(1)} /></DndContext>)
    expect(screen.getByRole('button', { name: 'Add The Acropolis to itinerary' })).toBeInTheDocument()
  })
})
