// QA opzionale: richiede Playwright disponibile esternamente, senza aggiungerlo al progetto.
// node tests/frontend-browser.mjs [modulo-playwright] [eseguibile-chrome] [URL-locale]
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = process.argv[4] ?? 'http://127.0.0.1:5173/'
const output = resolve('docs/frontend-verification')
await mkdir(output, { recursive: true })
const results = []
const errors = []
const check = async (name, action) => { await action(); results.push({ name, passed: true }); console.log(`OK ${name}`) }
const attachErrors = page => page.on('pageerror', error => errors.push(error.message))
const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
const record = (index, overrides = {}) => ({
  ingestion_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  temperature_c: [14.9, 15.5, 16.1, 17, 17.8, 19.4][index] ?? 20.2,
  humidity_pct: [76, 74, 72, 70, 68, 64][index] ?? 62,
  pressure_hpa: [1014.8, 1014.9, 1015.1, 1015.2, 1015.4, 1015.8][index] ?? 1015.9,
  captured_at: new Date(Date.UTC(2026, 9, 22, index * 3)).toISOString(), measured_at: null,
  received_at: '2026-10-22T18:00:00.000Z', quality_flags: [], ...overrides,
})
const records = Array.from({ length: 6 }, (_, index) => record(index))
const pageData = items => ({ items, next_cursor: null, until: '2026-10-22T20:00:00.000Z', time_basis: 'captured_at' })
let latest = records.at(-1)
let fixtureRows = records
let failure = false
let waitForResponse = null
let historyCalls = 0
const markSynthetic = async page => page.evaluate(() => {
  document.querySelector('.notice p').textContent = 'VERIFICA LOCALE · DATI SINTETICI · tutti i valori sono sintetici, non provengono dalla stazione.'
  document.querySelectorAll('h2, .metric-source').forEach(element => { if (!element.textContent.includes('TEST SINTETICO')) element.textContent += ' · TEST SINTETICO' })
})
try {
  const liveContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  const live = await liveContext.newPage()
  attachErrors(live)
  await check('API pubblica → dashboard vuota, nessuna misura inventata', async () => {
    await live.goto(base)
    await live.getByText('Nessuna misura disponibile', { exact: true }).waitFor({ timeout: 20000 })
    assert.deepEqual(await live.locator('.metric-value').allTextContents(), Array(3).fill('Nessun dato disponibile'))
    assert.equal(await live.locator('.chart svg').count(), 0)
    await live.evaluate(() => document.fonts.ready)
    await live.screenshot({ path: `${output}/desktop-empty.png`, fullPage: true })
  })
  await liveContext.close()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  await context.route('**/functions/v1/read-measurements?*', async route => {
    if (waitForResponse) await waitForResponse
    if (failure) return route.abort('internetdisconnected')
    const url = new URL(route.request().url())
    const history = url.searchParams.get('view') === 'history'
    if (history) historyCalls++
    const items = history ? url.searchParams.get('period') === '7g' ? [] : fixtureRows : [latest]
    await route.fulfill({ json: pageData(items) })
  })
  const page = await context.newPage()
  attachErrors(page)
  await page.clock.install()
  await check('fixture sintetica: tre grafici, unità e tabella accessibile', async () => {
    await page.goto(base)
    await page.locator('.chart svg').first().waitFor()
    assert.equal(await page.locator('.chart svg').count(), 3)
    assert.equal(await page.locator('.history-table tbody tr').count(), 6)
    assert.match(await page.locator('.metric-value').first().textContent(), /19,4/)
    assert.equal(await page.getByRole('status').first().textContent(), 'Freschezza non determinabile')
    await markSynthetic(page)
  })
  await check('reflow 320, 390, 768, 1280 px e font Inter locale', async () => {
    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await noOverflow(page)
      if (width === 390 || width === 1280) {
        // Una pagina nuova evita artefatti di compositing headless dopo resize con backdrop-filter.
        const capture = await context.newPage()
        await capture.setViewportSize({ width, height: 900 })
        await capture.goto(base)
        await capture.locator('.chart svg').first().waitFor()
        await capture.evaluate(() => document.fonts.ready)
        await markSynthetic(capture)
        await capture.screenshot({ path: `${output}/${width === 390 ? 'mobile' : 'desktop'}-synthetic-test.png`, fullPage: true, animations: 'disabled' })
        await capture.close()
      }
    }
    assert.equal(await page.evaluate(() => document.fonts.check('14px Inter')), true)
  })
  await check('tastiera, focus e filtri 7g/30g senza storico sostitutivo', async () => {
    const seven = page.getByRole('button', { name: '7 giorni', exact: true })
    await seven.focus()
    await page.keyboard.press('Enter')
    await page.getByText('Nessuna misura nel periodo selezionato.', { exact: true }).waitFor()
    assert.equal(await seven.getAttribute('aria-pressed'), 'true')
    assert.equal(await page.locator('.history-table tbody tr').count(), 0)
    await page.getByRole('button', { name: '30 giorni', exact: true }).click()
    await page.locator('.chart svg').first().waitFor()
    assert.equal(await page.locator('.history-table tbody tr').count(), 6)
    await page.getByRole('button', { name: '24 ore', exact: true }).click()
    await page.locator('.chart svg').first().waitFor()
  })
  await check('polling invariato non ricarica la serie', async () => {
    const before = historyCalls
    await page.clock.fastForward(15001)
    await page.waitForTimeout(100)
    assert.equal(historyCalls, before)
  })
  const second = await context.newPage()
  attachErrors(second)
  await second.clock.install()
  await second.goto(base)
  await second.locator('.chart svg').first().waitFor()
  await check('nuovo campione appare in due browser senza reload', async () => {
    latest = record(6)
    fixtureRows = [...records, latest]
    for (const target of [page, second]) {
      await target.clock.fastForward(15001)
      await target.locator('.metric-value').first().filter({ hasText: '20,2' }).waitFor()
    }
  })
  await check('errore rete conserva dati con avviso; riconnessione automatica', async () => {
    failure = true
    await page.clock.fastForward(15001)
    await page.getByRole('alert').waitFor()
    assert.match(await page.locator('.metric-value').first().textContent(), /20,2/)
    failure = false
    await page.clock.fastForward(15001)
    await page.getByText('Freschezza non determinabile', { exact: true }).waitFor()
    assert.equal(await page.getByRole('alert').count(), 0)
  })
  await check('campi assenti e probabili errati preservati e separati dalla linea', async () => {
    latest = record(7, { humidity_pct: null, temperature_c: 999, quality_flags: [{ field: 'temperature_c', code: 'outside_configured_range', label: 'probabile errato', reason: 'fixture sintetica fuori intervallo' }, { field: 'humidity_pct', code: 'missing_value', label: 'dato assente', reason: 'fixture sintetica assente' }] })
    fixtureRows = [records[0], latest, records[5]]
    await page.clock.fastForward(15001)
    await page.getByText('Probabile errato', { exact: true }).first().waitFor()
    assert.match(await page.locator('.metric-value').nth(1).textContent(), /Dato assente/)
    assert.equal(await page.locator('.chart.tone-mint .chart-point').count(), 2)
    assert.match(await page.locator('.history-table').textContent(), /999,0/)
  })
  await check('zoom 200% simulato tramite reflow e movimento ridotto', async () => {
    await page.setViewportSize({ width: 640, height: 450 })
    await noOverflow(page)
    await page.locator('.about-section').scrollIntoViewIfNeeded()
    assert.equal(await page.evaluate(() => document.getAnimations().length), 0)
  })
  await check('stato caricamento distinto dal vuoto', async () => {
    let release
    waitForResponse = new Promise(resolve => { release = resolve })
    const loading = await context.newPage()
    attachErrors(loading)
    await loading.goto(base)
    await loading.getByText('Caricamento delle misure…', { exact: true }).waitFor()
    assert.equal(await loading.getByText('Nessuna misura disponibile', { exact: true }).count(), 0)
    release()
    waitForResponse = null
    await loading.getByText('Freschezza non determinabile', { exact: true }).waitFor()
    await loading.close()
  })
  await check('fallback senza JavaScript', async () => {
    const nojs = await browser.newContext({ javaScriptEnabled: false })
    const target = await nojs.newPage()
    await target.goto(base)
    assert.equal(await target.locator('noscript').isVisible(), true)
    assert.match(await target.locator('noscript').textContent(), /Questa pagina statica non mostra dati live/)
    await nojs.close()
  })
  assert.deepEqual(errors, [])
  await writeFile(`${output}/results.json`, `${JSON.stringify({ date: '2026-10-22', backend: 'GET pubblico vuoto; tutti i casi positivi sono fixture sintetiche intercettate nel browser, nessuna scrittura remota', browser: await browser.version(), results, pageErrors: errors }, null, 2)}\n`)
} finally { await browser.close() }
