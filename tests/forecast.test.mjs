import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildForecast } from '../src/forecast.ts'
import { createForecastFeed } from '../src/forecast-feed.ts'
import { parsePage, readHistory } from '../src/weather.ts'

// Fixture interamente sintetiche che esercitano il contratto delle future osservazioni reali.
// Non sono caricate nel database e non attestano attendibilità meteorologica.
const start = Date.parse('2026-10-01T00:00:00Z')
const hour = 3600000
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
  const rows = series(241, 3 * hour, i => 15 + 4 * Math.sin((i % 8) * Math.PI / 4)).map(row => ({
    ...row, acquisition_kind: 'synthetic', measured_at: null,
  }))
  const run = buildForecast(rows, nowOf(rows))
  assert.equal(run.dataKind, 'synthetic')
  assert.ok(run.inputCount >= 240)
  assert.deepEqual(run.horizons.map(item => item.hours), [3, 6, 24])
  assert.ok(run.horizons.every(h => h.estimates.every(e => e.value !== null)))
  assert.ok(run.horizons.every(h => h.estimates.every(e => e.target && e.origin)))
})
test('previsioni fisiche: date PC e provenienza ignota non alimentano il modello', () => {
  for (const transform of [row => ({ ...row, measured_at: null }), row => ({ ...row, acquisition_kind: undefined })]) {
    const rows = series(10, 6 * hour).map(transform)
    const run = buildForecast(rows, nowOf(rows))
    assert.equal(run.inputCount, 0)
    assert.equal(run.dataKind, 'none')
    assert.ok(run.horizons.every(h => h.estimates.every(e => e.value === null)))
  }
})
test('previsioni: ciclo giornaliero scelto sui dati di selezione e verificato separatamente', () => {
  const rows = series()
  const run = buildForecast(rows, nowOf(rows))
  const temperature = get(run)
  assert.equal(temperature.method, 'daily')
  assert.ok(temperature.mae < temperature.baselineMae)
  assert.ok(temperature.cases >= 12 && temperature.selectionCases >= 12)
  assert.equal(temperature.lastObservationId, rows.at(-1).ingestion_id)
  assert.equal(run.version, 'station-statistical-v2')
  assert.equal(Date.parse(temperature.target) - Date.parse(temperature.origin), hour / 2)
  assert.ok(get(run, 2).value !== null)
  assert.equal(get(run, 2).target, new Date(Date.parse(rows.at(-1).measured_at) + 24 * hour).toISOString())
})
test('previsioni: trend smorzato quando migliora; persistenza per grandezze stabili', () => {
  const rows = series(480, hour / 2, i => 10 + i * 0.002)
  const run = buildForecast(rows, nowOf(rows))
  assert.equal(get(run).method, 'trend')
  assert.ok(get(run).value > rows.at(-1).temperature_c)
  assert.equal(get(run, 0, 1).method, 'persistence')
  assert.equal(get(run, 0, 1).mae, 0)
})
test('previsioni: dati insufficienti e cadenza oraria non diventano verità a mezz’ora', () => {
  assert.equal(get(buildForecast(series(10), nowOf(series(10)))).value, null)
  const rows = series(720, hour)
  assert.match(get(buildForecast(rows, nowOf(rows))).reason, /cadenza/)
  assert.notEqual(get(buildForecast(rows, nowOf(rows)), 1).value, null)
})
test('previsioni: scadenza, campi sospetti e assenti separati senza recuperare un vecchio valore', () => {
  const rows = series()
  assert.ok(buildForecast(rows, nowOf(rows) + 2 * hour).horizons.every(h => h.estimates.every(e => e.value === null)))
  rows.at(-1).temperature_c = null
  rows.at(-1).quality_flags = [{ field: 'humidity_pct', code: 'outside_configured_range', label: 'probabile errato', reason: 'Fixture sintetica' }]
  const run = buildForecast(rows, nowOf(rows))
  assert.equal(get(run).value, null)
  assert.equal(get(run, 0, 1).value, null)
  assert.equal(get(run, 0, 2).value, 1015)
})
test('previsioni: duplicati temporali ambigui, futuri e caricamenti successivi non diventano training', () => {
  const rows = series()
  const duplicate = { ...rows[100], ingestion_id: '00000000-0000-4000-8000-999999999999' }
  const future = { ...rows[0], measured_at: new Date(nowOf(rows) + hour).toISOString() }
  const late = { ...rows[1], received_at: new Date(nowOf(rows) + hour).toISOString() }
  const run = buildForecast([...rows, duplicate, future, late], nowOf(rows))
  // 100 è ambiguo; il duplicato tardivo non entra nella serie.
  assert.equal(run.inputCount, rows.length - 1)
  assert.equal(get(run).origin, rows.at(-1).measured_at)
  assert.throws(() => buildForecast(rows, NaN), /Orario/)
})
test('previsioni: nessun confronto a target mancante e nessuna interpolazione dei gap', () => {
  const rows = series(120, 6 * hour)
  const run = buildForecast(rows, nowOf(rows))
  assert.equal(get(run).value, null)
  assert.equal(get(run, 1).value, null)
})
test('previsioni: +24 ore indica durata fisica anche attraversando il cambio ora', () => {
  const rows = series().map(row => ({ ...row,
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
    if (!latest) { histories++; assert.equal(params.get('basis'), 'measured_at') }
    return { items: latest ? [rows.at(-1)] : rows, until: new Date(nowOf(rows)).toISOString(), next_cursor: null, time_basis: latest ? 'captured_at' : 'measured_at' }
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

test('feed previsioni: i campioni synthetic richiedono lo storico captured_at', async () => {
  const rows = series(241, 3 * hour).map(row => ({ ...row, acquisition_kind: 'synthetic', measured_at: null }))
  const bases = []
  const feed = createForecastFeed(() => {}, async (input, now) => buildForecast(input, now), async params => {
    const latest = params.get('view') === 'latest'
    if (!latest) bases.push(params.get('basis'))
    return { items: latest ? [rows.at(-1)] : rows, next_cursor: null, until: new Date(nowOf(rows)).toISOString(), time_basis: latest ? 'captured_at' : 'captured_at' }
  })
  await feed.refresh()
  assert.deepEqual(bases, ['captured_at'])
  feed.stop()
})


test('previsioni: un metodo che non conferma il miglioramento nel periodo separato viene ritirato', () => {
  const rows = series(1440, hour / 2, i => 10 + Math.min(i, 720) * 0.01)
  const estimate = get(buildForecast(rows, nowOf(rows)))
  assert.equal(estimate.value, null)
  assert.match(estimate.reason, /non conferma/)
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
    return { items: latest ? [rows.at(-1)] : rows, next_cursor: null, until: new Date(nowOf(rows)).toISOString(), time_basis: latest ? 'captured_at' : 'measured_at' }
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
    return { items: latest ? [rows.at(-1)] : rows, next_cursor: null, until: new Date(now).toISOString(), time_basis: latest ? 'captured_at' : 'measured_at' }
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
