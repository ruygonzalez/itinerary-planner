import type { Place, PlaceDraft } from '../types'
import { foodPlaces } from './food'
import { W, combine, everyDay, heritage, official, onDays, publicWalk, season } from './schedules'

const stateClosures = ['01-01', '03-25', '05-01', '12-25', '12-26']

const athensDrafts: PlaceDraft[] = [
  {
    id: 'acropolis',
    name: 'The Acropolis',
    area: 'Acropolis',
    tagline: 'The city from its ancient heart',
    description:
      'Walk among the Parthenon, Erechtheion and Propylaea above Athens. Reserve a timed entry and allow time for the climb.',
    kind: 'sight',
    duration: 105,
    coordinates: { lat: 37.97173, lng: 23.72667 },
    rating: 4.6,
    reviewCount: 37927,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d198706-Reviews-Acropolis-Athens_Attica.html',
    cost: 'ticket',
    ticketPrice: 30,
    tags: ['Ancient history', 'Iconic', 'Outdoors'],
    priority: 5,
    hours: heritage('https://www.hh.gr/en/destinations/acropolis-of-athens/', 1020),
  },
  {
    id: 'acropolis-museum',
    name: 'Acropolis Museum',
    area: 'Makrygianni',
    tagline: 'The stories beneath the stones',
    description:
      'See sculpture and finds from the Acropolis in light-filled galleries beside the archaeological site.',
    kind: 'museum',
    duration: 90,
    coordinates: { lat: 37.96842, lng: 23.728525 },
    rating: 4.7,
    reviewCount: 38387,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d735521-Reviews-Acropolis_Museum-Athens_Attica.html',
    cost: 'ticket',
    ticketPrice: 20,
    tags: ['Art', 'Ancient history', 'Indoors'],
    priority: 5,
    hours: official(
      'https://www.theacropolismuseum.gr/en/plan-your-visit',
      combine(onDays([1, 2, 3, 4], 540, 1020), onDays([5], 540, 1320), onDays([0, 6], 540, 1200)),
      {
        seasons: [
          season(
            '04-01',
            '10-31',
            combine(onDays([1], 540, 1020), onDays([2, 3, 4, 0, 6], 540, 1200), onDays([5], 540, 1320)),
          ),
        ],
        annualClosures: ['01-01', '05-01', '12-25', '12-26'],
        movableClosures: ['orthodox-easter'],
        annualOverrides: { '12-24': W(540, 900), '12-31': W(540, 900) },
        lastEntryMinutes: 30,
        note: 'Christmas Eve and New Year’s Eve: 09:00–15:00. Closed 25–26 December.',
      },
    ),
  },
  {
    id: 'ancient-agora',
    name: 'Ancient Agora',
    area: 'Thissio',
    tagline: 'Where Athens learned to debate',
    description:
      'Explore the civic heart of classical Athens, the Temple of Hephaestus and the Stoa of Attalos.',
    kind: 'sight',
    duration: 90,
    coordinates: { lat: 37.97495, lng: 23.722761 },
    rating: 4.5,
    reviewCount: 4591,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d198709-Reviews-Ancient_Agora_of_Athens-Athens_Attica.html',
    cost: 'ticket',
    ticketPrice: 20,
    tags: ['Ancient history', 'Outdoors', 'Museum'],
    priority: 4.7,
    hours: heritage('https://www.hh.gr/en/destinations/ancient-agora-athens/', 1020),
  },
  {
    id: 'roman-agora',
    name: 'Roman Agora',
    area: 'Plaka',
    tagline: 'A quiet pocket of ancient Rome',
    description:
      'Wander the Roman-era marketplace and the remarkable Tower of the Winds just off Plaka.',
    kind: 'sight',
    duration: 55,
    coordinates: { lat: 37.97399, lng: 23.72579 },
    rating: 3.8,
    reviewCount: 954,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d242841-Reviews-Roman_Agora-Athens_Attica.html',
    cost: 'ticket',
    ticketPrice: 10,
    tags: ['Ancient history', 'Outdoors', 'Quick stop'],
    priority: 3.7,
    hours: heritage('https://www.hh.gr/en/destinations/roman-agora-athens/', 900),
  },
  {
    id: 'national-museum',
    name: 'National Archaeological Museum',
    area: 'Exarchia',
    tagline: 'A whole civilization, one museum',
    description:
      'A deep dive into Greek antiquity, from Mycenaean gold to the Antikythera mechanism.',
    kind: 'museum',
    duration: 110,
    coordinates: { lat: 37.989094, lng: 23.732534 },
    rating: 4.6,
    reviewCount: 8271,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d198713-Reviews-National_Archaeological_Museum-Athens_Attica.html',
    cost: 'ticket',
    ticketPrice: 20,
    tags: ['Art', 'Ancient history', 'Indoors'],
    priority: 4.6,
    hours: official(
      'https://www.hh.gr/en/destinations/national-archaeological-museum/',
      combine(onDays([0, 1, 3, 4, 5, 6], 510, 930), onDays([2], 780, 1200)),
      {
        seasons: [
          season(
            '05-01',
            '10-31',
            combine(onDays([0, 1, 3, 4, 5, 6], 480, 1200), onDays([2], 780, 1200)),
          ),
        ],
        annualClosures: stateClosures,
        movableClosures: ['orthodox-easter'],
        lastEntryMinutes: 30,
        note: 'Tuesday opens at 13:00, including in winter.',
      },
    ),
  },
  {
    id: 'cycladic',
    name: 'Museum of Cycladic Art',
    area: 'Kolonaki',
    tagline: 'The beauty of simple forms',
    description:
      'Discover the distinctive marble figures of the Cyclades and collections from the ancient Aegean.',
    kind: 'museum',
    duration: 75,
    coordinates: { lat: 37.975895, lng: 23.742218 },
    rating: 4.7,
    reviewCount: 1281,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d198712-Reviews-Museum_of_Cycladic_Art-Athens_Attica.html',
    cost: 'ticket',
    ticketPrice: 12,
    tags: ['Art', 'Design', 'Indoors'],
    priority: 4.2,
    hours: official(
      'https://cycladic.gr/en/episkeftheite-to-mouseio/',
      combine(
        onDays([1, 3, 5, 6], 600, 1020),
        onDays([0], 660, 1020),
        onDays([4], 600, 1200),
      ),
      {
        annualClosures: ['01-01', '03-25', '05-01', '08-15', '12-25', '12-26'],
        movableClosures: [
          'orthodox-easter',
          'easter-monday',
          'clean-monday',
          'holy-spirit-monday',
        ],
        lastEntryMinutes: 15,
        note: 'Closed every Tuesday and 25–26 December.',
      },
    ),
  },
  {
    id: 'benaki',
    name: 'Benaki Museum of Greek Culture',
    area: 'Kolonaki',
    tagline: 'Greece through the centuries',
    description:
      'Move from antiquity to modern Greece through art, clothing and objects in a neoclassical mansion.',
    kind: 'museum',
    duration: 90,
    coordinates: { lat: 37.975952, lng: 23.740444 },
    rating: 4.6,
    reviewCount: 1629,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d198714-Reviews-Benaki_Museum-Athens_Attica.html',
    cost: 'ticket',
    tags: ['Art', 'Culture', 'Indoors'],
    priority: 4.1,
    hours: official(
      'https://www.benaki.org/index.php?option=com_buildings&view=visiting&Itemid=532&lang=en',
      combine(onDays([1, 3, 5, 6], 600, 1080), onDays([4], 600, 1440), onDays([0], 600, 960)),
      {
        annualClosures: [
          '01-01',
          '01-06',
          '03-25',
          '05-01',
          '08-15',
          '10-28',
          '12-25',
          '12-26',
        ],
        movableClosures: [
          'orthodox-easter',
          'easter-monday',
          'clean-monday',
          'holy-spirit-monday',
        ],
        note: 'Museum of Greek Culture branch; closed Tuesdays and Christmas Day.',
      },
    ),
  },
  {
    id: 'stadium',
    name: 'Panathenaic Stadium',
    area: 'Pangrati',
    tagline: 'The birthplace of the modern Games',
    description:
      'Step inside the all-marble stadium that hosted the first modern Olympic Games in 1896.',
    kind: 'sight',
    duration: 65,
    coordinates: { lat: 37.969337, lng: 23.740248 },
    rating: 4.4,
    reviewCount: 7186,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d245991-Reviews-Panathenaic_Stadium-Athens_Attica.html',
    cost: 'ticket',
    ticketPrice: 12,
    tags: ['History', 'Architecture', 'Outdoors'],
    priority: 4,
    hours: official('https://www.panathenaicstadium.gr/en/visit/', everyDay(480, 1020), {
      seasons: [season('03-01', '10-31', everyDay(480, 1140))],
      holidayUnconfirmed: true,
      note: 'Published November–February hours are 08:00–17:00; holiday exceptions are not posted.',
    }),
  },
  {
    id: 'national-garden',
    name: 'National Garden',
    area: 'Syntagma',
    tagline: 'A leafy pause in the city',
    description:
      'Take a quiet walk beneath palms and mature trees behind the Greek Parliament.',
    kind: 'outdoors',
    duration: 50,
    coordinates: { lat: 37.97374, lng: 23.73743 },
    rating: 4.1,
    reviewCount: 1570,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d246658-Reviews-National_Garden-Athens_Attica.html',
    cost: 'free',
    tags: ['Nature', 'Free', 'Easy walk'],
    priority: 3.5,
    hours: publicWalk(
      'https://accessibleroutes.thisisathens.org/en/mobility-national-garden-of-athens-and-surrounding-highlights/national-garden/',
      everyDay(480, 1020),
      'Suggested daylight window only. The garden has gates and actual closing follows local conditions; verify at the entrance.',
      { holidayUnconfirmed: true },
    ),
  },
  {
    id: 'philopappos',
    name: 'Philopappos Hill',
    area: 'Koukaki',
    tagline: 'An Acropolis view worth the climb',
    description:
      'Follow the paths on the Hill of the Muses for one of the loveliest views back toward the Acropolis.',
    kind: 'outdoors',
    duration: 65,
    coordinates: { lat: 37.966946, lng: 23.721375 },
    rating: 4.5,
    reviewCount: 1491,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d523835-Reviews-Philopappos_Hill-Athens_Attica.html',
    cost: 'free',
    tags: ['Viewpoint', 'Nature', 'Free'],
    priority: 4.1,
    hours: publicWalk(
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d523835-Reviews-Philopappos_Hill-Athens_Attica.html',
      everyDay(480, 1080),
      'Public hill paths; 08:00–18:00 is a suggested daylight planning window, not posted opening hours.',
    ),
  },
  {
    id: 'lycabettus',
    name: 'Mount Lycabettus',
    area: 'Kolonaki',
    tagline: 'See Athens in every direction',
    description:
      'Climb to the hilltop for a sweeping skyline view; the ascent is steep, so allow a comfortable pace.',
    kind: 'outdoors',
    duration: 75,
    coordinates: { lat: 37.98179, lng: 23.743057 },
    rating: 4.5,
    reviewCount: 6485,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d245989-Reviews-Mount_Lycabettus-Athens_Attica.html',
    cost: 'free',
    tags: ['Viewpoint', 'Hike', 'Free'],
    priority: 4.3,
    hours: publicWalk(
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d245989-Reviews-Mount_Lycabettus-Athens_Attica.html',
      everyDay(480, 1260),
      'Public hill; the 08:00–21:00 planning window is not an operating schedule. Take care on paths after dark.',
    ),
  },
  {
    id: 'plaka',
    name: 'Wander through Plaka',
    area: 'Plaka',
    tagline: 'Lose an hour on purpose',
    description:
      'Meander through narrow lanes, neoclassical houses and small squares below the Acropolis.',
    kind: 'outdoors',
    duration: 55,
    coordinates: { lat: 37.97375, lng: 23.73015 },
    rating: 4.5,
    reviewCount: 16683,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d277449-Reviews-Plaka-Athens_Attica.html',
    cost: 'free',
    tags: ['Neighborhood', 'Free', 'Easy walk'],
    priority: 4.2,
    hours: publicWalk(
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d277449-Reviews-Plaka-Athens_Attica.html',
      everyDay(480, 1320),
      'Public streets have no venue opening hours; this is a comfortable planning window. Shops keep their own hours.',
    ),
  },
  {
    id: 'anafiotika',
    name: 'Anafiotika lanes',
    area: 'Acropolis',
    tagline: 'An island feeling in the city',
    description:
      'Explore the little whitewashed neighborhood on the Acropolis slope and respect its residents.',
    kind: 'outdoors',
    duration: 40,
    coordinates: { lat: 37.9734, lng: 23.727762 },
    rating: 4.6,
    reviewCount: 1382,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d524609-Reviews-Anafiotika-Athens_Attica.html',
    cost: 'free',
    tags: ['Neighborhood', 'Photography', 'Free'],
    priority: 4,
    hours: publicWalk(
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d524609-Reviews-Anafiotika-Athens_Attica.html',
      everyDay(480, 1140),
      'Residential public lanes; 08:00–19:00 is a suggested respectful visit window, not formal opening hours.',
    ),
  },
  {
    id: 'monastiraki',
    name: 'Monastiraki Square',
    area: 'Monastiraki',
    tagline: 'The crossroads of old Athens',
    description:
      'Take in the busy square, its layered architecture and the streets leading toward the flea market.',
    kind: 'outdoors',
    duration: 40,
    coordinates: { lat: 37.97638, lng: 23.725883 },
    walkingEstimate: { minutes: 10, meters: 350 },
    rating: 4.2,
    reviewCount: 54,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d23587131-Reviews-Monastiraki_Square-Athens_Attica.html',
    cost: 'free',
    tags: ['Neighborhood', 'Free', 'Markets'],
    priority: 3.6,
    hours: publicWalk(
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d23587131-Reviews-Monastiraki_Square-Athens_Attica.html',
      everyDay(480, 1320),
      'Public square; 08:00–22:00 is a suggested planning window. Market stalls have separate hours.',
    ),
  },
  {
    id: 'areopagus',
    name: 'Areopagus Hill',
    area: 'Acropolis',
    tagline: 'A close-up view of the Acropolis',
    description:
      'Climb the rocky outcrop beside the Acropolis for a wide city view. The stone can be slippery, especially after rain.',
    kind: 'outdoors',
    duration: 40,
    coordinates: { lat: 37.972247, lng: 23.723349 },
    walkingEstimate: { minutes: 22, meters: 650 },
    rating: 4.4,
    reviewCount: 755,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g189400-d1064131-Reviews-Areopago-Athens_Attica.html',
    cost: 'free',
    tags: ['Viewpoint', 'Free', 'Short climb'],
    priority: 4,
    hours: publicWalk(
      'https://mapcarta.com/N4944879670',
      everyDay(480, 1080),
      'Public rocky hill; 08:00–18:00 is a suggested daylight window, not formal opening hours.',
    ),
  },
  {
    id: 'snfcc',
    name: 'Stavros Niarchos Park',
    area: 'Kallithea',
    tagline: 'A little breathing room by the sea',
    description:
      'Walk the landscaped park and canal at the Stavros Niarchos Foundation Cultural Center.',
    kind: 'outdoors',
    duration: 80,
    coordinates: { lat: 37.940712, lng: 23.693024 },
    rating: 4.7,
    reviewCount: 957,
    reviewUrl:
      'https://www.tripadvisor.co.uk/Attraction_Review-g262046-d10494339-Reviews-Stavros_Niarchos_Foundation_Cultural_Centre-Kallithea_Attica.html',
    cost: 'free',
    tags: ['Architecture', 'Park', 'Free'],
    priority: 4,
    hours: official('https://www.snfcc.org/en/your-visit/information/', everyDay(360, 1440), {
      holidayUnconfirmed: true,
      note: 'The park lists 06:00–00:00 daily. Seasonal events and holiday changes should be checked.',
    }),
  },
  ...foodPlaces,
]

export const places: Place[] = athensDrafts.map((draft) => ({
  ...draft,
  cityId: 'athens',
  price: draft.price ?? (
    draft.cost === 'ticket' && draft.ticketPrice !== undefined
      ? {
          amount: draft.ticketPrice,
          currency: 'EUR',
          basis: 'published-admission',
          sourceUrl: draft.hours.sourceUrl,
          checkedOn: draft.hours.checkedOn,
          note: 'Listed adult admission; confirm price and any discount before booking.',
        }
      : undefined
  ),
}))

export const placesById: Record<string, Place> = Object.fromEntries(
  places.map((place) => [place.id, place]),
)
