import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { ArrowUpRight, Clock3, Footprints, ShieldCheck, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AddPlaceDialog } from './components/AddPlaceDialog'
import { CalendarBoard } from './components/CalendarBoard'
import { PIXELS_PER_MINUTE, type DragPreview } from './components/DayColumn'
import { DateControls } from './components/DateControls'
import { DiscoverPanel } from './components/DiscoverPanel'
import { EditStopDialog } from './components/EditStopDialog'
import { Header } from './components/Header'
import { InfoDialog } from './components/InfoDialog'
import { InsightsPanel } from './components/InsightsPanel'
import { KindIcon } from './components/KindIcon'
import { PlaceDetailsDialog } from './components/PlaceDetailsDialog'
import { Toast, type ToastMessage } from './components/Toast'
import { TripOverview } from './components/TripOverview'
import { places, placesById } from './data/places'
import { usePlanner } from './hooks/usePlanner'
import { downloadCalendar } from './lib/export'
import { roundToQuarter } from './lib/dates'
import { dayWalking } from './lib/travel'
import { DAY_END, DAY_START } from './lib/validation'
import type { Place, ScheduledStop } from './types'

type Dialog =
  | { type: 'details'; placeId: string }
  | { type: 'add'; placeId: string }
  | { type: 'edit'; eventId: string }
  | { type: 'info'; view: 'how' | 'sources' }
  | null

const collisionDetection: CollisionDetection = (args) => {
  const pointer = pointerWithin(args)
  return pointer.length ? pointer : rectIntersection(args)
}

function pointerPosition(event: DragMoveEvent | DragEndEvent): number | null {
  const trigger = event.activatorEvent
  if ('clientY' in trigger && typeof trigger.clientY === 'number') {
    return trigger.clientY + event.delta.y
  }
  if (typeof TouchEvent !== 'undefined' && trigger instanceof TouchEvent && trigger.touches.length) {
    return trigger.touches[0].clientY + event.delta.y
  }
  return event.active.rect.current.translated?.top ?? null
}

function previewFor(event: DragMoveEvent | DragEndEvent): DragPreview | null {
  const date = event.over?.data.current?.date as string | undefined
  const placeId = event.active.data.current?.placeId as string | undefined
  if (!date || !placeId || !placesById[placeId]) return null
  const lane = document.getElementById('lane-' + date)
  const y = pointerPosition(event)
  if (!lane || y === null) return null
  const top = lane.getBoundingClientRect().top
  const place = placesById[placeId]
  const start = Math.max(
    DAY_START,
    Math.min(
      DAY_END - place.duration,
      roundToQuarter(DAY_START + (y - top) / PIXELS_PER_MINUTE),
    ),
  )
  return { date, start, placeId }
}

