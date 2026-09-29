export type PlaceKind = 'sight' | 'museum' | 'outdoors' | 'food'
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type Pace = 'easy' | 'balanced' | 'full'
export type Interest = 'all' | 'history' | 'art' | 'outdoors' | 'food'
export type HoursStatus = 'open' | 'closed' | 'tentative' | 'flexible'
export type HoursKind = 'official' | 'listed' | 'suggested'
export type MovableHoliday =
  | 'orthodox-easter'
  | 'easter-monday'
  | 'clean-monday'
  | 'holy-spirit-monday'

export interface Coordinates {
  lat: number
  lng: number
}

export interface TimeWindow {
  open: number
  close: number
}

export type WeeklyHours = Partial<Record<number, TimeWindow[]>>

export interface SeasonalHours {
  from: string
  through: string
  weekly: WeeklyHours
}

export interface OpeningRules {
  weekly: WeeklyHours
  seasons?: SeasonalHours[]
  annualClosures?: string[]
  movableClosures?: MovableHoliday[]
  annualOverrides?: Record<string, TimeWindow[]>
  holidayUnconfirmed?: boolean
  kind: HoursKind
  sourceUrl: string
  sourceLabel: string
  checkedOn: string
  lastEntryMinutes?: number
  note?: string
}

export interface Place {
  id: string
  name: string
  area: string
  tagline: string
  description: string
  kind: PlaceKind
  duration: number
  coordinates: Coordinates
  rating: number
  reviewCount: number
  reviewUrl: string
  cost: 'free' | 'ticket' | 'budget'
  ticketPrice?: number
  tags: string[]
  priority: number
  mealSlots?: MealSlot[]
  hours: OpeningRules
}

export interface Availability {
  status: HoursStatus
  windows: TimeWindow[]
  label: string
  note: string
  sourceUrl: string
  lastEntryMinutes: number
}

export interface ScheduledStop {
  id: string
  placeId: string
  date: string
  start: number
  duration: number
  pinned: boolean
  origin: 'manual' | 'generated'
}

export interface TravelMatrix {
  ids: string[]
  minutes: number[][]
  meters: number[][]
  source: 'osm-foot' | 'estimate'
}

export interface TravelLeg {
  minutes: number
  meters: number
  source: TravelMatrix['source']
}

export interface PlanSettings {
  pace: Pace
  interest: Interest
  includeTentativeMeals: boolean
  savedIds: string[]
}

export interface PlannerSnapshot {
  version: 1
  startDate: string
  endDate: string
  activeDate: string
  events: ScheduledStop[]
  settings: PlanSettings
}
