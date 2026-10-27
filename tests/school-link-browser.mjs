// QA locale del nome accessibile: nessuna navigazione o statistica esterna.
// node tests/school-link-browser.mjs [modulo-playwright] [chrome] [URL-locale] [axe.min.js-opzionale]
import assert from 'node:assert/strict'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = new URL(process.argv[4] ?? 'http://127.0.0.1:5189/')
try {
  const context = await browser.newContext({ viewport: { width: 901, height: 900 } })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === base.origin) return route.continue()
    if (url.pathname.endsWith('/read-measurements')) return route.fulfill({ json: { items: [], next_cursor: null, until: '2026-10-27T12:00:00Z', time_basis: url.searchParams.get('basis') ?? 'captured_at' } })
    return route.abort()
  })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  for (const path of ['/home', '/info', '/privacy', '/gioca']) {
    await page.goto(new URL(path, base).href)
    await page.locator('h1').waitFor()
    const link = page.getByRole('link', { name: 'Visita il sito ufficiale del Liceo Teresio Olivelli, si apre in una nuova scheda', exact: true })
    assert.equal(await link.count(), 1)
    assert.equal(await link.isVisible(), true)
    assert.equal(await link.getAttribute('href'), 'https://www.liceoolivelli.pv.it/')
    assert.equal(await link.getAttribute('target'), '_blank')
    const visibleLabel = await link.evaluate(element => {
      const clone = element.cloneNode(true)
      clone.querySelectorAll('[aria-hidden="true"]').forEach(element => element.remove())
      return clone.textContent.trim()
    })
    assert.equal(visibleLabel, 'Visita il sito ufficiale')
    assert.ok((await link.getAttribute('aria-label')).startsWith(visibleLabel))
    assert.equal(await link.locator('[aria-hidden="true"]').textContent(), '↗')
    if (process.argv[5]) {
      await page.addScriptTag({ path: process.argv[5] })
      const violations = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ['label-content-name-mismatch'] })).violations.map(item => item.id))
      assert.deepEqual(violations, [], path)
    }
    console.log(`OK ${path}: nome accessibile coerente con il testo visibile del link scolastico`)
  }
  assert.deepEqual(errors, [])
  await context.close()
} finally {
  await browser.close()
}
