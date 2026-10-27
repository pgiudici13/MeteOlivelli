// Collaudo browser opzionale: fixture esclusivamente locali, nessun database scritto.
// node tests/forecast-browser.mjs /percorso/playwright/index.mjs /percorso/chrome URL-locale [directory-evidenze]
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const output = resolve(process.argv[5] ?? 'docs/forecast-verification')
await mkdir(output, { recursive: true })
const results = [], errors = []
const hour = 3600000
const now = Date.now()
let serverNow = now, fail = false, synthetic = false
const rows = Array.from({ length: 1440 }, (_, i) => {
  const time = now - 2000 - (1439 - i) * hour / 2
  return { acquisition_kind: 'live', ingestion_id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    measured_at: new Date(time).toISOString(), captured_at: new Date(time + 500).toISOString(), received_at: new Date(time + 1000).toISOString(),
    temperature_c: 18 + 5 * Math.sin(i * Math.PI / 24), humidity_pct: 65 + 10 * Math.cos(i * Math.PI / 24),
    pressure_hpa: 1015 + 4 * Math.sin(i * Math.PI / 24), quality_flags: [] }
})
const check = async (name, action) => { await action(); results.push({ name, passed: true }); console.log(`OK ${name}`) }
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' })
  page.on('pageerror', error => errors.push(error.message))
  await page.clock.install({ time: now })
  const requests = []
  await page.route('**/functions/v1/read-measurements?*', async route => {
    if (fail) return route.abort('internetdisconnected')
    const params = new URL(route.request().url()).searchParams
    requests.push(params.toString())
    const latest = params.get('view') === 'latest'
    const basis = latest ? 'captured_at' : params.get('basis')
    const source = synthetic ? basis === 'measured_at' ? [] : rows.slice(-10).map(row => ({ ...row, acquisition_kind: 'synthetic', measured_at: null })) : rows
    const offset = Number(params.get('cursor') ?? 0)
    const items = latest ? source.slice(-1) : source.slice(offset, offset + 500)
    const next = !latest && offset + 500 < source.length ? String(offset + 500) : null
    await route.fulfill({ json: { items, next_cursor: next, until: params.get('until') ?? new Date(serverNow).toISOString(), time_basis: basis } })
  })
  await check('worker reale: tre orizzonti, sei stime e ritiro della persistenza a 24 ore, con paginazione', async () => {
    await page.goto(process.argv[4] ?? 'http://127.0.0.1:5179/')
    await page.locator('.forecast-section').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => document.querySelectorAll('.forecast-value').length === 6)
    assert.equal(await page.locator('.forecast-card').count(), 3)
    assert.equal(await page.locator('.forecast-card').last().locator('.forecast-value').count(), 0)
    assert.match(await page.locator('.forecast-card').last().innerText(), /miglioramento rispetto all’ultimo valore/)
    assert.ok(requests.some(request => request.includes('basis=measured_at') && request.includes('cursor=500')))
    await page.locator('.forecast-evidence summary').first().click()
    assert.match(await page.locator('.forecast-evidence').first().innerText(), /Errore medio assoluto.*confronti/s)
    assert.match(await page.locator('.forecast-section').innerText(), /non le massime e minime/)
    await page.evaluate(() => {
      const banner = document.createElement('p')
      banner.textContent = 'COLLAUDO LOCALE · SERIE SIMULATA · NON SONO PREVISIONI REALI DELLA STAZIONE'
      banner.className = 'small'
      document.querySelector('.forecast-section').prepend(banner)
    })
    await page.locator('.forecast-section').screenshot({ path: `${output}/desktop.png` })
  })
  await check('filtri dei grafici indipendenti dal modello', async () => {
    const before = await page.locator('.forecast-value').allTextContents()
    const physicalRequests = requests.filter(r => r.includes('basis=measured_at')).length
    await page.getByRole('button', { name: '7 giorni', exact: true }).click()
    await page.waitForTimeout(100)
    assert.deepEqual(await page.locator('.forecast-value').allTextContents(), before)
    assert.equal(requests.filter(r => r.includes('basis=measured_at')).length, physicalRequests)
  })
  await check('reflow a 390/320 px con dettagli metodo aperti', async () => {
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.locator('.forecast-section').screenshot({ path: `${output}/mobile-${width}.png` })
    }
  })
  await check('errore rete ritira i numeri; riconnessione recupera il risultato', async () => {
    fail = true
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForFunction(() => document.querySelector('.forecast-section [role=status]')?.textContent.includes('Lettura o calcolo non riusciti'))
    assert.equal(await page.locator('.forecast-value').count(), 0)
    fail = false
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForFunction(() => document.querySelectorAll('.forecast-value').length === 6)
  })
  await check('ultimo dato nullo/sospetto ritira soltanto le grandezze interessate', async () => {
    rows.at(-1).temperature_c = null
    rows.at(-1).quality_flags = [{ field: 'humidity_pct', code: 'outside_configured_range', label: 'probabile errato', reason: 'Fixture sintetica' }]
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForFunction(() => document.querySelectorAll('.forecast-value').length === 2)
    assert.ok((await page.locator('.forecast-value').allTextContents()).every(text => text.includes('hPa')))
  })
  await check('scadenza anche senza nuovi campioni: nessuna stima passata resta attuale', async () => {
    serverNow += 51 * 60000
    await page.clock.fastForward(51 * 60000)
    await page.waitForFunction(() => document.querySelectorAll('.forecast-value').length === 0)
    assert.ok(await page.getByText('Previsione scaduta: servono nuove osservazioni.').count() > 0)
  })
  await check('dieci sintetici non producono previsioni né una simulazione nella UI finale', async () => {
    synthetic = true
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForFunction(() => document.querySelector('.forecast-section [role=status]')?.textContent.includes('osservazioni fisiche datate'))
    assert.equal(await page.locator('.forecast-value').count(), 0)
    assert.equal(await page.locator('.forecast-simulation').count(), 0)
    assert.match(await page.locator('.forecast-method').textContent(), /0 osservazioni fisiche datate considerate/)
    await page.locator('.forecast-section').screenshot({ path: `${output}/unavailable.png` })
  })
  assert.deepEqual(errors, [])
  await writeFile(`${output}/results.json`, JSON.stringify({ source: 'Collaudo locale con fixture simulate e worker reale; nessuna scrittura remota', results, errors }, null, 2) + '\n')
} finally { await browser.close() }
