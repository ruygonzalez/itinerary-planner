import type {
  Interest,
  Place,
  PlanSettings,
  ScheduledStop,
  TravelMatrix,
} from '../types'
import { getAvailability, nextOpenSlots } from './hours'
import { dayWalking, getTravelLeg } from './travel'
import { DAY_END, validatePlacement } from './validation'

interface GeneratorInput {
  dates: string[]
  places: Place[]
  pinned: ScheduledStop[]
  settings: PlanSettings
  matrix?: TravelMatrix | null
  seed: number
}

interface Candidate {
  place: Place
  start: number
  score: number
}

const attractionLimit = { easy: 2, balanced: 3, full: 4 } as const
const mealWindows = {
  lunch: { target: 13 * 60, earliest: 12 * 60, latest: 14 * 60 + 15 },
  dinner: { target: 19 * 60, earliest: 18 * 60, latest: 20 * 60 },
} as const

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

function softPick<T extends { score: number }>(
  candidates: T[],
  random: () => number,
  count = 5,
): T | null {
  if (!candidates.length) return null
  const top = [...candidates].sort((a, b) => b.score - a.score).slice(0, count)
  const maximum = top[0].score
  const weights = top.map((candidate) => Math.exp((candidate.score - maximum) / 6))
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  let choice = random() * total
  for (let index = 0; index < top.length; index += 1) {
    choice -= weights[index]
    if (choice <= 0) return top[index]
  }
  return top.at(-1) ?? null
}

function matchesInterest(place: Place, interest: Interest): boolean {
  if (interest === 'all') return true
  if (interest === 'food') return place.kind === 'food'
  if (interest === 'outdoors') return place.kind === 'outdoors'
  if (interest === 'art') return place.kind === 'museum'
  return place.kind === 'sight' || place.tags.some((tag) => tag.includes('history'))
}

function travelAdded(
  events: ScheduledStop[],
  date: string,
  place: Place,
  start: number,
  lookup: Record<string, Place>,
  matrix?: TravelMatrix | null,
): number {
  const ordered = events.filter((event) => event.date === date).sort((a, b) => a.start - b.start)
  const previous = ordered.filter((event) => event.start + event.duration <= start).at(-1)
  const next = ordered.find((event) => event.start >= start + place.duration)
  const previousPlace = previous ? lookup[previous.placeId] : null
  const nextPlace = next ? lookup[next.placeId] : null
  const before = previousPlace && nextPlace ? getTravelLeg(previousPlace, nextPlace, matrix).minutes : 0
  const after =
    (previousPlace ? getTravelLeg(previousPlace, place, matrix).minutes : 0) +
    (nextPlace ? getTravelLeg(place, nextPlace, matrix).minutes : 0)
  return after - before
}

function candidateScore(
  place: Place,
  date: string,
  start: number,
  events: ScheduledStop[],
  lookup: Record<string, Place>,
  settings: PlanSettings,
  foodUses: Map<string, number>,
  matrix: TravelMatrix | null | undefined,
  random: () => number,
  target?: number,
): number {
  const onDay = events.filter((event) => event.date === date)
  const kinds = new Set(onDay.map((event) => lookup[event.placeId]?.kind))
  const availability = getAvailability(place, date)
  const extraWalking = travelAdded(events, date, place, start, lookup, matrix)
  const longLeg = extraWalking > 45 ? (extraWalking - 45) * 0.25 : 0
  const savedBoost = settings.savedIds.includes(place.id) ? 15 : 0
  const interestBoost = matchesInterest(place, settings.interest) ? 5 : 0
  const varietyBoost = place.kind !== 'food' && !kinds.has(place.kind) ? 4 : 0
  const foodRepeat = (foodUses.get(place.id) ?? 0) * 11
  const uncertainty = availability.status === 'tentative' ? 11 : 0
  const ideal = target ?? (place.kind === 'museum' ? 630 : place.kind === 'outdoors' ? 885 : 600)
  const timing = Math.abs(start - ideal) / 85
  const scarceHours = place.kind === 'sight' && availability.windows[0]?.close <= 930 ? 2 : 0
  return (
    place.priority * 7 +
    place.rating * 2.4 +
    savedBoost +
    interestBoost +
    varietyBoost +
    scarceHours -
    extraWalking * 0.53 -
    longLeg -
    foodRepeat -
    uncertainty -
    timing +
    random() * 6
  )
}

