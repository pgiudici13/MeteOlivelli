/** Contratto locale v1; nessun accesso a rete, clock, file o ambiente. */
export type Metric = 'temperature_c' | 'humidity_pct' | 'pressure_hpa'

export interface Measurement {
  schema_version: 1
  source_id: string
  ingestion_id: string
  arduino_seconds: number
  temperature_c: number | null
  humidity_pct: number | null
  pressure_hpa: number | null
  acquisition_kind: 'live' | 'historical' | 'synthetic'
  captured_at: string | null
  measured_at: string | null
  _provenance?: { kind: 'synthetic' }
  _entry_method?: 'manual'
}

export interface QualityFlag {
  field: Metric
  code: 'missing_value' | 'outside_physical_bounds' | 'outside_configured_range'
  label: 'dato assente' | 'probabile errato'
  reason: string
}

export interface ValidationIssue {
  field: string
  code:
    | 'invalid_json'
    | 'invalid_object'
    | 'missing_field'
    | 'unknown_field'
    | 'unsupported_version'
    | 'invalid_identifier'
    | 'invalid_number'
    | 'invalid_timestamp'
    | 'invalid_acquisition_kind'
    | 'inconsistent_time'
    | 'invalid_provenance'
}

export type ValidationResult =
  | { ok: true; measurement: Measurement; quality_flags: QualityFlag[] }
  | { ok: false; issues: ValidationIssue[] }

export type QualityRanges = Partial<Record<Metric, { min: number; max: number }>>

const metrics: Metric[] = ['temperature_c', 'humidity_pct', 'pressure_hpa']
const fields = [
  'schema_version',
  'source_id',
  'ingestion_id',
  'arduino_seconds',
  ...metrics,
  'acquisition_kind',
  'captured_at',
  'measured_at',
]
const knownFields = [...fields, '_provenance']

/** Solo UTC esplicito, precisione massima al millisecondo; niente rollover di date invalide. */
function normalizeTimestamp(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string') return undefined
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) {
    return undefined
  }
  // PostgreSQL non ammette l'anno zero: rifiutarlo prima della persistenza.
  if (value.startsWith('0000-')) return undefined
  const milliseconds = Date.parse(value)
  if (!Number.isFinite(milliseconds)) return undefined
  const normalized = new Date(milliseconds).toISOString()
  const expected = value.includes('.')
    ? value.replace(/\.(\d{1,3})Z$/, (_, fraction: string) => `.${fraction.padEnd(3, '0')}Z`)
    : value.replace('Z', '.000Z')
  return normalized === expected ? normalized : undefined
}

function classifyQuality(measurement: Measurement, ranges: QualityRanges): QualityFlag[] {
  const flags: QualityFlag[] = []
  for (const field of metrics) {
    const range = ranges[field]
    if (
      range && (!Number.isFinite(range.min) || !Number.isFinite(range.max) || range.min > range.max)
    ) {
      throw new Error(`Intervallo di qualità non valido per ${field}`)
    }
    const value = measurement[field]
    if (value === null) {
      flags.push({
        field,
        code: 'missing_value',
        label: 'dato assente',
        reason: 'Valore non disponibile.',
      })
      continue
    }
    const outsidePhysicalBounds = (field === 'humidity_pct' && (value < 0 || value > 100)) ||
      (field === 'pressure_hpa' && value <= 0) ||
      (field === 'temperature_c' && value < -273.15)
    if (outsidePhysicalBounds) {
      flags.push({
        field,
        code: 'outside_physical_bounds',
        label: 'probabile errato',
        reason: 'Valore fuori dai limiti fisici della grandezza dichiarata.',
      })
    } else if (range && (value < range.min || value > range.max)) {
      flags.push({
        field,
        code: 'outside_configured_range',
        label: 'probabile errato',
        reason: 'Valore fuori dall’intervallo di qualità configurato.',
      })
    }
  }
  return flags
}

