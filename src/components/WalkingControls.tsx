import { Footprints } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { distanceInUnit, distanceToMeters, distanceUnits, formatDistance, MAX_WALKING_METERS, roundedDistance } from '../lib/distance'
import type { DistanceUnit, PlanSettings } from '../types'

interface WalkingControlsProps {
  meters: number
  unit: DistanceUnit
  onChange: (changes: Partial<Pick<PlanSettings, 'maxWalkingMeters' | 'distanceUnit'>>) => void
}

const units: DistanceUnit[] = ['km', 'miles', 'feet', 'steps']

export function WalkingControls({ meters, unit, onChange }: WalkingControlsProps) {
  const [draft, setDraft] = useState(String(roundedDistance(meters, unit)))
  const numberInput = useRef<HTMLInputElement>(null)
  const choice = distanceUnits[unit]
  const display = distanceInUnit(meters, unit)
  const sliderMax = distanceInUnit(MAX_WALKING_METERS, unit)
  const displayMax = roundedDistance(MAX_WALKING_METERS, unit)
  const sliderValue = Math.min(sliderMax,
    Math.max(0, Math.round(display / choice.step) * choice.step))
  const entered = Number(draft)
  const invalid = draft !== '' && (!Number.isFinite(entered) || entered < 0 ||
    entered > displayMax)

  useEffect(() => {
    if (document.activeElement !== numberInput.current) setDraft(String(roundedDistance(meters, unit)))
  }, [meters, unit])

  const update = (value: string) => {
    setDraft(value)
    const amount = Number(value)
    if (value !== '' && Number.isFinite(amount) && amount >= 0 && amount <= displayMax) {
      onChange({ maxWalkingMeters: Math.min(MAX_WALKING_METERS, distanceToMeters(amount, unit)) })
    }
  }

  return (
    <div className="walking-controls" aria-label="Daily walking distance limit">
      <div className="walking-heading">
        <Footprints size={19} aria-hidden="true" />
        <div><strong>How far do you want to walk?</strong><span>Estimated walking between and at activities, per day. Steps use an approximate 0.76 m stride.</span></div>
      </div>
      <div className="walking-slider-wrap">
        <label htmlFor="walking-slider">Daily max <strong>{formatDistance(meters, unit)}</strong></label>
        <input
          id="walking-slider"
          name="walking-slider"
          type="range"
          min="0"
          max={sliderMax}
          step={choice.step}
          value={sliderValue}
          aria-label="Maximum distance walked per day"
          aria-valuetext={formatDistance(meters, unit)}
          onChange={(event) => update(event.target.value)}
        />
      </div>
      <label className="walking-number-label">
        <span>Type a limit</span>
        <input ref={numberInput} type="number" min="0" max={displayMax} step="any"
          name="walking-limit" aria-label={'Daily walking limit in ' + choice.label}
          value={draft} onChange={(event) => update(event.target.value)}
          aria-invalid={invalid}
          onBlur={() => setDraft(String(roundedDistance(meters, unit)))} />
      </label>
      <label className="walking-unit-label">
        <span>Unit</span>
        <select name="walking-unit" aria-label="Walking distance unit" value={unit}
          onChange={(event) => onChange({ distanceUnit: event.target.value as DistanceUnit })}>
          {units.map((option) => <option key={option} value={option}>{distanceUnits[option].label}</option>)}
        </select>
      </label>
      {invalid && <span className="walking-validation" role="alert">Enter at most {formatDistance(MAX_WALKING_METERS, unit)}.</span>}
    </div>
  )
}
