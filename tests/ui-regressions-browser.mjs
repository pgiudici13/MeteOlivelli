// Regressioni UI locali: dati inventati nel solo browser, traffico esterno bloccato.
// node tests/ui-regressions-browser.mjs /percorso/playwright/index.mjs /percorso/chrome [URL]
import assert from 'node:assert/strict'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = process.argv[4] ?? 'http://127.0.0.1:5179'
const results = []
const errors = []
let latestTemperature = 18
const rows = Array.from({ length: 300 }, (_, index) => ({
  acquisition_kind: 'live', ingestion_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  captured_at: new Date(Date.UTC(2026, 9, 26, 6, index)).toISOString(), measured_at: null,
  received_at: '2026-10-27T12:00:00.000Z', temperature_c: 15 + index / 100,
  humidity_pct: 60, pressure_hpa: 1010, quality_flags: [],
}))
const older = { ...rows[0], ingestion_id: '00000000-0000-4000-8000-000000001000', captured_at: '2026-10-25T12:00:00.000Z' }
const check = async (name, run) => { await run(); results.push(name); console.log(`OK ${name}`) }
try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
  await context.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.origin === new URL(base).origin) {
      // Forza il fallback Suspense: gli ingressi devono aspettare il chunk.
      if (/InfoPage|PrivacyPage/.test(url.pathname)) await new Promise(resolve => setTimeout(resolve, 300))
      return route.continue()
    }
    if (!url.pathname.includes('read-measurements')) return route.abort()
    const latest = { ...rows.at(-1), temperature_c: latestTemperature }
    const items = url.searchParams.get('view') === 'latest'
      ? [latest] : url.searchParams.get('period') === 'all' ? [older, ...rows.slice(0, -1), latest] : [...rows.slice(0, -1), latest]
    return route.fulfill({ json: { items, next_cursor: null, until: url.searchParams.get('until') ?? '2026-10-27T12:00:00.000Z', time_basis: url.searchParams.get('basis') ?? 'captured_at' } })
  })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await check('intestazione senza sovrapposizioni in ogni breakpoint e pagina pubblica', async () => {
    for (const route of ['/home', '/info', '/privacy', '/gioca']) {
      for (const width of [320, 390, 760, 761, 900, 901, 920, 1000, 1001, 1024, 1060, 1061, 1280]) {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(`${base}${route}`)
        await page.locator('h1').waitFor()
        await page.evaluate(() => document.fonts.ready)
        const layout = await page.evaluate(() => {
          const elements = ['.brand', '.school-logo', '.header-actions'].map(selector => document.querySelector(selector))
          const rects = elements.filter(element => getComputedStyle(element).display !== 'none').map(element => element.getBoundingClientRect())
          return {
            overflow: document.documentElement.scrollWidth > innerWidth,
            overlap: rects.some((a, index) => rects.slice(index + 1).some(b => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top)),
            footerLogoVisible: getComputedStyle(document.querySelector('.footer-school-link')).display !== 'none',
          }
        })
        assert.deepEqual(layout, { overflow: false, overlap: false, footerLogoVisible: true }, `${route} ${width}px`)
      }
    }
  })
  await check('ingressi delle pagine lazy inizializzati dopo Suspense e movimento ridotto rispettato', async () => {
    await page.setViewportSize({ width: 1280, height: 900 })
    for (const path of ['/info', '/privacy']) {
      await page.goto(`${base}${path}`)
      await page.locator('h1').waitFor()
      assert.ok(await page.locator('.info-block[data-entrance-pending], .privacy-block[data-entrance-pending]').count() > 0, path)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.waitForFunction(() => document.querySelectorAll('[data-entrance-pending]').length === 0 && document.getAnimations().length === 0)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
    }
  })
  await check('quiz completabile da tastiera con focus su domanda, spiegazione e risultato', async () => {
    await page.goto(`${base}/gioca`)
    await page.getByRole('button', { name: 'Inizia il quiz' }).focus()
    await page.keyboard.press('Enter')
    for (let index = 0; index < 10; index++) {
      assert.equal(await page.locator('.quiz-question legend').evaluate(element => document.activeElement === element), true)
      await page.keyboard.press('Tab')
      assert.equal(await page.locator('.quiz-answer').first().evaluate(element => document.activeElement === element), true)
      await page.keyboard.press('Enter')
      assert.equal(await page.locator('.quiz-feedback').evaluate(element => document.activeElement === element), true)
      await page.keyboard.press('Tab')
      assert.equal(await page.locator('.quiz-feedback button').evaluate(element => document.activeElement === element), true)
      await page.keyboard.press('Enter')
    }
    assert.equal(await page.locator('.quiz-result h2').evaluate(element => document.activeElement === element), true)
    assert.match(await page.locator('#quiz-result-summary').textContent(), /su 10/)
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    assert.equal(await page.locator('.quiz-question legend').evaluate(element => document.activeElement === element), true)
  })
  await check('grafico limitato in altezza: puntatore e tocco selezionano il punto effettivo', async () => {
    await page.setViewportSize({ width: 760, height: 900 })
    await page.goto(`${base}/home`)
    const svg = page.locator('.hero-instrument svg')
    await svg.waitFor()
    await svg.scrollIntoViewIfNeeded()
    const point = await svg.evaluate(svg => {
      const circle = svg.querySelectorAll('.chart-point')[30]
      const x = Number(circle.getAttribute('cx')), y = Number(circle.getAttribute('cy'))
      const screen = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM())
      return { x, clientX: screen.x, clientY: screen.y }
    })
    for (const [event, pointerType] of [['pointermove', 'mouse'], ['pointerdown', 'touch']]) {
      await svg.dispatchEvent(event, { pointerType, clientX: point.clientX, clientY: point.clientY })
      const selected = Number(await svg.locator('.chart-selection circle').getAttribute('cx'))
      assert.ok(Math.abs(selected - point.x) < 0.001, `${pointerType}: ${selected} vs ${point.x}`)
    }
  })
  await check('cambio giorno con 300 campioni termina rapidamente e conserva i dati', async () => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${base}/home`)
    await page.locator('.history-table tbody tr').first().waitFor()
    assert.equal(await page.locator('.history-table tbody tr').count(), 300)
    const start = Date.now()
    await page.getByRole('button', { name: 'Precedenti', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('.history-table-wrap')?.getAttribute('aria-busy') === 'false', null, { timeout: 3000 })
    assert.ok(Date.now() - start < 2500, 'transizione superiore a 2,5 secondi')
    assert.equal(await page.locator('.history-table tbody tr').count(), 1)
    await page.getByRole('button', { name: 'Più recenti', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('.history-table-wrap')?.getAttribute('aria-busy') === 'false', null, { timeout: 3000 })
    assert.equal(await page.locator('.history-table tbody tr').count(), 300)
  })
  await check('modifica dell’ultima misura con stesso ID aggiorna anche la cronologia', async () => {
    // Una rilettura appena conclusa impedisce al solo evento online di
    // aggiornare la tabella: il recupero deve derivare dalla nuova misura.
    await page.getByRole('button', { name: 'Aggiorna cronologia', exact: true }).click()
    await page.waitForFunction(() => !document.querySelector('.pdf-export-controls button[disabled]'))
    latestTemperature = 25.8
    await page.evaluate(() => window.dispatchEvent(new Event('online')))
    await page.waitForFunction(() => document.querySelector('.history-table tbody tr')?.textContent.includes('25,8') && document.querySelector('.hero-temperature')?.textContent.includes('25,8'))
    assert.match(await page.locator('.hero-temperature').textContent(), /25,8/)
  })
  assert.deepEqual(errors, [])
  await context.close()
  console.log(`${results.length} regressioni UI superate; fixture esclusivamente locali.`)
} finally {
  await browser.close()
}
