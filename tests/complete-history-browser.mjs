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
    const items = url.searchParams.get('basis') === 'measured_at' ? [] : latest ? [row(count - 1)] : Array.from({ length: count + (all ? historical : 0) }, (_, index) => row(index))
    return route.fulfill({ json: { items, next_cursor: null, until: url.searchParams.get('until') ?? '2026-10-23T12:00:00.000Z', time_basis: url.searchParams.get('basis') ?? 'captured_at' } })
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install({ time: new Date('2026-10-23T12:00:00Z') })
  await page.goto(base.href)
  const total = page.locator('.chronology-section .history-feedback')
  const expectTotal = async value => { await page.waitForFunction(value => document.querySelector('.chronology-section .history-feedback')?.textContent === `${value} campioni registrati.`, value) }
  await check('caricamento iniziale completo', () => expectTotal(13))
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
    assert.equal(await total.textContent(), '15 campioni registrati.')
    assert.match(await page.locator('.pagination p').textContent(), /Giorno 2 di/)
    fail = false
    historical++
    await page.getByRole('button', { name: 'Riprova', exact: true }).click()
    await expectTotal(16)
  })
  await check('ritorno online riconcilia anche senza nuovo latest', async () => {
    historical++
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await expectTotal(17)
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
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expectTotal(18)
  })
  for (const width of [320, 390, 1280]) await check(`reflow ${width} px`, async () => {
    await page.setViewportSize({ width, height: 900 })
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  })
  assert.deepEqual(errors, [])
  await mkdir('docs/project-review', { recursive: true })
  await writeFile('docs/project-review/fixes-browser-results.json', JSON.stringify({ fixture: 'synthetic', target: 'build locale con API intercettata', results, errors }, null, 2) + '\n')
} finally {
  await browser.close()
}
