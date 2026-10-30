import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildForecast } from '../src/forecast.ts'
import { createForecastFeed } from '../src/forecast-feed.ts'
import { parsePage, readHistory } from '../src/weather.ts'

// Fixture interamente sintetiche che esercitano il contratto delle future osservazioni reali.
// Non sono caricate nel database e non attestano attendibilità meteorologica.
const start = Date.parse('2026-10-01T00:00:00Z')
const hour = 3600000
const halfHour = 30 * 60000
function series(count = 1440, step = hour / 2, value = i => 18 + 5 * Math.sin(i * Math.PI / 24)) {
  return Array.from({ length: count }, (_, i) => ({
    acquisition_kind: 'live', ingestion_id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    captured_at: new Date(start + i * step + 500).toISOString(),
    measured_at: new Date(start + i * step).toISOString(), received_at: new Date(start + i * step + 1000).toISOString(),
    temperature_c: value(i), humidity_pct: 65, pressure_hpa: 1015, quality_flags: [],
  }))
}
const nowOf = rows => Date.parse(rows.at(-1).received_at) + 1000
const get = (run, horizon = 0, metric = 0) => run.horizons[horizon].estimates[metric]

test('previsioni: la simulazione usa captured_at, resta distinta e propone orizzonti compatibili con la cadenza', () => {
  const scenarioStart = Date.parse('2026-09-24T12:08:07Z')
  const receivedAt = '2026-10-24T12:09:00.000Z'
  const rows = Array.from({ length: 241 }, (_, i) => ({
    acquisition_kind: 'synthetic', ingestion_id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`,
    captured_at: new Date(scenarioStart + i * 3 * hour).toISOString(), measured_at: null, received_at: receivedAt,
    temperature_c: 15 + 4 * Math.sin((i % 8) * Math.PI / 4), humidity_pct: 65, pressure_hpa: 1015, quality_flags: [],
  }))
  const run = buildForecast(rows, Date.parse('2026-10-24T12:10:00Z'))
  assert.equal(run.dataKind, 'synthetic')
  assert.ok(run.inputCount >= 240)
  assert.deepEqual(run.horizons.map(item => item.hours), [1, 6, 24])
  assert.match(run.horizons[0].label, /\+1 ora/)
  assert.match(run.horizons[1].label, /\+6 ore/)
  assert.match(run.horizons[2].label, /Giornata.*\+24 ore/)
  assert.match(run.horizons[0].estimates[0].reason, /miglioramento rispetto all’ultimo valore|cadenza/)
  assert.deepEqual(run.horizons[1].estimates[0].value, 19)
  assert.equal(run.horizons[2].estimates[0].value, null)
  assert.match(run.horizons[2].estimates[0].reason, /miglioramento rispetto all’ultimo valore/)
  assert.ok(run.horizons.every(h => h.estimates.slice(1).every(e => e.value === null && (/miglioramento/.test(e.reason) || /cadenza/.test(e.reason)))))
  assert.ok(run.horizons.slice(0, 2).every(h => (h.estimates[0].target ?? h.estimates[0].reason) && (h.estimates[0].origin ?? h.estimates[0].reason)))
})
test('previsioni fisiche: usa captured_at senza richiedere measured_at o usare uptime', () => {
  const rows = series().map(row => ({ ...row, measured_at: null }))
  const run = buildForecast(rows, nowOf(rows))
  assert.equal(run.inputCount, rows.length)
  assert.equal(run.dataKind, 'physical')
  assert.equal(get(run).origin, rows.at(-1).captured_at)
  const withoutCapture = rows.map(row => ({ ...row, captured_at: null }))
  const unavailable = buildForecast(withoutCapture, nowOf(rows))
  assert.equal(unavailable.inputCount, 0)
  assert.equal(unavailable.dataKind, 'none')
  const unknownSource = buildForecast(rows.map(row => ({ ...row, acquisition_kind: undefined })), nowOf(rows))
  assert.equal(unknownSource.inputCount, 0)
})
test('previsioni: ciclo giornaliero scelto sui dati di selezione e verificato separatamente', () => {
  const rows = series()
  const run = buildForecast(rows, nowOf(rows))
  const temperature = get(run)
  assert.equal(temperature.method, 'daily')
  assert.ok(temperature.mae < temperature.baselineMae)
  assert.ok(temperature.cases >= 12 && temperature.selectionCases >= 12)
  assert.equal(temperature.lastObservationId, rows.at(-1).ingestion_id)
  assert.equal(run.version, 'station-statistical-v4')
  assert.equal(Date.parse(temperature.target) - Date.parse(temperature.origin), hour)
  assert.equal(get(run, 2).value, null)
  assert.match(get(run, 2).reason, /miglioramento rispetto all’ultimo valore/)
})
test('previsioni: la stima finale usa la stessa tolleranza stagionale del backtest', () => {
  const rows = series(2880, 10 * 60000, i => 18 + 5 * Math.sin(i * Math.PI / 72))
  const seasonal = rows.length - 1 - 23 * 6
  for (const key of ['captured_at', 'measured_at', 'received_at']) {
    rows[seasonal][key] = new Date(Date.parse(rows[seasonal][key]) + 4 * 60000).toISOString()
  }
  const estimate = get(buildForecast(rows, nowOf(rows)))
  assert.equal(estimate.value, null)
  assert.match(estimate.reason, /ultime misure non consentono una stima valida/)
})
test('previsioni: baseline persistente non viene spacciata per previsione', () => {
  const rows = series(480, hour / 2, () => 10)
  const run = buildForecast(rows, nowOf(rows))
  assert.equal(run.horizons[0].estimates[0].value, null)
  assert.match(run.horizons[0].estimates[1].reason, /miglioramento rispetto all’ultimo valore/)
})
test('previsioni: tendenza crescente e decrescente seguono il segno della regressione', () => {
  for (const direction of [-1, 1]) {
    const rows = series(480, halfHour, i => 20 + direction * i * 0.02)
    const estimate = get(buildForecast(rows, nowOf(rows)))
    assert.equal(estimate.method, 'trend')
    assert.equal(Math.sign(estimate.value - rows.at(-1).temperature_c), direction)
    assert.ok(estimate.mae < estimate.baselineMae)
  }
})
test('previsioni: la cadenza non può superare l’orizzonte richiesto', () => {
  const hourlyRows = series(720, hour)
  const hourlyRun = buildForecast(hourlyRows, nowOf(hourlyRows))
  assert.notEqual(hourlyRun.horizons[0].estimates[0].value, null)
  assert.notEqual(hourlyRun.horizons[1].estimates[0].value, null)
  assert.equal(hourlyRun.horizons[1].hours, 6)
  assert.equal(Date.parse(hourlyRun.horizons[1].estimates[0].target) - Date.parse(hourlyRun.horizons[1].estimates[0].origin), 6 * hour)
  const halfHourlyRows = series(720, halfHour)
  const halfHourlyRun = buildForecast(halfHourlyRows, nowOf(halfHourlyRows))
  assert.notEqual(halfHourlyRun.horizons[0].estimates[0].value, null)
  assert.equal(Date.parse(halfHourlyRun.horizons[0].estimates[0].target) - Date.parse(halfHourlyRun.horizons[0].estimates[0].origin), hour)
  const sparseRows = series(400, 2 * hour)
  const sparseRun = buildForecast(sparseRows, nowOf(sparseRows))
  const firstCadenceEstimate = sparseRun.horizons[0].estimates[0]
  assert.equal(firstCadenceEstimate.value, null)
  assert.match(firstCadenceEstimate.reason, /cadenza/)
})
test('previsioni: scadenza, campi sospetti e assenti separati senza recuperare un vecchio valore', () => {
  const rows = series()
  assert.ok(buildForecast(rows, nowOf(rows) + 2 * hour).horizons.every(h => h.estimates.every(e => e.value === null)))
  rows.at(-1).temperature_c = null
  rows.at(-1).quality_flags = [{ field: 'humidity_pct', code: 'outside_configured_range', label: 'probabile errato', reason: 'Fixture sintetica' }]
  const run = buildForecast(rows, nowOf(rows))
  assert.equal(get(run).value, null)
  assert.equal(get(run, 0, 1).value, null)
  assert.equal(get(run, 0, 2).value, null)
})
test('previsioni: duplicati temporali ambigui, futuri e caricamenti successivi non diventano training', () => {
  const rows = series()
  const duplicate = { ...rows[100], ingestion_id: '00000000-0000-4000-8000-999999999999' }
  const future = { ...rows[0], captured_at: new Date(nowOf(rows) + hour).toISOString() }
  const late = { ...rows[1], received_at: new Date(nowOf(rows) + hour).toISOString() }
  const run = buildForecast([...rows, duplicate, future, late], nowOf(rows))
  // 100 è ambiguo; il duplicato tardivo non entra nella serie.
  assert.equal(run.inputCount, rows.length - 1)
  assert.equal(get(run).origin, rows.at(-1).captured_at)
  assert.throws(() => buildForecast(rows, NaN), /Orario/)
})
test('previsioni: nessun confronto a target mancante e nessuna interpolazione dei gap', () => {
  const rows = series(120, 6 * hour)
  const run = buildForecast(rows, nowOf(rows))
  assert.equal(get(run).value, null)
  assert.equal(get(run, 1).value, null)
})
test('previsioni: +24 ore indica durata fisica anche attraversando il cambio ora', () => {
  const rows = series(1440, hour / 2, i => 18 + 5 * Math.sin(i * Math.PI / 24) + i * 0.01).map(row => ({ ...row,
    captured_at: new Date(Date.parse(row.captured_at) - 6 * 24 * hour).toISOString(),
    measured_at: new Date(Date.parse(row.measured_at) - 6 * 24 * hour).toISOString(),
    received_at: new Date(Date.parse(row.received_at) - 6 * 24 * hour).toISOString(),
  }))
  const result = get(buildForecast(rows, nowOf(rows)), 2)
  assert.equal(Date.parse(result.target) - Date.parse(result.origin), 24 * hour)
})
test('lettura fisica: measured_at ammette storico senza captured_at e rifiuta la base sbagliata', async () => {
  const rows = series(2).map(row => ({ ...row, captured_at: null, acquisition_kind: 'historical' }))
  const page = { items: rows.reverse(), until: new Date(nowOf(rows)).toISOString(), next_cursor: null, time_basis: 'measured_at' }
  assert.equal(parsePage(page).time_basis, 'measured_at')
  const result = await readHistory('30g', new AbortController().signal, async params => {
    assert.equal(params.get('basis'), 'measured_at')
    return page
  }, 'measured_at')
  assert.ok(Date.parse(result[0].measured_at) < Date.parse(result[1].measured_at))
  await assert.rejects(() => readHistory('30g', new AbortController().signal, async () => ({ ...page, time_basis: 'captured_at' }), 'measured_at'), /Base temporale/)
})
test('feed previsioni: lettura dedicata, cache a input invariati, recupero e stop', async () => {
  const rows = series(150)
  let published, computations = 0, histories = 0, fail = false
  const reader = async params => {
    if (fail) throw new Error('Errore sintetico')
    const latest = params.get('view') === 'latest'
    if (!latest) { histories++; assert.equal(params.get('basis'), 'captured_at') }
    return { items: latest ? [rows.at(-1)] : rows, until: new Date(nowOf(rows)).toISOString(), next_cursor: null, time_basis: 'captured_at' }
  }
  const feed = createForecastFeed(state => { published = state }, async (input, now) => { computations++; return buildForecast(input, now) }, reader)
  await feed.refresh()
  assert.equal(published.error, false)
  await feed.refresh()
  assert.equal(computations, 1)
  assert.equal(histories, 1)
  fail = true
  await feed.refresh()
  assert.equal(published.error, true)
  fail = false
  await feed.refresh()
  assert.equal(published.error, false)
  assert.equal(computations, 1)
  rows.at(-1).temperature_c += 0.1
  await feed.refresh()
  assert.equal(computations, 2)
  const before = published
  feed.stop()
  await feed.refresh()
  assert.equal(published, before)
})

test('feed previsioni: legge captured_at e non usa campioni synthetic', async () => {
  const rows = series(241, 3 * hour).map(row => ({ ...row, measured_at: null }))
  const synthetic = { ...rows.at(-1), acquisition_kind: 'synthetic', ingestion_id: '00000000-0000-4000-8000-999999999999' }
  const bases = []
  let computed
  const feed = createForecastFeed(() => {}, async (input, now) => { computed = input; return buildForecast(input, now) }, async params => {
    const latest = params.get('view') === 'latest'
    if (!latest) bases.push(params.get('basis'))
    return { items: latest ? [rows.at(-1)] : [synthetic, ...rows], next_cursor: null, until: new Date(nowOf(rows)).toISOString(), time_basis: 'captured_at' }
  })
  await feed.refresh()
  assert.deepEqual(bases, ['captured_at'])
  assert.equal(computed.length, rows.length)
  assert.ok(computed.every(row => row.acquisition_kind === 'live' && row.measured_at === null))
  feed.stop()
})


test('previsioni: un metodo che non conferma il miglioramento nel periodo separato viene ritirato', () => {
  const rows = series(1440, hour / 2, i => 10 + Math.min(i, 720) * 0.01)
  const estimate = get(buildForecast(rows, nowOf(rows)))
  assert.equal(estimate.value, null)
  assert.match(estimate.reason, /non conferma il miglioramento sui dati di verifica/)
})
test('previsioni: archivio caricato in ritardo non consente backtest con dati non ancora ricevuti', () => {
  const rows = series()
  const received = rows.at(-1).received_at
  const lateRows = rows.map(row => ({ ...row, received_at: received }))
  assert.equal(get(buildForecast(lateRows, nowOf(lateRows))).value, null)
})

test('feed previsioni: richieste sovrapposte evitate e nessuna pubblicazione dopo stop durante il calcolo', async () => {
  const rows = series(10)
  let published = 0, calls = 0, release
  const pending = new Promise(resolve => { release = resolve })
  const feed = createForecastFeed(() => { published++ }, async (input, now) => { await pending; return buildForecast(input, now) }, async params => {
    calls++
    const latest = params.get('view') === 'latest'
    return { items: latest ? [rows.at(-1)] : rows, next_cursor: null, until: new Date(nowOf(rows)).toISOString(), time_basis: 'captured_at' }
  })
  const refresh = feed.refresh()
  await new Promise(resolve => setImmediate(resolve))
  await feed.refresh()
  assert.equal(calls, 2)
  feed.stop()
  release()
  await refresh
  assert.equal(published, 0)
})
test('feed previsioni: recupera modifiche storiche ogni cinque minuti senza ricalcolare input uguali', async () => {
  const rows = series(10)
  let now = nowOf(rows), histories = 0, computations = 0
  const feed = createForecastFeed(() => {}, async (input, time) => { computations++; return buildForecast(input, time) }, async params => {
    const latest = params.get('view') === 'latest'
    if (!latest) histories++
    return { items: latest ? [rows.at(-1)] : rows, next_cursor: null, until: new Date(now).toISOString(), time_basis: 'captured_at' }
  })
  await feed.refresh()
  now += 5 * 60000
  await feed.refresh()
  assert.equal(histories, 2)
  assert.equal(computations, 1)
  rows[1].temperature_c += 1
  now += 5 * 60000
  await feed.refresh()
  assert.equal(computations, 2)
  feed.stop()
})
