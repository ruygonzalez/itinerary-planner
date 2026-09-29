import { CalendarDays, ChevronDown, RotateCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Interest, Pace, PlanSettings } from '../types'
import { dateRangeError } from '../lib/dates'

interface DateControlsProps {
  startDate: string
  endDate: string
  settings: PlanSettings
  onDates: (start: string, end: string) => string | null
  onSettings: (changes: Partial<PlanSettings>) => void
  onGenerate: () => void
}

const paces: { value: Pace; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'full', label: 'Full' },
]

export function DateControls({
  startDate,
  endDate,
  settings,
  onDates,
  onSettings,
  onGenerate,
}: DateControlsProps) {
  const [draftStart, setDraftStart] = useState(startDate)
  const [draftEnd, setDraftEnd] = useState(endDate)
  const [error, setError] = useState('')
  const changed = draftStart !== startDate || draftEnd !== endDate

  useEffect(() => {
    setDraftStart(startDate)
    setDraftEnd(endDate)
  }, [startDate, endDate])

  const applyDates = () => {
    const issue = dateRangeError(draftStart, draftEnd) ?? onDates(draftStart, draftEnd)
    setError(issue ?? '')
  }

  return (
    <section className="controls-panel" aria-label="Trip settings">
      <div className="controls-topline">
        <div>
          <span className="eyebrow dark">YOUR TRIP AT A GLANCE</span>
          <h2>Let's make it yours.</h2>
        </div>
        <p>Every stop fits around opening hours, meal times, and the walk in between.</p>
      </div>
      <div className="controls-grid">
        <div className="control-group dates-group">
          <span className="control-label"><CalendarDays size={15} /> WHEN ARE YOU GOING?</span>
          <div className="date-fields">
            <label><span>From</span><input name="trip-start" aria-label="Trip start date" type="date" value={draftStart} onChange={(event) => { setDraftStart(event.target.value); setError('') }} /></label>
            <span className="date-arrow" aria-hidden="true">→</span>
            <label><span>Until</span><input name="trip-end" aria-label="Trip end date" type="date" value={draftEnd} onChange={(event) => { setDraftEnd(event.target.value); setError('') }} /></label>
            {changed && <button className="apply-dates" type="button" onClick={applyDates}>Apply dates</button>}
          </div>
          {error && <span className="field-error" role="alert">{error}</span>}
        </div>
        <div className="control-group pace-group">
          <span className="control-label">YOUR PACE</span>
          <div className="segmented" role="group" aria-label="Daily pace">
            {paces.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={settings.pace === value ? 'selected' : ''}
                aria-pressed={settings.pace === value}
                onClick={() => onSettings({ pace: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="control-group interest-group">
          <label className="control-label" htmlFor="interest">MOST INTO</label>
          <div className="select-wrap">
            <select
              id="interest"
              name="interest"
              value={settings.interest}
              onChange={(event) => onSettings({ interest: event.target.value as Interest })}
            >
              <option value="all">A little of everything</option>
              <option value="history">Ancient history</option>
              <option value="art">Art & museums</option>
              <option value="outdoors">Views & outdoors</option>
              <option value="food">Local food</option>
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </div>
        </div>
        <div className="control-group generate-group">
          <span className="control-label">READY WHEN YOU ARE</span>
          <button className="generate-button" type="button" onClick={() => { if (changed) applyDates(); else onGenerate() }}>
            <Sparkles size={18} aria-hidden="true" /> Generate a route <RotateCw size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
      <label className="holiday-toggle">
        <input
          type="checkbox"
          name="include-tentative-meals"
          checked={settings.includeTentativeMeals}
          onChange={(event) => onSettings({ includeTentativeMeals: event.target.checked })}
        />
        <span>Include restaurants with unconfirmed holiday hours in suggestions</span>
        <span className="toggle-hint">They'll be marked “call ahead.”</span>
      </label>
    </section>
  )
}
