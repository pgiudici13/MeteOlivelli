import {
  canonicalMeasurementContent,
  type Measurement,
  parseMeasurementJson,
  validateMeasurement,
  type ValidationIssue,
  type ValidationResult,
} from './measurement.ts'

// Tutti i dati di questo file sono sintetici; nessuna misura della stazione.
function fixture(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: 1,
    source_id: 'stazione-test',
    ingestion_id: '12345678-1234-4234-8234-123456789abc',
    arduino_seconds: 3600,
    temperature_c: 21.12345,
    humidity_pct: 55,
    pressure_hpa: 1013.25,
    acquisition_kind: 'live',
    captured_at: '2026-10-22T08:00:00Z',
    measured_at: null,
    ...overrides,
  }
}

function assert(condition: unknown, message = 'Verifica fallita'): asserts condition {
  if (!condition) throw new Error(message)
}

function valid(result: ValidationResult) {
  assert(result.ok, 'Evento sintetico atteso valido')
  return result
}

function hasIssue(result: ValidationResult, field: string, code: ValidationIssue['code']) {
  assert(!result.ok, 'Evento atteso invalido')
  assert(result.issues.some((issue) => issue.field === field && issue.code === code))
}

Deno.test('accetta unità fissate, preserva precisione e zero senza ricostruire date', () => {
  const input = fixture({ arduino_seconds: 0, temperature_c: 0, humidity_pct: 0 })
  const result = valid(validateMeasurement(input))
  assert(result.measurement.arduino_seconds === 0)
  assert(result.measurement.temperature_c === 0 && result.measurement.humidity_pct === 0)
  assert(result.measurement.measured_at === null)
  assert(result.measurement.captured_at === '2026-10-22T08:00:00.000Z')
  assert(input.captured_at === '2026-10-22T08:00:00Z', 'Non mutare l’input')
  assert(result.quality_flags.length === 0)
  assert(valid(validateMeasurement(fixture())).measurement.temperature_c === 21.12345)
})

Deno.test('distingue JSON malformato da payload non oggetto', () => {
  hasIssue(parseMeasurementJson('{'), '$', 'invalid_json')
  for (const input of [null, [], true, 12, 'test']) {
    hasIssue(validateMeasurement(input), '$', 'invalid_object')
  }
  assert(parseMeasurementJson(JSON.stringify(fixture())).ok)
})

Deno.test('richiede ogni campo, rifiuta versioni e campi sconosciuti inclusi ricevuta e flag client', () => {
  for (const field of Object.keys(fixture())) {
    const input = fixture()
    delete input[field]
    hasIssue(validateMeasurement(input), field, 'missing_field')
  }
  for (const version of [0, 2, '1', null]) {
    hasIssue(
      validateMeasurement(fixture({ schema_version: version })),
      'schema_version',
      'unsupported_version',
    )
  }
  for (const field of ['received_at', 'quality_flags', 'unexpected']) {
    hasIssue(validateMeasurement(fixture({ [field]: 'valore sintetico' })), '$', 'unknown_field')
  }
})

Deno.test('rifiuta conversioni implicite, non numerici e numeri non finiti per ogni grandezza', () => {
  for (const field of ['arduino_seconds', 'temperature_c', 'humidity_pct', 'pressure_hpa']) {
    for (
      const value of ['21', '', ' ', '21,2', undefined, false, {}, [], NaN, Infinity, -Infinity]
    ) {
      hasIssue(validateMeasurement(fixture({ [field]: value })), field, 'invalid_number')
    }
  }
  hasIssue(
    parseMeasurementJson(JSON.stringify(fixture()).replace('1013.25', '1e999')),
    'pressure_hpa',
    'invalid_number',
  )
})

Deno.test('uptime non negativo rappresentabile, senza presumere risoluzione o Unix time', () => {
  for (const value of [-1, null, Number.MAX_SAFE_INTEGER + 1]) {
    hasIssue(
      validateMeasurement(fixture({ arduino_seconds: value })),
      'arduino_seconds',
      'invalid_number',
    )
  }
  assert(validateMeasurement(fixture({ arduino_seconds: 0.5 })).ok)
  assert(validateMeasurement(fixture({ arduino_seconds: Number.MAX_SAFE_INTEGER })).ok)
})

