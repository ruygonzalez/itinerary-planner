import { Heart, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Place, ScheduledStop } from '../types'
import { PlaceCard } from './PlaceCard'
import type { CityGuide } from '../domain/CityGuide'
import type { ExchangeQuote } from '../services/exchange'

interface DiscoverPanelProps {
  places: Place[]
  date: string
  savedIds: string[]
  events: ScheduledStop[]
  city: CityGuide
  quote: ExchangeQuote
  onSave: (id: string) => void
  onDetails: (place: Place) => void
  onAdd: (place: Place) => void
}

const filters = [
  { key: 'all', label: 'All' },
  { key: 'sight', label: 'Sights' },
  { key: 'museum', label: 'Museums' },
  { key: 'food', label: 'Food' },
  { key: 'outdoors', label: 'Outdoors' },
] as const

type Filter = (typeof filters)[number]['key'] | 'saved'

export function DiscoverPanel({
  places,
  date,
  savedIds,
  events,
  city,
  quote,
  onSave,
  onDetails,
  onAdd,
}: DiscoverPanelProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const visible = useMemo(() => {
    const words = query.toLocaleLowerCase().trim()
    return places.filter((place) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'saved' ? savedIds.includes(place.id) : place.kind === filter)
      const matchesQuery =
        !words ||
        [place.name, place.area, place.tagline, ...place.tags]
          .join(' ')
          .toLocaleLowerCase()
          .includes(words)
      return matchesFilter && matchesQuery
    })
  }, [places, query, filter, savedIds])
  const plannedIds = new Set(events.map((event) => event.placeId))

  return (
    <aside className="discover-panel" aria-labelledby="discover-heading">
      <div className="panel-heading discover-heading">
        <div>
          <span className="eyebrow dark">01 / DISCOVER</span>
          <h2 id="discover-heading">Find your thing<span className="period">.</span></h2>
        </div>
        <span className="count-bubble">{places.length}</span>
      </div>
      <p className="panel-intro">Real places, thoughtfully picked. Drag a card into your day or tap + to choose a time.</p>
      <label className="search-field">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          name="place-search"
          placeholder="Search places or neighborhoods"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search activities"
        />
        <kbd>/</kbd>
      </label>
      <div className="filter-row" aria-label="Filter places">
        {filters.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={filter === key ? 'active' : ''}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="list-toolbar">
        <span><SlidersHorizontal size={14} aria-hidden="true" /> {visible.length} places to explore</span>
        <button
          type="button"
          className={filter === 'saved' ? 'favorites-active' : ''}
          onClick={() => setFilter(filter === 'saved' ? 'all' : 'saved')}
          aria-pressed={filter === 'saved'}
        >
          <Heart size={14} fill={filter === 'saved' ? 'currentColor' : 'none'} /> Saved
        </button>
      </div>
      <div className="place-list">
        {visible.length ? (
          visible.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              city={city}
              quote={quote}
              date={date}
              saved={savedIds.includes(place.id)}
              planned={plannedIds.has(place.id)}
              onSave={() => onSave(place.id)}
              onDetails={() => onDetails(place)}
              onAdd={() => onAdd(place)}
            />
          ))
        ) : (
          <div className="no-results">
            <Search size={22} />
            <strong>Nothing in this corner yet.</strong>
            <span>Try a different search or filter.</span>
            <button type="button" onClick={() => { setQuery(''); setFilter('all') }}>Show all places</button>
          </div>
        )}
      </div>
    </aside>
  )
}
