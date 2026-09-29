import type { PlaceDraft, PriceQuote, WeeklyHours } from '../types'
import { combine, everyDay, listedRestaurant, onDays } from './schedules'
import { listedRange, menuEstimate } from './prices'

type Restaurant = Omit<PlaceDraft, 'kind' | 'cost' | 'hours' | 'price'> & { weekly: WeeklyHours }

const mealPrices: Record<string, PriceQuote> = {
  falafellas: listedRange(3, 'EUR', 'https://restaurantguru.com/Falafellas-Athens', 'Midpoint of the listed €1–€5 per-person band for a falafel wrap.'),
  feyrouz: listedRange(7.5, 'EUR', 'https://restaurantguru.com/Feyrouz-Athens', 'Midpoint of the listed €5–€10 per-person band.'),
  'street-souvlaki': listedRange(7.5, 'EUR', 'https://restaurantguru.com/Street-Souvlaki-Athens', 'Midpoint of the listed €5–€10 per-person band.'),
  'rhino-vegan': menuEstimate(11, 'EUR', 'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d14142081-Reviews-Rhino_Vegan_Beat_Athens-Athens_Attica.html'),
  'to-kati-allo': menuEstimate(14, 'EUR', 'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d2108580-Reviews-To_Kati_Allo-Athens_Attica.html'),
  'mama-tierra': menuEstimate(12, 'EUR', 'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d23997166-Reviews-Mama_Tierra_Acropolis-Athens_Attica.html'),
  lefteris: menuEstimate(8, 'EUR', 'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d6731564-Reviews-Lefteris_O_Politis-Athens_Attica.html'),
  cookoomela: menuEstimate(9, 'EUR', 'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d14043008-Reviews-Cookoomela_Grill-Athens_Attica.html'),
  lukumades: menuEstimate(5, 'EUR', 'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d5993987-Reviews-Lukumades-Athens_Attica.html', 'Illustrative dessert-and-drink budget; a snack does not count as a required meal.'),
  koulouri: menuEstimate(4, 'EUR', 'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d12132014-Reviews-To_Koulouri_tou_Psyrri-Athens_Attica.html', 'Illustrative bakery breakfast; not a published average receipt.'),
  'takis-bakery': menuEstimate(7, 'EUR', 'https://www.tripadvisor.ca/Restaurant_Review-g189400-d7158734-Reviews-Takis_Bakery-Athens_Attica.html', 'Illustrative pastry-and-drink breakfast; not a published average receipt.'),
}

function restaurant({ weekly, ...details }: Restaurant): PlaceDraft {
  const price = mealPrices[details.id]
  if (!price) throw new Error(`Missing food price for ${details.id}`)
  return {
    ...details,
    kind: 'food',
    cost: 'budget',
    price,
    hours: listedRestaurant(details.reviewUrl, weekly),
  }
}

