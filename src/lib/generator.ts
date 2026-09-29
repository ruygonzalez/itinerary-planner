import type { CityId, Interest, Place, PlanSettings, RequiredMeal, ScheduledStop, TravelMatrix } from '../types'
import { auditDay, mealProximityIssues } from './audit'
import { dayCosts, stopCostUsd, withinDailyCaps } from './costs'
import { getAvailability, nextOpenSlots } from './hours'
import { mealWindows } from './meals'
import { dayWalking, getTravelLeg } from './travel'
import { DAY_END, validatePlacement } from './validation'
import type { ExchangeQuote } from '../services/exchange'

export interface GeneratorInput {
  cityId: CityId
  dates: string[]
  places: Place[]
  pinned: ScheduledStop[]
  settings: PlanSettings
  matrix?: TravelMatrix | null
  quote: ExchangeQuote
  seed: number
}

export interface GenerationResult {
  events: ScheduledStop[]
  /** Failed days contain only user-pinned stops, never an incomplete generated route. */
  failedDates: string[]
}

type Role = RequiredMeal | 'morning' | 'afternoon'
interface State { events: ScheduledStop[]; score: number }
interface Candidate { place: Place; start: number; score: number }

const roles: Role[] = ['breakfast', 'morning', 'lunch', 'afternoon', 'dinner']
const beamWidth = 10
const attempts = 5
const activityTarget = { easy: 2, balanced: 3, full: 4 } as const

