import { chartTimeline, prepareChart } from '../src/chart.ts'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parsePage, readPage, readHistory, readAllHistory, chartSegments, getFreshness, formatTime, formatValue, trimHistory, groupHistoryByLocalDay } from '../src/weather.ts'
import { createWeatherFeed } from '../src/weather-feed.ts'
import { readAnalyticsConsent, saveAnalyticsConsent } from '../src/analytics.ts'
import { formatReportTime, formatReportValue, reportFilename } from '../src/pdf-export.ts'
import { createPdfBlob } from '../src/pdf-runtime.ts'
import { buildPdfChart } from '../src/pdf-chart.ts'
import { buildGraphsDocument } from '../src/pdf-graphs-document.ts'
import { readFreshChartData } from '../src/pdf-chart-data.ts'
import { buildHistoryDocument } from '../src/pdf-history-document.ts'
import { downloadPdfBlob } from '../src/pdf-download.ts'
import { createFreshHistoryPdf } from '../src/pdf-history-export.ts'

// Tutti i valori di questa suite sono sintetici; nessuna rete, ambiente o credenziale.
const row = (number = 1, overrides = {}) => ({
  ingestion_id: `00000000-0000-4000-8000-${String(number).padStart(12, '0')}`,
  temperature_c: 19.4, humidity_pct: 64, pressure_hpa: 1015.8,
  captured_at: `2026-10-22T${String(number).padStart(2, '0')}:00:00.000Z`,
  measured_at: null, received_at: '2026-10-22T12:00:00.000Z', quality_flags: [], ...overrides,
})
const page = (items = [], next_cursor = null) => ({ items, next_cursor, until: '2026-10-22T12:00:00.000Z', time_basis: 'captured_at' })
const signal = () => new AbortController().signal

test('Prova misure: fixture sintetica, completa per 30 giorni e a intervalli CEST di sei ore', () => {
  const contents = readFileSync(new URL('./fixtures/Prova misure.csv', import.meta.url), 'utf8').trimEnd()
  const lines = contents.split('\n')
  assert.equal(lines[0], 'ora;temperatura;umidità;pressione')
  assert.equal(lines.length, 122)
  const rows = lines.slice(1).map(line => line.split(';'))
  assert.ok(rows.every(row => row.length === 4))
  const timestamps = rows.map(([time]) => Date.parse(time))
  assert.equal(timestamps.at(-1) - timestamps[0], 30 * 24 * 60 * 60 * 1000)
  assert.ok(timestamps.every(value => Number.isFinite(value)))
  assert.ok(timestamps.every((value, index) => index === 0 || value - timestamps[index - 1] === 6 * 60 * 60 * 1000))
  assert.ok(rows.every(([time, temperature, humidity, pressure]) =>
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+02:00$/.test(time) &&
    [temperature, humidity, pressure].every(value => /^-?\d+,\d$/.test(value))))
  const readme = readFileSync(new URL('./fixtures/README.md', import.meta.url), 'utf8')
  assert.match(readme, /non\s+sono osservazioni della stazione/)
})

test('pagina Informazioni: ogni voce dell’indice porta a una sezione presente', () => {
  const page = readFileSync(new URL('../src/pages/InfoPage.tsx', import.meta.url), 'utf8')
  const ids = new Set([...page.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]))
  const links = [...page.matchAll(/<a href="#([^"]+)"/g)].map((match) => match[1])
  assert.ok(links.length >= 5)
  assert.ok(links.every((id) => ids.has(id)), `Destinazioni dell’indice non trovate: ${links.filter((id) => !ids.has(id)).join(', ')}`)
  assert.match(page, /aria-label="In questa pagina"/)
  assert.match(page, /aria-label="In breve"/)
})

test('logo scolastico in testata apre il sito ufficiale in tutte le pagine', () => {
  const pages = ['../src/App.tsx', '../src/pages/InfoPage.tsx', '../src/pages/PrivacyPage.tsx', '../src/pages/QuizPage.tsx']
  for (const path of pages) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8')
    const header = source.match(/<header className="site-header">([\s\S]*?)<\/header>/)?.[1]
    assert.ok(header, `Intestazione non trovata in ${path}`)
    assert.match(header, /<SchoolSiteLink className="school-logo"><SchoolLogo \/><\/SchoolSiteLink>/)
    assert.match(source, /<SiteFooter \/>/)
  }
})

