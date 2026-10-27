import {
  type CsvDialect,
  type CsvEventContext,
  type CsvMeasurementResult,
  parseMeasurementCsvRow,
} from './measurement_csv.ts'
import { canonicalMeasurementContent } from './measurement.ts'

// Esempi interamente sintetici: nessun dialetto certificato o misura della stazione.
const dialect: CsvDialect = {
  delimiter: ';',
  decimal_separator: '.',
  empty_measurement: 'reject',
}
const context: CsvEventContext = {
  source_id: 'stazione-test',
  ingestion_id: '12345678-1234-4234-8234-123456789abc',
  acquisition_kind: 'live',
  captured_at: '2026-10-22T08:00:00Z',
}

function assert(condition: unknown, message = 'Verifica fallita'): asserts condition {
  if (!condition) throw new Error(message)
}

function valid(result: CsvMeasurementResult) {
  assert(result.ok, 'Riga sintetica attesa valida')
  return result
}

Deno.test('CSV: ordine utente, precisione e originale preservati nei quattro dialetti espliciti', () => {
  for (const delimiter of [',', ';', '\t', '|'] as const) {
    const row = ['0', '-2.12345', '55', '1013.25'].join(delimiter)
    const result = valid(parseMeasurementCsvRow(row, { ...dialect, delimiter }, context))
    assert(result.raw_row === row)
    assert(result.measurement.arduino_seconds === 0)
    assert(result.measurement.temperature_c === -2.12345)
    assert(result.measurement.humidity_pct === 55)
    assert(result.measurement.pressure_hpa === 1013.25)
    assert(result.measurement.measured_at === null)
  }
})

Deno.test('CSV: decimali con virgola solo se configurati, anche in campi quotati', () => {
  const commaDecimal: CsvDialect = { ...dialect, decimal_separator: ',' }
  const result = valid(parseMeasurementCsvRow('3600;21,5;55,2;1013,25', commaDecimal, context))
  assert(result.measurement.temperature_c === 21.5)
  assert(result.measurement.humidity_pct === 55.2 && result.measurement.pressure_hpa === 1013.25)
  assert(
    valid(
      parseMeasurementCsvRow(
        '3600,"21,5","55,2","1013,25"',
        { ...commaDecimal, delimiter: ',' },
        context,
      ),
    ).measurement.temperature_c === 21.5,
  )
  assert(!parseMeasurementCsvRow('3600;21,5;55;1013', dialect, context).ok)
  assert(!parseMeasurementCsvRow('3600;21.5;55;1013', commaDecimal, context).ok)
})

Deno.test('CSV: spazi nei numeri, segno ed esponente decimale espliciti', () => {
  const result = valid(parseMeasurementCsvRow(' 3.6e3 ;" +21.5 "; 55 ;1.01325e3', dialect, context))
  assert(result.measurement.arduino_seconds === 3600)
  assert(result.measurement.temperature_c === 21.5 && result.measurement.pressure_hpa === 1013.25)
})

Deno.test('CSV: mai autodetect del dialetto o salti automatici di intestazioni e righe vuote', () => {
  for (const row of ['', 'secondi;temperatura;umidita;pressione', '3600,21.5,55,1013.25']) {
    const result = parseMeasurementCsvRow(row, dialect, context)
    assert(!result.ok && result.stage === 'csv')
    assert(result.raw_row === row)
  }
  const result = parseMeasurementCsvRow('1;2;3;4', {} as CsvDialect, context)
  assert(!result.ok && result.issues[0].code === 'invalid_dialect')
})

Deno.test('CSV: rifiuta colonne aggiuntive o mancanti conservando la riga', () => {
  for (const row of ['1;2;3', '1;2;3;4;5', '1;2;3;4;']) {
    const result = parseMeasurementCsvRow(row, dialect, context)
    assert(!result.ok && result.issues[0].code === 'invalid_column_count')
    assert(result.raw_row === row)
  }
})

Deno.test('CSV: virgolette non chiuse, testo dopo quote, multilinea e BOM richiedono diagnosi', () => {
  for (
    const row of [
      '1;"2;3;4',
      '1;2";3;4',
      '1;"2"x;3;4',
      '1;2;3;4\n',
      '1;2;3;4\r\n',
      '\uFEFF1;2;3;4',
      '1;"2\n";3;4',
    ]
  ) {
    const result = parseMeasurementCsvRow(row, dialect, context)
    assert(!result.ok && result.issues[0].code === 'invalid_csv')
    assert(result.raw_row === row)
  }
  const escapedQuote = parseMeasurementCsvRow('1;"2""3";3;4', dialect, context)
  assert(!escapedQuote.ok && escapedQuote.issues[0].code === 'invalid_number')
})

