# Atlas Athens

A responsive, multi-day Athens itinerary planner built with React, TypeScript, and Vite. Pick from 16 real sights and outdoor walks plus 10 highly rated, inexpensive food stops. The starting trip is **December 22–25, 2026, inclusive**.

## Run locally

Requires Node.js 20.19+ or 22.12+ and npm.

~~~bash
npm ci
npm run dev
~~~

Open the URL printed by Vite (usually <http://localhost:5173/>). If that port is busy, Vite uses the next available port. This workspace currently runs the app at <http://localhost:5174/>.

No API key, database, account, or server-side secret is needed. The app saves the itinerary in this browser's local storage. "Export plan" downloads an .ics calendar using the Europe/Athens time zone.

## Plan a trip

- Choose an inclusive date range of up to 14 days, pace, and interest. Tap **Generate a route** for a new variation.
- Search or filter real places. Drag a card into a calendar day, or tap **+** to choose a day and time. Drag a scheduled stop to move it, or tap it for keyboard/touch-friendly editing.
- The planner rejects confirmed closures, visits outside opening hours, overlapping stops, repeated non-food attractions, and transfers without enough walking time.
- Manually added or moved stops are pinned. A generated stop can be pinned in its details; pinned stops survive regeneration. Saving a place gives it priority in future generated routes.
- Food stops are first-class calendar events, with lunch and dinner windows. Tripadvisor's inexpensive "£" category is a price **tier**, not a quoted GBP or euro menu price.

## What the algorithm considers

The generator tries 16 randomized complete itineraries and selects a high-scoring near-best one. It schedules the most constrained days first (so Christmas Day doesn't consume closed museums), anchors a morning sight, fits distinct lunch and dinner venues, and inserts the remaining stops around those commitments. Hard constraints cover weekly/seasonal hours, published holiday closures, Christmas Eve exceptions, last admission, event duration, and travel buffers. Soft scoring balances ratings, saved places, stated interests, category variety, meal variety, walking distance, holiday uncertainty, and some breathing room in the afternoon. A different random seed produces a slightly different feasible plan on each click.

The app requests one walking-time/distance matrix for its curated places from the public OpenStreetMap-based foot router at routing.openstreetmap.de. It caches a successful result for seven days. If the service is unavailable, it uses an explicitly labeled, conservative straight-line estimate with a street-detour factor. Routes and timing are **walking-focused**; the map connects stops in order and does not claim to draw the exact walking path. For a long leg, consider transit or a taxi separately.

## Data honesty

Schedules and ratings were checked on **September 29, 2026**. Major attractions use official published hours, including the Acropolis Museum's 09:00–15:00 Christmas Eve hours and known December 25–26 closures. Restaurant ratings, inexpensive price tiers, and regular hours come from their linked Tripadvisor listings. **December 24–25, 2026 restaurant exceptions had not been published**; those meals are marked *holiday hours unconfirmed / call ahead*. You can exclude tentative holiday meals from generated routes. Public streets and hills have suggested planning windows, not invented formal operating hours. The National Garden's daylight window is an estimate; check its gates locally. All times shown are local clock times in Athens.

This is a planning aid, not a live reservation or real-time opening-hours guarantee. Always confirm tickets, special closures, and holiday restaurant service shortly before visiting. See [DATA_SOURCES.md](DATA_SOURCES.md) for links and field provenance.

## Code map

| Area | Responsibility |
| --- | --- |
| src/data/places.ts, food.ts, schedules.ts | Curated venues, coordinates, reviews, and sourced schedules |
| src/lib/hours.ts, dates.ts | Seasonal/holiday availability in Athens-local calendar dates |
| src/lib/validation.ts, travel.ts | Placement constraints and walking legs |
| src/lib/generator.ts | Random-restart, multi-day itinerary search |
| src/services/routing.ts | One-shot foot-route matrix, seven-day cache, offline fallback |
| src/hooks/usePlanner.ts | Planner state, persistence, pinning, additions, moves |
| src/components/ | Reusable catalog, calendar, map, settings, dialogs, and feedback |
| src/lib/export.ts | Athens-time-zone calendar export |

## Checks

~~~bash
npm run typecheck
npm test
npm run build
~~~

The optional browser smoke test exercises desktop drag/drop, a rejected Christmas closure, pinned regeneration, and mobile layout. With the dev server running and a Chrome/Chromium instance exposing CDP on port 9222:

~~~bash
npm run verify:ui
~~~

Set SITE_URL or CDP_URL to use different endpoints. Set EVIDENCE_DIR to save desktop and mobile screenshots locally. The smoke test uses fresh browser contexts, so it does not overwrite an existing personal itinerary.

The illustrated Athens hero and app code are original. The map uses Esri Light Gray tiles with the provider/data attribution visible in the map; walking routes use OpenStreetMap contributors' data. Internet access is needed for the map tiles and exact foot-route matrix, but itinerary editing and the fallback estimator work without them.