test('link esterno della scuola annuncia la nuova scheda e usa la URL centrale', () => {
  const link = readFileSync(new URL('../src/components/SchoolSiteLink.tsx', import.meta.url), 'utf8')
  assert.match(link, /href=\{SCHOOL_WEBSITE_URL\}/)
  assert.match(link, /target="_blank"/)
  assert.match(link, /rel="noopener noreferrer"/)
  assert.match(link, /aria-label="Sito ufficiale del Liceo Teresio Olivelli, si apre in una nuova scheda"/)
})

test('footer completo e copia pubblica della licenza restano coerenti', () => {
  const footer = readFileSync(new URL('../src/components/SiteFooter.tsx', import.meta.url), 'utf8')
  for (const text of ['Pietro Giudici', 'Nicholas Borin', 'Liceo Teresio Olivelli di Pavia', 'Visita il sito ufficiale', 'href="/LICENSE"']) {
    assert.ok(footer.includes(text), `Informazione assente nel footer: ${text}`)
  }
  const license = readFileSync(new URL('../LICENSE', import.meta.url), 'utf8')
  const publicLicense = readFileSync(new URL('../public/LICENSE', import.meta.url), 'utf8')
  assert.match(license, /Copyright \(c\) 2026 Pietro Giudici, Nicholas Borin, and Liceo Teresio Olivelli di Pavia/)
  assert.equal(publicLicense, license)
})

test('PDF: formatta tempi in Europe/Rome, null espliciti e nomi file datati', () => {
  assert.equal(formatReportTime('2026-10-25T00:30:00.000Z'), '25/10/2026, 02:30 CEST')
  assert.equal(formatReportTime('2026-10-25T01:30:00.000Z'), '25/10/2026, 02:30 CET')
  assert.equal(formatReportTime(null), 'Orario sconosciuto')
  assert.equal(formatReportTime('data non valida'), 'Orario sconosciuto')
  assert.equal(formatReportValue(null, '°C'), 'Dato assente')
  assert.equal(formatReportValue(0, '°C'), '0,0 °C')
  assert.equal(reportFilename('grafici', new Date('2026-10-23T12:00:00.000Z')), 'MeteOlivelli-grafici-2026-10-23.pdf')
  assert.equal(reportFilename('cronologia', new Date('2026-10-22T23:30:00.000Z')), 'MeteOlivelli-cronologia-2026-10-23.pdf')
  assert.equal(reportFilename('grafici', new Date('2026-10-23T22:30:00.000Z')), 'MeteOlivelli-grafici-2026-10-24.pdf')
  assert.throws(() => reportFilename('cronologia', new Date('invalid')))
})

test('PDF: il runtime lazy genera un blob valido con font e testo italiano', async () => {
  const blob = await createPdfBlob({ content: [{ text: 'MeteOlivelli · temperatura, umidità e pressione' }] })
  assert.equal(blob.type, 'application/pdf')
  assert.ok(blob.size > 500)
  const bytes = new Uint8Array(await blob.arrayBuffer())
  const start = new TextDecoder().decode(bytes.subarray(0, 8))
  const end = new TextDecoder().decode(bytes.subarray(bytes.length - 16))
  assert.match(start, /^%PDF-/)
  assert.match(end, /%%EOF/)
})

