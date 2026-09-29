import { ArrowUpRight, CheckCircle2, CircleAlert, Footprints, Info, MapPinned, Route, Sparkles, UtensilsCrossed } from 'lucide-react'
import { lazy, Suspense } from 'react'
import type { CityGuide } from '../domain/CityGuide'
import type { DayAudit } from '../lib/audit'
import { dateLabel, durationLabel } from '../lib/dates'
import { getAvailability } from '../lib/hours'
import { requiredMeals } from '../lib/meals'
import { dayWalking, getTravelLeg } from '../lib/travel'
import { exchangeSourceUrl, formatUsd, type ExchangeQuote } from '../services/exchange'
import type { Place, ScheduledStop, TravelMatrix } from '../types'

const MapPanel = lazy(() => import('./MapPanel').then(({ MapPanel }) => ({ default: MapPanel })))

interface InsightsPanelProps {
  city: CityGuide
  date: string
  stops: ScheduledStop[]
  places: Place[]
  lookup: Record<string, Place>
  matrix: TravelMatrix
  routeStatus: 'loading' | 'routed' | 'estimated'
  audit: DayAudit
  quote: ExchangeQuote
  maxMealsUsd: number
  maxActivitiesUsd: number
  onSources: () => void
}

export function InsightsPanel({
  city, date, stops, places, lookup, matrix, routeStatus, audit, quote,
  maxMealsUsd, maxActivitiesUsd, onSources,
}: InsightsPanelProps) {
  const ordered = [...stops].sort((a, b) => a.start - b.start)
  const walking = dayWalking(ordered, lookup, matrix)
  const tentative = ordered.filter((stop) =>
    lookup[stop.placeId] && getAvailability(lookup[stop.placeId], date).status === 'tentative')
  const closedCount = places.filter((place) =>
    place.kind !== 'food' && getAvailability(place, date).status === 'closed').length
  const legs = ordered.slice(1).map((stop, index) => {
    const from = lookup[ordered[index].placeId]
    const to = lookup[stop.placeId]
    return from && to ? { from, to, ...getTravelLeg(from, to, matrix) } : null
  }).filter((leg) => leg !== null)
  const longest = [...legs].sort((a, b) => b.minutes - a.minutes)[0]
  const errors = audit.issues.filter((issue) => issue.severity === 'error')
  const cautions = audit.issues.filter((issue) => issue.severity === 'caution')

  return (
    <aside className="insights-panel" aria-labelledby="insights-heading">
      <div className="panel-heading">
        <div><span className="eyebrow dark">03 / THE BIG PICTURE</span><h2 id="insights-heading">Go with the flow<span className="period">.</span></h2></div>
      </div>
      <p className="panel-intro">Your {city.name} plan for {dateLabel(date, { weekday: 'long', month: 'short', day: 'numeric' })}.</p>
      <div className={'constraint-summary' + (audit.complete ? ' ready' : ' incomplete')} role="status" aria-live="polite">
        {audit.complete ? <CheckCircle2 size={19} /> : <CircleAlert size={19} />}
        <div><strong>{audit.complete ? 'All daily rules met' : `${errors.length} ${errors.length === 1 ? 'rule' : 'rules'} to fix`}</strong><span>3 meals · nearby activities · hours · walks · budgets</span></div>
      </div>
      <div className="meal-checklist" aria-label="Required meals">
        {requiredMeals.map((meal) => <span key={meal} className={audit.meals[meal] === 1 ? 'met' : 'unmet'}>
          <UtensilsCrossed size={13} /> {meal} <strong>{audit.meals[meal]}/1</strong>
        </span>)}
      </div>
      <div className="daily-budget" aria-label="Daily spending estimates per person">
        <div><span>MEALS / PERSON</span><strong>{formatUsd(audit.costs.mealsUsd)}</strong><small>of {formatUsd(maxMealsUsd)} max</small><meter min="0" max={Math.max(1, maxMealsUsd)} value={Math.min(audit.costs.mealsUsd, Math.max(1, maxMealsUsd))} aria-label="Meals budget used" /></div>
        <div><span>ACTIVITIES / PERSON</span><strong>{formatUsd(audit.costs.activitiesUsd)}</strong><small>of {formatUsd(maxActivitiesUsd)} max</small><meter min="0" max={Math.max(1, maxActivitiesUsd)} value={Math.min(audit.costs.activitiesUsd, Math.max(1, maxActivitiesUsd))} aria-label="Activities budget used" /></div>
      </div>
      <p className="exchange-note">Converted from {city.country.currency} at USD rates from <a href={exchangeSourceUrl} target="_blank" rel="noreferrer">ExchangeRate-API</a>, {quote.asOf} ({quote.source}). Costs are per-person estimates.</p>
      {(errors.length > 0 || cautions.length > 0) && <ul className="constraint-list" aria-label="Itinerary requirements and cautions">
        {[...errors, ...cautions].map((issue, index) => <li key={`${issue.code}-${index}`} className={issue.severity}>
          {issue.severity === 'error' ? <CircleAlert size={14} /> : <Info size={14} />}
          <span>{issue.message}</span>
        </li>)}
      </ul>}
      <div className="map-card">
        <div className="map-card-heading"><span><MapPinned size={16} /> YOUR DAY ON THE MAP</span><span>{ordered.length} stops</span></div>
        <Suspense fallback={<div className="map-shell map-loading">Loading the day map…</div>}>
          <MapPanel stops={ordered} lookup={lookup} city={city} />
        </Suspense>
        <p className="map-disclaimer">Dashed lines show visit order, not street-by-street directions.</p>
      </div>
      <div className="route-metrics">
        <div><span className="metric-icon"><Footprints size={19} /></span><strong>{durationLabel(walking.minutes)}</strong><small>walking time</small></div>
        <div><span className="metric-icon"><Route size={19} /></span><strong>{(walking.meters / 1000).toFixed(1)} km</strong><small>between stops</small></div>
      </div>
      <div className="route-source">
        <span className={routeStatus === 'routed' ? 'source-indicator ready' : 'source-indicator'} />
        {routeStatus === 'routed' ? 'Walking times from OpenStreetMap foot routes'
          : routeStatus === 'loading' ? 'Checking walking routes…'
            : 'Conservative walking estimates (route service unavailable)'}
      </div>
      <div className="smart-notes">
        <div className="notes-heading"><Sparkles size={17} /> GOOD TO KNOW</div>
        {city.notes.map((note) => <div className="note" key={note}><Info size={17} /><p>{note}</p></div>)}
        {closedCount > 0 && <div className="note"><CircleAlert size={17} /><p><strong>{closedCount} catalog stops are closed today.</strong> Suggestions leave them out.</p></div>}
        {tentative.length > 0 && <div className="note caution"><CircleAlert size={17} /><p><strong>{tentative.length} stops need an hours check.</strong> Call ahead before relying on them.</p></div>}
        {longest && longest.minutes >= 45 && <div className="note"><Footprints size={17} /><p><strong>Long walk:</strong> {longest.from.name} to {longest.to.name} is about {longest.minutes} min. Arrange local transit or a taxi separately.</p></div>}
      </div>
      <button type="button" className="source-link" onClick={onSources}>How we check hours & prices <ArrowUpRight size={15} /></button>
    </aside>
  )
}
