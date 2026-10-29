// QA locale opzionale: API intercettata, tutte le misure sono fixture sintetiche.
// node tests/complete-history-browser.mjs [modulo-playwright] [chrome] [URL-locale]
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = new URL(process.argv[4] ?? 'http://127.0.0.1:5189/home/')
const results = []
const errors = []
let count = 13
let historical = 0
let fail = false
let undated = false
let historyRequests = 0
const row = index => ({
  // La fixture è inventata e intercettata localmente, ma esercita il contratto live.
  acquisition_kind: 'live',
  ingestion_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  temperature_c: 20 + index / 10, humidity_pct: 60, pressure_hpa: 1015,
  captured_at: new Date(Date.UTC(2026, 9, 21 + Math.floor(index / 6), 8, index % 6)).toISOString(),
  received_at: '2026-10-23T12:00:00.000Z', measured_at: null, quality_flags: [],
})
const check = async (name, action) => { await action(); results.push(name); console.log(`OK ${name}`) }
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === base.origin) return route.continue()
    if (!url.pathname.includes('/functions/v1/read-measurements')) return route.abort()
    const all = url.searchParams.get('period') === 'all'
    if (all) historyRequests++
    if (all && fail) return route.fulfill({ status: 503, json: { code: 'temporarily_unavailable' } })
    const latest = url.searchParams.get('view') === 'latest'
    const items = latest ? [row(count - 1)] : Array.from({ length: count + (all ? historical : 0) }, (_, index) => row(index))
    if (all && undated) items.push({ ...row(90), acquisition_kind: 'historical', captured_at: null, received_at: '2026-10-23T11:00:00.000Z' })
    return route.fulfill({ json: { items, next_cursor: null, until: url.searchParams.get('until') ?? '2026-10-23T12:00:00.000Z', time_basis: url.searchParams.get('basis') ?? 'captured_at' } })
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install({ time: new Date('2026-10-23T12:00:00Z') })
  await page.goto(base.href)
  const total = page.locator('.chronology-section .history-feedback')
  const expectTotal = async value => { await page.waitForFunction(value => document.querySelector('.chronology-section .history-feedback')?.textContent === `${value} campioni registrati, consultabili giorno per giorno.`, value) }
  await check('caricamento iniziale completo', () => expectTotal(13))
  await check('cronologia chiusa inizialmente e apribile', async () => {
    const toggle = page.getByRole('button', { name: 'Mostra le misurazioni', exact: true })
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false')
    await toggle.click()
    assert.equal(await page.getByRole('button', { name: 'Nascondi le misurazioni', exact: true }).getAttribute('aria-expanded'), 'true')
  })
  await check('nuova lettura riconcilia la cronologia', async () => {
    count++
    await page.clock.runFor(16000)
    await expectTotal(14)
  })
  await check('polling invariato non rilegge tutto lo storico', async () => {
    const requests = historyRequests
    await page.clock.runFor(16000)
    assert.equal(historyRequests, requests)
  })
  await check('aggiornamento manuale include importazioni e mantiene la pagina', async () => {
    await page.getByRole('button', { name: 'Precedenti', exact: true }).click()
    historical = 1
    await page.getByRole('button', { name: 'Aggiorna cronologia', exact: true }).click()
    await expectTotal(15)
    assert.match(await page.locator('.pagination p').textContent(), /Giorno 2 di/)
  })
  await check('errore conserva campioni e pagina, retry recupera', async () => {
    fail = true
    await page.getByRole('button', { name: 'Aggiorna cronologia', exact: true }).click()
    await page.locator('.chronology-section .warning').waitFor()
    assert.equal(await total.textContent(), '15 campioni registrati, consultabili giorno per giorno.')
    assert.match(await page.locator('.pagination p').textContent(), /Giorno 2 di/)
    fail = false
    historical++
    await page.getByRole('button', { name: 'Ritenta', exact: true }).click()
    await expectTotal(16)
  })
  await check('ritorno online riconcilia anche senza nuovo latest', async () => {
    // Focus/online condividono il limite di un minuto introdotto dall'audit AUD-04.
    await page.clock.runFor(61000)
    historical++
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expectTotal(17)
  })
  await check('focus ripetuti entro un minuto non rileggono la cronologia', async () => {
    const requests = historyRequests
    await page.evaluate(() => { window.dispatchEvent(new Event('focus')); window.dispatchEvent(new Event('online')) })
    await page.clock.runFor(1000)
    assert.equal(historyRequests, requests)
  })
  await check('pagina nascosta non rilegge; ritorno visibile riconcilia', async () => {
    const requests = historyRequests
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await page.clock.runFor(16000)
    assert.equal(historyRequests, requests)
    historical++
    await page.clock.runFor(61000)
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expectTotal(18)
  })
  await check('il giorno di ricezione non viene presentato come acquisizione', async () => {
    undated = true
    await page.getByRole('button', { name: 'Aggiorna cronologia', exact: true }).click()
    await expectTotal(19)
    await page.getByRole('button', { name: 'Più recenti', exact: true }).click()
    assert.match(await page.locator('.history-day-heading p').textContent(), /giorno di acquisizione o, se assente, di ricezione/)
    assert.equal(await page.getByText('Senza ora di acquisizione', { exact: true }).count(), 1)
  })
  for (const width of [320, 390, 1280]) await check(`reflow ${width} px`, async () => {
    await page.setViewportSize({ width, height: 900 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  })
  assert.deepEqual(errors, [])
  const output = process.argv[5] ?? 'docs/project-review'
  await mkdir(output, { recursive: true })
  await writeFile(`${output}/fixes-browser-results.json`, JSON.stringify({ fixture: 'synthetic', target: 'build locale con API intercettata', results, errors }, null, 2) + '\n')
} finally {
  await browser.close()
}
