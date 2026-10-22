// Collaudo di un deployment: codice/asset online, CSV sintetico intercettato solo nel browser.
// node tests/frontend-csv-online.mjs [modulo-playwright] [chrome] URL [vercel-curl scope commit-verificato]
import assert from 'node:assert/strict'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const { chromium } = await import(process.argv[2] ?? 'playwright')
const base = new URL(process.argv[4])
assert.equal(base.protocol, 'https:')
const csvPath = 'data/simulazioni/simulazioni_demo.csv'
const projectRoot = fileURLToPath(new URL('../', import.meta.url))
const csv = await readFile(resolve(projectRoot, csvPath), 'utf8')
const [header, ...lines] = csv.trim().split(/\r?\n/)
assert.equal(header, 'arduino_seconds,temperature_c,humidity_pct,pressure_hpa')
const samples = lines.map(line => {
  const fields = line.split(',')
  assert.equal(fields.length, 4)
  assert.ok(fields.every(field => /^-?\d+(?:\.\d+)?$/.test(field)))
  return fields.map(Number)
})
assert.equal(samples.length, 50)
// Date VIRTUALI della fixture: il CSV ha solo uptime. Non sono date della stazione.
const virtualStart = Date.parse('2026-10-22T00:00:00.000Z')
const rows = samples.map(([seconds, temperature_c, humidity_pct, pressure_hpa], index) => ({
  ingestion_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  temperature_c, humidity_pct, pressure_hpa,
  captured_at: new Date(virtualStart + seconds * 1000).toISOString(),
  measured_at: null,
  received_at: '2026-10-22T00:50:00.000Z',
  quality_flags: [],
}))
const output = resolve(projectRoot, 'docs/frontend-online-verification')
await mkdir(output, { recursive: true })
const results = []
const pageErrors = []
const assetFailures = []
const assets = new Set()
const check = async (name, action) => { await action(); results.push({ name, passed: true }); console.log(`OK ${name}`) }
const value = number => number.toFixed(1).replace('.', ',')
const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) })
const cliAccess = process.argv[5] === 'vercel-curl'
const scope = process.argv[6]
const sourceCommit = process.argv[7] ?? null
const run = promisify(execFile)
const remoteAssets = new Map()
async function readProtectedAsset(url) {
  if (!remoteAssets.has(url.href)) remoteAssets.set(url.href, (async () => {
    const { stdout } = await run('vercel', ['curl', `${url.pathname}${url.search}`, '--deployment', base.origin, ...(scope ? ['--scope', scope] : []), '--', '--silent', '--show-error', '--fail', '--write-out', '\n__METEOLIVELLI_STATUS__%{http_code}'], { cwd: projectRoot, encoding: 'buffer', timeout: 40000, maxBuffer: 16 * 1024 * 1024 })
    const marker = Buffer.from('\n__METEOLIVELLI_STATUS__')
    const position = stdout.lastIndexOf(marker)
    assert.ok(position >= 0)
    const status = Number(stdout.subarray(position + marker.length).toString('utf8'))
    assert.equal(status, 200)
    const contentType = url.pathname.endsWith('.js') ? 'application/javascript' : url.pathname.endsWith('.css') ? 'text/css' : url.pathname.endsWith('.woff2') ? 'font/woff2' : url.pathname.endsWith('.svg') ? 'image/svg+xml' : 'text/html'
    return { status, contentType, body: stdout.subarray(0, position) }
  })())
  return remoteAssets.get(url.href)
}
async function newContext(options = {}) {
  const context = await browser.newContext({ reducedMotion: 'reduce', ...options })
  // Credenziale temporanea in memoria, limitata all'origine verificata. Mai inviata a Supabase.
  if (cliAccess) await context.route(`${base.origin}/**`, async route => {
    assert.equal(route.request().method(), 'GET')
    await route.fulfill(await readProtectedAsset(new URL(route.request().url())))
  })
  else if (process.env.VERCEL_OIDC_TOKEN) await context.route(`${base.origin}/**`, route => route.continue({ headers: { ...route.request().headers(), 'x-vercel-trusted-oidc-idp-token': process.env.VERCEL_OIDC_TOKEN } }))
  return context
}
function watch(page) {
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('response', response => {
    const url = new URL(response.url())
    if (url.origin === base.origin && /\.(js|css|woff2)$/.test(url.pathname)) {
      assets.add(url.pathname)
      if (response.status() !== 200) assetFailures.push({ path: url.pathname, status: response.status() })
    }
  })
}
async function markDemo(page) {
  await page.evaluate(() => {
    document.querySelector('.notice p').textContent = 'COLLAUDO ONLINE · DEMO · dati sintetici dal CSV, date virtuali solo di prova. Nessuna misura reale.'
    document.querySelectorAll('h2, .metric-source').forEach(element => { element.textContent += ' · DEMO' })
  })
}
try {
  const actualContext = await newContext({ viewport: { width: 1280, height: 900 } })
  const actual = await actualContext.newPage()
  watch(actual)
  await check('deployment online: titolo, asset e API pubblica reale vuota', async () => {
    const response = await actual.goto(base.href)
    assert.equal(response.status(), 200)
    assert.equal(await actual.title(), 'MeteOlivelli — Il meteo a scuola')
    await actual.getByText('Nessuna misura disponibile', { exact: true }).waitFor({ timeout: 20000 })
    assert.equal(await actual.locator('.chart svg').count(), 0)
    assert.deepEqual(await actual.locator('.metric-value').allTextContents(), Array(3).fill('Nessun dato disponibile'))
    await actual.evaluate(() => document.fonts.ready)
    await actual.screenshot({ path: `${output}/online-empty.png`, fullPage: true, animations: 'disabled' })
  })
  await actualContext.close()
  const context = await newContext({ viewport: { width: 1280, height: 900 } })
  let newest = rows.at(-1)
  let history = rows
  let fail = false
  const mockRequests = []
  await context.route('**/functions/v1/read-measurements?*', async route => {
    assert.equal(route.request().method(), 'GET')
    const url = new URL(route.request().url())
    mockRequests.push({ view: url.searchParams.get('view'), period: url.searchParams.get('period') })
    if (fail) return route.abort('internetdisconnected')
    await route.fulfill({ json: { items: url.searchParams.get('view') === 'latest' ? [newest] : history, next_cursor: null, until: '2026-10-22T00:50:00.000Z', time_basis: 'captured_at' } })
  })
  const page = await context.newPage()
  watch(page)
  await page.clock.install()
  await check('CSV originale: ultimo campione esatto nelle tre schede', async () => {
    await page.goto(base.href)
    await page.locator('.chart svg').first().waitFor()
    assert.deepEqual(await page.locator('.metric-value').allTextContents(), ['-4,1 °C', '89,6 %', '1008,3 hPa'])
    assert.equal(await page.getByText('Freschezza non determinabile', { exact: true }).count(), 1)
  })
  await check('grafici: 50 punti per grandezza, minimi/massimi coerenti col CSV', async () => {
    for (const [index, unit] of ['°C', '%', 'hPa'].entries()) {
      const chart = page.locator('.chart').nth(index)
      assert.equal(await chart.locator('circle').count(), 50)
      assert.equal(await chart.locator('polyline').count(), 1)
      const numbers = samples.map(sample => sample[index + 1])
      assert.equal(await chart.locator('.small').textContent(), `Min ${value(Math.min(...numbers))} · max ${value(Math.max(...numbers))} ${unit}`)
      assert.equal((await chart.locator('polyline').getAttribute('points')).includes('NaN'), false)
    }
  })
  await check('cronologia: tutti i 50 campioni identici al CSV, senza salti o duplicati', async () => {
    const found = []
    for (let pagination = 0; pagination < 9; pagination++) {
      const text = await page.locator('.history-table tbody tr').evaluateAll(elements => elements.map(element => Array.from(element.querySelectorAll('td[data-label] > span:first-child')).map(cell => cell.textContent)))
      found.push(...text)
      if (pagination < 8) await page.getByRole('button', { name: 'Precedenti', exact: true }).click()
    }
    const expected = [...samples].reverse().map(sample => [`${value(sample[1])} °C`, `${value(sample[2])} %`, `${value(sample[3])} hPa`])
    assert.deepEqual(found, expected)
    assert.equal(await page.getByRole('button', { name: 'Precedenti', exact: true }).isDisabled(), true)
  })
  await check('24h/7g/30g: richiesta corretta e 50 campioni, nessuno storico artificiale aggiunto', async () => {
    for (const [label, period] of [['7 giorni', '7g'], ['30 giorni', '30g'], ['24 ore', '24h']]) {
      const before = mockRequests.length
      await page.getByRole('button', { name: label, exact: true }).click()
      await page.locator('.history-feedback').filter({ hasText: '50 campioni' }).waitFor()
      assert.ok(mockRequests.slice(before).some(request => request.view === 'history' && request.period === period))
      assert.equal(await page.locator('.chart').first().locator('circle').count(), 50)
    }
  })
  await check('online desktop/mobile: reflow 320/390/768/1280 px, screenshot DEMO', async () => {
    for (const width of [320, 390, 768, 1280]) {
      const capture = await context.newPage()
      watch(capture)
      await capture.setViewportSize({ width, height: 900 })
      await capture.goto(base.href)
      await capture.locator('.chart svg').first().waitFor()
      await capture.evaluate(() => document.fonts.ready)
      assert.equal(await capture.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true)
      await markDemo(capture)
      if (width === 390 || width === 1280) await capture.screenshot({ path: `${output}/online-csv-${width}.png`, fullPage: true, animations: 'disabled' })
      await capture.close()
    }
  })
  await check('pagina online aperta: un nuovo evento simulato compare senza reload', async () => {
    newest = { ...newest, ingestion_id: '00000000-0000-4000-8000-000000000051', temperature_c: 0, captured_at: '2026-10-22T00:50:00.000Z' }
    history = [...rows, newest]
    await page.clock.fastForward(15001)
    await page.locator('.metric-value').first().filter({ hasText: '0,0 °C' }).waitFor()
    assert.equal(await page.locator('.chart').first().locator('circle').count(), 51)
  })
  await check('rete interrotta e recupero: valori conservati con avviso, nessun falso vuoto', async () => {
    fail = true
    await page.clock.fastForward(15001)
    await page.getByRole('alert').waitFor()
    assert.match(await page.locator('.metric-value').first().textContent(), /0,0 °C/)
    fail = false
    await page.clock.fastForward(15001)
    await page.getByText('Freschezza non determinabile', { exact: true }).waitFor()
    assert.equal(await page.getByRole('alert').count(), 0)
  })
  assert.deepEqual(pageErrors, [])
  assert.deepEqual(assetFailures, [])
  assert.ok([...assets].some(path => path.endsWith('.js')))
  assert.ok([...assets].some(path => path.endsWith('.css')))
  assert.ok(assets.has('/fonts/InterVariable.woff2'))
  await writeFile(`${output}/results.json`, `${JSON.stringify({ deployment: base.origin, sourceCommit, date: '2026-10-22', csv: csvPath, csvSha256: createHash('sha256').update(csv).digest('hex'), samples: 50, lastValues: samples.at(-1).slice(1), virtualTime: 'Solo fixture browser: 2026-10-22T00:00:00Z + uptime. Nessuna data fisica dedotta.', scope: 'Codice e asset HTTPS online. GET reale vuoto; risposte positive sostituite esclusivamente nel browser di prova. Nessuna scrittura DB o DEMO pubblica.', access: cliAccess ? 'HTML, JS, CSS e font dal preview tramite vercel curl autenticato; stessi byte renderizzati nel browser di prova' : process.env.VERCEL_OIDC_TOKEN ? 'Header OIDC limitato all origine del preview' : 'HTTPS diretto', browser: await browser.version(), results, assets: [...assets].sort(), pageErrors, assetFailures }, null, 2)}\n`)
} finally { await browser.close() }
