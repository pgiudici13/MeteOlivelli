// QA opzionale: richiede Playwright disponibile esternamente, senza aggiungerlo al progetto.
// node tests/frontend-browser.mjs [modulo-playwright] [eseguibile-chrome] [URL-locale]
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = process.argv[4] ?? 'http://127.0.0.1:5173/'
const output = resolve(process.argv[5] ?? 'docs/factory-verification')
await mkdir(output, { recursive: true })
const results = []
const errors = []
const check = async (name, action) => { await action(); results.push({ name, passed: true }); console.log(`OK ${name}`) }
const attachErrors = page => page.on('pageerror', error => errors.push(error.message))
const noOverflow = async page => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
const record = (index, overrides = {}) => ({
  // Fixture inventata, intercettata localmente, con il contratto della stazione.
  acquisition_kind: 'live',
  ingestion_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  temperature_c: [14.9, 15.5, 16.1, 17, 17.8, 19.4][index] ?? 20.2,
  humidity_pct: [76, 74, 72, 70, 68, 64][index] ?? 62,
  pressure_hpa: [1014.8, 1014.9, 1015.1, 1015.2, 1015.4, 1015.8][index] ?? 1015.9,
  captured_at: new Date(Date.UTC(2026, 9, 22, index * 3)).toISOString(), measured_at: null,
  received_at: '2026-10-22T18:00:00.000Z', quality_flags: [], ...overrides,
})
const records = Array.from({ length: 6 }, (_, index) => record(index))
const pageData = (items, basis = 'captured_at') => ({ items, next_cursor: null, until: '2026-10-22T23:59:59.000Z', time_basis: basis })
let latest = records.at(-1)
let fixtureRows = records
let failure = false
let waitForResponse = null
let historyCalls = 0
const markSynthetic = async page => page.evaluate(() => {
  let banner = document.querySelector('.synthetic-test-notice')
  if (!banner) {
    banner = document.createElement('p')
    banner.className = 'synthetic-test-notice'
    banner.style.cssText = 'padding:16px 0;color:#b8b3b0;font:11px/1.5 monospace'
    document.querySelector('main').prepend(banner)
  }
  banner.textContent = 'VERIFICA LOCALE · DATI SINTETICI · tutti i valori sono sintetici, non provengono dalla stazione.'
  document.querySelectorAll('h2, .metric-source').forEach(element => { if (!element.textContent.includes('TEST SINTETICO')) element.textContent += ' · TEST SINTETICO' })
})
try {
  const liveContext = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await liveContext.route('**/functions/v1/read-measurements?*', route => route.fulfill({ json: pageData([], new URL(route.request().url()).searchParams.get('basis') ?? 'captured_at') }))
  const live = await liveContext.newPage()
  attachErrors(live)
  await check('risposta vuota intercettata → dashboard senza misure inventate', async () => {
    await live.goto(base)
    await live.getByText('Nessuna misura disponibile', { exact: true }).waitFor({ timeout: 20000 })
    assert.deepEqual(await live.locator('.metric-value').allTextContents(), Array(3).fill('Nessun dato disponibile'))
    assert.equal(await live.locator('.chart svg').count(), 0)
    await live.evaluate(() => document.fonts.ready)
    await live.screenshot({ path: `${output}/desktop-empty.png`, fullPage: true })
  })
  await liveContext.close()
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', colorScheme: 'dark' })
  await context.route('**/functions/v1/read-measurements?*', async route => {
    if (waitForResponse) await waitForResponse
    if (failure) return route.abort('internetdisconnected')
    const url = new URL(route.request().url())
    const history = url.searchParams.get('view') === 'history'
    if (url.searchParams.get('basis') === 'measured_at') return route.fulfill({ json: pageData([], 'measured_at') })
    if (history) historyCalls++
    const items = history ? url.searchParams.get('period') === '7g' ? [] : fixtureRows : [latest]
    await route.fulfill({ json: { ...pageData(items), until: url.searchParams.get('until') ?? pageData(items).until } })
  })
  const page = await context.newPage()
  attachErrors(page)
  await page.clock.install()
  await check('fixture sintetica: tre grafici, unità e tabella accessibile', async () => {
    await page.goto(base)
    await page.locator('.chart svg').first().waitFor()
    await page.locator('.history-table tbody tr').first().waitFor()
    assert.equal(await page.locator('.chart-grid .chart svg').count(), 3)
    assert.equal(await page.locator('.history-table tbody tr').count(), 6)
    assert.match(await page.locator('.metric-value').first().textContent(), /19,4/)
    assert.match(await page.locator('.hero-temperature').textContent(), /19,4/)
    assert.equal(await page.locator('.hero-instrument .chart svg').count(), 1)
    const intro = await page.locator('.intro').boundingBox()
    const instrument = await page.locator('.hero-instrument').boundingBox()
    assert.ok(instrument.x > intro.x + intro.width, 'Grafico a destra del titolo su desktop')
    assert.equal(await page.getByRole('status').first().textContent(), 'Freschezza non determinabile')
    await markSynthetic(page)
  })
  await check('Auto predefinito: intervallo breve e medie settimanali senza cambiare i campioni', async () => {
    assert.equal(await page.getByRole('button', { name: 'Auto', exact: true }).getAttribute('aria-pressed'), 'true')
    const originalRows = fixtureRows
    const originalLatest = latest
    try {
      fixtureRows = Array.from({ length: 45 * 3 }, (_, index) => record(index, {
        captured_at: new Date(Date.UTC(2026, 8, 8 + Math.floor(index / 3), [0, 12, 18][index % 3])).toISOString(),
        temperature_c: 10 + index % 3,
      }))
      latest = fixtureRows.at(-1)
      const auto = await context.newPage()
      await auto.goto(base)
      await auto.locator('.chart-average-label').first().waitFor()
      await auto.locator('.history-table tbody tr').first().waitFor()
      assert.equal(await auto.locator('.hero-instrument .chart-point').count(), 21)
      assert.match(await auto.locator('.chart-period-note').first().textContent(), /medie per fascia 00–12/)
      assert.match(await auto.locator('.chart-point title').first().textContent(), /media di/)
      assert.equal(await auto.locator('.history-table tbody tr').count(), 3)
      await auto.close()
    } finally { fixtureRows = originalRows; latest = originalLatest }
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
  await check('motion: disegno curva in vista, fine animazione e riduzione dinamica', async () => {
    const motion = await context.newPage()
    attachErrors(motion)
    await motion.emulateMedia({ reducedMotion: 'no-preference' })
    await motion.goto(base)
    await motion.waitForFunction(() => document.querySelector('.hero-instrument .chart-reveal-mask')?.getAnimations().length > 0)
    const drawing = await motion.locator('.hero-instrument .chart-reveal-mask').evaluate(mask => {
      const animation = mask.getAnimations()[0]
      animation.pause()
      const width = Number(mask.getAttribute('width'))
      animation.currentTime = 410
      return { fraction: parseFloat(getComputedStyle(mask).width) / width, dash: getComputedStyle(document.querySelector('.hero-instrument .chart-line')).strokeDasharray, easing: animation.effect.getTiming().easing }
    })
    assert.ok(Math.abs(drawing.fraction - 0.5) < 0.02)
    assert.equal(drawing.dash, 'none')
    assert.equal(drawing.easing, 'linear')
    await motion.locator('.hero-instrument .chart-reveal-mask').evaluate(mask => mask.getAnimations()[0].play())
    assert.equal(await motion.locator('.forecast-card').first().evaluate(element => getComputedStyle(element).opacity), '0')
    await motion.waitForTimeout(1000)
    assert.equal(await motion.locator('.hero-instrument .chart-reveal-mask').evaluate(line => line.getAnimations().length), 0)
    await motion.locator('.chart-grid .chart svg').first().scrollIntoViewIfNeeded()
    await motion.waitForFunction(() => [...document.querySelectorAll('.chart-grid .chart-reveal-mask')].some(line => line.getAnimations().length > 0))
    await motion.emulateMedia({ reducedMotion: 'reduce' })
    await motion.waitForFunction(() => document.querySelectorAll('[data-entrance-pending]').length === 0)
    await motion.waitForFunction(() => document.getAnimations().length === 0)
    assert.equal(await motion.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto')
    await motion.close()
  })
  await check('hover: riflesso locale, nessuna illuminazione della sezione e periodo leggibile', async () => {
    for (const selector of ['.hero-instrument', '.metric-card', '.chart-grid .chart', '.forecast-card', '.period-picker button']) {
      const target = page.locator(selector).first()
      await target.hover()
      await page.waitForTimeout(220)
      assert.equal(await target.getAttribute('data-border-light'), '')
      assert.equal(await target.evaluate(element => getComputedStyle(element, '::after').opacity), '1')
    }
    const selected = page.locator('.period-picker button[aria-pressed="true"]')
    await selected.hover()
    assert.equal(await selected.evaluate(element => getComputedStyle(element).color), 'rgb(16, 16, 16)')
    await page.getByRole('button', { name: '7 giorni', exact: true }).hover()
    assert.equal(await page.getByRole('button', { name: '7 giorni', exact: true }).getAttribute('aria-pressed'), 'false')
    assert.equal(await page.locator('.history-section').evaluate(element => getComputedStyle(element).borderTopColor), 'rgb(61, 58, 57)')
    assert.equal(await page.locator('[data-border-light]').count(), 1)
  })
  await check('tastiera, focus e filtri 7g/30g senza storico sostitutivo', async () => {
    const seven = page.getByRole('button', { name: '7 giorni', exact: true })
    await seven.focus()
    await page.keyboard.press('Enter')
    await page.getByText('Nessuna misura nel periodo selezionato.', { exact: true }).waitFor()
    assert.equal(await seven.getAttribute('aria-pressed'), 'true')
    assert.equal(await page.locator('.history-table tbody tr').count(), 6)
    await page.getByRole('button', { name: '30 giorni', exact: true }).click()
    await page.locator('.chart svg').first().waitFor()
    assert.equal(await page.locator('.history-table tbody tr').count(), 6)
    assert.ok(await page.locator('.hero-instrument .chart-time-gridline.minor').count() >= 20)
    assert.ok(await page.locator('.hero-instrument .chart-time-gridline.major').count() >= 4)
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
    assert.equal(await page.locator('.chart-grid .chart.tone-mint .chart-point').count(), 2)
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
  await writeFile(`${output}/results.json`, `${JSON.stringify({ date: '2026-10-22', backend: 'Risposte vuote e positive intercettate nel browser; nessuna scrittura remota da questo runner', browser: await browser.version(), results, pageErrors: errors }, null, 2)}\n`)
} finally { await browser.close() }
