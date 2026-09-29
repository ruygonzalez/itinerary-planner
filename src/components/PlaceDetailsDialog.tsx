import { ArrowUpRight, Clock3, MapPin, Plus, Star, Ticket } from 'lucide-react'
import type { Place } from '../types'
import { dateLabel, durationLabel } from '../lib/dates'
import { getAvailability } from '../lib/hours'
import { KindIcon } from './KindIcon'
import { Modal } from './Modal'

interface PlaceDetailsDialogProps {
  place: Place
  date: string
  onClose: () => void
  onAdd: () => void
}

export function PlaceDetailsDialog({ place, date, onClose, onAdd }: PlaceDetailsDialogProps) {
  const availability = getAvailability(place, date)
  const mapUrl =
    'https://www.openstreetmap.org/?mlat=' +
    place.coordinates.lat +
    '&mlon=' +
    place.coordinates.lng +
    '#map=16/' +
    place.coordinates.lat +
    '/' +
    place.coordinates.lng

  return (
    <Modal title={place.name} onClose={onClose}>
      <div className={'details-art kind-' + place.kind}><KindIcon kind={place.kind} size={50} /><span>{place.area}</span></div>
      <p className="details-tagline">{place.tagline}</p>
      <p className="details-description">{place.description}</p>
      <div className="details-facts">
        <span><Star size={16} fill="currentColor" /> {place.rating.toFixed(1)} <small>Tripadvisor · {place.reviewCount.toLocaleString()} reviews</small></span>
        <span><Clock3 size={16} /> {durationLabel(place.duration)} <small>suggested visit</small></span>
        <span><Ticket size={16} /> {place.cost === 'budget' ? 'Budget £ tier' : place.cost === 'free' ? 'Free' : place.ticketPrice ? '€' + place.ticketPrice + ' entry' : 'Ticketed'} <small>{place.cost === 'budget' ? 'Tripadvisor price category' : 'admission'}</small></span>
      </div>
      <div className={'details-hours status-' + availability.status}>
        <span><Clock3 size={17} /> {dateLabel(date, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
        <strong>{availability.label}</strong>
        <p>{availability.note}</p>
        {place.hours.note && <p>{place.hours.note}</p>}
      </div>
      <div className="detail-tags">{place.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      <div className="source-list">
        <a href={place.hours.sourceUrl} target="_blank" rel="noreferrer">{place.hours.kind === 'suggested' ? 'Place & access source' : 'Opening hours source'} <ArrowUpRight size={14} /></a>
        <a href={place.reviewUrl} target="_blank" rel="noreferrer">Ratings & budget source <ArrowUpRight size={14} /></a>
        <a href={mapUrl} target="_blank" rel="noreferrer"><MapPin size={14} /> See location <ArrowUpRight size={14} /></a>
      </div>
      <p className="checked-date">Sources checked {dateLabel(place.hours.checkedOn, { month: 'long', day: 'numeric', year: 'numeric' })}. Check the venue again before travel.</p>
      <button type="button" className="modal-primary" onClick={onAdd}><Plus size={18} /> Add to my itinerary</button>
    </Modal>
  )
}