test('PDF grafico: usa le serie e le finestre della UI senza interpolare i vuoti', () => {
  const until = '2026-10-22T12:00:00.000Z'
  const rows = [row(1), row(2), row(3, { temperature_c: null }), row(4), row(5)]
  const chart = buildPdfChart(rows, 'temperature_c', '24h', until)
  assert.equal(chart.pointCount, 4)
  assert.equal(chart.sampleCount, 4)
  assert.match(chart.svg, /Temperatura · °C · 24 ore/)
  assert.equal((chart.svg.match(/stroke="#A5481A"/g) ?? []).length, 2)
  assert.doesNotMatch(chart.svg, /NaN|undefined/)
  const averageRows = [
    row(1, { captured_at: '2026-10-20T10:00:00.000Z' }),
    row(2, { captured_at: '2026-10-21T10:00:00.000Z' }),
  ]
  const averages = buildPdfChart(averageRows, 'humidity_pct', '7g', until)
  assert.match(averages.note, /09:00–18:00/)
  assert.ok(averages.pointCount > 0)
  assert.equal(averages.sampleCount, 2)
})

test('PDF grafici: punti, minimi, massimi e aggregazioni corrispondono alla UI in ogni periodo', () => {
  const start = Date.parse('2026-10-01T08:00:00.000Z')
  const rows = Array.from({ length: 90 }, (_, index) => {
    const day = Math.floor(index / 3)
    const hour = [0, 4, 7][index % 3]
    const capturedAt = new Date(start + day * 86400000 + hour * 3600000).toISOString()
    return row(index + 1, {
      acquisition_kind: 'live', captured_at: capturedAt,
      temperature_c: 10 + index / 10,
      quality_flags: index === 4 ? [{ field: 'temperature_c', code: 'outside_configured_range', label: 'probabile errato', reason: 'fixture' }] : [],
    })
  })
  const until = '2026-10-31T00:00:00.000Z'
  for (const mode of ['24h', '7g', '14g', '30g', 'auto']) {
    const windowHours = mode === '24h' ? 24 : mode === '7g' ? 168 : mode === '14g' ? 336 : 720
    const periodUntil = mode === 'auto' ? rows.at(-1).captured_at : until
    const periodRows = mode === 'auto' ? rows : rows.filter(item => Date.parse(item.captured_at) >= Date.parse(until) - windowHours * 3600000)
    const expected = prepareChart(periodRows, 'temperature_c', mode, periodUntil)
    const actual = buildPdfChart(periodRows, 'temperature_c', mode, periodUntil)
    const values = expected.segments.flat().map(point => point.value)
    assert.equal(actual.pointCount, values.length, `${mode}: conteggio punti`)
    assert.equal(actual.minimum, values.length ? Math.min(...values) : null, `${mode}: minimo`)
    assert.equal(actual.maximum, values.length ? Math.max(...values) : null, `${mode}: massimo`)
    assert.equal(actual.sampleCount, expected.segments.flat().reduce((sum, point) => sum + point.count, 0), `${mode}: campioni di origine`)
    assert.match(actual.svg, /<svg[^>]+viewBox="0 0 820 330"/)
  }
})

test('PDF grafici: documento completo per il periodo selezionato e metadati di generazione', () => {
  const until = '2026-10-22T12:00:00.000Z'
  const document = buildGraphsDocument([row(1), row(2)], '24h', until, new Date(until))
  assert.equal(document.pageOrientation, 'landscape')
  assert.match(document.info.title, /24 ore/)
  assert.equal(document.content.filter(item => item.stack).length, 3)
  assert.ok(document.content.some(item => item.text?.includes('Generato il 22/10/2026')))
  assert.ok(document.content.some(item => item.text?.includes('non vengono interpolati')))
  const weeklyRows = [
    row(1, { captured_at: '2026-10-20T10:00:00.000Z' }),
    row(2, { captured_at: '2026-10-21T10:00:00.000Z' }),
  ]
  const weekly = buildGraphsDocument(weeklyRows, '7g', until, new Date(until))
  assert.ok(weekly.content.some(item => item.stack?.some(child => child.text?.includes('2 medie giornaliere da 2 campioni validi'))))
})

test('PDF grafici: il motore produce un PDF valido con le serie vettoriali', async () => {
  const until = '2026-10-22T12:00:00.000Z'
  const blob = await createPdfBlob(buildGraphsDocument([row(1), row(2)], '24h', until, new Date(until)))
  assert.equal(blob.type, 'application/pdf')
  assert.ok(blob.size > 1500)
  const bytes = new Uint8Array(await blob.slice(0, 5).arrayBuffer())
  assert.equal(new TextDecoder().decode(bytes), '%PDF-')
})

