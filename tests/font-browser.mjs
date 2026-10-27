// QA locale: font originali e subset, nessuna API o statistica remota.
// node tests/font-browser.mjs [modulo-playwright] [chrome] [URL-locale]
import assert from 'node:assert/strict'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = new URL(process.argv[4] ?? 'http://127.0.0.1:5189/')
try {
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
    await context.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.origin === base.origin) return route.continue()
      if (url.pathname.endsWith('/read-measurements')) return route.fulfill({ json: { items: [], next_cursor: null, until: '2026-10-27T12:00:00Z', time_basis: url.searchParams.get('basis') ?? 'captured_at' } })
      return route.abort()
    })
    const page = await context.newPage()
    const fonts = [], errors = []
    page.on('request', request => { if (request.url().includes('.woff2')) fonts.push(new URL(request.url()).pathname) })
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(new URL('/home', base).href)
    await page.evaluate(() => document.fonts.ready)
    assert.deepEqual(fonts, ['/fonts/InterVariable-latin.woff2'], 'Solo il subset viene scaricato per la UI italiana')
    for (const theme of ['dark', 'light']) {
      await page.evaluate(theme => { document.documentElement.dataset.theme = theme }, theme)
      await page.getByRole('switch', { name: 'Tema chiaro', exact: true }).click()
      await page.evaluate(() => document.fonts.ready)
      assert.deepEqual([...new Set(fonts)], ['/fonts/InterVariable-latin.woff2'])
    }
    const quiz = await context.newPage()
    quiz.on('request', request => { if (request.url().includes('.woff2')) fonts.push(new URL(request.url()).pathname) })
    await quiz.goto(new URL('/gioca', base).href)
    await quiz.getByRole('button', { name: 'Inizia il quiz' }).click()
    await quiz.locator('.quiz-answer').first().click()
    await quiz.evaluate(() => document.fonts.ready)
    assert.deepEqual([...new Set(fonts)], ['/fonts/InterVariable-latin.woff2'], 'Anche i simboli del quiz usano il subset')
    await quiz.close()
    const comparison = await page.evaluate(async () => {
      const heading = document.querySelector('#page-title')
      const dimensions = () => [...heading.querySelectorAll('.title-word')].map(word => ({ text: word.textContent, width: word.getBoundingClientRect().width, height: word.getBoundingClientRect().height }))
      const subset = dimensions()
      const original = new FontFace('AuditOriginal', "url('/fonts/InterVariable.woff2')", { weight: '100 900' })
      await original.load()
      document.fonts.add(original)
      heading.style.fontFamily = 'AuditOriginal'
      const full = dimensions()
      heading.style.removeProperty('font-family')
      await document.fonts.load('14px Inter', 'ΔЖ')
      return { subset, full, extraAlphabets: document.fonts.check('14px Inter', 'ΔЖ'), overflow: document.documentElement.scrollWidth > innerWidth }
    })
    assert.deepEqual(comparison.subset, comparison.full, 'Stessi ingombri del font originale')
    assert.equal(comparison.extraAlphabets, true)
    assert.equal(comparison.overflow, false)
    assert.deepEqual(errors, [])
    await context.close()
    console.log(`OK Inter ${width}px: solo subset iniziale, glifi con stesse misure, alfabeti ulteriori disponibili`)
  }
} finally { await browser.close() }
