import { CalendarCheck2, Hand, Sparkles } from 'lucide-react'
import type { Place, ScheduledStop, TravelMatrix } from '../types'
import { dateLabel } from '../lib/dates'
import { DAY_END, DAY_START } from '../lib/validation'
import { DayColumn, type DragPreview } from './DayColumn'
import type { CityGuide } from '../domain/CityGuide'
import type { DayAudit } from '../lib/audit'

interface CalendarBoardProps {
  dates: string[]
  activeDate: string
  stops: ScheduledStop[]
  lookup: Record<string, Place>
  matrix: TravelMatrix
  routeStatus: 'loading' | 'routed' | 'estimated'
  city: CityGuide
  audits: Record<string, DayAudit>
  preview: DragPreview | null
  onSelectDate: (date: string) => void
  onOpenStop: (stop: ScheduledStop) => void
  onExplore: () => void
}

export function CalendarBoard({
  dates,
  activeDate,
  stops,
  lookup,
  matrix,
  routeStatus,
  city,
  audits,
  preview,
  onSelectDate,
  onOpenStop,
  onExplore,
}: CalendarBoardProps) {
  const count = stops.length
  const hours = Array.from(
    { length: (DAY_END - DAY_START) / 60 + 1 },
    (_, index) => DAY_START + index * 60,
  )

  return (
    <section className="board-panel" aria-labelledby="board-heading">
      <div className="panel-heading board-heading">
        <div>
          <span className="eyebrow dark">02 / BUILD YOUR DAYS</span>
          <h2 id="board-heading">The good kind of plans<span className="period">.</span></h2>
        </div>
        <span className="board-count"><CalendarCheck2 size={16} /> {count} {count === 1 ? 'stop' : 'stops'}</span>
      </div>
      <div className="board-subline">
        <span><Hand size={15} /> Drag places onto a day, then drag again to move them.</span>
        <span className="time-zone">All times · {city.country.timeZone}</span>
      </div>
      <div className="mobile-day-tabs" role="tablist" aria-label="Choose a day to view">
        {dates.map((date) => (
          <button
            key={date}
            role="tab"
            type="button"
            aria-selected={date === activeDate}
            className={date === activeDate ? 'selected' : ''}
            onClick={() => onSelectDate(date)}
          >
            <span>{dateLabel(date, { weekday: 'short' })}</span>
            <strong>{dateLabel(date, { day: 'numeric' })}</strong>
          </button>
        ))}
      </div>
      {routeStatus === 'loading' && !count && (
        <div className="routing-note"><Sparkles size={16} /> Checking walking routes through {city.name}…</div>
      )}
      <div className="calendar-scroll">
        <div className="calendar-grid" style={{ '--day-count': dates.length } as React.CSSProperties}>
          <div className="time-axis">
            <div className="axis-heading">{city.name.toUpperCase()}<br />TIME</div>
            <div className="axis-body" style={{ height: DAY_END - DAY_START }}>
              {hours.map((hour) => (
                <span key={hour} className="axis-label" style={{ top: hour - DAY_START }}>
                  {String(Math.floor(hour / 60)).padStart(2, '0')}:00
                </span>
              ))}
            </div>
          </div>
          {dates.map((date) => (
            <DayColumn
              key={date}
              date={date}
              selected={date === activeDate}
              stops={stops.filter((stop) => stop.date === date)}
              lookup={lookup}
              matrix={matrix}
              preview={preview}
              audit={audits[date]}
              onSelect={() => onSelectDate(date)}
              onOpenStop={onOpenStop}
              onEmptyAdd={onExplore}
            />
          ))}
        </div>
      </div>
      <p className="board-footnote">Travel gaps include a small buffer for crossings. Dragging a stop keeps it in future generated routes.</p>
    </section>
  )
}
