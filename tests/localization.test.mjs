import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'
import { readdirSync, readFileSync } from 'node:fs'
import { detectDeviceLanguage, getPreferences, parsePreferences, temperatureValue, updatePreferences } from '../src/preferences.ts'
import { translate, loadLanguage } from '../src/i18n.ts'
import { formatValue, formatCivilDay } from '../src/weather.ts'
import { quizQuestions } from '../src/quiz.ts'
import { metricExplanations } from '../src/metric-explanations.ts'
import { buildHistoryDocument } from '../src/pdf-history-document.ts'
import { buildGraphsDocument } from '../src/pdf-graphs-document.ts'
import { measurementAge } from '../src/measurement-age.ts'
import { describeWeatherChange } from '../src/weather-summary.ts'

const reset = () => updatePreferences({ language: 'it', temperatureUnit: 'C' }, false)
const sample = {
  acquisition_kind: 'live', ingestion_id: '00000000-0000-4000-8000-000000000001',
  temperature_c: 0, humidity_pct: 70, pressure_hpa: 1010,
  captured_at: '2026-10-27T10:00:00Z', measured_at: '2026-10-27T10:00:00Z', received_at: '2026-10-27T10:01:00Z', quality_flags: [],
}

test('conversione Fahrenheit: gelo, ebollizione, negativi, null e differenze senza offset', () => {
  assert.equal(temperatureValue(0, 'F'), 32)
  assert.equal(temperatureValue(100, 'F'), 212)
  assert.equal(temperatureValue(-40, 'F'), -40)
  assert.equal(temperatureValue(null, 'F'), null)
  assert.equal(temperatureValue(10, 'F', true), 18)
  assert.equal(temperatureValue(20, 'C'), 20)
  updatePreferences({ language: 'it', temperatureUnit: 'F' }, false)
  assert.equal(formatValue(0, 'temperature_c'), '32,0')
  assert.equal(formatValue(10, 'temperature_c', true), '18,0')
  assert.equal(formatValue(70, 'humidity_pct'), '70,0')
  assert.equal(formatValue(1010, 'pressure_hpa'), '1010,0')
  assert.equal(formatValue(null, 'temperature_c'), 'Dato assente')
  reset()
})

test('preferenze corrotte o sconosciute tornano ai default, le scelte valide sono indipendenti', () => {
  for (const raw of [null, '', '{', 'null', 'false', '[]', '{"language":"xx","temperatureUnit":"Kelvin"}']) {
    assert.deepEqual(parsePreferences(raw), { language: 'it', temperatureUnit: 'C' })
  }
  assert.deepEqual(parsePreferences('{"language":"de","temperatureUnit":"F"}'), { language: 'de', temperatureUnit: 'F' })
})

test('lingua del dispositivo: varianti regionali, ordine di preferenza e italiano come ripiego', () => {
  for (const [locale, expected] of [['it-CH', 'it'], ['en-US', 'en'], ['es-MX', 'es'], ['fr-CA', 'fr'], ['de-AT', 'de']]) {
    assert.equal(detectDeviceLanguage([locale]), expected)
  }
  assert.equal(detectDeviceLanguage(['nl-NL', 'fr-BE', 'en-GB']), 'fr')
  assert.equal(detectDeviceLanguage([' ES-mx ']), 'es')
  assert.equal(detectDeviceLanguage(['pt-BR', 'nl-NL']), 'it')
  assert.equal(detectDeviceLanguage([]), 'it')
})

test('la lingua salvata prevale sul dispositivo; dati assenti o invalidi usano la lingua rilevata', () => {
  for (const raw of [null, '', '{', 'null', '[]', '{"language":"xx"}']) {
    assert.equal(parsePreferences(raw, 'fr').language, 'fr')
  }
  assert.deepEqual(parsePreferences('{"temperatureUnit":"F"}', 'de'), { language: 'de', temperatureUnit: 'F' })
  assert.deepEqual(parsePreferences('{"language":"it","temperatureUnit":"F"}', 'en'), { language: 'it', temperatureUnit: 'F' })
})

