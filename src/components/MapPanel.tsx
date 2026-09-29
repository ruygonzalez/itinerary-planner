import { useEffect, useMemo } from 'react'
import { latLngBounds } from 'leaflet'
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet'
import type { Place, ScheduledStop } from '../types'

type Point = [number, number]

function FitStops({ points }: { points: Point[] }) {
  const map = useMap()
  const key = points.map((point) => point.join(',')).join('|')
  useEffect(() => {
    if (points.length > 1) {
      map.fitBounds(latLngBounds(points), { padding: [34, 34], maxZoom: 14 })
    } else if (points.length === 1) {
      map.setView(points[0], 14)
    } else {
      map.setView([37.9746, 23.728], 13)
    }
  }, [key, map]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export function MapPanel({
  stops,
  lookup,
}: {
  stops: ScheduledStop[]
  lookup: Record<string, Place>
}) {
  const ordered = useMemo(
    () => [...stops].sort((a, b) => a.start - b.start).filter((stop) => lookup[stop.placeId]),
    [stops, lookup],
  )
  const points = useMemo<Point[]>(
    () =>
      ordered.map(({ placeId }) => {
        const { lat, lng } = lookup[placeId].coordinates
        return [lat, lng]
      }),
    [ordered, lookup],
  )

  return (
    <div className="map-shell" aria-label="Map of selected day's stops">
      <MapContainer
        center={[37.9746, 23.728]}
        zoom={13}
        scrollWheelZoom={false}
        className="route-map"
      >
        <TileLayer
          attribution='Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>, HERE, Garmin, <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &amp; GIS community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        />
        <FitStops points={points} />
        {points.length > 1 && (
          <Polyline positions={points} pathOptions={{ color: '#b7654c', weight: 3, opacity: 0.8, dashArray: '5 7' }} />
        )}
        {ordered.map((stop, index) => {
          const place = lookup[stop.placeId]
          return (
            <CircleMarker
              key={stop.id}
              center={points[index]}
              radius={10}
              pathOptions={{
                color: '#fffaf1',
                weight: 3,
                fillColor: place.kind === 'food' ? '#d78e5d' : '#205b50',
                fillOpacity: 1,
              }}
            >
              <Tooltip direction="top" offset={[0, -11]}>{index + 1}. {place.name}</Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>
      {!ordered.length && <span className="map-empty">Your Athens route will appear here.</span>}
    </div>
  )
}