test('PDF grafici: aggiorna dati al clic e ancora Auto all’ultima acquisizione', async () => {
  const calls = []
  const latest = row(1, { acquisition_kind: 'live', captured_at: '2026-10-22T11:00:00.000Z' })
  const result = await readFreshChartData('auto', signal(), async params => {
    calls.push(new URLSearchParams(params))
    return params.get('view') === 'latest'
      ? page([latest])
      : { ...page([latest]), until: params.get('until') }
  })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].get('view'), 'latest')
  assert.equal(calls[1].get('period'), '30g')
  assert.equal(calls[1].get('until'), latest.captured_at)
  assert.equal(result.rows[0].ingestion_id, latest.ingestion_id)
  assert.equal(result.until, latest.captured_at)
})

test('PDF cronologia: include ogni riga, distingue gli orari e marca null, qualità e sintetici', () => {
  const earlier = row(1, {
    captured_at: null,
    measured_at: null,
    received_at: '2026-10-20T10:00:00.000Z',
    temperature_c: null,
    quality_flags: [{ field: 'humidity_pct', code: 'outside_configured_range', label: 'probabile errato', reason: 'fuori intervallo' }],
  })
  const later = row(2, { acquisition_kind: 'synthetic', captured_at: '2026-10-21T10:00:00.000Z' })
  const document = buildHistoryDocument([later, earlier], new Date('2026-10-22T12:00:00.000Z'))
  const table = document.content.find(item => item.table)?.table.body
  assert.equal(table.length, 3)
  assert.match(table[1][1], /Senza acquisizione/)
  assert.match(table[1][1], /Ricevuto:/)
  assert.match(table[1][4], /Dato assente/)
  assert.match(table[1][5], /†/)
  assert.match(table[2][1], /SINTETICO/)
  assert.equal(table[0][2].text, 'Misura fisica')
})

test('PDF cronologia: il motore genera un documento tabellare scaricabile', async () => {
  const blob = await createPdfBlob(buildHistoryDocument([row(1), row(2)], new Date('2026-10-22T12:00:00.000Z')))
  assert.equal(blob.type, 'application/pdf')
  assert.ok(blob.size > 1500)
  assert.equal(new TextDecoder().decode(new Uint8Array(await blob.slice(0, 5).arrayBuffer())), '%PDF-')
})

test('PDF cronologia: il layout multipagina resta entro entrambi i margini A4', async () => {
  const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
    import('pdfmake/build/pdfmake.js'), import('pdfmake/build/vfs_fonts.js'),
  ])
  pdfMake.addVirtualFileSystem(fonts)
  const rows = Array.from({ length: 300 }, (_, index) => row(index + 1, {
    captured_at: index % 2 ? null : '2026-10-25T01:30:00.000Z',
    received_at: '2026-10-25T02:30:00.000Z',
    pressure_hpa: index === 299 ? 123456789012345 : 1015.8,
  }))
  const document = buildHistoryDocument(rows, new Date('2026-10-25T03:00:00Z'))
  const pdf = pdfMake.createPdf(document)
  const stream = await pdf.getStream()
  await pdf.getBuffer()
  assert.ok(stream._pdfMakePages.length > 1)
  for (const page of stream._pdfMakePages) {
    const vectors = page.items.filter(item => item.type === 'vector').map(item => item.item)
    assert.ok(vectors.length > 0)
    for (const vector of vectors) {
      const left = vector.x ?? Math.min(vector.x1, vector.x2)
      const right = vector.x === undefined ? Math.max(vector.x1, vector.x2) : vector.x + vector.w
      assert.ok(left >= 28, `bordo sinistro ${left}`)
      assert.ok(right <= 841.89 - 28, `bordo destro ${right}`)
    }
  }
})

