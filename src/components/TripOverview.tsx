import { ArrowDownRight, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import { dateLabel } from '../lib/dates'
import type { CityGuide } from '../domain/CityGuide'

interface TripOverviewProps {
  startDate: string
  endDate: string
  dayCount: number
  city: CityGuide
}

export function TripOverview({ startDate, endDate, dayCount, city }: TripOverviewProps) {
  const start = dateLabel(startDate, { month: 'short', day: 'numeric' })
  const end = dateLabel(endDate, { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <section className={'hero hero-' + city.id} id="top" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <div className="hero-eyebrow"><Sparkles size={14} aria-hidden="true" /> THREE CITIES, YOUR WAY</div>
        <h1 id="hero-heading">Make room<br />for <em>{city.name}.</em></h1>
        <p>{city.subtitle}</p>
        <div className="hero-bottom">
          <span className="hero-trip-chip"><CalendarDays size={16} /> {start} – {end}</span>
          <span className="hero-trip-chip"><MapPin size={16} /> {dayCount} {dayCount === 1 ? 'day' : 'days'} in {city.country.name}</span>
        </div>
      </div>
      <img src={city.hero} alt={city.heroAlt} />
      <a className="hero-scroll" href="#planner" aria-label="Jump to the itinerary planner"><ArrowDownRight size={20} /></a>
    </section>
  )
}
