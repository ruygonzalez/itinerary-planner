import type { CityId, Coordinates, Place, PlaceDraft } from '../types'
import { Country } from './Country'

interface CityGuideOptions {
  id: CityId
  name: string
  country: Country
  dates: { start: string; end: string }
  center: Coordinates
  hero: string
  heroAlt: string
  subtitle: string
  notes: string[]
  places: PlaceDraft[]
}

/** Each destination owns its country, local calendar, curated venues and price currency. */
export class CityGuide {
  readonly id: CityId
  readonly name: string
  readonly country: Country
  readonly dates: CityGuideOptions['dates']
  readonly center: Coordinates
  readonly hero: string
  readonly heroAlt: string
  readonly subtitle: string
  readonly notes: string[]
  readonly places: Place[]
  readonly lookup: Record<string, Place>

  constructor(options: CityGuideOptions) {
    this.id = options.id
    this.name = options.name
    this.country = options.country
    this.dates = options.dates
    this.center = options.center
    this.hero = options.hero
    this.heroAlt = options.heroAlt
    this.subtitle = options.subtitle
    this.notes = options.notes
    this.places = options.places.map((draft) => {
      const price = draft.price ??
        (draft.cost === 'ticket' && draft.ticketPrice !== undefined
          ? {
              amount: draft.ticketPrice,
              currency: this.country.currency,
              basis: 'published-admission' as const,
              sourceUrl: draft.hours.sourceUrl,
              checkedOn: draft.hours.checkedOn,
              note: 'Published adult admission; check eligibility and current ticket prices.',
            }
          : undefined)
      if (price && price.currency !== this.country.currency) {
        throw new Error(`${draft.id} has a price outside ${this.country.currency}`)
      }
      return { ...draft, cityId: this.id, price }
    })
    this.lookup = Object.fromEntries(this.places.map((place) => [place.id, place]))
    if (Object.keys(this.lookup).length !== this.places.length) {
      throw new Error(`Duplicate venue ID in ${this.name}`)
    }
  }

  getPlace(id: string): Place | undefined {
    return this.lookup[id]
  }

  formatPrice(amount: number): string {
    return this.country.format(amount)
  }
}
