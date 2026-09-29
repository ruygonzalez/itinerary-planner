import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'

const cdpUrl = process.env.CDP_URL || 'http://127.0.0.1:9222'
const siteUrl = process.env.SITE_URL || 'http://localhost:5174/'
const evidenceDir = process.env.EVIDENCE_DIR
const browser = await chromium.connectOverCDP(cdpUrl)
const errors = []

if (evidenceDir) await mkdir(evidenceDir, { recursive: true })

async function readPlan(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('atlas-three-cities-v2')))
}

async function awaitPlans(page) {
  await page.waitForFunction(() => {
    const saved = JSON.parse(localStorage.getItem('atlas-three-cities-v2') || 'null')
    return saved && Object.values(saved.plans).every((plan) => plan.generatedOnce && plan.events.length > 0)
  }, undefined, { timeout: 30000 })
}

async function selectCity(page, id) {
  await page.locator('.city-tab-' + id).click()
  await page.waitForFunction((city) => JSON.parse(localStorage.getItem('atlas-three-cities-v2')).selectedCity === city, id)
}

async function drag(page, from, to, offsetMinutes) {
  await to.scrollIntoViewIfNeeded()
  await from.scrollIntoViewIfNeeded()
  const origin = await from.boundingBox()
  const target = await to.boundingBox()
  assert(origin && target, 'Both draggable handle and day lane must be visible')
  await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2)
  await page.mouse.down()
  await page.mouse.move(target.x + target.width / 2, target.y + offsetMinutes, { steps: 18 })
  await page.mouse.up()
}