export const foodPlaces: PlaceDraft[] = [
  restaurant({
    id: 'falafellas',
    name: 'Falafellas',
    area: 'Monastiraki',
    tagline: 'A little wrap, a lot of flavor',
    description:
      'A well-loved, inexpensive stop for falafel wraps on Aiolou Street. A good quick lunch between central sights.',
    duration: 50,
    coordinates: { lat: 37.978504, lng: 23.728085 },
    rating: 4.6,
    reviewCount: 1038,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d4293737-Reviews-Falafellas-Athens_Attica.html',
    tags: ['Vegetarian', 'Street food', 'Quick bite'],
    priority: 4.5,
    mealSlots: ['lunch', 'dinner'],
    weekly: combine(onDays([1, 2, 3, 4], 660, 1380), onDays([5, 6], 660, 1440)),
  }),
  restaurant({
    id: 'feyrouz',
    name: 'Feyrouz',
    area: 'Monastiraki',
    tagline: 'Levantine comfort, Athens style',
    description:
      'A tiny counter known for aromatic lahmacun, pies and wraps, a few streets from Monastiraki.',
    duration: 55,
    coordinates: { lat: 37.978176, lng: 23.72794 },
    rating: 4.7,
    reviewCount: 661,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d6784810-Reviews-Feyrouz-Athens_Attica.html',
    tags: ['Levantine', 'Street food', 'Vegetarian options'],
    priority: 4.7,
    mealSlots: ['lunch', 'dinner'],
    weekly: onDays([1, 2, 3, 4, 5, 6], 720, 1320),
  }),
  restaurant({
    id: 'street-souvlaki',
    name: 'Street Souvlaki',
    area: 'Syntagma',
    tagline: 'The classic Greek quick stop',
    description:
      'Souvlaki and pita at a wallet-friendly counter in the center, useful for lunch or an easy dinner.',
    duration: 55,
    coordinates: { lat: 37.97765, lng: 23.730331 },
    rating: 4.6,
    reviewCount: 456,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d10637814-Reviews-Street_Souvlaki_Athens_Center-Athens_Attica.html',
    tags: ['Greek', 'Souvlaki', 'Street food'],
    priority: 4.5,
    mealSlots: ['lunch', 'dinner'],
    weekly: combine(
      onDays([0], 720, 1560),
      onDays([1, 2, 3, 4], 690, 1560),
      onDays([5, 6], 690, 1620),
    ),
  }),
  restaurant({
    id: 'rhino-vegan',
    name: 'Rhino Vegan Beat',
    area: 'Syntagma',
    tagline: 'Colorful, plant-based comfort',
    description:
      'A central, inexpensive vegan option with hearty wraps and bowls, reviewed highly by travelers.',
    duration: 60,
    coordinates: { lat: 37.976837, lng: 23.729803 },
    rating: 4.9,
    reviewCount: 1229,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d14142081-Reviews-Rhino_Vegan_Beat_Athens-Athens_Attica.html',
    tags: ['Vegan', 'Greek-inspired', 'Budget'],
    priority: 4.8,
    mealSlots: ['lunch', 'dinner'],
    weekly: everyDay(660, 1380),
  }),
  restaurant({
    id: 'to-kati-allo',
    name: 'To Kati Allo',
    area: 'Makrygianni',
    tagline: 'A relaxed Greek table',
    description:
      'Home-style Greek plates close to the Acropolis Museum, with a modest Tripadvisor price tier.',
    duration: 70,
    coordinates: { lat: 37.968464, lng: 23.728874 },
    rating: 4.5,
    reviewCount: 1262,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d2108580-Reviews-To_Kati_Allo-Athens_Attica.html',
    tags: ['Greek', 'Sit-down', 'Near Acropolis'],
    priority: 4.5,
    mealSlots: ['lunch', 'dinner'],
    weekly: onDays([0, 2, 3, 4, 5, 6], 660, 1320),
  }),
  restaurant({
    id: 'mama-tierra',
    name: 'Mama Tierra Acropolis',
    area: 'Makrygianni',
    tagline: 'Fresh flavors by the museum',
    description:
      'An affordable plant-based meal option near the Acropolis Museum, with all-week regular hours listed.',
    duration: 60,
    coordinates: { lat: 37.96754, lng: 23.729862 },
    rating: 4.7,
    reviewCount: 27,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d23997166-Reviews-Mama_Tierra_Acropolis-Athens_Attica.html',
    tags: ['Vegan', 'Near Acropolis', 'Sit-down'],
    priority: 4.1,
    mealSlots: ['lunch', 'dinner'],
    weekly: everyDay(720, 1350),
  }),
  restaurant({
    id: 'lefteris',
    name: 'Lefteris O Politis',
    area: 'Omonia',
    tagline: 'A local kebab favorite',
    description:
      'A compact souvlaki and kebab stop north of the center, ideal alongside the National Museum.',
    duration: 50,
    coordinates: { lat: 37.9852, lng: 23.727367 },
    rating: 4.7,
    reviewCount: 97,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d6731564-Reviews-Lefteris_O_Politis-Athens_Attica.html',
    tags: ['Greek', 'Souvlaki', 'Quick bite'],
    priority: 4.3,
    mealSlots: ['lunch'],
    weekly: combine(onDays([1, 2, 3, 4, 5], 660, 1140), onDays([6], 660, 1050)),
  }),
  restaurant({
    id: 'cookoomela',
    name: 'Cookoomela Grill',
    area: 'Exarchia',
    tagline: 'A different kind of souvlaki',
    description:
      'Mushroom-based vegan souvlaki near the National Archaeological Museum.',
    duration: 55,
    coordinates: { lat: 37.98578, lng: 23.733547 },
    rating: 4.7,
    reviewCount: 116,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d14043008-Reviews-Cookoomela_Grill-Athens_Attica.html',
    tags: ['Vegan', 'Souvlaki', 'Street food'],
    priority: 4.4,
    mealSlots: ['lunch', 'dinner'],
    weekly: onDays([1, 2, 3, 4, 5, 6], 780, 1440),
  }),
  restaurant({
    id: 'lukumades',
    name: 'Lukumades',
    area: 'Monastiraki',
    tagline: 'A sweet Athenian intermission',
    description:
      'Fresh loukoumades with toppings, an inexpensive dessert stop near Agias Irinis Square.',
    duration: 30,
    coordinates: { lat: 37.97694, lng: 23.72761 },
    rating: 4.6,
    reviewCount: 1295,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d5993987-Reviews-Lukumades-Athens_Attica.html',
    tags: ['Dessert', 'Greek', 'Quick bite'],
    priority: 4.2,
    mealSlots: ['snack'],
    weekly: combine(
      onDays([0], 540, 1500),
      onDays([1, 2, 3, 4], 480, 1500),
      onDays([5, 6], 480, 1560),
    ),
  }),
  restaurant({
    id: 'koulouri',
    name: 'To Koulouri tou Psyrri',
    area: 'Psyrri',
    tagline: 'Start with something simple',
    description:
      'A small bakery known for koulouri, the sesame bread ring that makes an easy Athens breakfast.',
    duration: 30,
    coordinates: { lat: 37.978203, lng: 23.723677 },
    rating: 4.6,
    reviewCount: 49,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d12132014-Reviews-To_Koulouri_tou_Psyrri-Athens_Attica.html',
    tags: ['Bakery', 'Breakfast', 'Greek'],
    priority: 4.1,
    mealSlots: ['breakfast', 'snack'],
    weekly: everyDay(0, 1439),
  }),
  restaurant({
    id: 'takis-bakery',
    name: 'Takis Bakery',
    area: 'Koukaki',
    tagline: 'A warm pastry before the ruins',
    description: 'An early bakery near the Acropolis Museum, useful for a quick breakfast before a timed visit.',
    duration: 35,
    coordinates: { lat: 37.96767, lng: 23.7268 },
    rating: 4.7,
    reviewCount: 171,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g189400-d7158734-Reviews-Takis_Bakery-Athens_Attica.html',
    tags: ['Bakery', 'Breakfast', 'Quick bite'],
    priority: 4.5,
    mealSlots: ['breakfast'],
    weekly: combine(onDays([1, 2, 3, 4, 5], 420, 1260), onDays([6], 420, 1020)),
  }),
]
