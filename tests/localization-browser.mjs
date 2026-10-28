// Fixture inventata solo nel browser locale; tutte le richieste esterne vengono intercettate.
// node tests/localization-browser.mjs /percorso/playwright/index.mjs /percorso/chrome [URL]
import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = process.argv[4] ?? 'http://127.0.0.1:5179'
const rows = [
  ['2026-10-26T10:00:00Z', -10], ['2026-10-27T09:00:00Z', 0], ['2026-10-27T10:00:00Z', 10],
].map(([time, temperature], index) => ({
  acquisition_kind: 'live', ingestion_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  temperature_c: temperature, humidity_pct: 70, pressure_hpa: 1010,
  captured_at: time, measured_at: time, received_at: time, quality_flags: [],
}))
const names = { it: 'Italiano', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch' }
const titles = { it: 'Le ultime misure', en: 'Latest measurements', es: 'Últimas mediciones', fr: 'Les dernières mesures', de: 'Die letzten Messungen' }
const errors = []
let checks = 0
const check = async (name, run) => { await run(); checks++; console.log(`OK ${name}`) }
try {
  const context = await browser.newContext({ locale: 'it-IT', viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === new URL(base).origin) return route.continue()
    if (!url.pathname.includes('read-measurements')) return route.abort()
    const basis = url.searchParams.get('basis') ?? 'captured_at'
    return route.fulfill({ json: { items: url.searchParams.get('view') === 'latest' ? [rows.at(-1)] : rows, next_cursor: null, until: '2026-10-27T12:00:00.000Z', time_basis: basis } })
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  async function select(code) {
    await page.getByRole('button', { name: names[code], exact: true }).click()
    await page.waitForFunction(language => document.documentElement.lang === language, code)
  }
  await check('cinque lingue: titoli, etichette accessibili e misure tradotte', async () => {
    await page.goto(`${base}/home`)
    for (const language of Object.keys(names)) {
      await select(language)
      await page.getByRole('heading', { name: titles[language], exact: true }).waitFor()
      assert.equal(await page.getByRole('button', { name: names[language], exact: true }).getAttribute('aria-pressed'), 'true')
      if (language !== 'it') {
        const text = await page.locator('main').innerText()
        for (const phrase of ['Le ultime misure', 'Gioca con il meteo', 'Il meteo,', 'Cosa indica?', 'Nessun valore disponibile', 'Previsione non disponibile']) assert.ok(!text.includes(phrase), `${language}: ${phrase}`)
      }
    }
  })
  await check('Fahrenheit coerente in misura principale, assi, statistiche, record e cronologia', async () => {
    await select('en')
    await page.getByRole('button', { name: 'Fahrenheit', exact: true }).click()
    assert.match(await page.locator('.hero-temperature').innerText(), /50.0 °F/)
    assert.match(await page.locator('.metric-card').first().innerText(), /50.0 °F/)
    assert.match(await page.locator('.metric-card').nth(1).innerText(), /70.0 %/)
    assert.match(await page.locator('.metric-card').nth(2).innerText(), /1010.0 hPa/)
    assert.match(await page.locator('.weather-summary').innerText(), /18.0 °F/)
    assert.ok((await page.locator('.chart h3').first().innerText()).includes('°F'))
    assert.match(await page.locator('.daily-stat-card').first().innerText(), /32.0 °F/)
    assert.match(await page.locator('.weather-records').innerText(), /14.0 °F/)
    await page.getByRole('button', { name: 'Show measurements', exact: true }).click()
    assert.match(await page.locator('.history-table').innerText(), /50.0 °F/)
    assert.doesNotMatch(await page.locator('.history-table').innerText(), /campioni|Tempi e qualità|Ricezione:/)
    await page.getByRole('button', { name: 'Celsius', exact: true }).click()
    assert.match(await page.locator('.hero-temperature').innerText(), /10.0 °C/)
  })
  await check('lingua e unità persistono fra pagine e al reload; quiz non si riavvia', async () => {
    await page.getByRole('button', { name: 'Fahrenheit', exact: true }).click()
    await page.goto(`${base}/gioca`)
    await page.getByRole('button', { name: 'Start the quiz', exact: true }).click()
    const question = await page.locator('.quiz-question legend').innerText()
    await page.locator('.quiz-answer').first().click()
    const answers = await page.locator('.quiz-answer').allInnerTexts()
    await select('fr')
    assert.equal(await page.locator('.quiz-feedback').count(), 1)
    assert.notDeepEqual(await page.locator('.quiz-answer').allInnerTexts(), answers)
    await select('en')
    assert.equal(await page.locator('.quiz-question legend').innerText(), question)
    assert.equal(await page.locator('.quiz-feedback').count(), 1)
    await page.reload()
    await page.getByRole('button', { name: 'Start the quiz', exact: true }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Fahrenheit' }).getAttribute('aria-pressed'), 'true')
  })
  await check('testata senza overflow o sovrapposizioni: 5 lingue, 4 pagine, 4 larghezze', async () => {
    for (const code of Object.keys(names)) {
      await select(code)
      for (const path of ['/home', '/info', '/privacy', '/gioca']) {
        for (const width of [320, 390, 900, 1280]) {
          await page.setViewportSize({ width, height: 900 })
          await page.goto(base + path)
          await page.locator('h1').waitFor()
          await page.evaluate(() => document.fonts.ready)
          const result = await page.evaluate(() => {
            const elements = ['.brand', '.site-header > .school-logo', '.header-actions'].map(selector => document.querySelector(selector)).filter(element => getComputedStyle(element).display !== 'none')
            const rectangles = elements.map(element => element.getBoundingClientRect())
            return { overflow: document.documentElement.scrollWidth > innerWidth, overlap: rectangles.some((a, i) => rectangles.slice(i + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)) }
          })
          assert.deepEqual(result, { overflow: false, overlap: false }, `${code} ${path} ${width}`)
          assert.equal(await page.locator('html').getAttribute('lang'), code)
        }
      }
    }
  })
  if (process.argv[5]) {
    const output = resolve(process.argv[5])
    await mkdir(output, { recursive: true })
    await select('en')
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 960 })
      await page.goto(base + '/home')
      await page.locator('.hero-temperature').filter({ hasText: '50.0' }).waitFor()
      await page.evaluate(() => {
        const note = document.createElement('div')
        note.textContent = 'COLLAUDO LOCALE · DATI INVENTATI'
        note.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:9999;padding:8px;background:#fff;color:#000;font:12px monospace;text-align:center'
        document.body.append(note)
      })
      await page.screenshot({ path: `${output}/local-fixture-${width}.png` })
    }
  }
  await check('preferenze funzionano anche quando localStorage non è disponibile', async () => {
    await page.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } }) })
    await page.goto(base + '/home')
    await select('es')
    await page.getByRole('button', { name: 'Fahrenheit', exact: true }).click()
    assert.match(await page.locator('.hero-temperature').innerText(), /50,0 °F/)
  })
  assert.deepEqual(errors, [])
  console.log(`${checks} scenari browser superati, incluse 80 combinazioni responsive; nessun errore JavaScript.`)
} finally { await browser.close() }
