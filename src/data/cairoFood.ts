import type { PlaceDraft, PriceQuote, WeeklyHours } from '../types'
import { listedRestaurant, everyDay, onDays } from './schedules'
import { listedRange, menuEstimate } from './prices'

type Restaurant = Omit<PlaceDraft, 'kind' | 'cost' | 'hours' | 'price'> & {
  weekly: WeeklyHours
  price: PriceQuote
}

function restaurant({ weekly, ...details }: Restaurant): PlaceDraft {
  return { ...details, kind: 'food', cost: 'budget', hours: listedRestaurant(details.reviewUrl, weekly) }
}

export const cairoFood: PlaceDraft[] = [
  restaurant({
    id: 'cairo-abou-tarek', name: 'Koshary Abou Tarek', area: 'Downtown',
    tagline: 'Cairo’s beloved bowl of koshary',
    description: 'A busy, inexpensive landmark for rice, lentils, pasta, tomato sauce and crisp onions.',
    duration: 50, coordinates: { lat: 30.050148, lng: 31.237835 },
    rating: 4.6, reviewCount: 2650,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g294201-d1508799-Reviews-Koshary_Abou_Tarek-Cairo_Cairo_Governorate.html',
    tags: ['Egyptian', 'Koshary', 'Vegetarian'], priority: 4.9,
    mealSlots: ['breakfast', 'lunch', 'dinner'], weekly: everyDay(420, 1440),
    price: listedRange(100, 'EGP', 'https://restaurantguru.com/Abou-Tarek-Cairo', 'Midpoint of the listed EGP 1–200 per-person band; a koshary portion varies by size.'),
  }),
  restaurant({
    id: 'cairo-el-abd', name: 'El Abd Pastry', area: 'Talaat Harb',
    tagline: 'Start the morning with a pastry',
    description: 'Long-running downtown bakery for a quick pastry-and-drink breakfast, not a full sit-down meal.',
    duration: 35, coordinates: { lat: 30.0493, lng: 31.2396 },
    rating: 4.3, reviewCount: 129,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g294201-d2727225-Reviews-El_Abd_Pastry-Cairo_Cairo_Governorate.html',
    tags: ['Bakery', 'Breakfast', 'Egyptian'], priority: 4.4,
    mealSlots: ['breakfast', 'snack'], weekly: everyDay(0, 1439),
    price: menuEstimate(120, 'EGP', 'https://elabdfoods.com/', 'Illustrative pastry-and-drink budget, not an average receipt; the listing reports all-day hours.'),
  }),
  restaurant({
    id: 'cairo-eish-malh', name: 'Eish & Malh', area: 'Downtown',
    tagline: 'A bright downtown table',
    description: 'Egyptian and Mediterranean café plates close to Talaat Harb; breakfast begins at 09:00.',
    duration: 65, coordinates: { lat: 30.051086, lng: 31.243683 },
    rating: 4.2, reviewCount: 211,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g294201-d7916160-Reviews-Eish_Malh-Cairo_Cairo_Governorate.html',
    tags: ['Cafe', 'Breakfast', 'Vegetarian options'], priority: 4.3,
    mealSlots: ['breakfast', 'lunch', 'dinner'], weekly: everyDay(540, 1440),
    price: menuEstimate(350, 'EGP', 'https://www.tripadvisor.ca/Restaurant_Review-g294201-d7916160-Reviews-Eish_Malh-Cairo_Cairo_Governorate.html'),
  }),
  restaurant({
    id: 'cairo-zooba', name: 'Zooba Zamalek', area: 'Zamalek',
    tagline: 'Egyptian street food, reimagined',
    description: 'Bright Egyptian sandwiches and bowls on 26th of July Street, useful for a Nile island day.',
    duration: 55, coordinates: { lat: 30.061085, lng: 31.219318 },
    rating: 4.2, reviewCount: 616,
    reviewUrl: 'https://www.tripadvisor.co.za/Restaurant_Review-g294201-d3398031-Reviews-Zooba-Cairo_Cairo_Governorate.html',
    tags: ['Egyptian', 'Street food', 'Vegetarian options'], priority: 4.5,
    mealSlots: ['breakfast', 'lunch', 'dinner'], weekly: everyDay(480, 1440),
    price: menuEstimate(220, 'EGP', 'https://www.zoobaeats.com/', 'Illustrative sandwich-and-drink budget, not a fixed 2026 menu price.'),
  }),
  restaurant({
    id: 'cairo-fasahet', name: 'Fasahet Somaya', area: 'Downtown',
    tagline: 'A little home cooking at dusk',
    description: 'Small Egyptian dinner kitchen with a short service window. Arrive early and confirm a table.',
    duration: 55, coordinates: { lat: 30.04569, lng: 31.240257 },
    rating: 4.1, reviewCount: 47,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g294201-d7380286-Reviews-Fasahet_Somaya-Cairo_Cairo_Governorate.html',
    tags: ['Egyptian', 'Home cooking', 'Dinner'], priority: 4.3,
    mealSlots: ['dinner'], weekly: onDays([0, 1, 2, 3, 4, 5], 1020, 1140),
    price: menuEstimate(330, 'EGP', 'https://www.tripadvisor.ca/Restaurant_Review-g294201-d7380286-Reviews-Fasahet_Somaya-Cairo_Cairo_Governorate.html', 'Illustrative dinner budget; hours are limited and menu changes daily.'),
  }),
  restaurant({
    id: 'cairo-naguib', name: 'Naguib Mahfouz Café', area: 'Khan el-Khalili',
    tagline: 'Dinner in the old bazaar',
    description: 'A historic bazaar restaurant for Egyptian dishes; more expensive than the downtown counters.',
    duration: 70, coordinates: { lat: 30.048069, lng: 31.261616 },
    rating: 4.3, reviewCount: 562,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g294201-d1944490-Reviews-Khan_El_Khalili_Restaurant_Naguib_Mahfouz_Cafe-Cairo_Cairo_Governorate.html',
    tags: ['Egyptian', 'Sit-down', 'Bazaar'], priority: 3.9,
    mealSlots: ['lunch', 'dinner'], weekly: everyDay(600, 1440),
    price: listedRange(800, 'EGP', 'https://restaurantguru.com/Naguib-Mahfouz-Cafe-Cairo', 'Midpoint of a very broad EGP 200–1,400 per-person band; inspect the menu before committing.'),
  }),
]