test('tutte le lingue coprono quiz, spiegazioni e testi statici accessibili', async () => {
  const allowed = new Set(['MeteOlivelli', '°C', 'hPa', 'Pietro Giudici', 'Nicholas Borin', 'meteolivelli@liceoolivelli.pv.it', 'meteolivelli-analytics-consent'])
  const required = quizQuestions.flatMap(q => [q.question, ...q.answers, q.explanation])
  required.push(...Object.values(metricExplanations))
  for (const file of readdirSync(new URL('../src', import.meta.url), { recursive: true }).filter(name => name.endsWith('.tsx'))) {
    const source = ts.createSourceFile(file, readFileSync(new URL('../src/' + file, import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true)
    const visit = node => {
      if (ts.isCallExpression(node) && node.expression.getText(source) === 'translate' && ts.isStringLiteral(node.arguments[0])) {
        const text = node.arguments[0].text.replace(/\s+/g, ' ').trim()
        if (/\p{L}/u.test(text) && !allowed.has(text)) required.push(text)
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
  const keys = []
  for (const language of ['en', 'es', 'fr', 'de']) {
    await loadLanguage(language)
    const catalogue = (await import(`../src/locales/${language}.ts`)).default
    keys.push(Object.keys(catalogue).sort())
    for (const key of required) assert.ok(Object.hasOwn(catalogue, key), `${language}: ${key}`)
    for (const [key, value] of Object.entries(catalogue)) {
      assert.ok(value.trim().length > 0)
      const slots = text => [...text.matchAll(/\{\d+\}/g)].map(item => item[0]).sort()
      assert.deepEqual(slots(value), slots(key), `${language}: parametri ${key}`)
    }
  }
  for (const other of keys.slice(1)) assert.deepEqual(other, keys[0])
})

test('traduzione reattiva di messaggi composti, date e durate; numeri non interpretati come misure', async () => {
  await loadLanguage('en')
  updatePreferences({ language: 'en', temperatureUnit: 'F' }, false)
  assert.equal(translate('Temperatura'), 'Temperature')
  assert.equal(translate('PDF scaricato con 42 campioni.'), 'PDF downloaded with 42 samples.')
  assert.equal(translate('Minimo 32.0 · massimo 68.0 · media 50.0 °F (5 campioni validi)'), 'Minimum 32.0 · maximum 68.0 · average 50.0 °F (5 valid samples)')
  assert.equal(formatValue(0, 'temperature_c'), '32.0')
  assert.equal(formatCivilDay('2026-10-27'), '27 October 2026')
  assert.match(measurementAge(sample, '2026-10-27T12:04:00Z'), /2 hours and 4 minutes ago/)
  const earlier = { ...sample, ingestion_id: '00000000-0000-4000-8000-000000000002', temperature_c: -10, captured_at: '2026-10-27T09:00:00Z', measured_at: '2026-10-27T09:00:00Z' }
  assert.match(translate(describeWeatherChange(sample, [earlier])[0]), /Temperature rising by 18.0 °F/)
  assert.equal(translate(null), null)
  assert.equal(translate(20), 20)
  reset()
})

test('PDF localizzati con temperatura convertita una volta, unità coerenti e input intatto', async () => {
  await loadLanguage('en')
  updatePreferences({ language: 'en', temperatureUnit: 'F' }, false)
  const snapshot = JSON.stringify(sample)
  const history = buildHistoryDocument([sample], new Date('2026-10-27T12:00:00Z'))
  assert.equal(history.content[0].text, 'MeteOlivelli · Full history')
  assert.equal(history.content[2].table.body[1][4], '32.0 °F')
  assert.match(history.footer(1, 2).text, /Page 1 of 2/)
  const graphs = buildGraphsDocument([sample], '24h', '2026-10-27T12:00:00Z', new Date('2026-10-27T12:00:00Z'))
  assert.match(graphs.content[2].stack[0].text, /Temperature · °F/)
  assert.match(graphs.content[2].stack[1].svg, /Temperature · °F/)
  assert.match(graphs.content[2].stack[2].text, /min 32.0 °F · max 32.0 °F/)
  assert.equal(JSON.stringify(sample), snapshot)
  reset()
  assert.match(history.footer(1, 2).text, /Page 1 of 2/)
  assert.match(graphs.footer(1, 2).text, /Page 1 of 2/)
  assert.deepEqual(getPreferences(), { language: 'it', temperatureUnit: 'C' })
})

test('misura manuale e lettura della stazione restano datate correttamente con valori e PDF in Fahrenheit', async () => {
  // Valori inventati, usati esclusivamente come fixture di integrazione locale.
  const { readObservationHistory } = await import('../src/weather.ts')
  const { prepareChart } = await import('../src/chart.ts')
  const live = { ...sample, measured_at: '2026-10-27T09:00:00Z', captured_at: '2026-10-27T09:01:00Z', temperature_c: 0 }
  const manual = { ...sample, ingestion_id: '00000000-0000-4000-8000-000000000002', acquisition_kind: 'historical', entry_method: 'manual', captured_at: null, measured_at: '2026-10-27T10:00:00Z', temperature_c: 10 }
  const before = JSON.stringify([live, manual])
  const until = '2026-10-27T12:00:00Z'
  const calls = []
  const result = await readObservationHistory('24h', new AbortController().signal, async params => {
    const basis = params.get('basis')
    calls.push(basis)
    return { items: [live, manual], next_cursor: null, until, time_basis: basis }
  })
  assert.deepEqual(calls, ['captured_at'])
  assert.deepEqual(result.rows.map(row => row.ingestion_id), [live.ingestion_id, manual.ingestion_id])
  assert.equal(result.rows[1].captured_at, null)
  assert.equal(prepareChart(result.rows, 'temperature_c', '24h', until).segments.flat().length, 2)
  assert.equal(prepareChart([{ ...live, measured_at: null }, manual], 'temperature_c', '24h', until).segments.flat().length, 2)
  for (const language of ['en', 'es', 'fr', 'de']) {
    await loadLanguage(language)
    updatePreferences({ language }, false)
    for (const text of ['Asse orizzontale: ora della misura fisica se attestata, altrimenti acquisizione sul PC, Europe/Rome.', 'measured_at ha precedenza su captured_at; valori assenti o sospetti interrompono la linea. Da', 'asse: measured_at se attestato, altrimenti captured_at (acquisizione sul PC)']) {
      assert.notEqual(translate(text), text, `${language}: ${text}`)
    }
  }
  await loadLanguage('en')
  updatePreferences({ language: 'en', temperatureUnit: 'F' }, false)
  assert.match(translate(describeWeatherChange(manual, result.rows)[0]), /Temperature rising by 18.0 °F/)
  const document = buildHistoryDocument(result.rows, new Date(until))
  const manualRow = document.content[2].table.body[2]
  assert.match(manualRow[1], /No capture time.*MANUAL ENTRY/)
  assert.notEqual(manualRow[2], '—')
  assert.equal(manualRow[4], '50.0 °F')
  assert.equal(JSON.stringify([live, manual]), before)
  reset()
})
