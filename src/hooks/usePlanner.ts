import { useEffect, useMemo, useRef, useState } from 'react'
import { allPlacesById, destinationById, destinations } from '../data/destinations'
import { overlappingCityDates, auditDay, type DayAudit } from '../lib/audit'
import { datesInRange, dateRangeError } from '../lib/dates'
import { generateItinerary, type GenerationResult } from '../lib/generator'
import { loadSnapshot, saveSnapshot } from '../lib/storage'
import { estimatedMatrix, fetchWalkingMatrix } from '../services/routing'
import { validatePlacement } from '../lib/validation'
import type { CityId, CityPlan, PlanSettings, PlannerSnapshot, ScheduledStop, TravelMatrix } from '../types'
import { useExchangeRates } from './useExchangeRates'

function freshSeed(): number {
  const numbers = new Uint32Array(1)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(numbers)
    return numbers[0]
  }
  return Math.floor(Math.random() * 4294967295)
}

function matrixDefaults(): Record<CityId, TravelMatrix> {
  return Object.fromEntries(destinations.map((city) => [city.id, estimatedMatrix(city.places)])) as Record<CityId, TravelMatrix>
}

function replacePlan(snapshot: PlannerSnapshot, id: CityId, changes: Partial<CityPlan>): PlannerSnapshot {
  return { ...snapshot, plans: {
    ...snapshot.plans,
    [id]: { ...snapshot.plans[id], ...changes },
  } }
}

