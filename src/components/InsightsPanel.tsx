import { ArrowUpRight, CircleAlert, Footprints, Info, MapPinned, Route, Sparkles } from 'lucide-react'
import { lazy, Suspense } from 'react'
import type { Place, ScheduledStop, TravelMatrix } from '../types'
import { dateLabel, durationLabel } from '../lib/dates'
import { getAvailability } from '../lib/hours'
import { dayWalking, getTravelLeg } from '../lib/travel'

const MapPanel = lazy(() =>
  import('./MapPanel').then(({ MapPanel }) => ({ default: MapPanel })),
)

interface InsightsPanelProps {
  date: string
  stops: ScheduledStop[]
  places: Place[]
  lookup: Record<string, Place>
  matrix: TravelMatrix
  routeStatus: 'loading' | 'routed' | 'estimated'
  onSources: () => void
}

export function InsightsPanel({
  date,
  stops,
  places,
  lookup,
  matrix,
  routeStatus,
  onSources,
}: InsightsPanelProps) {
  const ordered = [...stops].sort((a, b) => a.start - b.start)
  const walking = dayWalking(ordered, lookup, matrix)
  const tentative = ordered.filter(
    (stop) => lookup[stop.placeId] && getAvailability(lookup[stop.placeId], date).status === 'tentative',
  )
  const closedCount = places.filter(
    (place) => place.kind !== 'food' && getAvailability(place, date).status === 'closed',
  ).length
  const legs = ordered.slice(1).map((stop, index) => {
    const from = lookup[ordered[index].placeId]
    const to = lookup[stop.placeId]
    return from && to ? { from, to, ...getTravelLeg(from, to, matrix) } : null
  }).filter((leg) => leg !== null)
  const longest = [...legs].sort((a, b) => b.minutes - a.minutes)[0]

  return (
    <aside className="insights-panel" aria-labelledby="insights-heading">
      <div className="panel-heading">
        <div>
          <span className="eyebrow dark">03 / THE BIG PICTURE</span>
          <h2 id="insights-heading">Go with the flow<span className="period">.</span></h2>
        </div>
      </div>
      <p className="panel-intro">A bird's-eye view of {dateLabel(date, { weekday: 'long', month: 'short', day: 'numeric' })}.</p>
      <div className="map-card">
        <div className="map-card-heading"><span><MapPinned size={16} /> YOUR DAY ON THE MAP</span><span>{ordered.length} stops</span></div>
        <Suspense fallback={<div className="map-shell map-loading">Loading the day map…</div>}>
          <MapPanel stops={ordered} lookup={lookup} />
        </Suspense>
        <p className="map-disclaimer">Dashed lines show visit order, not street-by-street directions.</p>
      </div>
      <div className="route-metrics">
        <div><span className="metric-icon"><Footprints size={19} /></span><strong>{durationLabel(walking.minutes)}</strong><small>walking time</small></div>
        <div><span className="metric-icon"><Route size={19} /></span><strong>{(walking.meters / 1000).toFixed(1)} km</strong><small>between stops</small></div>
      </div>
      <div className="route-source">
        <span className={routeStatus === 'routed' ? 'source-indicator ready' : 'source-indicator'} />
        {routeStatus === 'routed'
          ? 'Walking times from OpenStreetMap foot routes'
          : routeStatus === 'loading'
            ? 'Checking walking routes…'
            : 'Walking estimates (route service unavailable)'}
      </div>
      <div className="smart-notes">
        <div className="notes-heading"><Sparkles size={17} /> GOOD TO KNOW</div>
        {closedCount > 0 && (
          <div className="note">
            <CircleAlert size={17} />
            <p><strong>{closedCount} catalog stops are closed this day.</strong> They stay out of suggested plans.</p>
          </div>
        )}
        {date.endsWith('12-24') && (
          <div className="note">
            <Info size={17} />
            <p><strong>Christmas Eve:</strong> the Acropolis Museum closes at 15:00.</p>
          </div>
        )}
        {tentative.length > 0 && (
          <div className="note caution">
            <CircleAlert size={17} />
            <p><strong>{tentative.length} {tentative.length === 1 ? 'stop needs' : 'stops need'} a holiday-hours check.</strong> Call ahead before relying on {tentative.length === 1 ? 'it' : 'them'}.</p>
          </div>
        )}
        {longest && longest.minutes >= 45 && (
          <div className="note">
            <Footprints size={17} />
            <p><strong>Long walk:</strong> {longest.from.name} to {longest.to.name} is about {longest.minutes} min on foot. Transit or a taxi may be easier.</p>
          </div>
        )}
        {!closedCount && !tentative.length && !(longest && longest.minutes >= 45) && (
          <div className="note"><Info size={17} /><p>Stops fit their listed windows. Keep a little extra time for tickets and queues.</p></div>
        )}
      </div>
      <button type="button" className="source-link" onClick={onSources}>
        How we check opening hours <ArrowUpRight size={15} />
      </button>
    </aside>
  )
}