export default function App() {
  const planner = usePlanner()
  const [dialog, setDialog] = useState<Dialog>(null)
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const [draggedPlaceId, setDraggedPlaceId] = useState<string | null>(null)
  const [preview, setPreview] = useState<DragPreview | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 7 } }),
    useSensor(KeyboardSensor),
  )

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (
        event.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) &&
        !dialog
      ) {
        event.preventDefault()
        document.querySelector<HTMLInputElement>('input[aria-label="Search activities"]')?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dialog])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  const notify = (text: string, type: ToastMessage['type'] = 'success') =>
    setToast({ id: Date.now(), text, type })

  const addPlace = (placeId: string, date: string, start: number) => {
    const result = planner.addPlace(placeId, date, start)
    notify(result.message, result.ok ? (result.tentative ? 'warning' : 'success') : 'error')
    return result
  }

  const moveEvent = (eventId: string, date: string, start: number) => {
    const result = planner.moveEvent(eventId, date, start)
    notify(
      result.ok ? (result.tentative ? 'Moved tentatively. Confirm holiday hours.' : 'Stop moved and pinned.') : result.message,
      result.ok ? (result.tentative ? 'warning' : 'success') : 'error',
    )
    return result
  }

  const onDragStart = (event: DragStartEvent) => {
    setDraggedPlaceId((event.active.data.current?.placeId as string | undefined) ?? null)
  }
  const onDragMove = (event: DragMoveEvent) => setPreview(previewFor(event))
  const onDragEnd = (event: DragEndEvent) => {
    const drop = previewFor(event)
    const eventId = event.active.data.current?.eventId as string | undefined
    const placeId = event.active.data.current?.placeId as string | undefined
    if (drop && placeId) {
      if (eventId) moveEvent(eventId, drop.date, drop.start)
      else addPlace(placeId, drop.date, drop.start)
    }
    setDraggedPlaceId(null)
    setPreview(null)
  }
  const onDragCancel = () => {
    setDraggedPlaceId(null)
    setPreview(null)
  }

  const tripWalking = planner.dates.reduce(
    (sum, date) =>
      sum +
      dayWalking(
        planner.events.filter((event) => event.date === date),
        placesById,
        planner.matrix,
      ).minutes,
    0,
  )
  const selectedStops = planner.events.filter((event) => event.date === planner.activeDate)
  const detailsPlace = dialog && 'placeId' in dialog ? placesById[dialog.placeId] : null
  const editingEvent =
    dialog?.type === 'edit'
      ? planner.events.find((event) => event.id === dialog.eventId)
      : null
  const editingPlace = editingEvent ? placesById[editingEvent.placeId] : null
  const closeDialog = () => setDialog(null)
  const openAdd = (place: Place) => setDialog({ type: 'add', placeId: place.id })
  const openEdit = (event: ScheduledStop) => setDialog({ type: 'edit', eventId: event.id })

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <Header
        stopCount={planner.events.length}
        onHow={() => setDialog({ type: 'info', view: 'how' })}
        onSources={() => setDialog({ type: 'info', view: 'sources' })}
        onExport={() => {
          if (!planner.events.length) return
          downloadCalendar(planner.events, placesById)
          notify('Calendar file downloaded. Times are set to Europe/Athens.')
        }}
      />
      <div className="app-shell">
        <TripOverview startDate={planner.startDate} endDate={planner.endDate} dayCount={planner.dates.length} />
        <main id="planner">
          <DateControls
            startDate={planner.startDate}
            endDate={planner.endDate}
            settings={planner.settings}
            onDates={planner.setDates}
            onSettings={planner.updateSettings}
            onGenerate={() => {
              planner.generate()
              notify('A fresh route is ready. Your pinned stops stayed put.')
            }}
          />
          <div className="trip-status">
            <div>
              <span className="status-led" />
              <strong>{places.length} real places</strong>
              <span className="status-divider">/</span>
              <span>{planner.events.length} planned stops</span>
              <span className="status-divider">/</span>
              <span><Footprints size={15} /> {tripWalking} min on foot</span>
            </div>
            <div className="status-right">
              <span><ShieldCheck size={15} /> Known closures applied</span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Clear all stops from this itinerary? Your dates and preferences will stay.')) {
                    planner.clear()
                    notify('Your calendar is clear. Start fresh with any place.')
                  }
                }}
                title="Clear itinerary"
              >
                <Trash2 size={14} /> Clear board
              </button>
            </div>
          </div>
          <div className="workspace">
            <DiscoverPanel
              places={places}
              date={planner.activeDate}
              savedIds={planner.settings.savedIds}
              events={planner.events}
              onSave={planner.toggleSave}
              onDetails={(place) => setDialog({ type: 'details', placeId: place.id })}
              onAdd={openAdd}
            />
            <CalendarBoard
              dates={planner.dates}
              activeDate={planner.activeDate}
              stops={planner.events}
              lookup={placesById}
              matrix={planner.matrix}
              routeStatus={planner.routeStatus}
              preview={preview}
              onSelectDate={planner.setActiveDate}
              onOpenStop={openEdit}
              onExplore={() => document.getElementById('discover-heading')?.scrollIntoView({ behavior: 'smooth' })}
            />
            <InsightsPanel
              date={planner.activeDate}
              stops={selectedStops}
              places={places}
              lookup={placesById}
              matrix={planner.matrix}
              routeStatus={planner.routeStatus}
              onSources={() => setDialog({ type: 'info', view: 'sources' })}
            />
          </div>
        </main>
        <footer className="site-footer">
          <div><span className="footer-mark">✦</span><strong>atlas<span>.</span></strong> For the days you'll remember.</div>
          <p><Clock3 size={14} /> Local Athens time · Hours checked Sep 2026 · Always reconfirm holiday openings</p>
          <button type="button" onClick={() => setDialog({ type: 'info', view: 'sources' })}>Data & credits <ArrowUpRight size={14} /></button>
        </footer>
      </div>
      <DragOverlay dropAnimation={null}>
        {draggedPlaceId && placesById[draggedPlaceId] ? (
          <div className={'drag-overlay kind-' + placesById[draggedPlaceId].kind}>
            <KindIcon kind={placesById[draggedPlaceId].kind} size={20} />
            <strong>{placesById[draggedPlaceId].name}</strong>
            <span>Drop into a day</span>
          </div>
        ) : null}
      </DragOverlay>
      {dialog?.type === 'details' && detailsPlace && (
        <PlaceDetailsDialog
          place={detailsPlace}
          date={planner.activeDate}
          onClose={closeDialog}
          onAdd={() => openAdd(detailsPlace)}
        />
      )}
      {dialog?.type === 'add' && detailsPlace && (
        <AddPlaceDialog
          place={detailsPlace}
          dates={planner.dates}
          activeDate={planner.activeDate}
          events={planner.events}
          lookup={placesById}
          matrix={planner.matrix}
          onConfirm={(date, start) => addPlace(detailsPlace.id, date, start)}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === 'edit' && editingEvent && editingPlace && (
        <EditStopDialog
          stop={editingEvent}
          place={editingPlace}
          dates={planner.dates}
          events={planner.events}
          lookup={placesById}
          matrix={planner.matrix}
          onMove={(date, start) => moveEvent(editingEvent.id, date, start)}
          onPin={() => {
            planner.togglePin(editingEvent.id)
            notify(editingEvent.pinned ? 'This stop can change on the next generated route.' : 'Stop pinned in place.')
          }}
          onRemove={() => {
            planner.removeEvent(editingEvent.id)
            notify('Stop removed from your itinerary.')
          }}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === 'info' && (
        <InfoDialog view={dialog.view} places={places} onClose={closeDialog} />
      )}
      <Toast message={toast} onClose={() => setToast(null)} />
    </DndContext>
  )
}
