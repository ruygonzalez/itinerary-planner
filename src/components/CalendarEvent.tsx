import { useDraggable } from '@dnd-kit/core'
import { GripVertical, Pin, TriangleAlert, UtensilsCrossed } from 'lucide-react'
import type { Place, ScheduledStop } from '../types'
import { getAvailability } from '../lib/hours'
import { timeLabel } from '../lib/dates'
import { KindIcon } from './KindIcon'

interface CalendarEventProps {
  stop: ScheduledStop
  place: Place
  top: number
  height: number
  onOpen: () => void
  invalid: boolean
}

export function CalendarEvent({ stop, place, top, height, onOpen, invalid }: CalendarEventProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: 'event:' + stop.id,
    data: { type: 'event', eventId: stop.id, placeId: place.id },
  })
  const tentative = getAvailability(place, stop.date).status === 'tentative'
  const compact = height < 58

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
          (invalid ? ', requirements need attention' : '') +
          (tentative ? ', holiday hours unconfirmed' : '') +
          '. Open details'
        }
      >
        <span className="event-time">
          {place.kind === 'food' ? <UtensilsCrossed size={12} /> : <KindIcon kind={place.kind} size={12} />}
          {timeLabel(stop.start)} – {timeLabel(stop.start + stop.duration)}
          {tentative && <TriangleAlert size={11} aria-label="Holiday hours unconfirmed" />}
        </span>
        <strong>{stop.meal && stop.meal !== 'snack' ? `${stop.meal[0].toUpperCase() + stop.meal.slice(1)} · ` : ''}{place.name}</strong>
        {!compact && (
          <span className="event-subtitle">
            {tentative ? 'Call ahead · ' : ''}{place.area}
          </span>
        )}
      </button>
      <div className="event-corner">
        {stop.pinned && <Pin size={11} fill="currentColor" aria-label="Pinned stop" />}
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
