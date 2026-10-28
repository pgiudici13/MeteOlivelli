// Fixture inventate intercettate nel browser; nessuna scrittura remota.
// node tests/main-sync-browser.mjs /percorso/playwright/index.mjs /percorso/chrome [URL]
import assert from 'node:assert/strict'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = new URL(process.argv[4] ?? 'http://127.0.0.1:5179')
const now = Date.now()
const iso = time => new Date(time).toISOString()
const live = { acquisition_kind: 'live', entry_method: null, ingestion_id: '00000000-0000-4000-8000-000000000001', temperature_c: 0, humidity_pct: 60, pressure_hpa: 1010, captured_at: iso(now - 7200000), measured_at: null, received_at: iso(now - 7100000), quality_flags: [] }
const manual = { acquisition_kind: 'historical', entry_method: 'manual', ingestion_id: '00000000-0000-4000-8000-000000000002', temperature_c: 10, humidity_pct: 70, pressure_hpa: 1012, captured_at: null, measured_at: iso(now - 3600000), received_at: iso(now - 3500000), quality_flags: [] }
const errors = []
try {
  const context = await browser.newContext({ locale: 'it-IT', reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === base.origin) return route.continue()
    if (!url.pathname.includes('read-measurements')) return route.abort()
    const view = url.searchParams.get('view'), basis = url.searchParams.get('basis') ?? 'captured_at'
    const items = view === 'latest' ? [manual] : url.searchParams.get('period') === 'all' ? [live, manual] : basis === 'measured_at' ? [manual] : [live]
    return route.fulfill({ json: { items, next_cursor: null, until: url.searchParams.get('until') ?? iso(now), time_basis: basis } })
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(new URL('/home', base).href)
  await page.locator('.hero-temperature').filter({ hasText: '10,0' }).waitFor()
  assert.match(await page.locator('.instrument-caption').innerText(), /inserita manualmente/)
  await page.getByRole('button', { name: 'English', exact: true }).click()
  await page.waitForFunction(() => document.documentElement.lang === 'en')
  await page.getByRole('button', { name: 'Fahrenheit', exact: true }).click()
  assert.match(await page.locator('.hero-temperature').innerText(), /50.0 °F/)
  assert.match(await page.locator('.instrument-caption').innerText(), /entered manually/)
  await page.locator('.hero-instrument').getByRole('button', { name: /Expand the Temperature chart/ }).click()
  const dialog = page.getByRole('dialog')
  await dialog.waitFor()
  assert.match(await dialog.locator('h3').innerText(), /Temperature · °F/i)
  assert.match(await dialog.locator('.chart-value').innerText(), /50.0 °F/)
  await dialog.getByRole('button', { name: 'Humidity', exact: true }).click()
  assert.match(await dialog.locator('h3').innerText(), /Humidity · %/i)
  assert.match(await dialog.locator('.chart-value').innerText(), /70.0 %/)
  await dialog.getByRole('button', { name: '24 hours', exact: true }).click()
  assert.equal(await dialog.getByRole('button', { name: '24 hours', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.keyboard.press('Escape')
  assert.equal(await page.getByRole('dialog').count(), 0)
  await page.getByRole('button', { name: 'Show measurements', exact: true }).click()
  assert.match(await page.locator('.history-table').innerText(), /entered manually/i)
  assert.match(await page.locator('.history-table').innerText(), /50.0 °F/)
  assert.deepEqual(errors, [])
  console.log('OK misure manuali, storia, lingua inglese, Fahrenheit e cambio metrica/periodo nel grafico ingrandito; API intercettata localmente.')
} finally { await browser.close() }
