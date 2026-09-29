# Three-city data sources and confidence

Checked September 29, 2026 for Athens (Dec 22–24), Cairo (Dec 24–26), and Istanbul (Dec 27–29), 2026. Each venue's details dialog links its hours, reviews, and price basis. This is a dated snapshot, not a promise that future special opening times, tickets, or menu prices will remain unchanged. The overlapping Athens/Cairo date is deliberately shown as a warning: the app does not model flights or transfers between cities.

## Athens: published opening hours

| Venue | Published winter schedule relevant to Dec 22–24 | Source |
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

The following restaurant listings supplied the displayed Tripadvisor rating, review count, inexpensive tier, regular weekly hours, and geographic coordinates. Ratings and prices can change. None of these listings confirmed **December 24, 2026 special hours** as of the check date, so the app flags that date as tentative rather than asserting they are open. The tier is not a numeric menu price; numeric planning estimates are distinguished below.

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
| Takis Bakery | 4.7 | [Tripadvisor](https://www.tripadvisor.ca/Restaurant_Review-g189400-d7158734-Reviews-Takis_Bakery-Athens_Attica.html) |

## Cairo: published and listed availability

| Place | Data in the planner | Source |
| --- | --- | --- |
| Giza Pyramids plateau | Daily 08:00–16:00; EGP 700 foreign adult plateau admission; pyramid interiors cost extra | [Egyptian Ministry of Tourism and Antiquities](https://egymonuments.gov.eg/en/archaeological-sites/giza-plateau/) |
| Citadel of Saladin | Daily 08:00–17:00; EGP 550 foreign adult | [Egyptian Ministry of Tourism and Antiquities](https://egymonuments.gov.eg/en/archaeological-sites/cairo-citadel/) |
| National Museum of Egyptian Civilization | 09:00–17:00, plus Friday 18:00–21:00; EGP 550 foreign adult | [Museum hours](https://nmec.gov.eg/opening-hours/) · [Official ticket portal](https://egymonuments.com/nmec/tickets) |
| Egyptian Museum at Tahrir | Listed regular hours 09:00–17:00; EGP 550 foreign adult; **reconfirm non-Ramadan hours** because the museum page currently emphasizes a shorter Ramadan schedule | [Museum visitor and ticket page](https://egyptianmuseumcairo.eg/ticket-opening-hours/) |
| Grand Egyptian Museum | Gallery hours 09:00–18:00 most days, 09:00–21:00 Wednesdays/Saturdays, last entry an hour before close; no reliable foreign-adult ticket amount in this snapshot, so **excluded from budgeted generation** | [Official ticket site](https://tickets.gem.eg/) |
| Museum of Islamic Art | Generally 09:00–17:00, with Friday prayer interval 11:30–13:30; current admission unverified, so **excluded from budgeted generation** | [Museum website](https://miaegypt.org/) |

Cairo restaurants' regular service hours, positions, rating snapshots, and meal choices are sourced from their individual [Koshary Abou Tarek](https://www.tripadvisor.ca/Restaurant_Review-g294201-d1508799-Reviews-Koshary_Abou_Tarek-Cairo_Cairo_Governorate.html), [El Abd Pastry](https://www.tripadvisor.ca/Restaurant_Review-g294201-d2727225-Reviews-El_Abd_Pastry-Cairo_Cairo_Governorate.html), [Eish & Malh](https://www.tripadvisor.ca/Restaurant_Review-g294201-d7916160-Reviews-Eish_Malh-Cairo_Cairo_Governorate.html), [Zooba](https://www.tripadvisor.co.za/Restaurant_Review-g294201-d3398031-Reviews-Zooba-Cairo_Cairo_Governorate.html), [Fasahet Somaya](https://www.tripadvisor.ca/Restaurant_Review-g294201-d7380286-Reviews-Fasahet_Somaya-Cairo_Cairo_Governorate.html), and [Naguib Mahfouz Café](https://www.tripadvisor.ca/Restaurant_Review-g294201-d1944490-Reviews-Khan_El_Khalili_Restaurant_Naguib_Mahfouz_Cafe-Cairo_Cairo_Governorate.html) listings. Their displayed per-person costs are illustrative estimates except Abou Tarek and Naguib Mahfouz Café, whose numeric [EGP 1–200](https://restaurantguru.com/Abou-Tarek-Cairo) and [EGP 200–1,400](https://restaurantguru.com/Naguib-Mahfouz-Cafe-Cairo) listing ranges supply midpoints. Not all are equally inexpensive; set a cap to rule out costly choices. Egypt's Coptic Christmas is January 7, so the planner does not assume December 25 restaurant closures in Cairo. Confirm individual holiday hours directly.

The downtown Nile, Tahrir, and Qasr el Nil points use [OpenStreetMap](https://www.openstreetmap.org/) positions; [Historic Cairo's UNESCO page](https://whc.unesco.org/en/list/89/) provides context for Al-Muizz Street. Khan el-Khalili represents public market lanes, not a guarantee that shops are open. Giza and Fustat are distant from downtown and require transport that this walking planner does not schedule or price.

## Istanbul: published and listed availability

| Place | Data in the planner | Source |
| --- | --- | --- |
| Topkapı Palace | Ticket booth 09:00–17:00, **closed Tuesday**; foreign adult palace/Harem/Hagia Irene combined admission TRY 2,750 in the checked price list | [National Palaces visitor page](https://www.millisaraylar.gov.tr/Lokasyon/2/topkapi-sarayi) |
| Istanbul Archaeological Museums | Listed 09:00–18:45 daily; current foreign-adult admission unverified, so **excluded from budgeted generation** | [Turkish Museums visitor page](https://muze.gov.tr/muze-detay?SectionId=IAR01&DistId=IAR) |
| Grand Bazaar | Main market typically Mon–Sat 09:00–19:00, **closed Sunday**; individual stalls vary | [Istanbul visitor guide](https://istanbul.com/grand-bazaar) |

The eight Istanbul food listings provide regular hours, locations, and rating/review snapshots: [Çiğdem Pastanesi](https://www.tripadvisor.co.za/Restaurant_Review-g293974-d1820330-Reviews-Cigdem_Pastanesi-Istanbul.html), [Evin Bakery](https://www.tripadvisor.co.za/Restaurant_Review-g293974-d6212860-Reviews-EVIN_BAKERY_EATERY-Istanbul.html), [Hafız Mustafa Sirkeci](https://www.tripadvisor.ca/Restaurant_Review-g293974-d1749881-Reviews-Hafiz_Mustafa_1864_Sirkeci-Istanbul.html), [Tarihi Sultanahmet Köftecisi](https://www.tripadvisor.ca/Restaurant_Review-g293974-d1228891-Reviews-Tarihi_Sultanahmet_Koftecisi-Istanbul.html), [Şehzade Cağ Kebap](https://www.tripadvisor.ca/Restaurant_Review-g293974-d2288800-Reviews-Sehzade_Cag_Kebap-Istanbul.html), [Hocapaşa Pidecisi](https://www.tripadvisor.ca/Restaurant_Review-g293974-d2359659-Reviews-Hocapasa_Pidecisi-Istanbul.html), [Dürümzade](https://www.tripadvisor.co.za/Restaurant_Review-g293974-d2221573-Reviews-Durumzade-Istanbul.html), and [Rafi Café](https://www.tripadvisor.ca/Restaurant_Review-g293974-d26517589-Reviews-Rafi_Cafe_Resto_Karakoy-Istanbul.html). The [TRY 400–600 listed band for Hocapaşa Pidecisi](https://restaurantguru.com/Hocapasa-Pidecisi-Istanbul) supplies a midpoint; other displayed amounts are illustrative meal budgets, not measured averages. Rafi's perfect listed rating has a **small review sample (9)**.

[UNESCO's Historic Areas of Istanbul](https://whc.unesco.org/en/list/356/) provides context for its squares, bridges, parks, and exterior views. Those stops have *suggested* visit windows. The app does **not** imply interior access or free admission to Hagia Sophia's gallery, the Blue Mosque at prayer time, or Galata Tower. Bazaar and restaurant hours are subject to change.

## Per-person pricing and currency conversion

- Paid attraction prices above and those in each Athens place's linked hours source are published adult admissions where available. Free *exterior/public* activities are $0; paid interiors are not silently treated as free. Unverified admissions are explicitly **unknown**, not $0.
- Athens food range midpoints: [Falafellas €1–5](https://restaurantguru.com/Falafellas-Athens), [Feyrouz €5–10](https://restaurantguru.com/Feyrouz-Athens), and [Street Souvlaki €5–10](https://restaurantguru.com/Street-Souvlaki-Athens). All other food amounts are marked as illustrative one-person meal budgets based on linked restaurant/menu listings. A Tripadvisor "inexpensive" tier does **not** establish an average receipt. Drinks, taxes, tips, exchange spreads, and booking fees can change the total.
- [ExchangeRate-API's keyless open USD feed](https://open.er-api.com/v6/latest/USD) supplies EUR, EGP, and TRY per USD, and the app divides a local-currency cost by that rate. A validated response is cached 24 hours. If unavailable, a dated 2026-09-29 fallback is shown: USD 1 = EUR 0.879241, EGP 52.070874, TRY 48.997476. With no trusted current price or rate, any budget comparison is an **estimate**, not a spending guarantee.
- The generator enforces separate per-day USD meal and activity limits. Manually placed items over a limit remain visible with a rule violation. It refuses to mark a day containing an unpriced paid venue budget-complete. Breakfast/lunch/dinner are explicit roles, not inferred from the restaurant's name.

## Travel and map

- Walking time and distance: [OpenStreetMap-based foot router](https://routing.openstreetmap.de/), one table request for the curated coordinates, cached seven days. The service is community-operated without an uptime promise; the app falls back to a labeled approximation if unavailable.
- Basemap tiles: [Esri Light Gray Canvas](https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer) with reference labels. The tile service credits Esri, HERE, Garmin, OpenStreetMap contributors, and the GIS user community; attribution is visible in the map.
- The dashed line connects scheduled stops in order. It is **not** the street-level path returned by the foot router.
