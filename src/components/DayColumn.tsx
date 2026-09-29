import { useDroppable } from '@dnd-kit/core'
import { ArrowDown, Footprints, Plus } from 'lucide-react'
import type { Place, PlanSettings, ScheduledStop, TravelMatrix } from '../types'
import { stopBudget } from '../lib/costs'
import { dateLabel, timeLabel } from '../lib/dates'
import { formatDistance } from '../lib/distance'
import { getAvailability } from '../lib/hours'
import { getTravelLeg } from '../lib/travel'
import { DAY_END, DAY_START } from '../lib/validation'
import { CalendarEvent } from './CalendarEvent'
import type { DayAudit } from '../lib/audit'
import type { PlacementResult } from '../lib/validation'
import { formatUsd, type ExchangeQuote } from '../services/exchange'

export const PIXELS_PER_MINUTE = 1.2

export interface DragPreview {
  date: string
  start: number
  placeId: string
  validation: PlacementResult
}

interface DayColumnProps {
  date: string
  selected: boolean
  stops: ScheduledStop[]
  lookup: Record<string, Place>
  matrix: TravelMatrix
  settings: PlanSettings
  quote: ExchangeQuote
  draggedPlace: Place | null
  draggedEventId: string | null
  preview: DragPreview | null
  audit?: DayAudit
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
  settings,
  quote,
  draggedPlace,
  draggedEventId,
  preview,
  audit,
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
  const budget = draggedPlace
    ? stopBudget(draggedPlace, date, stops, lookup, settings, quote, draggedEventId ?? undefined)
    : null
  const remainingActivities = Math.max(0, settings.maxActivitiesUsd - (audit?.costs.activitiesUsd ?? 0))
  const remainingWalk = Math.max(0, settings.maxWalkingMeters - (audit?.walking.meters ?? 0))
  const hovering = preview?.date === date
  const blocked = hovering && preview?.validation.ok === false
  const previewMessage = preview?.validation.ok
    ? budget?.priceUsd === null ? 'Budget unverified · confirm admission cost' : 'Fits this day · release to place' :
    preview?.validation.reason === 'budget' ? 'Over this day’s budget' :
    preview?.validation.reason === 'walking' ? 'Beyond your walking limit' :
    preview?.validation.reason === 'duplicate' ? 'Already in your itinerary' :
    preview?.validation.reason === 'hours' ? 'Closed or outside visiting hours' :
    'Time or travel conflict · try another slot'

  return (
    <div className={'day-column' + (selected ? ' active' : '') +
      (budget ? budget.exceeded ? ' cannot-afford' : budget.priceUsd === null ? ' price-unknown' : ' can-afford' : '')}>
      <button className="day-heading" type="button" onClick={onSelect}
        aria-label={'Select ' + dateLabel(date, { weekday: 'long', month: 'long', day: 'numeric' }) +
          (budget?.exceeded ? ', over ' + budget.category + ' budget for this stop' : '')}>
        <span className="day-heading-top"><span>{dayName}</span><span>{ordered.length} {ordered.length === 1 ? 'stop' : 'stops'}</span></span>
        <span className="day-heading-date"><strong>{dayNumber}</strong><span>{month}</span></span>
        <span className={'day-rule-status' + (audit?.complete ? ' ready' : '')}>
          {audit?.complete ? '✓ Requirements met' : `${(audit?.meals.breakfast ?? 0) + (audit?.meals.lunch ?? 0) + (audit?.meals.dinner ?? 0)}/3 meals · Check rules`}
        </span>
        <span className={'day-budget-room' + (budget?.exceeded ? ' over' : '')}>
          {budget ? budget.exceeded
            ? 'Over ' + budget.category + ' cap by ' + formatUsd(budget.totalUsd! - budget.capUsd)
            : budget.priceUsd === null ? 'Price unverified'
              : budget.category + ' budget: ' + formatUsd(Math.max(0, budget.remainingUsd)) + ' left'
            : 'Activities: ' + formatUsd(remainingActivities) + ' left'}
        </span>
        <span className="day-walk-room">{formatDistance(remainingWalk, settings.distanceUnit)} walking left</span>
        {tentativeCount > 0 && <span className="day-caution">{tentativeCount} to confirm</span>}
      </button>
      <div
        id={'lane-' + date}
        ref={setNodeRef}
        className={'day-lane' + (isOver ? ' is-over' : '') + (blocked ? ' drop-blocked' : '')}
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
                    top: (previous!.start + previous!.duration - DAY_START) * PIXELS_PER_MINUTE +
                      Math.max(3, (gap * PIXELS_PER_MINUTE - 20) / 2),
                  }}
                  aria-label={leg.minutes + ' minute walk from previous stop'}
                >
                  <ArrowDown size={11} aria-hidden="true" />
                  <Footprints size={11} aria-hidden="true" />
                  {leg.minutes} min · {formatDistance(leg.meters, settings.distanceUnit)}
                </div>
              )}
              <CalendarEvent
                stop={stop}
                place={place}
                invalid={audit?.issues.some((issue) => issue.severity === 'error' && issue.stopIds?.includes(stop.id)) ?? false}
                top={(stop.start - DAY_START) * PIXELS_PER_MINUTE}
                height={stop.duration * PIXELS_PER_MINUTE}
                walk={leg}
                unit={settings.distanceUnit}
                quote={quote}
                onOpen={() => onOpenStop(stop)}
              />
            </div>
          )
        })}
        {preview?.date === date && lookup[preview.placeId] && (
          <div
            className={'drop-preview' + (blocked ? ' blocked' : budget?.priceUsd === null ? ' unpriced' : '')}
            style={{
              top: (preview.start - DAY_START) * PIXELS_PER_MINUTE,
              height: lookup[preview.placeId].duration * PIXELS_PER_MINUTE,
            }}
            aria-hidden="true"
          >
            <span>{timeLabel(preview.start)} · {budget?.priceUsd === null ? 'price unverified' : formatUsd(budget?.priceUsd ?? 0)} / person</span>
            <strong>{lookup[preview.placeId].name}</strong>
            <small>{previewMessage}</small>
          </div>
        )}
      </div>
    </div>
  )
}
