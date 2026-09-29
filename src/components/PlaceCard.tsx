import { useDraggable } from '@dnd-kit/core'
import { ArrowUpRight, GripVertical, Heart, Plus, Star } from 'lucide-react'
import type { Place } from '../types'
import { getAvailability } from '../lib/hours'
import { KindIcon } from './KindIcon'
import type { CityGuide } from '../domain/CityGuide'
import { formatUsd, toUsd, type ExchangeQuote } from '../services/exchange'

interface PlaceCardProps {
  place: Place
  city: CityGuide
  quote: ExchangeQuote
  date: string
  saved: boolean
  onSave: () => void
  onDetails: () => void
  onAdd: () => void
}

export function PlaceCard({
  place,
  city,
  quote,
  date,
  saved,
  onSave,
  onDetails,
  onAdd,
}: PlaceCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: 'place:' + place.id,
    data: { type: 'place', placeId: place.id },
  })
  const availability = getAvailability(place, date)
  const kindLabel =
    place.kind === 'food'
      ? place.mealSlots?.includes('breakfast') ? 'BREAKFAST & FOOD' : 'LOCAL FOOD'
      : place.kind === 'outdoors'
        ? 'OPEN AIR'
        : place.kind === 'museum'
          ? 'MUSEUM'
          : 'LANDMARK'

  return (
    <article
      ref={setNodeRef}
      {...listeners}
      className={'place-card kind-' + place.kind + (isDragging ? ' dragging' : '')}
    >
      <div className="place-art" aria-hidden="true">
        <span className="place-art-ring" />
        <KindIcon kind={place.kind} size={27} />
      </div>
      <div className="place-main">
        <div className="place-topline">
          <span className="place-category">{kindLabel}</span>
          {place.reviewCount > 0 && <span className="place-rating"><Star size={12} fill="currentColor" /> {place.rating.toFixed(1)}</span>}
        </div>
        <button className="place-title" type="button" onClick={onDetails}>
          {place.name} <ArrowUpRight size={14} aria-hidden="true" />
        </button>
        <p>{place.area} <span aria-hidden="true">·</span> {place.duration} min</p>
        <div className="place-bottomline">
          <span className={'hours-badge status-' + availability.status}>
            <span aria-hidden="true" />
            {availability.status === 'open'
              ? availability.label
              : availability.status === 'closed'
                ? 'Closed this day'
                : availability.status === 'tentative'
                  ? 'Call ahead'
                  : 'Flexible'}
          </span>
          <span className="price-badge" title={place.price?.note ?? 'Ticket price not verified; excluded from budgeted suggestions'}>
            {place.cost === 'free' ? 'Free' : place.price
              ? `${city.formatPrice(place.price.amount)} ≈ ${formatUsd(toUsd(place.price.amount, place.price.currency, quote))}`
              : 'Price unverified'}
          </span>
        </div>
      </div>
      <div className="place-actions">
        <button
          className={'icon-button save-button' + (saved ? ' is-saved' : '')}
          type="button"
          onClick={onSave}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          aria-label={(saved ? 'Remove ' : 'Save ') + place.name + (saved ? ' from' : ' to') + ' favorites'}
          aria-pressed={saved}
          title={saved ? 'Remove from favorites' : 'Save for later'}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
        <button
          className="icon-button drag-handle"
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          aria-label={'Drag ' + place.name + ' into a day on the calendar'}
          title="Drag into the calendar"
        >
          <GripVertical size={17} />
        </button>
        <button
          className="place-add"
          type="button"
          onClick={onAdd}
          onPointerDown={(event) => event.stopPropagation()}
          onTouchStart={(event) => event.stopPropagation()}
          aria-label={'Add ' + place.name + ' to itinerary'}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  )
}
