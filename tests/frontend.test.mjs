import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePage, readPage, readHistory, chartSegments, getFreshness, formatTime, formatValue, trimHistory } from '../src/weather.ts'
import { createWeatherFeed } from '../src/weather-feed.ts'

// Tutti i valori di questa suite sono sintetici; nessuna rete, ambiente o credenziale.
const row = (number = 1, overrides = {}) => ({
  ingestion_id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
  temperature_c: 19.4, humidity_pct: 64, pressure_hpa: 1015.8,
  captured_at: `2026-10-22T${String(number).padStart(2, '0')}:00:00.000Z`,
  measured_at: null, received_at: '2026-10-22T12:00:00.000Z', quality_flags: [], ...overrides,
})
const page = (items = [], next_cursor = null) => ({ items, next_cursor, until: '2026-10-22T12:00:00.000Z', time_basis: 'captured_at' })
const signal = () => new AbortController().signal

test('contratto: archivio vuoto, null e UTC PostgreSQL sono validi', () => {
  assert.deepEqual(parsePage(page()).items, [])
  assert.equal(parsePage(page([row(1, { temperature_c: null, received_at: '2026-10-22T12:00:00+00:00' })])).items[0].temperature_c, null)
})
test('contratto: risposta malformata non diventa archivio vuoto', () => {
  for (const invalid of [{}, { ...page(), time_basis: 'received_at' }, page([row(1, { temperature_c: '19' })]), page([row(1, { humidity_pct: Infinity })]), page([row(1, { quality_flags: [{ field: 'unknown' }] })]), page([row(1, { received_at: 'ieri' })]), page([row(1, { received_at: '2026-02-30T00:00:00.000Z' })])]) {
    assert.throws(() => parsePage(invalid))
  }
})
test('contratto: campi interni non propagati', () => {
  assert.equal('raw_payload' in parsePage(page([row(1, { raw_payload: 'sintetico' })])).items[0], false)
})
test('GET pubblico senza credenziali e controllo HTTP', async () => {
  await readPage(new URLSearchParams({ view: 'latest' }), signal(), async (url, options) => {
    assert.match(url, /read-measurements\?view=latest$/)
    assert.equal(options.credentials, 'omit')
    assert.equal(options.headers.Authorization, undefined)
    return Response.json(page([row()]))
  })
  await assert.rejects(() => readPage(new URLSearchParams(), signal(), async () => new Response('errore interno sintetico', { status: 503 })), /temporaneamente/)
})
test('storico: tutte le pagine, deduplica ID e ordinamento temporale', async () => {
  let calls = 0
  const result = await readHistory('30g', signal(), async params => {
    calls++
    assert.equal(params.get('limit'), '500')
    assert.equal(params.get('period'), '30g')
    if (calls === 1) return page([row(2), row(1)], 'cursore')
    assert.equal(params.get('cursor'), 'cursore')
    return page([row(2), row(3)])
  })
  assert.deepEqual(result.map(item => item.ingestion_id), [row(1), row(2), row(3)].map(item => item.ingestion_id))
})
test('storico: cursore ripetuto rifiutato senza loop', async () => {
  await assert.rejects(() => readHistory('7g', signal(), async () => page([row()], 'ripetuto')), /ripetuto/)
})
test('storico: finestra incoerente o tempi ignoti rifiutati', async () => {
  let count = 0
  await assert.rejects(() => readHistory('24h', signal(), async () => ++count === 1 ? page([row()], 'next') : { ...page(), until: '2026-10-22T13:00:00.000Z' }), /incoerente/)
  await assert.rejects(() => readHistory('24h', signal(), async () => page([row(1, { captured_at: null })])), /non datata/)
})
test('grafico: null e sospetti interrompono solo il campo interessato', () => {
  const records = [row(1), row(2, { temperature_c: null }), row(3), row(4, { quality_flags: [{ field: 'temperature_c', code: 'outside_configured_range', label: 'probabile errato', reason: 'Fixture' }] }), row(5)]
  assert.deepEqual(chartSegments(records, 'temperature_c').map(segment => segment.length), [1, 1, 1])
  assert.equal(chartSegments(records, 'humidity_pct')[0].length, 5)
  assert.equal(records[3].temperature_c, 19.4)
})
test('finestra mobile: un campione scaduto scompare anche senza nuovi inserimenti', () => {
  const record = row(1)
  const boundary = '2026-10-23T01:00:00.000Z'
  assert.equal(trimHistory([record], '24h', boundary).length, 1)
  assert.equal(trimHistory([record], '24h', '2026-10-23T01:00:00.001Z').length, 0)
  assert.equal(trimHistory([record], '7g', '2026-10-23T01:00:00.001Z').length, 1)
})
test('freschezza: prima, al limite, oltre atteso +20 minuti', () => {
  const record = row(1, { measured_at: '2026-10-22T10:00:00.000Z' })
  const boundary = Date.parse('2026-10-22T11:20:00.000Z')
  assert.equal(getFreshness(record, boundary - 1, 3600000), 'current')
  assert.equal(getFreshness(record, boundary, 3600000), 'current')
  assert.equal(getFreshness(record, boundary + 1, 3600000), 'delayed')
})
test('freschezza: ricezione recente non ringiovanisce storico; ora/cadenza ignote', () => {
  const now = Date.parse('2026-10-22T12:00:00.000Z')
  assert.equal(getFreshness(row(1, { measured_at: '2026-10-21T10:00:00.000Z' }), now, 3600000), 'delayed')
  assert.equal(getFreshness(row(), now, 3600000), 'unknown')
  assert.equal(getFreshness(row(1, { measured_at: '2026-10-22T11:00:00.000Z' }), now, null), 'unknown')
  assert.equal(getFreshness(null, now, null), 'empty')
})
test('formattazione: zero valido, null esplicito e fuso Europe/Rome anche al DST', () => {
  assert.equal(formatValue(0), '0,0')
  assert.equal(formatValue(null), 'Dato assente')
  assert.equal(formatTime(null), 'Orario sconosciuto')
  assert.equal(formatTime('2026-10-25T00:30:00.000Z', true), '02:30')
  assert.equal(formatTime('2026-10-25T01:30:00.000Z', true), '02:30')
})
test('polling: storico iniziale, nessun ricaricamento se ultima invariata, nuovo campione senza reload', async () => {
  let latest = row(1)
  let historyCalls = 0
  let published
  const feed = createWeatherFeed('24h', state => { published = state }, async params => {
    if (params.get('view') === 'latest') return page([latest])
    historyCalls++
    return page([latest])
  })
  await feed.refresh()
  await feed.refresh()
  assert.equal(historyCalls, 1)
  latest = row(2)
  await feed.refresh()
  assert.equal(historyCalls, 2)
  assert.equal(published.latest.ingestion_id, latest.ingestion_id)
  assert.equal(published.history.length, 1)
  feed.stop()
})
test('polling: errore conserva dati e recupero ricarica storico senza duplicati', async () => {
  let fail = false
  let published
  const feed = createWeatherFeed('24h', state => { published = state }, async () => {
    if (fail) throw new Error('Offline sintetico')
    return page([row()])
  })
  await feed.refresh()
  fail = true
  await feed.refresh()
  assert.equal(published.latestError, true)
  assert.equal(published.latest.ingestion_id, row().ingestion_id)
  fail = false
  await feed.refresh()
  assert.equal(published.latestError, false)
  assert.equal(published.history.length, 1)
  feed.stop()
})
test('polling: errori indipendenti di storico e ultima misura', async () => {
  let published
  let historyFail = true
  const feed = createWeatherFeed('7g', state => { published = state }, async params => {
    if (params.get('view') === 'history' && historyFail) throw new Error('Fixture')
    return page([row()])
  })
  await feed.refresh()
  assert.equal(published.historyError, true)
  assert.equal(published.latestError, false)
  historyFail = false
  await feed.refresh()
  assert.equal(published.historyError, false)
  feed.stop()
})
test('polling: richieste sovrapposte evitate; nessun aggiornamento dopo stop', async () => {
  let resolve
  let calls = 0
  let updates = 0
  const pending = new Promise(done => { resolve = done })
  const feed = createWeatherFeed('24h', () => { updates++ }, async () => { calls++; await pending; return page() })
  const first = feed.refresh()
  await feed.refresh()
  assert.equal(calls, 2)
  feed.stop()
  resolve()
  await first
  assert.equal(updates, 0)
})
