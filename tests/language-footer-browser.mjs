// QA locale di lingua del dispositivo, preferenze e posizione sotto il footer.
// node tests/language-footer-browser.mjs /percorso/playwright/index.mjs /percorso/chrome [URL]
import assert from 'node:assert/strict'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = new URL(process.argv[4] ?? 'http://127.0.0.1:5179')
const errors = []
let cases = 0
async function setup(locale, storage, preferred) {
  const context = await browser.newContext({ locale, reducedMotion: 'reduce' })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === base.origin) return route.continue()
    if (url.pathname.includes('read-measurements')) return route.fulfill({ json: { items: [], next_cursor: null, until: '2026-10-28T12:00:00Z', time_basis: url.searchParams.get('basis') ?? 'captured_at' } })
    return route.abort()
  })
  if (storage !== undefined || preferred) await context.addInitScript(({ storage, preferred }) => {
    if (storage === 'blocked') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError') } })
    else if (storage) window.localStorage.setItem('meteolivelli-display', storage)
    if (preferred) Object.defineProperty(navigator, 'languages', { get: () => preferred })
  }, { storage, preferred })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  return { context, page }
}
try {
  for (const [locale, expected] of [['it-CH', 'it'], ['en-US', 'en'], ['es-MX', 'es'], ['fr-CA', 'fr'], ['de-AT', 'de'], ['pt-BR', 'it']]) {
    const { context, page } = await setup(locale)
    await page.goto(new URL('/home', base).href)
    await page.locator('.language-picker').waitFor()
    assert.equal(await page.locator('html').getAttribute('lang'), expected, locale)
    assert.equal(await page.locator(`.language-picker button[lang="${expected}"]`).getAttribute('aria-pressed'), 'true')
    await context.close(); cases++
  }
  console.log('OK lingua iniziale del dispositivo: cinque lingue e ripiego italiano')
  for (const [locale, storage, preferred, expected] of [
    ['en-GB', '{"language":"it","temperatureUnit":"F"}', undefined, 'it'],
    ['fr-CA', 'blocked', undefined, 'fr'],
    ['nl-NL', undefined, ['nl-NL', 'de-AT', 'en-GB'], 'de'],
  ]) {
    const { context, page } = await setup(locale, storage, preferred)
    await page.goto(new URL('/home', base).href)
    await page.locator('.language-picker').waitFor()
    assert.equal(await page.locator('html').getAttribute('lang'), expected)
    if (storage?.startsWith('{')) assert.equal(await page.getByRole('button', { name: 'Fahrenheit' }).getAttribute('aria-pressed'), 'true')
    await context.close(); cases++
  }
  console.log('OK preferenza salvata prioritaria, storage bloccato e ordine degli idiomi del dispositivo')
  const { context, page } = await setup('it-IT')
  for (const path of ['/home', '/info', '/privacy', '/gioca']) {
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(new URL(path, base).href)
      await page.locator('.language-picker').waitFor()
      assert.equal(await page.locator('.language-picker').count(), 1)
      assert.equal(await page.locator('.site-header .language-picker').count(), 0)
      assert.equal(await page.locator('.site-header .temperature-picker').count(), 0)
      assert.equal(await page.locator('.site-language-bar .temperature-picker').count(), 1)
      assert.equal(await page.locator('.site-header a[href="#site-language"]').count(), 0)
      const layout = await page.evaluate(() => {
        const footer = document.querySelector('.site-footer').getBoundingClientRect()
        const bar = document.querySelector('#site-language').getBoundingClientRect()
        return { afterFooter: bar.top >= footer.bottom, overflow: document.documentElement.scrollWidth > innerWidth }
      })
      assert.deepEqual(layout, { afterFooter: true, overflow: false }, `${path} ${width}`)
      cases++
    }
  }
  console.log('OK lingue e unità sotto il footer, nessun rimando in cima: quattro pagine a 320/1280 px senza overflow')
  await page.getByRole('button', { name: 'Español', exact: true }).click()
  await page.waitForFunction(() => document.documentElement.lang === 'es')
  await page.reload()
  await page.locator('.language-picker').waitFor()
  assert.equal(await page.locator('html').getAttribute('lang'), 'es')
  await context.close(); cases++
  assert.deepEqual(errors, [])
  console.log(`OK ${cases} casi browser superati, nessun errore JavaScript, nessuna richiesta remota non intercettata.`)
} finally { await browser.close() }