test('PDF cronologia: un errore a pagina successiva impedisce la generazione parziale', async () => {
  let calls = 0
  let generated = false
  const reader = async () => {
    calls++
    if (calls === 1) return page([row(1)], 'second-page')
    throw new Error('seconda pagina non disponibile')
  }
  await assert.rejects(createFreshHistoryPdf(signal(), reader, async () => {
    generated = true
    return new Blob(['%PDF'], { type: 'application/pdf' })
  }), /seconda pagina non disponibile/)
  assert.equal(calls, 2)
  assert.equal(generated, false)
})

test('PDF cronologia: genera solo dopo aver raccolto tutte le pagine e fissa l’ora del report', async () => {
  let calls = 0
  const generatedAt = new Date('2026-10-23T12:00:00.000Z')
  const result = await createFreshHistoryPdf(signal(), async () => {
    calls++
    return calls === 1 ? page([row(2)], 'second-page') : page([row(1)])
  }, async definition => {
    const table = definition.content.find(item => item.table)?.table.body
    assert.equal(table.length, 3)
    return new Blob(['%PDF'], { type: 'application/pdf' })
  }, () => generatedAt)
  assert.equal(result.rows.length, 2)
  assert.equal(result.generatedAt, generatedAt)
  assert.equal(calls, 2)
})

test('PDF vuoti: cronologia e grafici restano validi senza inventare campioni', async () => {
  const generatedAt = new Date('2026-10-23T12:00:00.000Z')
  const history = buildHistoryDocument([], generatedAt)
  const table = history.content.find(item => item.table)?.table.body
  assert.equal(table.length, 1)
  assert.equal(table[0][0].text, 'N.')
  const emptyGraphs = buildGraphsDocument([], '24h', generatedAt.toISOString(), generatedAt)
  assert.ok(emptyGraphs.content.filter(item => item.stack).every(item => item.stack.some(child => child.text?.includes('Nessun valore valido'))))
  for (const definition of [history, emptyGraphs]) {
    const blob = await createPdfBlob(definition)
    assert.equal(blob.type, 'application/pdf')
    assert.ok(blob.size > 1500)
    assert.equal(new TextDecoder().decode(new Uint8Array(await blob.slice(0, 5).arrayBuffer())), '%PDF-')
  }
})

test('PDF download: usa il nome atteso e revoca l’URL temporaneo dopo il click', () => {
  const events = []
  let deferred
  const environment = {
    createObjectURL: blob => { assert.equal(blob.type, 'application/pdf'); events.push('create'); return 'blob:test' },
    revokeObjectURL: url => events.push(`revoke:${url}`),
    createLink: () => ({ href: '', download: '', click() { events.push(`click:${this.href}:${this.download}`) } }),
    schedule: (callback, delay) => { assert.equal(delay, 1000); deferred = callback },
  }
  const filename = downloadPdfBlob(new Blob(['%PDF-test'], { type: 'application/pdf' }), 'cronologia', new Date('2026-10-22T12:00:00Z'), environment)
  assert.equal(filename, 'MeteOlivelli-cronologia-2026-10-22.pdf')
  assert.equal(events[1], 'click:blob:test:MeteOlivelli-cronologia-2026-10-22.pdf')
  deferred()
  assert.equal(events[2], 'revoke:blob:test')
  assert.throws(() => downloadPdfBlob(new Blob(['test']), 'grafici', new Date(), environment), /non valido/)
})

