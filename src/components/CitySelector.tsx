import { ArrowRight, MapPin, Plane, Sparkles, TriangleAlert } from 'lucide-react'
import { destinationById, destinations } from '../data/destinations'
import type { DayAudit } from '../lib/audit'
import { dateLabel, datesInRange } from '../lib/dates'
import type { CityId, CityPlan } from '../types'

interface CitySelectorProps {
  selected: CityId
  plans: Record<CityId, CityPlan>
  audits: Record<CityId, Record<string, DayAudit>>
  overlaps: { date: string; cities: CityId[] }[]
  onSelect: (id: CityId) => void
  onGenerateAll: () => void
}

export function CitySelector({ selected, plans, audits, overlaps, onSelect, onGenerateAll }: CitySelectorProps) {
  return (
    <section className="city-selector" aria-label="City itineraries">
      <div className="city-selector-top">
        <div><span className="eyebrow dark">ONE JOURNEY / THREE CITY GUIDES</span><h2>Where to next?</h2></div>
        <button type="button" className="generate-all" onClick={onGenerateAll}>
          <Sparkles size={15} /> Generate all three <ArrowRight size={14} />
        </button>
      </div>
      <div className="city-tabs" role="group" aria-label="Choose a city itinerary">
        {destinations.map((city, index) => {
          const plan = plans[city.id]
          const dates = datesInRange(plan.startDate, plan.endDate)
          const complete = dates.filter((date) => audits[city.id][date]?.complete).length
          return (
            <button
              key={city.id}
              type="button"
              className={'city-tab city-tab-' + city.id + (selected === city.id ? ' selected' : '')}
              aria-pressed={selected === city.id}
              onClick={() => onSelect(city.id)}
            >
              <span className="city-tab-top"><span>0{index + 1} / {city.country.name}</span><MapPin size={15} /></span>
              <strong>{city.name}</strong>
              <span className="city-tab-bottom">
                {dateLabel(plan.startDate, { month: 'short', day: 'numeric' })} – {dateLabel(plan.endDate, { month: 'short', day: 'numeric' })}
                <span>{complete}/{dates.length} days ready</span>
              </span>
            </button>
          )
        })}
      </div>
      {overlaps.map(({ date, cities }) => (
        <p className="transfer-warning" key={date} role="status">
          <TriangleAlert size={17} aria-hidden="true" />
          <span><strong>{dateLabel(date, { month: 'short', day: 'numeric' })} appears in {cities.map((id) => destinationById[id].name).join(' and ')}.</strong> These are separate full-day city plans; a flight and airport transfer are not modeled. Choose which stops fit your actual travel day.</span>
          <Plane size={18} aria-hidden="true" />
        </p>
      ))}
    </section>
  )
}