function bestAttractionCandidates(
  date: string,
  events: ScheduledStop[],
  places: Place[],
  used: Set<string>,
  lookup: Record<string, Place>,
  settings: PlanSettings,
  foodUses: Map<string, number>,
  matrix: TravelMatrix | null | undefined,
  random: () => number,
  morningOnly: boolean,
  startDate: string,
  endDate: string,
  minimumStart = 9 * 60,
): Candidate[] {
  const candidates: Candidate[] = []
  for (const place of places) {
    if (place.kind === 'food' || used.has(place.id)) continue
    const slots = nextOpenSlots(
      place,
      date,
      minimumStart,
      morningOnly ? 11 * 60 + 15 : DAY_END - place.duration,
    )
    let best: Candidate | null = null
    for (const start of slots) {
      if (
        !validatePlacement({
          place,
          date,
          start,
          events,
          lookup,
          matrix,
          startDate,
          endDate,
        }).ok
      ) {
        continue
      }
      const score = candidateScore(
        place,
        date,
        start,
        events,
        lookup,
        settings,
        foodUses,
        matrix,
        random,
        morningOnly ? 9 * 60 + 30 : undefined,
      )
      if (!best || score > best.score) best = { place, start, score }
    }
    if (best) candidates.push(best)
  }
  return candidates
}

function mealCandidates(
  date: string,
  meal: 'lunch' | 'dinner',
  events: ScheduledStop[],
  places: Place[],
  lookup: Record<string, Place>,
  settings: PlanSettings,
  foodUses: Map<string, number>,
  matrix: TravelMatrix | null | undefined,
  random: () => number,
  startDate: string,
  endDate: string,
): Candidate[] {
  const { target, earliest, latest } = mealWindows[meal]
  const candidates: Candidate[] = []
  for (const place of places) {
    if (!place.mealSlots?.includes(meal)) continue
    if (events.some((event) => event.date === date && event.placeId === place.id)) continue
    if ((foodUses.get(place.id) ?? 0) >= 2) continue
    const availability = getAvailability(place, date)
    if (availability.status === 'tentative' && !settings.includeTentativeMeals) continue
    const slots = nextOpenSlots(place, date, earliest, latest)
    let best: Candidate | null = null
    for (const start of slots) {
      if (
        !validatePlacement({
          place,
          date,
          start,
          events,
          lookup,
          matrix,
          startDate,
          endDate,
        }).ok
      ) {
        continue
      }
      const score = candidateScore(
        place,
        date,
        start,
        events,
        lookup,
        settings,
        foodUses,
        matrix,
        random,
        target,
      )
      if (!best || score > best.score) best = { place, start, score }
    }
    if (best) candidates.push(best)
  }
  return candidates
}

function hasMeal(events: ScheduledStop[], date: string, meal: 'lunch' | 'dinner', lookup: Record<string, Place>): boolean {
  const { earliest, latest } = mealWindows[meal]
  return events.some(
    (event) =>
      event.date === date &&
      lookup[event.placeId]?.kind === 'food' &&
      event.start >= earliest - 30 &&
      event.start <= latest,
  )
}

function availableAttractions(date: string, places: Place[]): number {
  return places.filter(
    (place) => place.kind !== 'food' && getAvailability(place, date).status !== 'closed',
  ).length
}

function itineraryScore(
  events: ScheduledStop[],
  dates: string[],
  lookup: Record<string, Place>,
  matrix: TravelMatrix | null | undefined,
  settings: PlanSettings,
): number {
  let score = 0
  for (const date of dates) {
    const day = events.filter((event) => event.date === date)
    const variety = new Set(day.map((event) => lookup[event.placeId]?.kind))
    score += variety.size * 3
    if (!hasMeal(day, date, 'lunch', lookup)) score -= 18
    if (!hasMeal(day, date, 'dinner', lookup)) score -= 18
    score -= dayWalking(day, lookup, matrix).minutes * 0.37
    for (const event of day) {
      const place = lookup[event.placeId]
      if (!place) continue
      score += place.priority * 6 + place.rating * 2
      if (settings.savedIds.includes(place.id)) score += 11
      if (getAvailability(place, date).status === 'tentative') score -= 10
    }
  }
  return score
}

