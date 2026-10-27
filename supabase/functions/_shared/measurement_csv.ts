import {
  type Measurement,
  type QualityRanges,
  validateMeasurement,
  type ValidationIssue,
  type ValidationResult,
} from './measurement.ts'

/** Nessun valore predefinito: il formato della stazione va verificato su un campione. */
export interface CsvDialect {
  delimiter: ',' | ';' | '\t' | '|'
  decimal_separator: '.' | ','
  empty_measurement: 'reject' | 'null'
}

export interface CsvEventContext extends
  Pick<
    Measurement,
    'source_id' | 'ingestion_id' | 'acquisition_kind' | 'captured_at'
  > {
  /** Eventuale ora di misura attestata dalla sorgente; assente se non disponibile. */
  measured_at?: string | null
}

export interface CsvIssue {
  field: '$' | 'arduino_seconds' | 'temperature_c' | 'humidity_pct' | 'pressure_hpa'
  code: 'invalid_dialect' | 'invalid_csv' | 'invalid_column_count' | 'invalid_number'
}

export type CsvMeasurementResult =
  | (Extract<ValidationResult, { ok: true }> & { raw_row: string })
  | { ok: false; raw_row: string; stage: 'csv'; issues: CsvIssue[] }
  | { ok: false; raw_row: string; stage: 'measurement'; issues: ValidationIssue[] }

/** Una sola riga già delimitata e completa, senza terminatore; nessun monitor del file. */
function splitRow(row: string, delimiter: string): string[] | undefined {
  if (/[\r\n\uFEFF]/.test(row)) return undefined
  const cells: string[] = []
  let cell = ''
  let quoted = false
  let closed = false
  for (let index = 0; index < row.length; index++) {
    const character = row[index]
    if (quoted) {
      if (character === '"') {
        if (row[index + 1] === '"') {
          cell += '"'
          index++
        } else {
          quoted = false
          closed = true
        }
      } else cell += character
    } else if (character === delimiter) {
      cells.push(cell)
      cell = ''
      closed = false
    } else if (closed) {
      return undefined
    } else if (character === '"') {
      if (cell !== '') return undefined
      quoted = true
    } else cell += character
  }
  if (quoted) return undefined
  cells.push(cell)
  return cells
}

/** Adattatore provvisorio senza I/O. Non scarta intestazioni o righe errate in silenzio. */
export function parseMeasurementCsvRow(
  rawRow: string,
  dialect: CsvDialect,
  context: CsvEventContext,
  ranges: QualityRanges = {},
): CsvMeasurementResult {
  const fail = (issues: CsvIssue[]): CsvMeasurementResult => ({
    ok: false,
    raw_row: rawRow,
    stage: 'csv',
    issues,
  })
  if (
    !dialect || ![',', ';', '\t', '|'].includes(dialect.delimiter) ||
    !['.', ','].includes(dialect.decimal_separator) ||
    !['reject', 'null'].includes(dialect.empty_measurement)
  ) return fail([{ field: '$', code: 'invalid_dialect' }])
  const cells = splitRow(rawRow, dialect.delimiter)
  if (!cells) return fail([{ field: '$', code: 'invalid_csv' }])
  if (cells.length !== 4) return fail([{ field: '$', code: 'invalid_column_count' }])
  const fields = ['arduino_seconds', 'temperature_c', 'humidity_pct', 'pressure_hpa'] as const
  const values: (number | null)[] = []
  const issues: CsvIssue[] = []
  const numericPattern = dialect.decimal_separator === '.'
    ? /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/
    : /^[+-]?(?:\d+(?:,\d+)?|,\d+)(?:[eE][+-]?\d+)?$/
  for (const [index, field] of fields.entries()) {
    const token = cells[index].trim()
    if (token === '' && index > 0 && dialect.empty_measurement === 'null') {
      values.push(null)
      continue
    }
    const normalized = token.replace(',', '.')
    const value = Number(normalized)
    const underflow = value === 0 && /[1-9]/.test(normalized.split(/[eE]/)[0])
    if (!numericPattern.test(token) || !Number.isFinite(value) || underflow) {
      issues.push({ field, code: 'invalid_number' })
    }
    values.push(value)
  }
  if (issues.length > 0) return fail(issues)
  const result = validateMeasurement({
    schema_version: 1,
    source_id: context.source_id,
    ingestion_id: context.ingestion_id,
    arduino_seconds: values[0],
    temperature_c: values[1],
    humidity_pct: values[2],
    pressure_hpa: values[3],
    acquisition_kind: context.acquisition_kind,
    captured_at: context.captured_at,
    // Il CSV v1 non contiene un'ora assoluta: measured_at è solo quello attestato
    // dal chiamante (writer o orologio della sorgente), mai dedotto o inventato.
    measured_at: context.measured_at ?? null,
    ...(context.acquisition_kind === 'synthetic' ? { _provenance: { kind: 'synthetic' } } : {}),
  }, ranges)
  return result.ok
    ? { ...result, raw_row: rawRow }
    : { ...result, raw_row: rawRow, stage: 'measurement' }
}
