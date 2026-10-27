// Collaudo locale: due schede, preferenze condivise e rete esterna intercettata.
// node tests/analytics-browser.mjs [playwright] [chrome] [URL-locale]
import assert from 'node:assert/strict'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = new URL(process.argv[4] ?? 'http://127.0.0.1:5189/')
const errors = []
const filter = page => page.evaluate(async () => {
  // Vite può includere un parametro HMR: riusare il modulo già caricato dalla UI.
  const loaded = performance.getEntriesByType('resource').find(entry => new URL(entry.name).pathname === '/src/analytics.ts')
  return (await import(loaded?.name ?? '/src/analytics.ts')).filterAnalyticsEvent({ name: 'pageview' })
})
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' })
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === base.origin) return route.continue()
    if (url.pathname.includes('/functions/v1/read-measurements')) {
      return route.fulfill({ json: { items: [], next_cursor: null, until: new Date().toISOString(), time_basis: url.searchParams.get('basis') ?? 'captured_at' } })
    }
    return route.abort()
  })
  const [first, second] = await Promise.all([context.newPage(), context.newPage()])
  for (const page of [first, second]) page.on('pageerror', error => errors.push(error.message))
  await Promise.all([first.goto(base.href), second.goto(base.href)])
  await second.getByRole('button', { name: 'Preferenze statistiche', exact: true }).waitFor()
  assert.deepEqual(await filter(second), { name: 'pageview' })
  await second.getByRole('button', { name: 'Preferenze statistiche', exact: true }).click()
  await first.getByRole('button', { name: 'Preferenze statistiche', exact: true }).click()
  await first.getByRole('button', { name: 'Disattiva statistiche', exact: true }).click()
  await second.waitForFunction(() => window['ga-disable-G-F2LRCD93NW'] === true, null, { timeout: 5000 })
  assert.equal(await filter(second), null)
  await second.getByRole('button', { name: 'Attiva statistiche', exact: true }).waitFor()
  console.log('OK opt-out nella prima scheda arresta gli invii e aggiorna la seconda senza reload')

  await first.waitForLoadState('domcontentloaded')
  await first.evaluate(() => localStorage.removeItem('meteolivelli-analytics-consent'))
  await second.waitForFunction(() => window['ga-disable-G-F2LRCD93NW'] === false, null, { timeout: 5000 })
  assert.deepEqual(await filter(second), { name: 'pageview' })
  await second.getByRole('button', { name: 'Disattiva statistiche', exact: true }).waitFor()
  console.log('OK cancellare la preferenza ripristina il default attivo nelle altre schede')

  const cookies = await browser.newContext()
  await cookies.route('https://audit.meteolivelli.test/**', async route => {
    const url = new URL(route.request().url())
    if (url.pathname === '/src/analytics.ts') {
      return route.fulfill({ response: await route.fetch({ url: new URL('/src/analytics.ts', base).href }) })
    }
    return route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Cookie audit locale</title>' })
  })
  const page = await cookies.newPage()
  await page.goto('https://audit.meteolivelli.test/')
  await cookies.addCookies([
    { name: '_ga_HOST_AUDIT', value: 'fixture-locale', url: 'https://audit.meteolivelli.test/' },
    { name: '_ga_DOMAIN_AUDIT', value: 'fixture-locale', domain: '.audit.meteolivelli.test', path: '/' },
    { name: 'theme_fixture', value: 'preservare', url: 'https://audit.meteolivelli.test/' },
  ])
  await page.evaluate(async () => (await import('/src/analytics.ts')).revokeAnalyticsConsent())
  const remaining = await cookies.cookies()
  assert.deepEqual(remaining.map(cookie => cookie.name), ['theme_fixture'])
  console.log('OK opt-out rimuove cookie Google host/domain e conserva gli altri cookie')
  await cookies.close()
  assert.deepEqual(errors, [])
} finally {
  await browser.close()
}
