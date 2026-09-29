import { ArrowDownRight, CalendarDays, MapPin, Sparkles } from 'lucide-react'
import { dateLabel } from '../lib/dates'

interface TripOverviewProps {
  startDate: string
  endDate: string
  dayCount: number
}

export function TripOverview({ startDate, endDate, dayCount }: TripOverviewProps) {
  const start = dateLabel(startDate, { month: 'short', day: 'numeric' })
  const end = dateLabel(endDate, { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <section className="hero" id="top" aria-labelledby="hero-heading">
      <div className="hero-copy">
        <div className="hero-eyebrow"><Sparkles size={14} aria-hidden="true" /> THE CITY, YOUR WAY</div>
        <h1 id="hero-heading">Make room<br />for <em>wonder.</em></h1>
        <p>Ancient stories, little detours, and really good food. A smarter way to spend your days in Athens.</p>
        <div className="hero-bottom">
          <span className="hero-trip-chip"><CalendarDays size={16} /> {start} – {end}</span>
          <span className="hero-trip-chip"><MapPin size={16} /> {dayCount} {dayCount === 1 ? 'day' : 'days'} in Athens</span>
        </div>
      </div>
      <img src="/athens-hero.svg" alt="Illustration of the Acropolis above Athens rooftops at golden hour" />
      <a className="hero-scroll" href="#planner" aria-label="Jump to the itinerary planner"><ArrowDownRight size={20} /></a>
    </section>
  )
}