Deno.test('CSV: null solo con policy vuoti esplicita, uptime mai assente', () => {
  assert(!parseMeasurementCsvRow('1;;55;1013', dialect, context).ok)
  const nullable: CsvDialect = { ...dialect, empty_measurement: 'null' }
  const result = valid(parseMeasurementCsvRow('1; ;"";', nullable, context))
  assert(result.measurement.temperature_c === null && result.measurement.pressure_hpa === null)
  assert(result.quality_flags.length === 3)
  assert(!parseMeasurementCsvRow(';21;55;1013', nullable, context).ok)
  assert(valid(parseMeasurementCsvRow('0;0;0;1', nullable, context)).quality_flags.length === 0)
})

Deno.test('CSV: numeri interamente validi, nessuna lettura parziale o conversione di sentinelle', () => {
  for (
    const token of [
      '21°C',
      '55%',
      '1013hPa',
      'N/A',
      'null',
      'NaN',
      'Infinity',
      '0x10',
      '12abc',
      '1 000',
      '1e999',
      '1e-999',
      '1,013.25',
    ]
  ) {
    const result = parseMeasurementCsvRow(`1;${token};55;1013`, dialect, context)
    assert(
      !result.ok && result.issues[0].field === 'temperature_c' &&
        result.issues[0].code === 'invalid_number',
    )
  }
  const suspicious = valid(parseMeasurementCsvRow('1;-999;110;-5', dialect, context))
  assert(suspicious.measurement.temperature_c === -999)
  assert(suspicious.quality_flags.length === 3)
  assert(suspicious.quality_flags.every((flag) => flag.label === 'probabile errato'))
})

Deno.test('CSV: validazione condivisa anche per uptime e metadati, senza creazione implicita di ID o ora', () => {
  for (const row of ['-1;21;55;1013', '9007199254740992;21;55;1013']) {
    const result = parseMeasurementCsvRow(row, dialect, context)
    assert(
      !result.ok && result.stage === 'measurement' && result.issues[0].field === 'arduino_seconds',
    )
  }
  const result = parseMeasurementCsvRow('1;21;55;1013', dialect, { ...context, captured_at: null })
  assert(!result.ok && result.stage === 'measurement')
  assert(!parseMeasurementCsvRow('1;21;55;1013', dialect, { ...context, ingestion_id: '' }).ok)
})

Deno.test('CSV: storico, retry, reset e righe identiche rispettano provenienza e identità esplicite', () => {
  const historical: CsvEventContext = {
    ...context,
    acquisition_kind: 'historical',
    captured_at: null,
  }
  const row = '0;21;55;1013'
  const first = valid(parseMeasurementCsvRow(row, dialect, historical))
  const retry = valid(parseMeasurementCsvRow(row, dialect, historical))
  assert(first.measurement.captured_at === null && first.measurement.measured_at === null)
  assert(
    canonicalMeasurementContent(first.measurement) ===
      canonicalMeasurementContent(retry.measurement),
  )
  const another = valid(parseMeasurementCsvRow(row, dialect, {
    ...historical,
    ingestion_id: '12345678-1234-4234-8234-123456789abd',
  }))
  assert(
    canonicalMeasurementContent(first.measurement) !==
      canonicalMeasurementContent(another.measurement),
  )
  assert(first.raw_row === another.raw_row)
  assert(!('boot_id' in first.measurement) && !('received_at' in first.measurement))
})

Deno.test('CSV: measured_at solo se attestato dal chiamante, mai dedotto', () => {
  const attested = valid(parseMeasurementCsvRow('1;21;55;1013', dialect, {
    ...context,
    measured_at: '2026-10-22T07:58:00.000Z',
  }))
  assert(attested.measurement.measured_at === '2026-10-22T07:58:00.000Z')
  // Il contratto normalizza gli istanti a millisecondi UTC.
  assert(attested.measurement.captured_at === '2026-10-22T08:00:00.000Z')
  const implicit = valid(parseMeasurementCsvRow('1;21;55;1013', dialect, context))
  assert(implicit.measurement.measured_at === null)
  // Un'ora di misura non è ammessa per i campioni sintetici.
  const synthetic = parseMeasurementCsvRow('1;21;55;1013', dialect, {
    ...context,
    acquisition_kind: 'synthetic',
    measured_at: '2026-10-22T07:58:00.000Z',
  })
  assert(!synthetic.ok && synthetic.stage === 'measurement')
})
