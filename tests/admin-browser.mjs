// QA locale opzionale: API amministrativa intercettata, nessuna scrittura remota.
// node tests/admin-browser.mjs [modulo-playwright] [chrome] [URL-locale]
import assert from 'node:assert/strict'
const { chromium } = await import(process.argv[2] ?? 'playwright')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const base = new URL(process.argv[4] ?? 'http://127.0.0.1:5189/')
const errors = []
const results = []
const row = {
  ingestion_id: '00000000-0000-4000-8000-000000000001', arduino_seconds: 42,
  temperature_c: 18, humidity_pct: 60, pressure_hpa: 1015,
  acquisition_kind: 'historical', captured_at: null,
  measured_at: '2026-10-25T01:30:45.123456+00:00', received_at: '2026-10-27T12:00:00Z', quality_flags: [],
}
async function scenario(name, run) {
  const context = await browser.newContext({ timezoneId: 'Europe/Rome', reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', error => errors.push(error.message))
  const requests = []
  let failList = false
  await context.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.origin === base.origin) return route.continue()
    if (!url.pathname.endsWith('/manage-measurements')) return route.abort()
    const method = route.request().method()
    if (method === 'GET') return route.fulfill({ status: failList ? 503 : 200, json: failList ? {} : { items: [row] } })
    requests.push({ method, body: route.request().postDataJSON() })
    return route.fulfill({ json: { ...row, ...requests.at(-1).body } })
  })
  try {
    await page.goto(new URL('/data', base).href)
    await page.getByLabel('Password amministratore').fill('fixture-locale-non-una-password-reale')
    await page.getByRole('button', { name: 'Accedi', exact: true }).click()
    await page.getByRole('button', { name: 'Modifica', exact: true }).waitFor()
    await run({ page, requests, failNextList: () => { failList = true }, restoreList: () => { failList = false } })
    results.push({ name, passed: true })
    console.log(`OK ${name}`)
  } catch (error) {
    results.push({ name, passed: false, error: error.message })
    console.error(`FAIL ${name}: ${error.message}`)
  } finally { await context.close() }
}
try {
  await scenario('modificare un valore conserva secondi, millisecondi e istante nel ritorno all’ora solare', async ({ page, requests }) => {
    await page.getByRole('button', { name: 'Modifica', exact: true }).click()
    await page.getByLabel('Temperatura (°C)', { exact: true }).fill('19')
    await page.getByRole('button', { name: 'Salva modifiche', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Modifiche salvate.' }).waitFor()
    assert.equal(requests[0].method, 'PATCH')
    assert.equal(requests[0].body.measured_at, '2026-10-25T01:30:45.123Z')
  })
  await scenario('un inserimento confermato blocca le modifiche fino al recupero dell’elenco', async ({ page, requests, failNextList, restoreList }) => {
    await page.getByLabel('Secondi Arduino', { exact: true }).fill('100')
    await page.getByLabel('Temperatura (°C)', { exact: true }).fill('20')
    failNextList()
    await page.getByRole('button', { name: 'Aggiungi al database', exact: true }).click()
    await page.waitForFunction(() => document.querySelector('.data-admin-status')?.textContent)
    assert.equal(requests.length, 1)
    assert.equal(await page.getByLabel('Secondi Arduino', { exact: true }).inputValue(), '')
    assert.match(await page.getByRole('status').textContent(), /Misura aggiunta.*elenco/s)
    assert.equal(await page.getByRole('button', { name: 'Aggiungi al database', exact: true }).isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: 'Modifica', exact: true }).isDisabled(), true)
    assert.equal(await page.getByRole('button', { name: 'Rimuovi', exact: true }).isDisabled(), true)
    await page.getByRole('button', { name: 'Aggiorna elenco', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Elenco non aggiornato.' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Modifica', exact: true }).isDisabled(), true)
    restoreList()
    await page.getByRole('button', { name: 'Aggiorna elenco', exact: true }).click()
    await page.getByRole('status').filter({ hasText: 'Elenco aggiornato.' }).waitFor()
    assert.equal(await page.getByRole('button', { name: 'Aggiungi al database', exact: true }).isEnabled(), true)
    assert.equal(await page.getByRole('button', { name: 'Modifica', exact: true }).isEnabled(), true)
    await page.getByRole('button', { name: 'Esci', exact: true }).click()
    assert.equal(await page.locator('tbody tr').count(), 0)
  })
  assert.deepEqual(errors, [])
  assert.ok(results.every(result => result.passed), 'Regressioni amministrazione')
} finally { await browser.close() }
