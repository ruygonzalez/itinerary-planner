# Atlas · Three Cities

A responsive itinerary planner for **Athens (December 22–24), Cairo (December 24–26), and Istanbul (December 27–29, 2026)**. Each city has its own editable, multi-day calendar, nearby restaurant suggestions, daily budgets, and a randomized route generator. The app is built with React, TypeScript, and Vite and runs entirely in your browser.

## Run it locally

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
git clone https://github.com/ruygonzalez/itinerary-planner.git
cd itinerary-planner
npm ci
npm run dev
```

Open the address Vite prints (usually <http://localhost:5173/>). No account, API key, database, or server-side secret is required. Your plans and preferences are saved in this browser's local storage. **Export plan** downloads an `.ics` calendar containing all three cities, with each event in its city's local time zone.

The default dates are independent city plans, not a connected flight itinerary. **December 24 overlaps Athens and Cairo**; the planner warns about this and does not schedule or price intercity travel. Shorten one leg to leave a real transfer day before relying on both plans. Each leg's dates can be changed to any inclusive range of up to 14 days.

## What you can do

- Switch among the three cities without losing your work. Search/filter real sights, outdoor walks, and restaurants; drag a card into a day or use its **+** button. Move an event by dragging or edit it through its dialog (including on touch and keyboard). Pin stops to keep them on regeneration and save favorites to influence suggestions.
- Set separate **maximum meal and activity costs per person, per day in USD** for each city. Local-currency admission prices and per-person restaurant estimates are converted using a public USD exchange feed, cached for 24 hours; an explicitly dated offline-rate snapshot is used when it is unavailable. The UI shows the source/date of the rate and a local-currency equivalent of each cap.
- Generate a varied itinerary for a city, or regenerate all three. Generated **complete** days have exactly one breakfast, lunch, and dinner; meals fit the venue's listed service hours and meal window, stay within 25 walking minutes **and** 1.8 km of the nearest attraction before/after them, and include at least two non-meal activities around lunch. Breakfast need not have a preceding activity, and dinner need not have a following one.
- Check opening hours, weekly closures, last admission, known holiday exceptions, visit durations, walking transfers, and separate daily budget caps. Generation uses a randomized beam search that favors highly rated/interesting places and neighborhood variety while enforcing these constraints. If no complete route fits (for example, a $0 meal cap), it reports that day instead of presenting an invalid suggestion as complete.
- Build your own calendar. Confirmed closures, overlaps, and insufficient transfer time are rejected on placement; the **day-by-day rule checklist** flags missing/duplicate meals, unsuitable serving times, distant meals, unverified prices, and over-budget manual choices. Manual stops are pinned. Tentative holiday restaurant hours are clearly labeled, and you can exclude them from generated suggestions.

The travel matrix comes from the community-operated [OpenStreetMap-based pedestrian router](https://routing.openstreetmap.de/) and is cached for seven days. When routing is unavailable, the app labels and uses a conservative walking approximation. A long car/transit trip (notably Giza or Fustat from central Cairo) may not fit this walking-focused planner; arrange those transfers separately. Map lines connect stops in order and are not exact street routes.

## Price and availability caveats

Venue information was checked **September 29, 2026**. Published admission is included when available. Restaurant amounts are either the midpoint of a listed per-person price range or an **illustrative one-person meal estimate** from a listing/menu; they are **not measured average bills**. Unpriced paid attractions remain browsable but cannot be used to claim a budget-compliant generated day. The USD exchange rate changes, and prices, tickets, availability, and special holiday hours can change too.

Public squares, streets, mosque exteriors, and other unticketed walks use *suggested planning windows*, not invented official opening times. Restaurant holiday service on Athens December 24 remains unconfirmed; check directly with the business. Cairo December 25 is **not** treated as a universal closure (Egyptian Coptic Christmas is January 7). Check tickets, opening times, reservations, and any December holiday changes shortly before traveling. See [DATA_SOURCES.md](DATA_SOURCES.md) and individual place details for links and the distinction between published and estimated data.

## Code organization

| Location | Responsibility |
| --- | --- |
| `src/domain/Country.ts`, `CityGuide.ts` | Country currency/time zone and city-owned venue collections |
| `src/data/` | Per-city attractions/restaurants, prices, sourced operating schedules |
| `src/lib/hours.ts`, `meals.ts`, `validation.ts`, `audit.ts`, `costs.ts` | Hours, meal roles/proximity, placement checks, daily rule checklist and USD budgets |
| `src/lib/generator.ts` | Randomized constrained multi-day beam search |
| `src/services/routing.ts`, `exchange.ts` | Walking matrix and USD currency rates, with labeled fallbacks |
| `src/hooks/usePlanner.ts`, `src/lib/storage.ts` | Independent city plans, migration, persistence, edits and pinning |
| `src/components/`, `src/styles/` | Responsive catalog, maps, calendar, settings, dialogs and feedback |
| `src/lib/export.ts` | Multi-time-zone calendar export |

## Check the project

```bash
npm run typecheck
npm test
npm run build
```

An optional browser smoke test covers city switching, meals, budgets, closures, drag/drop, export, and mobile layout. With the dev server running and a Chrome/Chromium instance exposing CDP on port 9222, run `npm run verify:ui`. Set `SITE_URL` or `CDP_URL` to use other endpoints; `EVIDENCE_DIR` optionally saves screenshots. It opens fresh browser contexts and will not overwrite your existing plan.

The illustrations and planner code are original. Map tiles use Esri Light Gray Canvas, with provider/data credits visible on the map. Internet access is needed for map tiles, fresh exchange rates, and exact walking routes; the editor and labeled fallbacks still work offline.
