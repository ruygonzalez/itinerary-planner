import type { CityId, Place } from '../types'
import { CityGuide } from '../domain/CityGuide'
import { Country } from '../domain/Country'
import { places as athensPlaces } from './places'
import { cairoPlaces } from './cairo'
import { istanbulPlaces } from './istanbul'

export const countries = {
  greece: new Country('GR', 'Greece', 'EUR', 'Europe/Athens', 'el-GR'),
  egypt: new Country('EG', 'Egypt', 'EGP', 'Africa/Cairo', 'en-EG'),
  turkey: new Country('TR', 'Türkiye', 'TRY', 'Europe/Istanbul', 'tr-TR'),
} as const

export const destinations = [
  new CityGuide({
    id: 'athens', name: 'Athens', country: countries.greece,
    dates: { start: '2026-12-22', end: '2026-12-24' },
    center: { lat: 37.9746, lng: 23.728 }, hero: '/athens-hero.svg',
    heroAlt: 'Illustration of the Acropolis above Athens rooftops at golden hour',
    subtitle: 'Ancient stories, little detours, and very good food. Your Athenian days, thoughtfully placed.',
    notes: ['Christmas Eve hours are shortened at the Acropolis Museum.', 'Restaurant service on December 24 is not yet confirmed. Call ahead.'],
    places: athensPlaces,
  }),
  new CityGuide({
    id: 'cairo', name: 'Cairo', country: countries.egypt,
    dates: { start: '2026-12-24', end: '2026-12-26' },
    center: { lat: 30.0444, lng: 31.2357 }, hero: '/cairo-hero.svg',
    heroAlt: 'Illustration of Cairo’s skyline, the Nile, and the Giza pyramids',
    subtitle: 'A city of layered histories and generous tables. Plan walkable neighborhoods one day at a time.',
    notes: ['The Giza plateau and Fustat are outside the walkable downtown cluster; arrange a vehicle separately.', 'December 24 also appears in the Athens leg; intercity travel is not scheduled.'],
    places: cairoPlaces,
  }),
  new CityGuide({
    id: 'istanbul', name: 'Istanbul', country: countries.turkey,
    dates: { start: '2026-12-27', end: '2026-12-29' },
    center: { lat: 41.011, lng: 28.977 }, hero: '/istanbul-hero.svg',
    heroAlt: 'Illustration of Istanbul’s domes, minarets, ferries, and the Golden Horn',
    subtitle: 'Across centuries and two shores, let the next good stop be just a short walk away.',
    notes: ['Topkapı Palace is closed on Tuesdays; the Grand Bazaar is typically closed Sundays.', 'Mosque exteriors are free; interior visiting hours depend on prayer schedules.'],
    places: istanbulPlaces,
  }),
] as const

export const destinationById: Record<CityId, CityGuide> = Object.fromEntries(
  destinations.map((city) => [city.id, city]),
) as Record<CityId, CityGuide>

export const allPlacesById: Record<string, Place> = Object.fromEntries(
  destinations.flatMap((city) => city.places.map((place) => [place.id, place])),
)

if (Object.keys(allPlacesById).length !== destinations.reduce((count, city) => count + city.places.length, 0)) {
  throw new Error('Every destination must use globally unique venue IDs')
}