test('consenso statistiche: scelta esplicita valida per sei mesi, poi si richiede di nuovo', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const originalNow = Date.now
  const store = new Map()
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) } } })
  Date.now = () => Date.parse('2026-10-23T12:00:00.000Z')
  try {
    assert.equal(readAnalyticsConsent(), null)
    assert.equal(saveAnalyticsConsent('denied'), true)
    assert.equal(readAnalyticsConsent(), 'denied')
    Date.now = () => Date.parse('2027-04-23T12:00:00.000Z')
    assert.equal(readAnalyticsConsent(), null)
  } finally {
    Date.now = originalNow
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor)
    else delete globalThis.window
  }
})

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
test('cronologia completa: pagina tutto lo storico, include date mancanti e ordina quelle per ricezione', async () => {
  let calls = 0
  const undated = row(2, { captured_at: null, received_at: '2026-10-22T09:00:00.000Z' })
  const result = await readAllHistory(signal(), async params => {
    calls++
    assert.equal(params.get('period'), 'all')
    assert.equal(params.get('basis'), 'captured_at')
    if (calls === 1) return page([row(3)], 'next')
    assert.equal(params.get('cursor'), 'next')
    return page([undated, row(1)])
  })
  assert.deepEqual(result.map(item => item.ingestion_id), [row(1), row(3), undated].map(item => item.ingestion_id))
})
test('cronologia: raggruppa ogni pagina per giorno civile Europe/Rome, anche al cambio UTC', () => {
  const rows = [
    row(3, { captured_at: '2026-10-24T08:00:00.000Z' }),
    row(2, { captured_at: '2026-10-24T01:00:00.000Z' }),
    row(1, { captured_at: '2026-10-23T21:30:00.000Z' }),
  ]
  const days = groupHistoryByLocalDay(rows)
  assert.deepEqual(days.map(day => day.key), ['2026-10-24', '2026-10-23'])
  assert.deepEqual(days.map(day => day.rows.length), [2, 1])
  assert.equal(days[0].label, '24 ottobre 2026')
})
test('cronologia completa: non applica finestre o limiti a cento pagine', async () => {
  let calls = 0
  const result = await readAllHistory(signal(), async params => {
    calls++
    assert.equal(params.get('period'), 'all')
    return page([row(calls, { captured_at: new Date(Date.parse('2026-10-22T00:00:00.000Z') + calls * 3600000).toISOString() })], calls < 101 ? `cursor-${calls}` : null)
  })
  assert.equal(calls, 101)
  assert.equal(result.length, 101)
})