export function usePlanner() {
  const quote = useExchangeRates()
  const [snapshot, setSnapshot] = useState<PlannerSnapshot>(loadSnapshot)
  const [matrices, setMatrices] = useState(matrixDefaults)
  const [routeStatuses, setRouteStatuses] = useState<Record<CityId, 'loading' | 'routed' | 'estimated'>>({
    athens: 'estimated', cairo: 'estimated', istanbul: 'estimated',
  })
  const lastLiveRates = useRef<string | null>(null)
  const cityId = snapshot.selectedCity
  const city = destinationById[cityId]
  const plan = snapshot.plans[cityId]
  const matrix = matrices[cityId]
  const dates = useMemo(() => datesInRange(plan.startDate, plan.endDate), [plan.startDate, plan.endDate])

  // The first visit creates three independent, constraint-checked city legs.
  // A cleared leg has generatedOnce=true and remains cleared on reload.
  useEffect(() => {
    setSnapshot((current) => {
      let next = current
      for (const destination of destinations) {
        const existing = next.plans[destination.id]
        if (existing.generatedOnce) continue
        const generated = generateItinerary({
          cityId: destination.id,
          dates: datesInRange(existing.startDate, existing.endDate),
          places: destination.places, pinned: existing.events.filter((event) => event.pinned),
          settings: existing.settings, matrix: matrices[destination.id], quote, seed: freshSeed(),
        })
        next = replacePlan(next, destination.id, { events: generated.events, generatedOnce: true })
      }
      return next
    })
    // Deliberately generate once with an estimated matrix, then refine the
    // selected city when a real foot-route table arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => saveSnapshot(snapshot), [snapshot])

  useEffect(() => {
    let active = true
    const selected = destinationById[cityId]
    setRouteStatuses((current) => ({ ...current, [cityId]: 'loading' }))
    fetchWalkingMatrix(selected.places).then((result) => {
      if (!active) return
      setMatrices((current) => ({ ...current, [cityId]: result }))
      setRouteStatuses((current) => ({
        ...current, [cityId]: result.source === 'osm-foot' ? 'routed' : 'estimated',
      }))
      if (result.source !== 'osm-foot') return
      setSnapshot((current) => {
        const existing = current.plans[cityId]
        if (!existing.generatedOnce || !existing.events.some((event) => !event.pinned)) return current
        const refreshed = generateItinerary({
          cityId, dates: datesInRange(existing.startDate, existing.endDate),
          places: selected.places, pinned: existing.events.filter((event) => event.pinned),
          settings: existing.settings, matrix: result, quote, seed: freshSeed(),
        })
        return replacePlan(current, cityId, { events: refreshed.events })
      })
    })
    return () => { active = false }
  // Do not restart the network request merely because an FX quote changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId])

  useEffect(() => {
    if (quote.source !== 'live') return
    const key = quote.asOf + JSON.stringify(quote.perUsd)
    if (lastLiveRates.current === key) return
    lastLiveRates.current = key
    setSnapshot((current) => {
      let next = current
      for (const destination of destinations) {
        const existing = next.plans[destination.id]
        if (!existing.generatedOnce || !existing.events.some((event) => !event.pinned)) continue
        const refreshed = generateItinerary({
          cityId: destination.id, dates: datesInRange(existing.startDate, existing.endDate),
          places: destination.places, pinned: existing.events.filter((event) => event.pinned),
          settings: existing.settings, matrix: matrices[destination.id], quote, seed: freshSeed(),
        })
        next = replacePlan(next, destination.id, { events: refreshed.events })
      }
      return next
    })
  // The rate stamp handles idempotence even as route tables arrive later.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote])

  const generateCity = (id: CityId): GenerationResult => {
    const destination = destinationById[id]
    const existing = snapshot.plans[id]
    const result = generateItinerary({
      cityId: id, dates: datesInRange(existing.startDate, existing.endDate),
      places: destination.places, pinned: existing.events.filter((event) => event.pinned),
      settings: existing.settings, matrix: matrices[id], quote, seed: freshSeed(),
    })
    setSnapshot((current) => replacePlan(current, id, { events: result.events, generatedOnce: true }))
    return result
  }

  const generate = () => generateCity(cityId)
  const generateAll = (): Record<CityId, GenerationResult> => {
    const results = Object.fromEntries(destinations.map((destination) => {
      const existing = snapshot.plans[destination.id]
      const generated = generateItinerary({
        cityId: destination.id, dates: datesInRange(existing.startDate, existing.endDate),
        places: destination.places, pinned: existing.events.filter((event) => event.pinned),
        settings: existing.settings, matrix: matrices[destination.id], quote, seed: freshSeed(),
      })
      return [destination.id, generated]
    })) as Record<CityId, GenerationResult>
    setSnapshot((current) => {
      let next = current
      for (const destination of destinations) {
        next = replacePlan(next, destination.id, {
          events: results[destination.id].events, generatedOnce: true,
        })
      }
      return next
    })
    return results
  }

  const setDates = (startDate: string, endDate: string): string | null => {
    const error = dateRangeError(startDate, endDate)
    if (error) return error
    const nextDates = datesInRange(startDate, endDate)
    const pinned = plan.events.filter((event) => event.pinned && nextDates.includes(event.date))
    const generated = generateItinerary({
      cityId, dates: nextDates, places: city.places, pinned,
      settings: plan.settings, matrix, quote, seed: freshSeed(),
    })
    setSnapshot((current) => replacePlan(current, cityId, {
      startDate, endDate,
      activeDate: nextDates.includes(current.plans[cityId].activeDate)
        ? current.plans[cityId].activeDate : nextDates[0],
      events: generated.events, generatedOnce: true,
    }))
    return null
  }

  const addPlace = (placeId: string, date: string, start: number) => {
    const place = city.getPlace(placeId)
    if (!place) return { ok: false, message: 'That place is unavailable in this city.', tentative: false }
    const result = validatePlacement({
      place, date, start, events: plan.events, lookup: city.lookup, matrix,
      startDate: plan.startDate, endDate: plan.endDate, cityId,
    })
    if (result.ok) {
      const event: ScheduledStop = {
        id: crypto.randomUUID(), placeId, date, start, duration: place.duration,
        pinned: true, origin: 'manual', meal: result.meal,
      }
      setSnapshot((current) => replacePlan(current, cityId, {
        activeDate: date, events: [...current.plans[cityId].events, event], generatedOnce: true,
      }))
    }
    return result
  }

  const moveEvent = (eventId: string, date: string, start: number) => {
    const event = plan.events.find((stop) => stop.id === eventId)
    const place = event && city.getPlace(event.placeId)
    if (!event || !place) return { ok: false, message: 'That stop is unavailable.', tentative: false }
    const result = validatePlacement({
      place, date, start, events: plan.events, lookup: city.lookup, matrix,
      startDate: plan.startDate, endDate: plan.endDate, ignoreId: eventId, cityId,
    })
    if (result.ok) setSnapshot((current) => replacePlan(current, cityId, {
      activeDate: date,
      events: current.plans[cityId].events.map((stop) => stop.id === eventId
        ? { ...stop, date, start, meal: result.meal, pinned: true, origin: 'manual' }
        : stop),
    }))
    return result
  }

  const removeEvent = (eventId: string) => setSnapshot((current) => replacePlan(current, cityId, {
    events: current.plans[cityId].events.filter((event) => event.id !== eventId),
  }))

  const togglePin = (eventId: string) => setSnapshot((current) => replacePlan(current, cityId, {
    events: current.plans[cityId].events.map((event) =>
      event.id === eventId ? { ...event, pinned: !event.pinned } : event),
  }))

  const toggleSave = (placeId: string) => setSnapshot((current) => {
    const settings = current.plans[cityId].settings
    return replacePlan(current, cityId, { settings: {
      ...settings,
      savedIds: settings.savedIds.includes(placeId)
        ? settings.savedIds.filter((id) => id !== placeId)
        : [...settings.savedIds, placeId],
    } })
  })

  const updateSettings = (changes: Partial<PlanSettings>) => setSnapshot((current) => replacePlan(current, cityId, {
    settings: { ...current.plans[cityId].settings, ...changes },
  }))

  const setActiveDate = (activeDate: string) => setSnapshot((current) =>
    datesInRange(current.plans[cityId].startDate, current.plans[cityId].endDate).includes(activeDate)
      ? replacePlan(current, cityId, { activeDate }) : current,
  )

  const clear = () => setSnapshot((current) => replacePlan(current, cityId, {
    events: [], generatedOnce: true,
  }))

  const auditsByCity = useMemo(() => Object.fromEntries(destinations.map((destination) => {
    const saved = snapshot.plans[destination.id]
    const byDate: Record<string, DayAudit> = Object.fromEntries(
      datesInRange(saved.startDate, saved.endDate).map((date) => [date, auditDay({
        date, cityId: destination.id, events: saved.events, lookup: destination.lookup,
        settings: saved.settings, matrix: matrices[destination.id], quote,
      })]),
    )
    return [destination.id, byDate]
  })) as Record<CityId, Record<string, DayAudit>>, [snapshot.plans, matrices, quote])
  const audits = auditsByCity[cityId]

  const overlap = useMemo(() => overlappingCityDates(destinations.map((destination) => ({
    cityId: destination.id,
    dates: datesInRange(snapshot.plans[destination.id].startDate, snapshot.plans[destination.id].endDate),
  }))), [snapshot.plans])

  return {
    ...plan, city, cityId, plans: snapshot.plans, quote,
    dates, matrix, routeStatus: routeStatuses[cityId],
    // The selected guide and all-city catalog are both available to export and summary UI.
    places: city.places, lookup: city.lookup, allPlacesById,
    allEvents: destinations.flatMap((destination) => snapshot.plans[destination.id].events),
    audits, auditsByCity, overlap,
    setCity: (id: CityId) => setSnapshot((current) => cityIds.has(id) ? { ...current, selectedCity: id } : current),
    generate, generateAll, setDates, addPlace, moveEvent, removeEvent,
    togglePin, toggleSave, updateSettings, setActiveDate, clear,
  }
}

const cityIds = new Set<CityId>(['athens', 'cairo', 'istanbul'])