function assertThreeMeals(plan, city) {
  const dates = {
    athens: ['2026-12-22', '2026-12-23', '2026-12-24'],
    cairo: ['2026-12-24', '2026-12-25', '2026-12-26'],
    istanbul: ['2026-12-27', '2026-12-28', '2026-12-29'],
  }[city]
  assert.equal(plan.startDate, dates[0])
  assert.equal(plan.endDate, dates[2])
  for (const date of dates) {
    const stops = plan.events.filter((stop) => stop.date === date)
    for (const meal of ['breakfast', 'lunch', 'dinner']) {
      assert.equal(stops.filter((stop) => stop.meal === meal).length, 1, city + ' ' + date + ' must have exactly one ' + meal)
    }
    assert(stops.length >= 5, city + ' ' + date + ' needs three meals and activities')
  }
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })
  const page = await desktop.newPage()
  page.on('pageerror', (error) => errors.push('desktop: ' + error.stack))
  await page.goto(siteUrl)
  await awaitPlans(page)
  let state = await readPlan(page)
  for (const city of ['athens', 'cairo', 'istanbul']) assertThreeMeals(state.plans[city], city)
  assert.equal(await page.locator('.day-column').count(), 3)
  assert.match(await page.locator('.transfer-warning').innerText(), /Dec 24 appears in Athens and Cairo/)
  assert((await page.locator('input[name="meal-budget"]').inputValue()) === '35')
  if (evidenceDir) {
    await page.screenshot({ path: path.join(evidenceDir, 'desktop-athens.png') })
    await page.locator('.budget-controls').scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.join(evidenceDir, 'desktop-budgets.png') })
    await page.locator('#board-heading').scrollIntoViewIfNeeded()
    await page.screenshot({ path: path.join(evidenceDir, 'desktop-calendar.png') })
  }

  await selectCity(page, 'cairo')
  assert.equal(await page.locator('.day-column').count(), 3)
  assert((await page.locator('.board-subline').innerText()).includes('Africa/Cairo'))
  await page.locator('.leaflet-container').waitFor()
  if (evidenceDir) await page.screenshot({ path: path.join(evidenceDir, 'desktop-cairo.png') })

  await selectCity(page, 'istanbul')
  assert.equal(await page.locator('.day-column').count(), 3)
  assert((await page.locator('.board-subline').innerText()).includes('Europe/Istanbul'))
  state = await readPlan(page)
  assert(!state.plans.istanbul.events.some((stop) => stop.date === '2026-12-29' && stop.placeId === 'istanbul-topkapi'), 'Topkapı is closed Tuesdays')
  assert(!state.plans.istanbul.events.some((stop) => stop.date === '2026-12-27' && stop.placeId === 'istanbul-grand-bazaar'), 'The Grand Bazaar is closed Sundays')
  if (evidenceDir) await page.screenshot({ path: path.join(evidenceDir, 'desktop-istanbul.png') })

  const downloadReady = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export plan' }).click()
  const download = await downloadReady
  assert.equal(download.suggestedFilename(), 'atlas-three-cities-itinerary.ics')
  let calendar = ''
  for await (const chunk of await download.createReadStream()) calendar += chunk.toString()
  for (const zone of ['Europe/Athens', 'Africa/Cairo', 'Europe/Istanbul']) {
    assert(calendar.includes('TZID=' + zone), 'Calendar export should use ' + zone)
  }

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear board' }).click()
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('atlas-three-cities-v2')).plans.istanbul.events.length === 0)
  assert((await page.locator('.constraint-summary').innerText()).includes('rules to fix'))
  await drag(
    page,
    page.getByRole('button', { name: 'Drag Topkapı Palace into a day on the calendar' }),
    page.locator('#lane-2026-12-29'),
    120,
  )
  state = await readPlan(page)
  assert.equal(state.plans.istanbul.events.length, 0, 'A manually dropped stop cannot ignore a Tuesday closure')
  await page.getByRole('alert').filter({ hasText: /closed/i }).waitFor()

  await selectCity(page, 'athens')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear board' }).click()
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('atlas-three-cities-v2')).plans.athens.events.length === 0)
  assert((await page.locator('.constraint-list').innerText()).includes('Exactly one breakfast is required'))
  await page.locator('input[name="activity-budget"]').fill('0')
  await drag(
    page,
    page.getByRole('button', { name: 'Drag The Acropolis into a day on the calendar' }),
    page.locator('#lane-2026-12-22'),
    150,
  )
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('atlas-three-cities-v2')).plans.athens.events.length === 1)
  state = await readPlan(page)
  assert(state.plans.athens.events.some((stop) => stop.placeId === 'acropolis' && stop.pinned))
  assert((await page.locator('.constraint-list').innerText()).includes('Activities are about'), 'Manually exceeded activity cap must be flagged')
  assert((await page.locator('.constraint-list').innerText()).includes('Exactly one lunch is required'))

  await page.locator('input[name="meal-budget"]').fill('0')
  await page.getByRole('button', { name: 'Generate a route' }).click()
  state = await readPlan(page)
  assert.equal(state.plans.athens.events.filter((stop) => stop.origin === 'generated').length, 0, 'A zero-dollar meal cap cannot yield a generated day')
  assert(state.plans.athens.events.some((stop) => stop.placeId === 'acropolis' && stop.pinned), 'Pinned manual choices must survive unsuccessful generation')
  await page.getByRole('status').filter({ hasText: /No compliant Athens route/i }).waitFor()
  await page.locator('input[name="activity-budget"]').fill('65')
  await page.locator('input[name="meal-budget"]').fill('35')
  await page.getByRole('button', { name: 'Generate a route' }).click()
  state = await readPlan(page)
  assert(state.plans.athens.events.some((stop) => stop.placeId === 'acropolis' && stop.pinned))

  await selectCity(page, 'cairo')
  await page.locator('input[name="trip-start"]').fill('2027-04-01')
  await page.locator('input[name="trip-end"]').fill('2027-04-03')
  await page.getByRole('button', { name: 'Apply dates' }).click()
  state = await readPlan(page)
  assert.equal(state.plans.cairo.startDate, '2027-04-01')
  assert.equal(state.plans.cairo.endDate, '2027-04-03')
  assert(state.plans.cairo.events.every((stop) => stop.date >= '2027-04-01' && stop.date <= '2027-04-03'))
  assert.equal(await page.locator('.day-column').count(), 3)
  assert.equal(await page.locator('.transfer-warning').count(), 0, 'Date changes should resolve the Athens/Cairo overlap')
  await desktop.close()

  const mobile = await browser.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
  const phone = await mobile.newPage()
  phone.on('pageerror', (error) => errors.push('mobile: ' + error.stack))
  await phone.goto(siteUrl)
  await awaitPlans(phone)
  if (evidenceDir) {
    await phone.screenshot({ path: path.join(evidenceDir, 'mobile-top.png') })
    await phone.locator('input[name="meal-budget"]').scrollIntoViewIfNeeded()
    await phone.screenshot({ path: path.join(evidenceDir, 'mobile-budgets.png') })
    await phone.locator('#board-heading').scrollIntoViewIfNeeded()
    await phone.screenshot({ path: path.join(evidenceDir, 'mobile-calendar.png') })
  }
  const layout = await phone.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    visibleDays: [...document.querySelectorAll('.day-column')].filter((element) => getComputedStyle(element).display !== 'none').length,
  }))
  assert.equal(layout.width, 393)
  assert(layout.scrollWidth <= layout.width + 1, 'Mobile page must not scroll horizontally')
  assert.equal(layout.visibleDays, 1)
  await phone.getByRole('tab', { name: /Wed 23/ }).click()
  assert((await phone.locator('.day-column.active .day-heading-date').textContent()).includes('23'))
  await phone.getByRole('button', { name: 'Food', exact: true }).click()
  await phone.getByRole('button', { name: 'Add Falafellas to itinerary' }).click()
  await phone.getByRole('dialog', { name: 'Add Falafellas' }).waitFor()
  await phone.getByRole('button', { name: 'Close dialog' }).click()
  await selectCity(phone, 'cairo')
  assert((await phone.locator('.board-subline').textContent()).includes('Africa/Cairo'))
  await mobile.close()

  assert.deepEqual(errors, [], 'No uncaught browser errors')
  process.stdout.write('UI smoke checks passed: three cities, three meals/day, budget and closure rules, drag/drop, export, date changes, and mobile layout.\n')
} finally {
  await browser.close()
}