function randomGenerator(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

function matchesInterest(place: Place, interest: Interest): boolean {
  if (interest === 'all') return true
  if (interest === 'food') return place.kind === 'food'
  if (interest === 'outdoors') return place.kind === 'outdoors'
  if (interest === 'art') return place.kind === 'museum'
  return place.kind === 'sight' || place.tags.some((tag) => /history|ancient/i.test(tag))
}

function roleSatisfied(role: Role, events: ScheduledStop[], lookup: Record<string, Place>): boolean {
  if (role !== 'morning' && role !== 'afternoon') return events.some((event) => event.meal === role)
  return events.some((event) => {
    const place = lookup[event.placeId]
    if (!place || place.kind === 'food') return false
    return role === 'morning'
      ? event.start < 12 * 60 && event.start + event.duration <= 12 * 60 + 15
      : event.start >= 13 * 60 && event.start + event.duration <= 18 * 60
  })
}

function roleWindow(role: Role, duration: number): { earliest: number; latest: number; target: number } {
  if (role === 'morning') return {
    earliest: 9 * 60, latest: Math.min(11 * 60, 12 * 60 + 15 - duration), target: 9 * 60 + 30,
  }
  if (role === 'afternoon') return {
    earliest: 13 * 60 + 15, latest: Math.min(16 * 60 + 30, 18 * 60 - duration), target: 14 * 60 + 15,
  }
  return mealWindows[role]
}

function travelAdded(
  events: ScheduledStop[], place: Place, start: number,
  lookup: Record<string, Place>, matrix?: TravelMatrix | null,
): number {
  const ordered = [...events].sort((a, b) => a.start - b.start)
  const previous = ordered.filter((event) => event.start + event.duration <= start).at(-1)
  const next = ordered.find((event) => event.start >= start + place.duration)
  const from = previous && lookup[previous.placeId]
  const to = next && lookup[next.placeId]
  const oldLeg = from && to ? getTravelLeg(from, to, matrix).minutes : 0
  return (from ? getTravelLeg(from, place, matrix).minutes : 0) +
    (to ? getTravelLeg(place, to, matrix).minutes : 0) - oldLeg
}

function candidateScore(
  candidate: Place, date: string, start: number, target: number, current: State,
  used: Set<string>, settings: PlanSettings, lookup: Record<string, Place>,
  matrix: TravelMatrix | null | undefined, quote: ExchangeQuote, random: () => number,
): number {
  // Small review samples cannot dominate a route: the place's editorial priority still matters.
  const confidence = candidate.reviewCount ? Math.min(1, Math.log10(candidate.reviewCount + 1) / 3) : 0
  const rating = candidate.rating * confidence
  const repeatedFood = candidate.kind === 'food' && used.has(candidate.id) ? 7 : 0
  const repeatedActivity = candidate.kind !== 'food' && used.has(candidate.id) ? 16 : 0
  const tentative = getAvailability(candidate, date).status === 'tentative' ? 4 : 0
  const usd = stopCostUsd(candidate, quote) ?? 100
  return candidate.priority * 5 + rating * 1.8 +
    (settings.savedIds.includes(candidate.id) ? 12 : 0) +
    (matchesInterest(candidate, settings.interest) ? 4 : 0) -
    travelAdded(current.events, candidate, start, lookup, matrix) * 0.48 -
    Math.abs(start - target) / 45 - usd * 0.05 -
    repeatedFood - repeatedActivity - tentative + random() * 7
}

function candidateStates(
  role: Role, state: State, date: string, input: GeneratorInput,
  lookup: Record<string, Place>, used: Set<string>, random: () => number,
  run: number,
): State[] {
  if (roleSatisfied(role, state.events, lookup)) return [state]
  const options: Candidate[] = []
  for (const place of input.places) {
    if (role === 'morning' || role === 'afternoon') {
      if (place.kind === 'food' || state.events.some((event) => event.placeId === place.id)) continue
    } else {
      if (!place.mealSlots?.includes(role) || state.events.some((event) => event.placeId === place.id)) continue
      if (getAvailability(place, date).status === 'tentative' && !input.settings.includeTentativeMeals) continue
    }
    if (stopCostUsd(place, input.quote) === null) continue
    const { earliest, latest, target } = roleWindow(role, place.duration)
    if (earliest > latest || place.duration + earliest > DAY_END) continue
    const starts = nextOpenSlots(place, date, earliest, latest)
      .sort((a, b) => Math.abs(a - target) - Math.abs(b - target))
      .slice(0, 6)
    const forPlace: Candidate[] = []
    for (const start of starts) {
      const result = validatePlacement({
        place, date, start, events: state.events, lookup, matrix: input.matrix,
        startDate: input.dates[0], endDate: input.dates.at(-1)!, cityId: input.cityId,
        meal: role === 'morning' || role === 'afternoon' ? undefined : role,
      })
      if (!result.ok) continue
      const nextEvent: ScheduledStop = {
        id: `gen-${input.cityId}-${input.seed.toString(36)}-${run}-${date}-${role}-${place.id}-${start}`,
        date, placeId: place.id, start, duration: place.duration,
        origin: 'generated', pinned: false,
        meal: result.meal,
      }
      const withCandidate = [...state.events, nextEvent]
      if (!withinDailyCaps(dayCosts(withCandidate, lookup, input.quote), input.settings)) continue
      if (role !== 'breakfast' && role !== 'lunch' &&
        mealProximityIssues(withCandidate, lookup, input.matrix, false).length) continue
      forPlace.push({
        place, start,
        score: candidateScore(place, date, start, target, state, used, input.settings, lookup, input.matrix, input.quote, random),
      })
    }
    options.push(...forPlace.sort((a, b) => b.score - a.score).slice(0, 2))
  }
  // Keep more than one timing/restaurant alternative so the beam can recover
  // from a later closure, a narrow lunch slot, or a nearby-meal constraint.
  return options.sort((a, b) => b.score - a.score).slice(0, 18).map(({ place, start, score }) => ({
    score: state.score + score,
    events: [...state.events, {
      id: `gen-${input.cityId}-${input.seed.toString(36)}-${run}-${date}-${role}-${place.id}-${start}`,
      date, placeId: place.id, start, duration: place.duration,
      origin: 'generated' as const, pinned: false,
      meal: role === 'morning' || role === 'afternoon' ? undefined : role,
    }],
  }))
}

function keepBest(states: State[]): State[] {
  const seen = new Set<string>()
  const unique = states.sort((a, b) => b.score - a.score).filter((state) => {
    const signature = state.events.map((event) => `${event.placeId}:${event.start}:${event.meal ?? ''}`).sort().join('|')
    if (seen.has(signature)) return false
    seen.add(signature)
    return true
  })
  const byBreakfast = new Map<string, number>()
  const byLastPlace = new Map<string, number>()
  const selected: State[] = []
  for (const state of unique) {
    const breakfast = state.events.find((event) => event.meal === 'breakfast')?.placeId ?? 'none'
    const last = state.events.at(-1)?.placeId ?? 'pinned'
    if ((byBreakfast.get(breakfast) ?? 0) >= 3 || (byLastPlace.get(last) ?? 0) >= 2) continue
    selected.push(state)
    byBreakfast.set(breakfast, (byBreakfast.get(breakfast) ?? 0) + 1)
    byLastPlace.set(last, (byLastPlace.get(last) ?? 0) + 1)
    if (selected.length === beamWidth) break
  }
  // When only one venue is feasible, still use the remaining beam capacity.
  for (const state of unique) {
    if (selected.length === beamWidth) break
    if (!selected.includes(state)) selected.push(state)
  }
  return selected
}

function addOptionalActivities(
  state: State, date: string, input: GeneratorInput,
  lookup: Record<string, Place>, used: Set<string>, random: () => number, run: number,
): State {
  const target = activityTarget[input.settings.pace]
  let current = state
  while (current.events.filter((event) => lookup[event.placeId]?.kind !== 'food').length < target) {
    const options: State[] = []
    for (const place of input.places) {
      if (place.kind === 'food' || current.events.some((event) => event.placeId === place.id)) continue
      if (stopCostUsd(place, input.quote) === null) continue
      for (const window of [
        { earliest: 10 * 60 + 30, latest: 12 * 60, target: 11 * 60 },
        { earliest: 15 * 60 + 30, latest: 17 * 60 + 15, target: 16 * 60 },
      ]) {
        for (const start of nextOpenSlots(place, date, window.earliest, Math.min(window.latest, DAY_END - place.duration))
          .sort((a, b) => Math.abs(a - window.target) - Math.abs(b - window.target)).slice(0, 3)) {
          if (!validatePlacement({
            place, date, start, events: current.events, lookup, matrix: input.matrix,
            startDate: input.dates[0], endDate: input.dates.at(-1)!, cityId: input.cityId,
          }).ok) continue
          const candidate: ScheduledStop = {
            id: `gen-${input.cityId}-${input.seed.toString(36)}-${run}-${date}-extra-${place.id}-${start}`,
            date, placeId: place.id, start, duration: place.duration, origin: 'generated', pinned: false,
          }
          const events = [...current.events, candidate]
          if (!withinDailyCaps(dayCosts(events, lookup, input.quote), input.settings)) continue
          if (!auditDay({ date, cityId: input.cityId, events, lookup, settings: input.settings, matrix: input.matrix, quote: input.quote }).complete) continue
          options.push({
            events,
            score: current.score + candidateScore(place, date, start, window.target, current, used, input.settings, lookup, input.matrix, input.quote, random),
          })
        }
      }
    }
    current = keepBest(options)[0] ?? current
    if (!options.length) break
  }
  return current
}

function buildDay(
  date: string, pinned: ScheduledStop[], input: GeneratorInput,
  lookup: Record<string, Place>, used: Set<string>, random: () => number, run: number,
): State | null {
  let beam: State[] = [{ events: pinned, score: 0 }]
  for (const role of roles) {
    beam = keepBest(beam.flatMap((state) => candidateStates(role, state, date, input, lookup, used, random, run)))
    if (!beam.length) return null
  }
  const feasible = beam.filter((state) => auditDay({
    date, cityId: input.cityId, events: state.events, lookup, settings: input.settings,
    matrix: input.matrix, quote: input.quote,
  }).complete)
  if (!feasible.length) return null
  const enhanced = feasible.map((state) => addOptionalActivities(state, date, input, lookup, used, random, run))
  // Sample from the best few feasible outcomes: each click is allowed to differ,
  // while hard constraints are already verified by the shared audit.
  const close = keepBest(enhanced).slice(0, 5)
  const top = close[0].score
  const weights = close.map((state) => Math.exp((state.score - top) / 9))
  let draw = random() * weights.reduce((sum, value) => sum + value, 0)
  for (let index = 0; index < close.length; index += 1) {
    draw -= weights[index]
    if (draw <= 0) return close[index]
  }
  return close[0]
}

function dayScore(events: ScheduledStop[], lookup: Record<string, Place>, matrix?: TravelMatrix | null): number {
  const kinds = new Set(events.map((event) => lookup[event.placeId]?.kind))
  return events.reduce((score, event) => score + (lookup[event.placeId]?.priority ?? 0) * 5, 0) +
    kinds.size * 3 - dayWalking(events, lookup, matrix).minutes * 0.32
}

export function generateItinerary(input: GeneratorInput): GenerationResult {
  const { dates, places, pinned, matrix, settings, quote, cityId } = input
  if (!dates.length) return { events: [...pinned], failedDates: [] }
  const lookup: Record<string, Place> = Object.fromEntries(places.map((place) => [place.id, place]))
  const random = randomGenerator(input.seed)
  const constrainedFirst = [...dates].sort((a, b) => {
    const available = (date: string) => places.filter((place) =>
      place.kind !== 'food' && getAvailability(place, date).status !== 'closed' &&
      stopCostUsd(place, quote) !== null,
    ).length
    return available(a) - available(b) || a.localeCompare(b)
  })
  const results: { events: ScheduledStop[]; failedDates: string[]; score: number }[] = []

  for (let run = 0; run < attempts; run += 1) {
    const events = pinned.map((event) => ({ ...event }))
    const failedDates: string[] = []
    const used = new Set(events.map((event) => event.placeId))
    let score = 0
    for (const date of constrainedFirst) {
      const pinnedDay = events.filter((event) => event.date === date)
      const day = buildDay(date, pinnedDay, input, lookup, used, random, run)
      if (!day) {
        failedDates.push(date)
        continue
      }
      for (const event of day.events) {
        if (!pinnedDay.some((previous) => previous.id === event.id)) events.push(event)
        used.add(event.placeId)
      }
      score += dayScore(day.events, lookup, matrix)
    }
    results.push({ events, failedDates, score: score + random() * 12 })
  }

  results.sort((a, b) => a.failedDates.length - b.failedDates.length || b.score - a.score)
  const best = results[0]
  const alternatives = results.filter((result) =>
    result.failedDates.length === best.failedDates.length && result.score >= best.score - 13,
  ).slice(0, 5)
  const selected = alternatives[Math.floor(random() * alternatives.length)] ?? best
  // This final audit is a safety net for a future data or algorithm change.
  const safeEvents = selected.events.filter((event) => {
    if (event.pinned) return true
    return !selected.failedDates.includes(event.date)
  })
  const failedDates = [...new Set([...selected.failedDates, ...dates.filter((date) =>
    !auditDay({
      date, cityId, events: safeEvents, lookup, settings, matrix, quote,
    }).complete,
  )])]
  return {
    events: safeEvents.filter((event) => event.pinned || !failedDates.includes(event.date))
      .sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start),
    failedDates: failedDates.sort(),
  }
}
