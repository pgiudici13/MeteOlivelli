// QA locale Motion: Playwright esterno, fixture esclusivamente sintetiche, rete esterna bloccata.
// node tests/motion-browser.mjs /percorso/playwright/index.mjs /percorso/chrome [URL]
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = process.argv[4] ?? 'http://127.0.0.1:5179'
const output = 'docs/motion-verification'
await mkdir(output, { recursive: true })
const results = []
const errors = []
const check = async (name, run) => { await run(); results.push({ name, passed: true }); console.log(`OK ${name}`) }
const rows = Array.from({ length: 12 }, (_, index) => ({
  acquisition_kind: 'synthetic', ingestion_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  captured_at: new Date(Date.UTC(2026, 9, 23, index)).toISOString(), measured_at: null,
  received_at: '2026-10-23T12:00:00.000Z', temperature_c: 15 + index / 2,
  humidity_pct: 60 + index, pressure_hpa: 1010 + index, quality_flags: [],
}))
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === new URL(base).origin) return route.continue()
    if (!url.pathname.includes('read-measurements')) return route.abort()
    const items = url.searchParams.get('basis') === 'measured_at' ? [] : url.searchParams.get('view') === 'latest' ? rows.slice(-1) : rows
    return route.fulfill({ json: { items, next_cursor: null, until: url.searchParams.get('until') ?? '2026-10-23T12:00:00.000Z', time_basis: url.searchParams.get('basis') ?? 'captured_at' } })
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await check('titolo animato, grafico progressivo e movimento ridotto dinamico', async () => {
    await page.goto(`${base}/home`)
    await page.waitForFunction(() => document.querySelector('.hero-instrument .chart-reveal-mask')?.getAnimations().length > 0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => document.querySelectorAll('[data-entrance-pending]').length === 0 && document.getAnimations().length === 0)
    assert.equal(await page.locator('#page-title').evaluate(el => getComputedStyle(el).opacity), '1')
    assert.equal(await page.locator('.chart-reveal-mask').first().evaluate(el => el.style.width), '')
    assert.equal(await page.locator('.title-word').first().evaluate(el => getComputedStyle(el).opacity), '1')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })
  await check('grafico: puntatore, frecce, estremi e campione reale della fixture', async () => {
    const svg = page.locator('.hero-instrument svg')
    await svg.focus()
    await page.keyboard.press('Home')
    assert.match(await page.locator('.hero-instrument .chart-inspection').textContent(), /15,0 °C/)
    await page.keyboard.press('ArrowRight')
    assert.match(await page.locator('.hero-instrument .chart-inspection').textContent(), /15,5 °C/)
    await page.keyboard.press('End')
    assert.match(await page.locator('.hero-instrument .chart-inspection').textContent(), /20,5 °C/)
    await page.keyboard.press('Escape')
    assert.equal(await page.locator('.hero-instrument .chart-selection').count(), 0)
    const bounds = await svg.boundingBox()
    await svg.dispatchEvent('pointerdown', { pointerType: 'touch', clientX: bounds.x + 80 })
    assert.equal(await page.locator('.hero-instrument .chart-selection').count(), 1)
    await svg.hover({ position: { x: 100, y: 70 } })
    assert.equal(await page.locator('.hero-instrument .chart-selection').count(), 1)
  })
  await check('controlli: hover, pressione e annullamento dinamico', async () => {
    const button = page.locator('.period-picker button').first()
    await button.hover()
    await page.waitForTimeout(200)
    assert.notEqual(await button.evaluate(el => getComputedStyle(el).transform), 'none')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.period-picker button')).transform === 'none')
    await page.emulateMedia({ reducedMotion: 'no-preference' })
  })
  await check('paginazione Motion completa, inversione e movimento ridotto durante uscita', async () => {
    const next = page.getByRole('button', { name: 'Precedenti', exact: true })
    await next.click()
    await page.waitForFunction(() => document.querySelector('.history-table-wrap')?.getAttribute('aria-busy') === 'false')
    assert.match(await page.locator('.pagination').textContent(), /Pagina 2 di 2/)
    const previous = page.getByRole('button', { name: 'Più recenti', exact: true })
    await previous.click()
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => document.querySelector('.history-table-wrap')?.getAttribute('aria-busy') === 'false')
    assert.match(await page.locator('.pagination').textContent(), /Pagina 1 di 2/)
    assert.equal(await page.locator('.history-table tbody tr').first().evaluate(el => getComputedStyle(el).opacity), '1')
  })
  await check('tutte le pagine, entrambi i temi e reflow 320/390/1280 px', async () => {
    for (const route of ['/home', '/info', '/privacy', '/gioca']) {
      for (const width of [320, 390, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${base}${route}`)
        await page.locator('h1').waitFor()
        for (const theme of ['light', 'dark']) {
          await page.evaluate(theme => { document.documentElement.dataset.theme = theme }, theme)
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${route} ${width} ${theme}`)
        }
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${base}/home`)
    await page.locator('.history-table tbody tr').first().waitFor()
    const reject = page.getByRole('button', { name: 'Rifiuta', exact: true })
    if (await reject.isVisible()) await reject.click()
    await page.evaluate(() => {
      const label = document.createElement('p')
      label.textContent = 'TEST LOCALE — FIXTURE SINTETICA, NON DATI DELLA STAZIONE'
      label.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#fff;color:#111;padding:8px;text-align:center'
      document.body.append(label)
    })
    await page.screenshot({ path: `${output}/desktop-synthetic.png`, fullPage: false })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: `${output}/mobile-synthetic.png`, fullPage: false })
    await page.locator('.hero-instrument').scrollIntoViewIfNeeded()
    await page.screenshot({ path: `${output}/mobile-chart-synthetic.png`, fullPage: false })
  })
  assert.deepEqual(errors, [])
  await context.close()
} finally {
  await browser.close()
  await writeFile(`${output}/results.json`, JSON.stringify({ source: 'fixture sintetica locale; nessuna misura della stazione', results, errors }, null, 2) + '\n')
}
