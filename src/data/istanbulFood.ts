import type { PlaceDraft, PriceQuote, WeeklyHours } from '../types'
import { everyDay, listedRestaurant, onDays } from './schedules'
import { listedRange, menuEstimate } from './prices'

type Restaurant = Omit<PlaceDraft, 'kind' | 'cost' | 'hours' | 'price'> & {
  weekly: WeeklyHours
  price: PriceQuote
}

function restaurant({ weekly, ...details }: Restaurant): PlaceDraft {
  return { ...details, kind: 'food', cost: 'budget', hours: listedRestaurant(details.reviewUrl, weekly) }
}

export const istanbulFood: PlaceDraft[] = [
  restaurant({
    id: 'istanbul-cigdem', name: 'Çiğdem Pastanesi', area: 'Sultanahmet',
    tagline: 'Börek and tea to start the day',
    description: 'An established pastry shop near the old city sights, with an early everyday opening.',
    duration: 40, coordinates: { lat: 41.008404, lng: 28.97442 },
    rating: 4.5, reviewCount: 507,
    reviewUrl: 'https://www.tripadvisor.co.za/Restaurant_Review-g293974-d1820330-Reviews-Cigdem_Pastanesi-Istanbul.html',
    tags: ['Bakery', 'Breakfast', 'Turkish'], priority: 4.6,
    mealSlots: ['breakfast', 'snack'], weekly: everyDay(420, 1380),
    price: menuEstimate(350, 'TRY', 'https://www.tripadvisor.co.za/Restaurant_Review-g293974-d1820330-Reviews-Cigdem_Pastanesi-Istanbul.html', 'Illustrative börek-and-tea breakfast, not a quoted average.'),
  }),
  restaurant({
    id: 'istanbul-evin', name: 'Evin Bakery & Eatery', area: 'Sultanahmet',
    tagline: 'A simple breakfast near the square',
    description: 'Early bakery and café south of Sultanahmet for a quick breakfast or a light lunch.',
    duration: 45, coordinates: { lat: 41.005127, lng: 28.970219 },
    rating: 4.5, reviewCount: 117,
    reviewUrl: 'https://www.tripadvisor.co.za/Restaurant_Review-g293974-d6212860-Reviews-EVIN_BAKERY_EATERY-Istanbul.html',
    tags: ['Bakery', 'Breakfast', 'Cafe'], priority: 4.3,
    mealSlots: ['breakfast', 'lunch'], weekly: everyDay(360, 1320),
    price: menuEstimate(320, 'TRY', 'https://www.tripadvisor.co.za/Restaurant_Review-g293974-d6212860-Reviews-EVIN_BAKERY_EATERY-Istanbul.html'),
  }),
  restaurant({
    id: 'istanbul-hafiz', name: 'Hafız Mustafa Sirkeci', area: 'Sirkeci',
    tagline: 'Tea and pastries in Sirkeci',
    description: 'Historic patisserie near Gülhane for a light bakery breakfast or a sweet pause.',
    duration: 40, coordinates: { lat: 41.014633, lng: 28.975618 },
    rating: 4.6, reviewCount: 7738,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g293974-d1749881-Reviews-Hafiz_Mustafa_1864_Sirkeci-Istanbul.html',
    tags: ['Bakery', 'Breakfast', 'Dessert'], priority: 4.3,
    mealSlots: ['breakfast', 'snack'], weekly: everyDay(0, 1439),
    price: menuEstimate(350, 'TRY', 'https://www.tripadvisor.ca/Restaurant_Review-g293974-d1749881-Reviews-Hafiz_Mustafa_1864_Sirkeci-Istanbul.html', 'Illustrative pastry-and-tea budget; sweets and full meals can cost more.'),
  }),
  restaurant({
    id: 'istanbul-kofte', name: 'Tarihi Sultanahmet Köftecisi', area: 'Sultanahmet',
    tagline: 'Meatballs, salad and tradition',
    description: 'A quick, well-known köfte counter a short walk from the Basilica Cistern.',
    duration: 55, coordinates: { lat: 41.008015, lng: 28.976904 },
    rating: 4.1, reviewCount: 2335,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g293974-d1228891-Reviews-Tarihi_Sultanahmet_Koftecisi-Istanbul.html',
    tags: ['Turkish', 'Köfte', 'Quick bite'], priority: 4.3,
    mealSlots: ['lunch', 'dinner'], weekly: everyDay(660, 1380),
    price: menuEstimate(500, 'TRY', 'https://www.tripadvisor.ca/Restaurant_Review-g293974-d1228891-Reviews-Tarihi_Sultanahmet_Koftecisi-Istanbul.html', 'Illustrative köfte-and-drink meal, not a fixed menu quote.'),
  }),
  restaurant({
    id: 'istanbul-sehzade', name: 'Şehzade Cağ Kebap', area: 'Sirkeci',
    tagline: 'A satisfying kebab in Sirkeci',
    description: 'Small, highly regarded cağ kebab restaurant. Listed closed on Sundays.',
    duration: 55, coordinates: { lat: 41.01398, lng: 28.975256 },
    rating: 4.3, reviewCount: 1082,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g293974-d2288800-Reviews-Sehzade_Cag_Kebap-Istanbul.html',
    tags: ['Turkish', 'Kebab', 'Quick bite'], priority: 4.5,
    mealSlots: ['lunch', 'dinner'], weekly: onDays([1, 2, 3, 4, 5, 6], 630, 1350),
    price: menuEstimate(550, 'TRY', 'https://www.tripadvisor.ca/Restaurant_Review-g293974-d2288800-Reviews-Sehzade_Cag_Kebap-Istanbul.html'),
  }),
  restaurant({
    id: 'istanbul-hocapasa', name: 'Hocapaşa Pidecisi', area: 'Sirkeci',
    tagline: 'Pide fresh from the oven',
    description: 'A compact and inexpensive pide restaurant near Sirkeci station; dinner service ends early.',
    duration: 55, coordinates: { lat: 41.01401, lng: 28.975655 },
    rating: 4.5, reviewCount: 434,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g293974-d2359659-Reviews-Hocapasa_Pidecisi-Istanbul.html',
    tags: ['Turkish', 'Pide', 'Budget'], priority: 4.7,
    mealSlots: ['lunch', 'dinner'], weekly: everyDay(720, 1170),
    price: listedRange(500, 'TRY', 'https://restaurantguru.com/Hocapasa-Pidecisi-Istanbul', 'Midpoint of the listed TRY 400–600 per-person band.'),
  }),
  restaurant({
    id: 'istanbul-durumzade', name: 'Dürümzade', area: 'Beyoğlu',
    tagline: 'A no-fuss grilled dürüm',
    description: 'Popular wrap counter for a Beyoğlu day, but too far to pair with Sultanahmet sights on foot.',
    duration: 55, coordinates: { lat: 41.035316, lng: 28.977144 },
    rating: 4.6, reviewCount: 760,
    reviewUrl: 'https://www.tripadvisor.co.za/Restaurant_Review-g293974-d2221573-Reviews-Durumzade-Istanbul.html',
    tags: ['Turkish', 'Dürüm', 'Street food'], priority: 4.5,
    mealSlots: ['lunch', 'dinner'], weekly: onDays([1, 2, 3, 4, 5, 6], 690, 1290),
    price: menuEstimate(450, 'TRY', 'https://www.tripadvisor.co.za/Restaurant_Review-g293974-d2221573-Reviews-Durumzade-Istanbul.html'),
  }),
  restaurant({
    id: 'istanbul-rafi', name: 'Rafi Café Karaköy', area: 'Karaköy',
    tagline: 'An easy Karaköy café stop',
    description: 'Small café serving breakfast and casual meals by the waterfront; its very high rating has a small review sample.',
    duration: 55, coordinates: { lat: 41.025417, lng: 28.979202 },
    rating: 5.0, reviewCount: 9,
    reviewUrl: 'https://www.tripadvisor.ca/Restaurant_Review-g293974-d26517589-Reviews-Rafi_Cafe_Resto_Karakoy-Istanbul.html',
    tags: ['Breakfast', 'Cafe', 'Karaköy'], priority: 3.9,
    mealSlots: ['breakfast', 'lunch', 'dinner'], weekly: everyDay(540, 1320),
    price: menuEstimate(450, 'TRY', 'https://www.tripadvisor.ca/Restaurant_Review-g293974-d26517589-Reviews-Rafi_Cafe_Resto_Karakoy-Istanbul.html'),
  }),
]