Deno.test('null esplicito è assenza; nessuno zero o valore precedente viene inventato', () => {
  const result = valid(
    validateMeasurement(fixture({ temperature_c: null, humidity_pct: null, pressure_hpa: null })),
  )
  assert(result.measurement.temperature_c === null)
  assert(result.quality_flags.length === 3)
  assert(
    result.quality_flags.every((flag) =>
      flag.code === 'missing_value' && flag.label === 'dato assente'
    ),
  )
})

Deno.test('conserva anomalie fisiche con motivo per campo ed etichetta richiesta', () => {
  const result = valid(
    validateMeasurement(fixture({ temperature_c: -300, humidity_pct: 101, pressure_hpa: 0 })),
  )
  assert(result.measurement.temperature_c === -300)
  assert(result.measurement.humidity_pct === 101 && result.measurement.pressure_hpa === 0)
  assert(result.quality_flags.length === 3)
  assert(
    result.quality_flags.every((flag) =>
      flag.label === 'probabile errato' && flag.reason.length > 0
    ),
  )
  assert(
    valid(
      validateMeasurement(
        fixture({ temperature_c: -273.15, humidity_pct: 100, pressure_hpa: 0.1 }),
      ),
    ).quality_flags.length === 0,
  )
  assert(
    valid(validateMeasurement(fixture({ humidity_pct: -0.1, pressure_hpa: -1 }))).quality_flags
      .length === 2,
  )
})

Deno.test('soglie sensore opzionali, inclusive, senza scarti o arrotondamenti', () => {
  const ranges = { temperature_c: { min: -20, max: 50 } }
  for (const value of [-20, 50]) {
    assert(
      valid(validateMeasurement(fixture({ temperature_c: value }), ranges)).quality_flags.length ===
        0,
    )
  }
  const result = valid(validateMeasurement(fixture({ temperature_c: 50.0001 }), ranges))
  assert(result.measurement.temperature_c === 50.0001)
  assert(result.quality_flags[0].code === 'outside_configured_range')
  assert(valid(validateMeasurement(fixture({ temperature_c: 500 }))).quality_flags.length === 0)
  for (const range of [{ min: 2, max: 1 }, { min: NaN, max: 1 }, { min: 0, max: Infinity }]) {
    let thrown = false
    try {
      validateMeasurement(fixture(), { temperature_c: range })
    } catch {
      thrown = true
    }
    assert(thrown, 'Una configurazione errata deve essere segnalata')
  }
})

Deno.test('timestamp rigorosi: calendario, bisestili, offset assenti e ore locali DST rifiutati', () => {
  for (const field of ['captured_at', 'measured_at']) {
    for (
      const value of [
        '',
        0,
        '2026-02-29T08:00:00Z',
        '2026-04-31T08:00:00Z',
        '2026-10-22T24:00:00Z',
        '2026-10-22T08:60:00Z',
        '2026-10-22T08:00:60Z',
        '2026-10-22',
        '2026-10-25T02:30:00',
        '2026-03-29T02:30:00',
        '0000-01-01T00:00:00Z',
        '2026-10-22T08:00:00+02:00',
        '2026-10-22T08:00:00.1234Z',
      ]
    ) hasIssue(validateMeasurement(fixture({ [field]: value })), field, 'invalid_timestamp')
  }
  for (
    const value of ['2024-02-29T08:00:00Z', '2026-10-22T08:00:00.1Z', '2026-10-22T08:00:00.123Z']
  ) {
    assert(validateMeasurement(fixture({ measured_at: value })).ok)
  }
})

