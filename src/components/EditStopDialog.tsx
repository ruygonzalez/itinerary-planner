import { CalendarDays, Clock3, Pin, PinOff, Trash2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import type { Place, ScheduledStop, TravelMatrix } from '../types'
import { dateLabel, minuteFromTime, timeLabel } from '../lib/dates'
import { getAvailability } from '../lib/hours'
import { validatePlacement, type PlacementResult } from '../lib/validation'
import { Modal } from './Modal'

interface EditStopDialogProps {
  stop: ScheduledStop
  place: Place
  dates: string[]
  events: ScheduledStop[]
  lookup: Record<string, Place>
  matrix: TravelMatrix
  onMove: (date: string, start: number) => PlacementResult
  onPin: () => void
  onRemove: () => void
  onClose: () => void
}

export function EditStopDialog({
  stop,
  place,
  dates,
  events,
  lookup,
  matrix,
  onMove,
  onPin,
  onRemove,
  onClose,
}: EditStopDialogProps) {
  const [date, setDate] = useState(stop.date)
  const [time, setTime] = useState(timeLabel(stop.start))
  const [error, setError] = useState('')
  const minutes = minuteFromTime(time)
  const availability = getAvailability(place, date)
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
          ignoreId: stop.id,
        })

  const save = () => {
    if (minutes === null) return
    const result = onMove(date, minutes)
    if (result.ok) onClose()
    else setError(result.message)
  }

  return (
    <Modal title={place.name} onClose={onClose}>
      <p className="modal-intro">{place.tagline}. Move this stop without losing sight of opening times and walking gaps.</p>
      <div className="modal-form-grid">
        <label><span><CalendarDays size={15} /> Day</span><select name="edit-day" value={date} onChange={(event) => { setDate(event.target.value); setError('') }}>{dates.map((day) => <option key={day} value={day}>{dateLabel(day, { weekday: 'long', month: 'long', day: 'numeric' })}</option>)}</select></label>
        <label><span><Clock3 size={15} /> Start time</span><input name="edit-time" type="time" step="900" value={time} onChange={(event) => { setTime(event.target.value); setError('') }} /></label>
      </div>
      <div className={'modal-availability status-' + availability.status}><strong>{availability.label}</strong><span>{availability.note}</span></div>
      {availability.status === 'tentative' && <p className="modal-warning"><TriangleAlert size={16} /> Confirm holiday hours with the venue.</p>}
      {!validation.ok && <p className="modal-validation" role="alert">{validation.message}</p>}
      {error && <p className="modal-validation" role="alert">{error}</p>}
      <button type="button" className="modal-primary" onClick={save} disabled={!validation.ok}>Save time & day</button>
      <div className="modal-secondary-actions">
        <button type="button" onClick={() => { onPin(); onClose() }}>{stop.pinned ? <PinOff size={16} /> : <Pin size={16} />}{stop.pinned ? 'Unpin from generated routes' : 'Keep in generated routes'}</button>
        <button type="button" className="remove-action" onClick={() => { onRemove(); onClose() }}><Trash2 size={16} /> Remove stop</button>
      </div>
      <p className="checked-date">Pinned stops stay put when you generate another route. Manually added stops start pinned.</p>
    </Modal>
  )
}
