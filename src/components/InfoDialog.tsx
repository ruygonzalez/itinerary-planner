import { ArrowUpRight, Clock3, Footprints, Heart, Shuffle, TriangleAlert } from 'lucide-react'
import type { Place } from '../types'
import { Modal } from './Modal'

interface InfoDialogProps {
  view: 'how' | 'sources'
  places: Place[]
  onClose: () => void
}

export function InfoDialog({ view, places, onClose }: InfoDialogProps) {
  const officialSources = Array.from(
    new Map(
      places
        .filter((place) => place.hours.kind === 'official')
        .map((place) => [place.hours.sourceUrl, { name: place.name, url: place.hours.sourceUrl }]),
    ).values(),
  )

  return (
    <Modal title={view === 'how' ? 'Good plans leave room to wander.' : 'The real-world details.'} onClose={onClose} wide>
      {view === 'how' ? (
        <div className="how-grid">
          <div><Clock3 size={24} /><h3>Hours first</h3><p>Every stop fits a local opening window. Museum closures, December exceptions and restaurant meal-time service are checked by city.</p></div>
          <div><Footprints size={24} /><h3>Three meals, close by</h3><p>Each generated day has one breakfast, lunch and dinner. A restaurant must be within 25 walking minutes and 1.8 km of the neighboring activities; no activity is required before breakfast or after dinner.</p></div>
          <div><Shuffle size={24} /><h3>Budgeted variety</h3><p>Multi-start beam search tries different complete plans, checks all hard rules and enforces your separate per-person USD meal and activity caps. An infeasible day is flagged, not presented as a valid suggestion.</p></div>
          <div><Heart size={24} /><h3>Make it yours</h3><p>Drag or tap to add and pin a stop. Manual changes remain flexible, while the day audit flags missing meals, long meal walks, costs, closures and transfer gaps. Each city plan stays in this browser.</p></div>
        </div>
      ) : (
        <div className="sources-body">
          <p>We checked these public sources on September 29, 2026. Operating hours can change. “Official” refers to the venue's recurring schedule, not a guarantee of a future one-off change.</p>
          <div className="source-warning"><TriangleAlert size={18} /><span>Athens and Cairo both include December 24. These are separate city-day plans; flights and airport transfers are not modeled. Athens restaurant holiday hours are tentative. Check special service before travel.</span></div>
          <h3>Official hours</h3>
          <div className="sources-grid">
            {officialSources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name} <ArrowUpRight size={14} /></a>
            ))}
          </div>
          <h3>Reviews, prices & places</h3>
          <p>Restaurant ratings and regular hours are a September 2026 listing snapshot. Food amounts are per-person planning estimates or midpoints of published ranges, not actual average receipts; ticketed stops with unknown prices stay out of generated budget plans. See each place's details for the separate hours and price links. Public walks use suggested windows, not venue hours.</p>
          <p>USD conversion uses the latest available open.er-api.com rate or a dated fallback. Each calendar leg uses its own IANA time zone (Athens, Cairo or Istanbul). Walking routes use OpenStreetMap data, the basemap credits Esri and other data contributors, and plans are stored only in your browser.</p>
        </div>
      )}
    </Modal>
  )
}