Deno.test('ora PC obbligatoria per nuove righe, import storico senza data inventata', () => {
  hasIssue(validateMeasurement(fixture({ captured_at: null })), 'captured_at', 'inconsistent_time')
  hasIssue(
    validateMeasurement(fixture({ acquisition_kind: 'historical' })),
    'captured_at',
    'inconsistent_time',
  )
  hasIssue(
    validateMeasurement(fixture({ acquisition_kind: 'other' })),
    'acquisition_kind',
    'invalid_acquisition_kind',
  )
  const result = valid(
    validateMeasurement(fixture({ acquisition_kind: 'historical', captured_at: null })),
  )
  assert(result.measurement.captured_at === null && result.measurement.measured_at === null)
})

Deno.test('gli istanti UTC restano distinti durante il ritorno all’ora solare Europe/Rome', () => {
  const first = valid(validateMeasurement(fixture({ captured_at: '2026-10-25T00:30:00Z' })))
  const second = valid(validateMeasurement(fixture({ captured_at: '2026-10-25T01:30:00Z' })))
  assert(
    Date.parse(second.measurement.captured_at!) - Date.parse(first.measurement.captured_at!) ===
      3600000,
  )
})

Deno.test('identità sorgente e UUID v4, senza spazi o normalizzazioni della sorgente', () => {
  for (const value of ['', ' ', ' stazione-test', 'UPPERCASE', 'a'.repeat(65), null]) {
    hasIssue(validateMeasurement(fixture({ source_id: value })), 'source_id', 'invalid_identifier')
  }
  for (
    const value of [
      '',
      3600,
      '12345678-1234-1234-8234-123456789abc',
      '12345678-1234-4234-1234-123456789abc',
    ]
  ) {
    hasIssue(
      validateMeasurement(fixture({ ingestion_id: value })),
      'ingestion_id',
      'invalid_identifier',
    )
  }
  assert(
    valid(validateMeasurement(fixture({ ingestion_id: '12345678-1234-4234-8234-123456789ABC' })))
      .measurement.ingestion_id.endsWith('abc'),
  )
})

Deno.test('confronto canonico indipendente da ordine proprietà, forma UTC e flag ricalcolati', () => {
  const first = valid(validateMeasurement(fixture()))
  const reordered = Object.fromEntries(Object.entries(fixture()).reverse())
  reordered.captured_at = '2026-10-22T08:00:00.000Z'
  const second = valid(validateMeasurement(reordered, { temperature_c: { min: 0, max: 10 } }))
  assert(second.quality_flags.length === 1)
  assert(
    canonicalMeasurementContent(first.measurement) ===
      canonicalMeasurementContent(second.measurement),
  )
  for (
    const [field, value] of Object.entries({
      source_id: 'altra-stazione',
      ingestion_id: '12345678-1234-4234-8234-123456789abd',
      arduino_seconds: 1,
      temperature_c: 22,
      humidity_pct: 56,
      pressure_hpa: 1012,
      captured_at: '2026-10-22T09:00:00Z',
      measured_at: '2026-10-22T07:59:00Z',
    })
  ) {
    const changed = valid(validateMeasurement(fixture({ [field]: value })))
    assert(
      canonicalMeasurementContent(first.measurement) !==
        canonicalMeasurementContent(changed.measurement),
      field,
    )
  }
})

Deno.test('retry e reset non creano ID, sessioni, date o ricevute server nel validatore', () => {
  const original = valid(validateMeasurement(fixture())).measurement
  const retry = valid(parseMeasurementJson(JSON.stringify(original))).measurement
  assert(canonicalMeasurementContent(original) === canonicalMeasurementContent(retry))
  const reset = valid(
    validateMeasurement(
      fixture({ arduino_seconds: 0, ingestion_id: '12345678-1234-4234-8234-123456789abd' }),
    ),
  ).measurement
  assert(reset.measured_at === null && reset.arduino_seconds === 0)
  assert(reset.ingestion_id !== original.ingestion_id)
  assert(!('boot_id' in reset) && !('received_at' in reset))
  // Un altro evento può avere identici valori e uptime; l'ID distingue gli eventi.
  const identicalValues: Measurement = { ...original, ingestion_id: reset.ingestion_id }
  assert(canonicalMeasurementContent(original) !== canonicalMeasurementContent(identicalValues))
})
