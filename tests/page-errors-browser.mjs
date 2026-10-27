// QA locale: chunk di pagina bloccati, nessun servizio o dato remoto coinvolto.
// node tests/page-errors-browser.mjs [modulo-playwright] [chrome] [URL-locale]
import assert from 'node:assert/strict'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = new URL(process.argv[4] ?? 'http://127.0.0.1:5189/')
const errors = []
const results = []
try {
  for (const [path, module, selector] of [['/info', 'InfoPage', '.info-page'], ['/gioca', 'QuizPage', '.quiz-page']]) {
    const context = await browser.newContext()
    let blockModule = true
    await context.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.origin === base.origin) return blockModule && url.pathname.includes(module) ? route.abort() : route.continue()
      if (url.pathname.endsWith('/read-measurements')) return route.fulfill({ json: { items: [], next_cursor: null, until: '2026-10-27T12:00:00Z', time_basis: url.searchParams.get('basis') ?? 'captured_at' } })
      return route.abort()
    })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(new URL(path, base).href)
    const heading = page.getByRole('heading', { name: 'La pagina non si è caricata.', exact: true })
    await heading.waitFor()
    assert.equal(await heading.evaluate(element => document.activeElement === element), true)
    assert.equal(await page.title(), 'Caricamento non riuscito — MeteOlivelli')
    assert.doesNotMatch(await page.locator('body').innerText(), /Failed to fetch|Error:|\.tsx|\.js|stack/i)
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme }, theme)
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${path} ${width} ${theme}`)
      }
    }
    await page.getByRole('button', { name: 'Preferenze statistiche', exact: true }).click()
    assert.equal(await page.locator('.analytics-consent').isVisible(), true)
    blockModule = false
    await page.getByRole('button', { name: 'Ricarica pagina', exact: true }).click()
    await page.locator(selector).waitFor()
    assert.equal(await heading.count(), 0)
    assert.equal(await page.locator('h1').count(), 1)
    blockModule = true
    await page.goto(new URL(path, base).href)
    await heading.waitFor()
    await page.getByRole('link', { name: 'Torna alla home', exact: true }).click()
    await page.locator('#page-title').waitFor()
    assert.equal(await heading.count(), 0)
    await context.close()
    results.push(path)
    console.log(`OK ${path}: errore gestito, temi/reflow, preferenze, ricarica e ritorno home`)
  }
  assert.deepEqual(errors, [])
  console.log(`${results.length} scenari di recupero pagina superati; rete esterna bloccata.`)
} finally {
  await browser.close()
}
