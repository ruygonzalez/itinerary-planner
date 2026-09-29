# Athens data sources

Checked September 29, 2026. The app links each venue's hours and review source again in its details dialog. This is a dated snapshot, not a promise that future special opening times will remain unchanged.

## Official opening hours

| Venue | Published winter schedule relevant to Dec 22–25 | Source |
| --- | --- | --- |
| Acropolis | Daily 08:00–17:00; closed Dec 25–26; last admission 20 min before closing | [Hellenic Heritage](https://www.hh.gr/en/destinations/acropolis-of-athens/) |
| Ancient Agora | Daily 08:00–17:00; closed Dec 25–26; last admission 20 min before closing | [Hellenic Heritage](https://www.hh.gr/en/destinations/ancient-agora-athens/) |
| Roman Agora | Daily 08:00–15:00; closed Dec 25–26; last admission 20 min before closing | [Hellenic Heritage](https://www.hh.gr/en/destinations/roman-agora-athens/) |
| Acropolis Museum | Mon–Thu 09:00–17:00, Fri 09:00–22:00, weekends 09:00–20:00; **Dec 24 09:00–15:00**, closed Dec 25–26 | [Museum visit page](https://www.theacropolismuseum.gr/en/plan-your-visit) |
| National Archaeological Museum | Tue 13:00–20:00; other days 08:30–15:30; closed Dec 25–26 | [Hellenic Heritage](https://www.hh.gr/en/destinations/national-archaeological-museum/) and [Greek Ministry of Culture](https://archaeologicalmuseums.culture.gov.gr/en/museum/5df34af3deca5e2d79e8c150/national-archaeological-museum) |
| Museum of Cycladic Art | Tue closed; Mon/Wed/Fri/Sat 10:00–17:00, Thu 10:00–20:00, Sun 11:00–17:00; closed Dec 25–26 | [Museum visit page](https://cycladic.gr/en/episkeftheite-to-mouseio/) |
| Benaki Museum of Greek Culture | Tue closed; Mon/Wed/Fri/Sat 10:00–18:00, Thu 10:00–00:00, Sun 10:00–16:00; closed Christmas Day and Boxing Day | [Benaki opening hours](https://www.benaki.org/index.php?option=com_buildings&view=visiting&Itemid=532&lang=en) |
| Panathenaic Stadium | Nov–Feb daily 08:00–17:00; no date-specific 2026 Christmas exception posted | [Stadium visit page](https://www.panathenaicstadium.gr/en/visit/) |
| Stavros Niarchos Park | Regular daily hours 06:00–00:00; check event/holiday changes | [SNFCC visitor information](https://www.snfcc.org/en/your-visit/information/) |

Official sites also publish seasonal summer schedules, fixed public-holiday closures, and in some cases movable Orthodox Easter closures. Those rules are modeled in src/data/places.ts and src/lib/hours.ts. The National Garden, Philopappos, Lycabettus, Plaka, Anafiotika, Areopagus, and Monastiraki Square use **suggested** visit windows for planning, not claims about ticketed opening hours. [The official Athens guide](https://accessibleroutes.thisisathens.org/en/mobility-national-garden-of-athens-and-surrounding-highlights/national-garden/) describes the National Garden; its gate time can change with daylight. [Mapcarta's OpenStreetMap point](https://mapcarta.com/N4944879670) supplies the Areopagus Hill position. Coordinates for venues and review snapshots are in the linked review pages; the Plaka route marker is a representative meeting point rather than a single entrance.

## Budget food listings

The following restaurant listings supplied the displayed Tripadvisor rating, review count, inexpensive "£" tier, regular weekly hours, and geographic coordinates. Ratings and prices can change. None of these listings confirmed **December 24–25, 2026 special hours** as of the check date, so the app flags those dates as tentative rather than asserting they are open.

| Food stop | Rating snapshot | Review / regular-hours listing |
| --- | ---: | --- |
| Falafellas | 4.6 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d4293737-Reviews-Falafellas-Athens_Attica.html) |
| Feyrouz | 4.7 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d6784810-Reviews-Feyrouz-Athens_Attica.html) |
| Street Souvlaki Athens Center | 4.6 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d10637814-Reviews-Street_Souvlaki_Athens_Center-Athens_Attica.html) |
| Rhino Vegan Beat | 4.9 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d14142081-Reviews-Rhino_Vegan_Beat_Athens-Athens_Attica.html) |
| To Kati Allo | 4.5 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d2108580-Reviews-To_Kati_Allo-Athens_Attica.html) |
| Mama Tierra Acropolis | 4.7 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d23997166-Reviews-Mama_Tierra_Acropolis-Athens_Attica.html) |
| Lefteris O Politis | 4.7 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d6731564-Reviews-Lefteris_O_Politis-Athens_Attica.html) |
| Cookoomela Grill | 4.7 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d14043008-Reviews-Cookoomela_Grill-Athens_Attica.html) |
| Lukumades | 4.6 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d5993987-Reviews-Lukumades-Athens_Attica.html) |
| To Koulouri tou Psyrri | 4.6 | [Tripadvisor](https://www.tripadvisor.co.uk/Restaurant_Review-g189400-d12132014-Reviews-To_Koulouri_tou_Psyrri-Athens_Attica.html) |

## Travel and map

- Walking time and distance: [OpenStreetMap-based foot router](https://routing.openstreetmap.de/), one table request for the curated coordinates, cached seven days. The service is community-operated without an uptime promise; the app falls back to a labeled approximation if unavailable.
- Basemap tiles: [Esri Light Gray Canvas](https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer) with reference labels. The tile service credits Esri, HERE, Garmin, OpenStreetMap contributors, and the GIS user community; attribution is visible in the map.
- The dashed line connects scheduled stops in order. It is **not** the street-level path returned by the foot router.
