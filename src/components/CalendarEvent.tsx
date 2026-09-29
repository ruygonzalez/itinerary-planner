import { useDraggable } from '@dnd-kit/core'
import { Footprints, GripVertical, Pin, TriangleAlert, UtensilsCrossed } from 'lucide-react'
import type { DistanceUnit, Place, ScheduledStop, TravelLeg } from '../types'
import { stopCostUsd } from '../lib/costs'
import { formatDistance } from '../lib/distance'
import { getAvailability } from '../lib/hours'
import { expectedOnsiteWalk } from '../lib/travel'
import { timeLabel } from '../lib/dates'
import { KindIcon } from './KindIcon'
import { formatUsd, type ExchangeQuote } from '../services/exchange'

interface CalendarEventProps {
  stop: ScheduledStop
  place: Place
  top: number
  height: number
  onOpen: () => void
  invalid: boolean
  walk: TravelLeg | null
  unit: DistanceUnit
  quote: ExchangeQuote
}

export function CalendarEvent({ stop, place, top, height, onOpen, invalid, walk, unit, quote }: CalendarEventProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: 'event:' + stop.id,
    data: { type: 'event', eventId: stop.id, placeId: place.id },
  })
  const tentative = getAvailability(place, stop.date).status === 'tentative'
  const compact = height < 70
  const price = stopCostUsd(place, quote)
  const costLabel = price === null ? 'Unpriced' : place.cost === 'free' ? 'Free' : formatUsd(price)
  const onsite = expectedOnsiteWalk(place)

  return (
    <article
      ref={setNodeRef}
      className={
        'calendar-event kind-' +
        place.kind +
        (compact ? ' compact' : '') +
        (isDragging ? ' dragging' : '') +
        (invalid ? ' needs-attention' : '')
      }
      style={{ top, height: Math.max(28, height - 4) }}
    >
      <button
        className="event-content"
        type="button"
        onClick={onOpen}
        aria-label={
          timeLabel(stop.start) +
          ' ' + (stop.meal ? stop.meal + ' at ' : '') +
          place.name +
          ', ' + (price === null ? 'cost unverified' : 'estimated ' + costLabel + ' per person') +
          (walk ? ', ' + walk.minutes + ' minute walk and ' + formatDistance(walk.meters, unit) + ' from previous stop' : '') +
          (onsite.minutes ? ', about ' + onsite.minutes + ' minutes and ' + formatDistance(onsite.meters, unit) + ' of walking at this activity' : '') +
          (invalid ? ', requirements need attention' : '') +
          (tentative ? ', holiday hours unconfirmed' : '') +
          '. Open details'
        }
      >
        <span className="event-time">
          {place.kind === 'food' ? <UtensilsCrossed size={12} /> : <KindIcon kind={place.kind} size={12} />}
          {timeLabel(stop.start)} – {timeLabel(stop.start + stop.duration)}
          {tentative && <TriangleAlert size={11} aria-label="Holiday hours unconfirmed" />}
          {compact && walk && <span className="event-walk-compact">+{walk.minutes}m</span>}
        </span>
        <strong>{stop.meal && stop.meal !== 'snack' ? `${stop.meal[0].toUpperCase() + stop.meal.slice(1)} · ` : ''}{place.name}</strong>
        {!compact && (
          <span className="event-subtitle event-route">
            {walk ? <><Footprints size={11} aria-hidden="true" /> {walk.minutes} min · {formatDistance(walk.meters, unit)} to here</> : place.area}
          </span>
        )}
        {onsite.minutes > 0 && <span className={'event-subtitle event-route' + (compact ? ' event-walk-compact' : '')}
          title={'Estimated walking at this activity: ' + onsite.minutes + ' min, ' + formatDistance(onsite.meters, unit)}>
          <Footprints size={compact ? 9 : 11} aria-hidden="true" /> {onsite.minutes} min · {formatDistance(onsite.meters, unit)} on-site
        </span>}
      </button>
      <div className="event-corner">
        <span className={'event-cost' + (price === null ? ' unpriced' : '')}
          title={place.price?.note ?? 'Estimated cost per person'}>
          {stop.pinned && <Pin size={10} fill="currentColor" aria-label="Pinned stop" />}
          {costLabel}
        </span>
        <button
          type="button"
          className="event-grip"
          {...attributes}
          {...listeners}
          onClick={(event) => event.stopPropagation()}
          aria-label={'Drag ' + place.name + ' to a new time or day'}
          title="Drag to move"
        >
          <GripVertical size={14} />
        </button>
      </div>
    </article>
  )
}