/** I numeri sospetti restano intatti; stringhe numeriche e unità implicite sono rifiutate. */
export function validateMeasurement(input: unknown, ranges: QualityRanges = {}): ValidationResult {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, issues: [{ field: '$', code: 'invalid_object' }] }
  }
  const data = input as Record<string, unknown>
  const issues: ValidationIssue[] = []
  const issue = (field: string, code: ValidationIssue['code']) => issues.push({ field, code })
  for (const field of fields) {
    if (!Object.hasOwn(data, field)) issue(field, 'missing_field')
  }
  // Non riportare nomi arbitrari inviati dal client nei messaggi diagnostici.
  if (Object.keys(data).some((field) => !knownFields.includes(field))) issue('$', 'unknown_field')
  if (data.schema_version !== 1) issue('schema_version', 'unsupported_version')
  if (typeof data.source_id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(data.source_id)) {
    issue('source_id', 'invalid_identifier')
  }
  if (
    typeof data.ingestion_id !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      data.ingestion_id,
    )
  ) issue('ingestion_id', 'invalid_identifier')
  if (
    typeof data.arduino_seconds !== 'number' || !Number.isFinite(data.arduino_seconds) ||
    data.arduino_seconds < 0 || data.arduino_seconds > Number.MAX_SAFE_INTEGER
  ) issue('arduino_seconds', 'invalid_number')
  for (const field of metrics) {
    const value = data[field]
    if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) {
      issue(field, 'invalid_number')
    }
  }
  if (
    data.acquisition_kind !== 'live' && data.acquisition_kind !== 'historical' &&
    data.acquisition_kind !== 'synthetic'
  ) {
    issue('acquisition_kind', 'invalid_acquisition_kind')
  }
  const provenance = data._provenance
  if (data.acquisition_kind === 'synthetic') {
    if (
      provenance === null || typeof provenance !== 'object' || Array.isArray(provenance) ||
      Object.keys(provenance).length !== 1 ||
      (provenance as Record<string, unknown>).kind !== 'synthetic'
    ) {
      issue('_provenance', 'invalid_provenance')
    }
  } else if (provenance !== undefined) {
    issue('_provenance', 'invalid_provenance')
  }
  const capturedAt = normalizeTimestamp(data.captured_at)
  const measuredAt = normalizeTimestamp(data.measured_at)
  if (capturedAt === undefined) issue('captured_at', 'invalid_timestamp')
  if (measuredAt === undefined) issue('measured_at', 'invalid_timestamp')
  if (data.acquisition_kind === 'live' && capturedAt === null) {
    issue('captured_at', 'inconsistent_time')
  }
  // v1 importa lo storico senza una provenienza verificata dell'ora originale sul PC.
  if (data.acquisition_kind === 'historical' && typeof capturedAt === 'string') {
    issue('captured_at', 'inconsistent_time')
  }
  if (
    data.acquisition_kind === 'synthetic' &&
    (typeof capturedAt !== 'string' || measuredAt !== null)
  ) {
    issue('captured_at', 'inconsistent_time')
  }
  if (issues.length > 0) return { ok: false, issues }

  const measurement: Measurement = {
    schema_version: 1,
    source_id: data.source_id as string,
    ingestion_id: (data.ingestion_id as string).toLowerCase(),
    arduino_seconds: data.arduino_seconds as number,
    temperature_c: data.temperature_c as number | null,
    humidity_pct: data.humidity_pct as number | null,
    pressure_hpa: data.pressure_hpa as number | null,
    acquisition_kind: data.acquisition_kind as Measurement['acquisition_kind'],
    captured_at: capturedAt as string | null,
    measured_at: measuredAt as string | null,
    ...(data.acquisition_kind === 'synthetic'
      ? { _provenance: { kind: 'synthetic' as const } }
      : {}),
  }
  return { ok: true, measurement, quality_flags: classifyQuality(measurement, ranges) }
}

export function parseMeasurementJson(body: string, ranges: QualityRanges = {}): ValidationResult {
  let input: unknown
  try {
    input = JSON.parse(body)
  } catch {
    return { ok: false, issues: [{ field: '$', code: 'invalid_json' }] }
  }
  return validateMeasurement(input, ranges)
}

/** Da usare solo su eventi validati. Non implementa persistenza o unicità nel DB. */
export function canonicalMeasurementContent(measurement: Measurement): string {
  const contentFields = measurement.acquisition_kind === 'synthetic' ? knownFields : fields
  return JSON.stringify(contentFields.map((field) => measurement[field as keyof Measurement]))
}
