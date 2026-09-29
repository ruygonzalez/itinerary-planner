import { useDroppable } from '@dnd-kit/core'
import { ArrowDown, Footprints, Plus } from 'lucide-react'
import type { Place, ScheduledStop, TravelMatrix } from '../types'
import { dateLabel, timeLabel } from '../lib/dates'
import { getAvailability } from '../lib/hours'
import { getTravelLeg } from '../lib/travel'
import { DAY_END, DAY_START } from '../lib/validation'
import { CalendarEvent } from './CalendarEvent'

export const PIXELS_PER_MINUTE = 1

export interface DragPreview {
  date: string
  start: number
  placeId: string
}

interface DayColumnProps {
  date: string
  selected: boolean
  stops: ScheduledStop[]
  lookup: Record<string, Place>
  matrix: TravelMatrix
  preview: DragPreview | null
  onSelect: () => void
  onOpenStop: (stop: ScheduledStop) => void
  onEmptyAdd: () => void
}

export function DayColumn({
  date,
  selected,
  stops,
  lookup,
  matrix,
  preview,
  onSelect,
  onOpenStop,
  onEmptyAdd,
}: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'day:' + date,
    data: { type: 'day', date },
  })
  const ordered = [...stops].sort((a, b) => a.start - b.start)
  const tentativeCount = ordered.filter(
    (stop) => lookup[stop.placeId] && getAvailability(lookup[stop.placeId], date).status === 'tentative',
  ).length
  const dayName = dateLabel(date, { weekday: 'short' }).toUpperCase()
  const dayNumber = dateLabel(date, { day: 'numeric' })
  const month = dateLabel(date, { month: 'long' })

  return (
    <div className={'day-column' + (selected ? ' active' : '')}>
      <button className="day-heading" type="button" onClick={onSelect} aria-label={'Select ' + dateLabel(date, { weekday: 'long', month: 'long', day: 'numeric' })}>
        <span className="day-heading-top"><span>{dayName}</span><span>{ordered.length} {ordered.length === 1 ? 'stop' : 'stops'}</span></span>
        <span className="day-heading-date"><strong>{dayNumber}</strong><span>{month}</span></span>
        {tentativeCount > 0 && <span className="day-caution">{tentativeCount} to confirm</span>}
      </button>
      <div
        id={'lane-' + date}
        ref={setNodeRef}
        className={'day-lane' + (isOver ? ' is-over' : '')}
        style={{ height: (DAY_END - DAY_START) * PIXELS_PER_MINUTE }}
        aria-label={'Calendar for ' + dateLabel(date, { weekday: 'long', month: 'long', day: 'numeric' })}
      >
        {ordered.length === 0 && (
          <button type="button" className="empty-day" onClick={onEmptyAdd}>
            <span><Plus size={20} /></span>
            <strong>An open day</strong>
            <small>Drop a place here or tap to explore.</small>
          </button>
        )}
        {ordered.map((stop, index) => {
          const place = lookup[stop.placeId]
          if (!place) return null
          const previous = index > 0 ? ordered[index - 1] : null
          const previousPlace = previous ? lookup[previous.placeId] : null
          const gap = previous ? stop.start - previous.start - previous.duration : 0
          const leg = previousPlace ? getTravelLeg(previousPlace, place, matrix) : null
          return (
            <div key={stop.id}>
              {leg && gap >= 28 && (
                <div
                  className="travel-between"
                  style={{
                    top: (previous!.start + previous!.duration - DAY_START) * PIXELS_PER_MINUTE + Math.max(3, (gap - 20) / 2),
                  }}
                  aria-label={leg.minutes + ' minute walk from previous stop'}
                >
                  <ArrowDown size={11} aria-hidden="true" />
                  <Footprints size={11} aria-hidden="true" />
                  {leg.minutes} min walk
                </div>
              )}
              <CalendarEvent
                stop={stop}
                place={place}
                top={(stop.start - DAY_START) * PIXELS_PER_MINUTE}
                height={stop.duration * PIXELS_PER_MINUTE}
                onOpen={() => onOpenStop(stop)}
              />
            </div>
          )
        })}
        {preview?.date === date && lookup[preview.placeId] && (
          <div
            className="drop-preview"
            style={{
              top: (preview.start - DAY_START) * PIXELS_PER_MINUTE,
              height: lookup[preview.placeId].duration * PIXELS_PER_MINUTE,
            }}
            aria-hidden="true"
          >
            <span>{timeLabel(preview.start)}</span>
            <strong>{lookup[preview.placeId].name}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