export function generateItinerary({
  dates,
  places,
  pinned,
  settings,
  matrix,
  seed,
}: GeneratorInput): ScheduledStop[] {
  if (!dates.length) return pinned
  const lookup: Record<string, Place> = Object.fromEntries(places.map((place) => [place.id, place]))
  const random = randomGenerator(seed)
  const constrainedFirst = [...dates].sort(
    (a, b) => availableAttractions(a, places) - availableAttractions(b, places) || a.localeCompare(b),
  )
  const attempts: { score: number; events: ScheduledStop[] }[] = []

  for (let run = 0; run < 16; run += 1) {
    const events = pinned.map((event) => ({ ...event }))
    const usedAttractions = new Set(
      events.filter((event) => lookup[event.placeId]?.kind !== 'food').map((event) => event.placeId),
    )
    const foodUses = new Map<string, number>()
    for (const event of events) {
      if (lookup[event.placeId]?.kind === 'food') {
        foodUses.set(event.placeId, (foodUses.get(event.placeId) ?? 0) + 1)
      }
    }
    let sequence = 0
    const add = (candidate: Candidate) => {
      const { place, start } = candidate
      events.push({
        id: 'gen-' + seed.toString(36) + '-' + run + '-' + sequence++,
        placeId: place.id,
        date: currentDate,
        start,
        duration: place.duration,
        pinned: false,
        origin: 'generated',
      })
      if (place.kind === 'food') {
        foodUses.set(place.id, (foodUses.get(place.id) ?? 0) + 1)
      } else {
        usedAttractions.add(place.id)
      }
    }
    let currentDate = dates[0]

    for (const date of constrainedFirst) {
      currentDate = date
      const limit = attractionLimit[settings.pace]
      const attractionCount = () =>
        events.filter(
          (event) => event.date === date && lookup[event.placeId]?.kind !== 'food',
        ).length

      if (attractionCount() < limit) {
        const anchor = softPick(
          bestAttractionCandidates(
            date,
            events,
            places,
            usedAttractions,
            lookup,
            settings,
            foodUses,
            matrix,
            random,
            true,
            dates[0],
            dates.at(-1)!,
          ),
          random,
          6,
        )
        if (anchor) add(anchor)
      }

      for (const meal of ['lunch', 'dinner'] as const) {
        if (hasMeal(events, date, meal, lookup)) continue
        const choice = softPick(
          mealCandidates(
            date,
            meal,
            events,
            places,
            lookup,
            settings,
            foodUses,
            matrix,
            random,
            dates[0],
            dates.at(-1)!,
          ),
          random,
          5,
        )
        if (choice) add(choice)
      }

      while (attractionCount() < limit) {
        const needsAfternoon =
          attractionCount() === limit - 1 &&
          hasMeal(events, date, 'lunch', lookup) &&
          !events.some(
            (event) =>
              event.date === date &&
              lookup[event.placeId]?.kind !== 'food' &&
              event.start >= 14 * 60,
          )
        const candidatesAt = (minimumStart: number) =>
          bestAttractionCandidates(
            date,
            events,
            places,
            usedAttractions,
            lookup,
            settings,
            foodUses,
            matrix,
            random,
            false,
            dates[0],
            dates.at(-1)!,
            minimumStart,
          )
        const afternoon = needsAfternoon ? candidatesAt(14 * 60) : []
        const choice = softPick(afternoon.length ? afternoon : candidatesAt(9 * 60), random, 6)
        if (!choice || choice.score < 8) break
        add(choice)
      }
    }

    attempts.push({
      score: itineraryScore(events, dates, lookup, matrix, settings),
      events,
    })
  }

  attempts.sort((a, b) => b.score - a.score)
  const best = attempts[0].score
  const close = attempts.filter((attempt) => attempt.score >= best - 18).slice(0, 10)
  const choice = softPick(close, random, 10) ?? attempts[0]
  return choice.events.sort(
    (a, b) => a.date.localeCompare(b.date) || a.start - b.start,
  )
}
