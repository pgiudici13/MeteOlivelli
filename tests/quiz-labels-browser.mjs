// Regressione locale: lettere delle opzioni invarianti, nessun servizio remoto contattato.
// node tests/quiz-labels-browser.mjs /percorso/playwright/index.mjs /percorso/chrome [URL]
import assert from 'node:assert/strict'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = new URL(process.argv[4] ?? 'http://127.0.0.1:5179')
const languages = { it: 'Italiano', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch' }
const errors = []
try {
  const context = await browser.newContext({ locale: 'it-IT', reducedMotion: 'reduce' })
  await context.route('**/*', route => new URL(route.request().url()).origin === base.origin ? route.continue() : route.abort())
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(new URL('/gioca', base).href)
  await page.getByRole('button', { name: 'Inizia il quiz' }).click()
  for (const answered of [false, true]) {
    if (answered) await page.locator('.quiz-answer').first().click()
    for (const [language, name] of Object.entries(languages)) {
      await page.getByRole('button', { name, exact: true }).click()
      await page.waitForFunction(value => document.documentElement.lang === value, language)
      assert.deepEqual(await page.locator('.quiz-answer-letter').allTextContents(), ['A', 'B', 'C'], `${language}, risposta selezionata: ${answered}`)
      assert.equal(await page.locator('.quiz-feedback').count(), answered ? 1 : 0)
    }
  }
  assert.deepEqual(errors, [])
  console.log('OK lettere A/B/C in cinque lingue, prima e dopo la risposta: 10 combinazioni, nessun errore JavaScript.')
} finally { await browser.close() }
