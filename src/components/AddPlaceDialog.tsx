import { CalendarDays, Clock3, Plus, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Place, ScheduledStop, TravelMatrix } from '../types'
import { dateLabel, minuteFromTime, timeLabel } from '../lib/dates'
import { getAvailability } from '../lib/hours'
import { suggestStart, validatePlacement, type PlacementResult } from '../lib/validation'
import { Modal } from './Modal'

interface AddPlaceDialogProps {
  place: Place
  dates: string[]
  activeDate: string
  events: ScheduledStop[]
  lookup: Record<string, Place>
  matrix: TravelMatrix
  onConfirm: (date: string, start: number) => PlacementResult
  onClose: () => void
}

export function AddPlaceDialog({
  place,
  dates,
  activeDate,
  events,
  lookup,
  matrix,
  onConfirm,
  onClose,
}: AddPlaceDialogProps) {
  const [date, setDate] = useState(activeDate)
  const [time, setTime] = useState(() =>
    timeLabel(
      suggestStart(place, activeDate, events, lookup, matrix, dates[0], dates.at(-1)!) ??
        12 * 60,
    ),
  )
  const [error, setError] = useState('')
  const availability = getAvailability(place, date)
  const minutes = minuteFromTime(time)
  const validation =
    minutes === null
      ? { ok: false, message: 'Choose a valid time.', tentative: false }
      : validatePlacement({
          place,
          date,
          start: minutes,
          events,
          lookup,
          matrix,
          startDate: dates[0],
          endDate: dates.at(-1)!,
        })

  useEffect(() => {
    const suggested = suggestStart(place, date, events, lookup, matrix, dates[0], dates.at(-1)!)
    if (suggested !== null) setTime(timeLabel(suggested))
    setError('')
  }, [date, place, events, lookup, matrix, dates])

  const submit = () => {
    if (minutes === null) return
    const result = onConfirm(date, minutes)
    if (result.ok) onClose()
    else setError(result.message)
  }

  return (
    <Modal title={'Add ' + place.name} onClose={onClose}>
      <p className="modal-intro">Choose a day and a start time. We'll check the venue's hours and walking gaps. The daily audit will flag any missing meal, distant restaurant or budget overage after you add it.</p>
      <div className="modal-form-grid">
        <label><span><CalendarDays size={15} /> Day</span><select name="add-day" value={date} onChange={(event) => setDate(event.target.value)}>{dates.map((day) => <option key={day} value={day}>{dateLabel(day, { weekday: 'long', month: 'long', day: 'numeric' })}</option>)}</select></label>
        <label><span><Clock3 size={15} /> Start time</span><input name="add-time" type="time" step="900" value={time} onChange={(event) => { setTime(event.target.value); setError('') }} /></label>
      </div>
      <div className={'modal-availability status-' + availability.status}>
        <strong>{availability.label}</strong>
        <span>{availability.note}</span>
      </div>
      {availability.status === 'tentative' && <p className="modal-warning"><TriangleAlert size={16} /> Holiday hours are not confirmed. This stop will be marked “call ahead.”</p>}
      {validation.ok && validation.meal && <p className="meal-assignment">Counts as <strong>{validation.meal}</strong>{validation.meal === 'snack' ? ' (not one of the three required meals)' : ''}.</p>}
      {!validation.ok && <p className="modal-validation" role="alert">{validation.message}</p>}
      {error && <p className="modal-validation" role="alert">{error}</p>}
      <button type="button" className="modal-primary" onClick={submit} disabled={!validation.ok}><Plus size={18} /> Add this stop</button>
    </Modal>
  )
}
