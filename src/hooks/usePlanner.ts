import { useCallback, useEffect, useMemo, useState } from 'react'
import { places, placesById } from '../data/places'
import { datesInRange, dateRangeError } from '../lib/dates'
import { generateItinerary } from '../lib/generator'
import { defaultSnapshot, loadSnapshot, saveSnapshot } from '../lib/storage'
import { estimatedMatrix, fetchWalkingMatrix } from '../services/routing'
import { validatePlacement } from '../lib/validation'
import type {
  PlanSettings,
  PlannerSnapshot,
  ScheduledStop,
  TravelMatrix,
} from '../types'

function freshSeed(): number {
  const numbers = new Uint32Array(1)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(numbers)
    return numbers[0]
  }
  return Math.floor(Math.random() * 4294967295)
}

export function usePlanner() {
  const [snapshot, setSnapshot] = useState<PlannerSnapshot>(loadSnapshot)
  const [matrix, setMatrix] = useState<TravelMatrix>(() => estimatedMatrix(places))
  const [routeStatus, setRouteStatus] = useState<'loading' | 'routed' | 'estimated'>('loading')
  const dates = useMemo(
    () => datesInRange(snapshot.startDate, snapshot.endDate),
    [snapshot.startDate, snapshot.endDate],
  )

  useEffect(() => {
    let mounted = true
    fetchWalkingMatrix(places).then((result) => {
      if (!mounted) return
      setMatrix(result)
      setRouteStatus(result.source === 'osm-foot' ? 'routed' : 'estimated')
      setSnapshot((current) => {
        if (current.events.length) return current
        const tripDates = datesInRange(current.startDate, current.endDate)
        return {
          ...current,
          events: generateItinerary({
            dates: tripDates,
            places,
            pinned: [],
            settings: current.settings,
            matrix: result,
            seed: freshSeed(),
          }),
        }
      })
    })
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => saveSnapshot(snapshot), [snapshot])

  const generate = useCallback(() => {
    setSnapshot((current) => {
      const pinned = current.events.filter((event) => event.pinned)
      return {
        ...current,
        events: generateItinerary({
          dates: datesInRange(current.startDate, current.endDate),
          places,
          pinned,
          settings: current.settings,
          matrix,
          seed: freshSeed(),
        }),
      }
    })
  }, [matrix])

  const setDates = useCallback(
    (startDate: string, endDate: string): string | null => {
      const error = dateRangeError(startDate, endDate)
      if (error) return error
      setSnapshot((current) => {
        const nextDates = datesInRange(startDate, endDate)
        const surviving = current.events.filter(
          (event) => event.pinned && nextDates.includes(event.date),
        )
        return {
          ...current,
          startDate,
          endDate,
          activeDate: nextDates.includes(current.activeDate) ? current.activeDate : nextDates[0],
          events: generateItinerary({
            dates: nextDates,
            places,
            pinned: surviving,
            settings: current.settings,
            matrix,
            seed: freshSeed(),
          }),
        }
      })
      return null
    },
    [matrix],
  )

  const addPlace = useCallback(
    (placeId: string, date: string, start: number) => {
      const place = placesById[placeId]
      if (!place) return { ok: false, message: 'That place is unavailable.', tentative: false }
      const result = validatePlacement({
        place,
        date,
        start,
        events: snapshot.events,
        lookup: placesById,
        matrix,
        startDate: snapshot.startDate,
        endDate: snapshot.endDate,
      })
      if (result.ok) {
        const event: ScheduledStop = {
          id: crypto.randomUUID(),
          placeId,
          date,
          start,
          duration: place.duration,
          pinned: true,
          origin: 'manual',
        }
        setSnapshot((current) => ({
          ...current,
          activeDate: date,
          events: [...current.events, event],
        }))
      }
      return result
    },
    [matrix, snapshot],
  )

  const moveEvent = useCallback(
    (eventId: string, date: string, start: number) => {
      const event = snapshot.events.find((stop) => stop.id === eventId)
      const place = event && placesById[event.placeId]
      if (!event || !place) {
        return { ok: false, message: 'That stop is unavailable.', tentative: false }
      }
      const result = validatePlacement({
        place,
        date,
        start,
        events: snapshot.events,
        lookup: placesById,
        matrix,
        startDate: snapshot.startDate,
        endDate: snapshot.endDate,
        ignoreId: eventId,
      })
      if (result.ok) {
        setSnapshot((current) => ({
          ...current,
          activeDate: date,
          events: current.events.map((stop) =>
            stop.id === eventId
              ? { ...stop, date, start, pinned: true, origin: 'manual' }
              : stop,
          ),
        }))
      }
      return result
    },
    [matrix, snapshot],
  )

  const removeEvent = (eventId: string) =>
    setSnapshot((current) => ({
      ...current,
      events: current.events.filter((event) => event.id !== eventId),
    }))

  const togglePin = (eventId: string) =>
    setSnapshot((current) => ({
      ...current,
      events: current.events.map((event) =>
        event.id === eventId ? { ...event, pinned: !event.pinned } : event,
      ),
    }))

  const toggleSave = (placeId: string) =>
    setSnapshot((current) => ({
      ...current,
      settings: {
        ...current.settings,
        savedIds: current.settings.savedIds.includes(placeId)
          ? current.settings.savedIds.filter((id) => id !== placeId)
          : [...current.settings.savedIds, placeId],
      },
    }))

  const updateSettings = (changes: Partial<PlanSettings>) =>
    setSnapshot((current) => ({
      ...current,
      settings: { ...current.settings, ...changes },
    }))

  const setActiveDate = (activeDate: string) =>
    setSnapshot((current) =>
      datesInRange(current.startDate, current.endDate).includes(activeDate)
        ? { ...current, activeDate }
        : current,
    )

  const clear = () =>
    setSnapshot((current) => ({
      ...defaultSnapshot(),
      startDate: current.startDate,
      endDate: current.endDate,
      activeDate: current.activeDate,
      settings: current.settings,
    }))

  return {
    ...snapshot,
    dates,
    matrix,
    routeStatus,
    generate,
    setDates,
    addPlace,
    moveEvent,
    removeEvent,
    togglePin,
    toggleSave,
    updateSettings,
    setActiveDate,
    clear,
  }
}
