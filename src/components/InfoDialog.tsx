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
          <div><Clock3 size={24} /><h3>Hours first</h3><p>Stops must fit the published hours, weekly closures and known holiday exceptions. Christmas Eve at the Acropolis Museum ends at 15:00.</p></div>
          <div><Footprints size={24} /><h3>Walks count</h3><p>We request a walking-time table from an OpenStreetMap foot router. If it's offline, the app uses a clearly labeled distance estimate.</p></div>
          <div><Shuffle size={24} /><h3>Thoughtful variety</h3><p>Random-restart planning balances ratings, interests, meal windows, variety and travel. Generate again for a close-but-different route.</p></div>
          <div><Heart size={24} /><h3>Make it yours</h3><p>Save favorites to give them priority. Drag or add a stop to pin it; pinned stops stay when you regenerate. Your plan stays in this browser.</p></div>
        </div>
      ) : (
        <div className="sources-body">
          <p>We checked these public sources on September 29, 2026. Operating hours can change. “Official” refers to the venue's recurring schedule, not a guarantee of a future one-off change.</p>
          <div className="source-warning"><TriangleAlert size={18} /><span>Private restaurants have no published December 24–25, 2026 exceptions yet. Their regular hours are shown as tentative on those dates. Call ahead before relying on a meal stop.</span></div>
          <h3>Official hours</h3>
          <div className="sources-grid">
            {officialSources.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.name} <ArrowUpRight size={14} /></a>
            ))}
          </div>
          <h3>Reviews, prices & places</h3>
          <p>Restaurant ratings and inexpensive “£” price tiers are a September 2026 snapshot from Tripadvisor, linked on each place card. Public walks use suggested planning windows; they are not ticketed venue schedules. Walking routes use OpenStreetMap data; map tiles are by Esri and its credited data contributors.</p>
          <p>All displayed times are local clock times in Athens. No account, API key, or location permission is needed. Plans are saved only in your browser.</p>
        </div>
      )}
    </Modal>
  )
}
