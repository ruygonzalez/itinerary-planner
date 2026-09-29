import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright-core'

const cdpUrl = process.env.CDP_URL || 'http://127.0.0.1:9222'
const siteUrl = process.env.SITE_URL || 'http://localhost:5174/'
const evidenceDir = process.env.EVIDENCE_DIR
const browser = await chromium.connectOverCDP(cdpUrl)
const problems = []

if (evidenceDir) await mkdir(evidenceDir, { recursive: true })

async function drag(page, from, to, offsetMinutes) {
  await to.scrollIntoViewIfNeeded()
  await from.scrollIntoViewIfNeeded()
  const origin = await from.boundingBox()
  const target = await to.boundingBox()
  assert(origin && target, 'Both draggable handle and day lane must be visible')
  const endX = target.x + target.width / 2
  const endY = target.y + offsetMinutes
  await page.mouse.move(origin.x + origin.width / 2, origin.y + origin.height / 2)
  await page.mouse.down()
  await page.mouse.move(endX, endY, { steps: 16 })
  await page.mouse.up()
}

try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await desktop.newPage()
  page.on('pageerror', (error) => problems.push('desktop: ' + error.message))
  await page.goto(siteUrl)
  await page.waitForFunction(
    () => document.querySelectorAll('.calendar-event').length >= 10,
    undefined,
    { timeout: 18000 },
  )
  assert.equal(await page.locator('.day-column').count(), 4)
  assert.equal(
    await page.locator('.day-column:last-child .calendar-event').filter({
      hasText: 'The Acropolis',
    }).count(),
    0,
    'Christmas Day must exclude the closed Acropolis',
  )
  assert(
    (await page.locator('.leaflet-tile').first().getAttribute('src')).includes('World_Light_Gray_Base'),
    'The map should use an accessible tile layer',
  )
  if (evidenceDir) {
    await page.screenshot({ path: path.join(evidenceDir, 'desktop.png') })
  }

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Clear board' }).click()
  await page.waitForFunction(() => document.querySelectorAll('.calendar-event').length === 0)

  await drag(
    page,
    page.getByRole('button', { name: 'Drag The Acropolis into a day on the calendar' }),
    page.locator('#lane-2026-12-22'),
    90,
  )
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem('atlas-athens-planner-v1')).events.some(
      (stop) => stop.placeId === 'acropolis' && stop.date === '2026-12-22',
    ),
  )
  let state = await page.evaluate(() => JSON.parse(localStorage.getItem('atlas-athens-planner-v1')))
  assert(state.events.some((stop) => stop.placeId === 'acropolis' && stop.pinned))

  await drag(
    page,
    page.getByRole('button', { name: 'Drag The Acropolis to a new time or day' }),
    page.locator('#lane-2026-12-23'),
    180,
  )
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem('atlas-athens-planner-v1')).events.some(
      (stop) => stop.placeId === 'acropolis' && stop.date === '2026-12-23',
    ),
  )

  await drag(
    page,
    page.getByRole('button', { name: 'Drag Acropolis Museum into a day on the calendar' }),
    page.locator('#lane-2026-12-25'),
    120,
  )
  state = await page.evaluate(() => JSON.parse(localStorage.getItem('atlas-athens-planner-v1')))
  assert.equal(state.events.some((stop) => stop.placeId === 'acropolis-museum'), false)
  await page.getByRole('alert').filter({ hasText: /closed on this date/i }).waitFor()

  await page.getByRole('button', { name: 'Generate a route' }).click()
  state = await page.evaluate(() => JSON.parse(localStorage.getItem('atlas-athens-planner-v1')))
  assert(state.events.some((stop) => stop.placeId === 'acropolis' && stop.date === '2026-12-23' && stop.pinned))
  assert.equal(
    state.events.some(
      (stop) =>
        stop.date === '2026-12-25' &&
        ['acropolis', 'acropolis-museum', 'ancient-agora', 'roman-agora', 'national-museum', 'cycladic', 'benaki'].includes(stop.placeId),
    ),
    false,
  )
  const downloadReady = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export plan' }).click()
  const download = await downloadReady
  assert.equal(download.suggestedFilename(), 'atlas-athens-itinerary.ics')

  await page.locator('input[name="trip-start"]').fill('2027-04-01')
  await page.locator('input[name="trip-end"]').fill('2027-04-03')
  await page.getByRole('button', { name: 'Apply dates' }).click()
  await page.waitForFunction(
    () => document.querySelectorAll('.day-column').length === 3,
  )
  state = await page.evaluate(() => JSON.parse(localStorage.getItem('atlas-athens-planner-v1')))
  assert.equal(state.startDate, '2027-04-01')
  assert.equal(state.endDate, '2027-04-03')
  assert(state.events.every((stop) => stop.date >= '2027-04-01' && stop.date <= '2027-04-03'))
  await desktop.close()

  const mobile = await browser.newContext({
    viewport: { width: 393, height: 852 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 1,
  })
  const phone = await mobile.newPage()
  phone.on('pageerror', (error) => problems.push('mobile: ' + error.message))
  await phone.goto(siteUrl)
  await phone.waitForFunction(
    () => document.querySelectorAll('.calendar-event').length >= 10,
    undefined,
    { timeout: 18000 },
  )
  if (evidenceDir) {
    await phone.screenshot({ path: path.join(evidenceDir, 'mobile.png') })
    await phone.locator('#board-heading').scrollIntoViewIfNeeded()
    await phone.screenshot({ path: path.join(evidenceDir, 'mobile-calendar.png') })
  }
  const layout = await phone.evaluate(() => ({
    width: innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    visibleDays: [...document.querySelectorAll('.day-column')].filter(
      (element) => getComputedStyle(element).display !== 'none',
    ).length,
  }))
  assert.equal(layout.width, 393)
  assert(layout.scrollWidth <= layout.width + 1, 'Mobile page must not scroll horizontally')
  assert.equal(layout.visibleDays, 1)
  await phone.getByRole('tab', { name: /Wed 23/ }).click()
  assert((await phone.locator('.day-column.active .day-heading-date').textContent()).includes('23'))
  await phone.getByRole('button', { name: 'Food', exact: true }).click()
  await phone.getByRole('button', { name: 'Add Falafellas to itinerary' }).click()
  await phone.getByRole('dialog', { name: 'Add Falafellas' }).waitFor()
  await mobile.close()

  assert.deepEqual(problems, [], 'No uncaught browser errors')
  process.stdout.write('UI smoke checks passed: routes, drag/drop, closures, pinning, export, date changes, and mobile layout.\n')
} finally {
  await browser.close()
}