test('cronologia e PDF ordinano microsecondi distinti prima dello spareggio UUID', async () => {
  const later = row(1, { captured_at: null, received_at: '2026-10-22T12:00:00.123457Z', temperature_c: 22 })
  const earlier = row(2, { captured_at: null, received_at: '2026-10-22T12:00:00.123456+00:00', temperature_c: 21 })
  const rows = await readAllHistory(signal(), async () => page([later, earlier]))
  assert.deepEqual(rows.map(row => row.ingestion_id), [earlier.ingestion_id, later.ingestion_id])
  const document = buildHistoryDocument([later, earlier], new Date('2026-10-22T13:00:00Z'))
  const body = document.content.find(item => item.table).table.body
  assert.equal(body[1][4], '21,0 °C')
  assert.equal(body[2][4], '22,0 °C')
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

test('provenienza: il tipo sintetico è conservato, un tipo sconosciuto è rifiutato', () => {
  assert.equal(parsePage(page([row(1, { acquisition_kind: 'synthetic' })])).items[0].acquisition_kind, 'synthetic')
  assert.throws(() => parsePage(page([row(1, { acquisition_kind: 'unknown' })])))
})

test('freschezza: i campioni sintetici non diventano misure fisiche aggiornate', () => {
  assert.equal(getFreshness(row(1, { acquisition_kind: 'synthetic', measured_at: '2026-10-22T12:00:00.000Z' }), Date.parse('2026-10-22T12:00:00.000Z'), 3600000), 'unknown')
})

test('grafici: scala completa 24h/7g/30g indipendente dai campioni', () => {
  for (const [period, hours] of [['24h', 24], ['7g', 168], ['30g', 720]]) {
    const axis = chartTimeline(period, '2026-10-22T20:00:00.000Z')
    assert.equal(axis.end - axis.start, hours * 3600000)
    assert.ok(axis.ticks.every(tick => tick.time > axis.start && tick.time < axis.end))
  }
  const month = chartTimeline('30g', '2026-10-22T20:00:00.000Z')
  assert.ok(month.ticks.length >= 29)
  assert.ok(month.ticks.filter(tick => tick.major).length >= 4)
})
test('grafici: linee giornaliere a mezzanotte italiana anche al cambio ora', () => {
  const axis = chartTimeline('7g', '2026-10-28T12:00:00.000Z')
  const localHour = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', hourCycle: 'h23' })
  assert.ok(axis.ticks.every(tick => localHour.format(tick.time) === '00'))
  const gaps = axis.ticks.slice(1).map((tick, i) => (tick.time - axis.ticks[i].time) / 3600000)
  assert.ok(gaps.includes(25))
  assert.throws(() => chartTimeline('24h', 'invalid'))
})

test('14 giorni usa la finestra API da 30g e ritaglia localmente gli ultimi 14 giorni', async () => {
  const records = [row(1, { captured_at: '2026-10-01T10:00:00Z' }), row(2, { captured_at: '2026-10-15T10:00:00Z' }), row(3, { captured_at: '2026-10-22T10:00:00Z' })]
  let requestedPeriod
  const result = await readHistory('14g', signal(), async params => {
    requestedPeriod = params.get('period')
    return page(records)
  })
  assert.equal(requestedPeriod, '30g')
  assert.deepEqual(result.map(item => item.ingestion_id), [records[1].ingestion_id, records[2].ingestion_id])
})

test('Auto: due giorni mantengono i campioni e la loro estensione temporale', () => {
  const records = [row(1, { captured_at: '2026-10-20T10:00:00Z' }), row(2, { captured_at: '2026-10-22T10:00:00Z' })]
  const chart = prepareChart(records, 'temperature_c', 'auto', '2026-10-22T20:00:00Z')
  assert.equal(chart.averaged, false)
  assert.equal(chart.timeline.end - chart.timeline.start, 48 * 3600000)
  assert.equal(chart.segments.flat().length, 2)
})
test('Auto: due mesi diventano sette giornate con tre medie, inclusa la notte', () => {
  const records = Array.from({ length: 61 * 4 }, (_, index) => row(index + 1, {
    captured_at: new Date(Date.UTC(2026, 7, 23 + Math.floor(index / 4), [0, 6, 12, 18][index % 4])).toISOString(),
    temperature_c: [10, 20, 30, 40][index % 4],
  }))
  const chart = prepareChart(records, 'temperature_c', 'auto', '2026-10-22T20:00:00Z')
  const points = chart.segments.flat()
  assert.equal(chart.averaged, true)
  assert.equal(points.length, 21)
  assert.deepEqual(points.slice(-3).map(point => point.value), [15, 30, 40])
  assert.deepEqual(points.slice(-3).map(point => point.count), [2, 1, 1])
  assert.equal(records.at(-1).temperature_c, 40)
})
test('Auto: null e sospetti non contribuiscono alle medie; fasce vuote interrompono la linea', () => {
  const records = [row(1, { captured_at: '2026-10-01T10:00:00Z' }), row(2, { captured_at: '2026-10-22T08:00:00Z', temperature_c: 20 }), row(3, { captured_at: '2026-10-22T09:00:00Z', temperature_c: 999, quality_flags: [{ field: 'temperature_c', label: 'probabile errato' }] }), row(4, { captured_at: '2026-10-22T12:00:00Z', temperature_c: null }), row(5, { captured_at: '2026-10-22T18:00:00Z', temperature_c: 30 })]
  const chart = prepareChart(records, 'temperature_c', 'auto', '2026-10-22T20:00:00Z')
  assert.deepEqual(chart.segments.map(segment => segment.length), [1, 1])
  assert.deepEqual(chart.segments.flat().map(point => [point.value, point.count]), [[20, 1], [30, 1]])
})
test('Auto: fasce e sette giornate rispettano il cambio ora Europe/Rome', () => {
  const records = [row(1, { captured_at: '2026-10-01T12:00:00Z' }), row(2, { captured_at: '2026-10-28T18:00:00Z' })]
  const chart = prepareChart(records, 'temperature_c', 'auto', '2026-10-28T20:00:00Z')
  assert.equal(chart.timeline.end - chart.timeline.start, 169 * 3600000)
  assert.equal(chart.segments.flat().at(-1).label.includes('Sera'), true)
})
test('Auto: una misura singola ha spazio e le medie vere non includono sintetici', () => {
  const only = prepareChart([row()], 'temperature_c', 'auto', '2026-10-22T20:00:00Z')
  assert.equal(only.timeline.end - only.timeline.start, 3600000)
  const mixed = prepareChart([row(1, { acquisition_kind: 'synthetic', captured_at: '2026-10-01T10:00:00Z', temperature_c: 999 }), row(2, { acquisition_kind: 'live', captured_at: '2026-10-22T10:00:00Z', temperature_c: 20 })], 'temperature_c', 'auto', '2026-10-22T20:00:00Z')
  assert.equal(mixed.averaged, false)
  assert.deepEqual(mixed.segments.flat().map(point => point.value), [20])
})

test('7, 14 e 30 giorni mostrano una media al giorno limitata alle 09:00–18:00 locali', () => {
  // In ottobre Europe/Rome è UTC+2: 06:59Z è 08:59, 07:00Z è 09:00, 15:59Z è 17:59 e 16:00Z è 18:00.
  const records = [
    row(1, { captured_at: '2026-10-22T06:59:00Z', temperature_c: 1 }),
    row(2, { captured_at: '2026-10-22T07:00:00Z', temperature_c: 10 }),
    row(3, { captured_at: '2026-10-22T15:59:00Z', temperature_c: 30 }),
    row(4, { captured_at: '2026-10-22T16:00:00Z', temperature_c: 100 }),
    row(5, { captured_at: '2026-10-23T08:00:00Z', temperature_c: 50 }),
  ]
  for (const mode of ['7g', '14g', '30g']) {
    const chart = prepareChart(records, 'temperature_c', mode, '2026-10-23T12:00:00Z')
    assert.equal(chart.averaged, true)
    const points = chart.segments.flat()
    assert.deepEqual(points.map(point => [point.value, point.count]), [[20, 2], [50, 1]])
    assert.ok(points[0].label.includes('09:00–18:00'))
  }
  const day = prepareChart(records, 'temperature_c', '24h', '2026-10-23T12:00:00Z')
  assert.equal(day.averaged, false)
  assert.equal(day.segments.flat().length, 5)
})

test('Auto: lettura ancorata all’ultima misura anche se la stazione è ferma da mesi', async () => {
  const old = row(1, { captured_at: '2026-08-01T10:00:00.000Z' })
  let published
  let calls = 0
  const feed = createWeatherFeed('30g', state => { published = state }, async params => {
    if (params.get('view') === 'latest') return page([old])
    calls++
    assert.equal(params.get('until'), old.captured_at)
    return { ...page([old]), until: old.captured_at }
  }, { anchorToLatest: true })
  await feed.refresh()
  assert.equal(published.history.length, 1)
  assert.equal(published.windowUntil, old.captured_at)
  await feed.refresh()
  assert.equal(calls, 1)
  feed.stop()
})

test('Auto: timestamp PostgreSQL normalizzati, inclusi microsecondi e paginazione', async () => {
  for (const captured of ['2026-08-01T10:00:00+00:00', '2026-08-01T10:00:00.123456+00:00']) {
    const old = row(1, { captured_at: captured })
    const anchor = captured.includes('.') ? '2026-08-01T10:00:00.124Z' : '2026-08-01T10:00:00.000Z'
    let published
    let calls = 0
    const feed = createWeatherFeed('30g', state => { published = state }, async params => {
      if (params.get('view') === 'latest') return parsePage(page([old]))
      calls++
      assert.equal(params.get('until'), anchor)
      const cursor = btoa(JSON.stringify(['30g', 'captured_at', anchor, new Date(captured).toISOString(), old.ingestion_id]))
      return parsePage({ ...page([old], calls === 1 ? cursor : null), until: anchor })
    }, { anchorToLatest: true })
    await feed.refresh()
    assert.equal(published.historyError, false)
    assert.equal(published.history.length, 1)
    assert.equal(published.windowUntil, anchor)
    await feed.refresh()
    assert.equal(published.windowUntil, anchor)
    assert.equal(calls, 2)
    feed.stop()
  }
})
