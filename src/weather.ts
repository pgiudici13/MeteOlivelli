// Contratto pubblico BE-06. Nessun import del runtime server nel browser.
export type Period = '24h' | '7g' | '14g' | '30g'
export type ChartMode = Period | 'auto'
export type Metric = 'temperature_c' | 'humidity_pct' | 'pressure_hpa'
export interface QualityFlag {
  field: Metric
  code: 'missing_value' | 'outside_physical_bounds' | 'outside_configured_range'
  label: 'dato assente' | 'probabile errato'
  reason: string
}
export interface Measurement {
  acquisition_kind?: 'live' | 'historical' | 'synthetic'
  ingestion_id: string
  temperature_c: number | null
  humidity_pct: number | null
  pressure_hpa: number | null
  captured_at: string | null
  measured_at: string | null
  received_at: string
  quality_flags: QualityFlag[]
}
export interface ReadPage {
  items: Measurement[]
  next_cursor: string | null
  until: string
  time_basis: 'captured_at' | 'measured_at'
}
/** La dashboard finale mostra solo campioni con provenienza della stazione esplicita. */
export function stationMeasurements(rows: Measurement[]): Measurement[] {
  return rows.filter(row => row.acquisition_kind === 'live' || row.acquisition_kind === 'historical')
}

function timestampKey(time: string): string {
  return time.replace(/\+00:00$/, 'Z')
    .replace(/(?:\.(\d{1,6}))?Z$/, (_, fraction: string = '') => `.${fraction.padEnd(6, '0')}Z`)
}
export function isAfterServerTime(value: string, serverUntil: string): boolean {
  return timestampKey(value) > timestampKey(serverUntil)
}

/** L'ancoraggio non può superare il tempo del server, neppure per arrotondamento. */
export function historyAnchor(capturedAt: string | null | undefined, serverUntil: string): string | null {
  if (!capturedAt) return null
  const time = Date.parse(capturedAt)
  const serverTime = Date.parse(serverUntil)
  if (!Number.isFinite(time) || !Number.isFinite(serverTime) || isAfterServerTime(capturedAt, serverUntil)) return null
  const fraction = capturedAt.match(/\.(\d+)/)?.[1] ?? ''
  return new Date(Math.min(serverTime, time + (/[1-9]/.test(fraction.slice(3)) ? 1 : 0))).toISOString()
}
export const metrics = [
  { key: 'temperature_c', name: 'Temperatura', unit: '°C', tone: 'mint' },
  { key: 'humidity_pct', name: 'Umidità', unit: '%', tone: 'blue' },
  { key: 'pressure_hpa', name: 'Pressione', unit: 'hPa', tone: 'lilac' },
] as const
export const periods: { value: ChartMode; label: string }[] = [
  { value: 'auto', label: 'Auto' }, { value: '24h', label: '24 ore' }, { value: '7g', label: '7 giorni' }, { value: '14g', label: '14 giorni' }, { value: '30g', label: '30 giorni' },
]
// URL pubblico già verificato in BE-07; non richiede chiavi o token client.
export const READ_ENDPOINT = 'https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/read-measurements'
const metricKeys = new Set<string>(metrics.map(metric => metric.key))
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const match = /^(?!0000)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(?:Z|\+00:00)$/.exec(value)
  if (!match || !Number.isFinite(Date.parse(value))) return false
  const canonical = `${match[1]}.${(match[2] ?? '').padEnd(3, '0').slice(0, 3)}Z`
  return new Date(value).toISOString() === canonical
}

export function parsePage(value: unknown): ReadPage {
  if (!isObject(value) || !Array.isArray(value.items) || value.items.length > 500 ||
    !['captured_at', 'measured_at'].includes(String(value.time_basis)) || !isTimestamp(value.until) ||
    !(value.next_cursor === null || (typeof value.next_cursor === 'string' && value.next_cursor.length > 0 && value.next_cursor.length <= 512))) {
    throw new Error('Risposta non valida')
  }
  const items = value.items.map((row: unknown): Measurement => {
    if (!isObject(row) || (row.acquisition_kind !== undefined && !['live', 'historical', 'synthetic'].includes(String(row.acquisition_kind))) || typeof row.ingestion_id !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(row.ingestion_id) ||
      !metrics.every(({ key }) => row[key] === null || (typeof row[key] === 'number' && Number.isFinite(row[key]))) ||
      !(row.captured_at === null || isTimestamp(row.captured_at)) ||
      !(row.measured_at === null || isTimestamp(row.measured_at)) || !isTimestamp(row.received_at) ||
      !Array.isArray(row.quality_flags) || !row.quality_flags.every((flag: unknown) =>
        isObject(flag) && typeof flag.field === 'string' && metricKeys.has(flag.field) &&
        ['missing_value', 'outside_physical_bounds', 'outside_configured_range'].includes(String(flag.code)) &&
        ['dato assente', 'probabile errato'].includes(String(flag.label)) && typeof flag.reason === 'string')) {
      throw new Error('Misura non valida')
    }
    // Proiezione esplicita: nessun campo interno propagato ai componenti.
    return {
      ...(row.acquisition_kind === undefined ? {} : { acquisition_kind: row.acquisition_kind as Measurement['acquisition_kind'] }),
      ingestion_id: row.ingestion_id, temperature_c: row.temperature_c as number | null,
      humidity_pct: row.humidity_pct as number | null, pressure_hpa: row.pressure_hpa as number | null,
      captured_at: row.captured_at, measured_at: row.measured_at, received_at: row.received_at,
      quality_flags: row.quality_flags as QualityFlag[],
    }
  })
  return { items, next_cursor: value.next_cursor, until: value.until, time_basis: value.time_basis as ReadPage['time_basis'] }
}

export async function readPage(params: URLSearchParams, signal: AbortSignal, request: typeof fetch = fetch): Promise<ReadPage> {
  const response = await request(`${READ_ENDPOINT}?${params}`, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    credentials: 'omit', headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    await response.body?.cancel()
    throw new Error('Letture temporaneamente non disponibili')
  }
  return parsePage(await response.json())
}
export type PageReader = typeof readPage

/** Ordine della cronologia: confrontare i microsecondi prima dello spareggio UUID. */
export function compareHistoryMeasurements(a: Measurement, b: Measurement): number {
  const aTime = timestampKey(a.captured_at ?? a.received_at)
  const bTime = timestampKey(b.captured_at ?? b.received_at)
  return (aTime < bTime ? -1 : aTime > bTime ? 1 : 0) || a.ingestion_id.localeCompare(b.ingestion_id)
}

export interface HistoryDay { key: string; label: string; rows: Measurement[] }
const romeDayParts = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' })
const romeDayLabel = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', year: 'numeric', month: 'long', day: 'numeric' })
function localDay(value: string): string {
  const parts = Object.fromEntries(romeDayParts.formatToParts(new Date(value)).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
/** Raggruppa le righe per giorno civile di Pavia; usa received_at solo se manca captured_at. */
export function groupHistoryByLocalDay(rows: Measurement[]): HistoryDay[] {
  const days: HistoryDay[] = []
  for (const row of rows) {
    const timestamp = row.captured_at ?? row.received_at
    const key = localDay(timestamp)
    let day = days.at(-1)
    if (!day || day.key !== key) {
      day = { key, label: romeDayLabel.format(new Date(timestamp)), rows: [] }
      days.push(day)
    }
    day.rows.push(row)
  }
  return days
}

/** Cronologia completa, inclusi i record senza ora di acquisizione. */
export async function readAllHistory(signal: AbortSignal, reader: PageReader = readPage): Promise<Measurement[]> {
  const items = new Map<string, Measurement>()
  const cursors = new Set<string>()
  let cursor: string | null = null
  let until: string | null = null
  for (;;) {
    const params = new URLSearchParams({ view: 'history', period: 'all', basis: 'captured_at', limit: '500' })
    if (cursor) params.set('cursor', cursor)
    const result = await reader(params, signal)
    if (result.time_basis !== 'captured_at') throw new Error('Base temporale dello storico incoerente')
    if (until !== null && result.until !== until) throw new Error('Finestra dello storico incoerente')
    until = result.until
    for (const item of result.items) items.set(item.ingestion_id, item)
    if (!result.next_cursor) break
    if (cursors.has(result.next_cursor)) throw new Error('Cursore ripetuto')
    cursor = result.next_cursor
    cursors.add(cursor)
  }
  return [...items.values()].sort(compareHistoryMeasurements)
}

/** Rilettura integrale costosa: gli stimoli automatici di rete/visibilità sono limitati. */
export const HISTORY_AUTO_REFRESH_MIN_MS = 60000
export function shouldAutoRefreshHistory(
  lastRefreshAt: number,
  now: number,
  minIntervalMs: number = HISTORY_AUTO_REFRESH_MIN_MS,
): boolean {
  return !Number.isFinite(lastRefreshAt) || now - lastRefreshAt >= minIntervalMs
}

export async function readHistory(period: Period, signal: AbortSignal, reader: PageReader = readPage, basis: 'captured_at' | 'measured_at' = 'captured_at'): Promise<Measurement[]> {
  const items = new Map<string, Measurement>()
  const cursors = new Set<string>()
  let cursor: string | null = null
  let until: string | null = null
  // Limite conservativo: oltre 50.000 eventi fallire esplicitamente, mai mostrare una serie troncata come completa.
  for (let page = 0; page < 100; page++) {
    // L'API ha finestre 24h/7g/30g; 14g riusa la lettura 30g e viene tagliata localmente.
    const apiPeriod = period === '14g' ? '30g' : period
    const params = new URLSearchParams({ view: 'history', period: apiPeriod, basis, limit: '500' })
    if (cursor) params.set('cursor', cursor)
    const result = await reader(params, signal)
    if (result.time_basis !== basis) throw new Error('Base temporale dello storico incoerente')
    if (until !== null && result.until !== until) throw new Error('Finestra dello storico incoerente')
    until = result.until
    for (const item of result.items) {
      if (!item[basis]) throw new Error('Acquisizione non datata nello storico')
      items.set(item.ingestion_id, item)
    }
    if (!result.next_cursor) {
      const sorted = [...items.values()].sort((a, b) => compareMeasurements(a, b, basis))
      if (period !== '14g') return sorted
      const cutoff = Date.parse(until!) - 336 * 3600000
      return sorted.filter(item => Date.parse(item[basis]!) >= cutoff)
    }
    if (cursors.has(result.next_cursor)) throw new Error('Cursore ripetuto')
    cursor = result.next_cursor
    cursors.add(cursor)
  }
  throw new Error('Storico oltre il limite di consultazione')
}

export function compareMeasurements(a: Measurement, b: Measurement, basis: ReadPage['time_basis'] = 'captured_at'): number {
  const aTime = timestampKey(a[basis] ?? '')
  const bTime = timestampKey(b[basis] ?? '')
  return (aTime < bTime ? -1 : aTime > bTime ? 1 : 0) || a.ingestion_id.localeCompare(b.ingestion_id)
}
export function trimHistory(rows: Measurement[], period: Period, serverUntil: string): Measurement[] {
  const duration = (period === '24h' ? 24 : period === '7g' ? 168 : period === '14g' ? 336 : 720) * 3600000
  const start = Date.parse(serverUntil) - duration
  return rows.filter(row => row.captured_at !== null && Date.parse(row.captured_at) >= start)
}
export function isSuspect(row: Measurement, field: Metric): boolean {
  return row.quality_flags.some(flag => flag.field === field && flag.code !== 'missing_value')
}
export function formatValue(value: number | null): string {
  return value === null ? 'Dato assente' : new Intl.NumberFormat('it-IT', { useGrouping: false, minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)
}
export function formatTime(value: string | null, short = false): string {
  if (!value) return 'Orario sconosciuto'
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome', ...(short ? {} : { day: '2-digit', month: 'short', year: 'numeric' }),
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}
export type Freshness = 'empty' | 'unknown' | 'current' | 'delayed'
export function getFreshness(row: Measurement | null, now: number, verifiedCadenceMs: number | null): Freshness {
  if (!row) return 'empty'
  if (row.acquisition_kind === 'synthetic') return 'unknown'
  // received_at e captured_at non sostituiscono l'ora fisica della misura.
  if (!row.measured_at || !verifiedCadenceMs || verifiedCadenceMs <= 0 || !Number.isFinite(verifiedCadenceMs)) return 'unknown'
  const measured = Date.parse(row.measured_at)
  if (!Number.isFinite(measured) || measured > now) return 'unknown'
  return now > measured + verifiedCadenceMs + 20 * 60000 ? 'delayed' : 'current'
}

export interface StationStatusInput {
  latestLoaded: boolean
  invalidLatestTime: boolean
  latestError: boolean
  freshness: Freshness
  historicalOnly: boolean
}
/** Stato della stazione per l’utente; le sole importazioni storiche non sono letture recenti. */
export function stationStatusText(input: StationStatusInput): string {
  if (!input.latestLoaded) return 'Caricamento delle misure…'
  if (input.invalidLatestTime) return 'Orario dell’ultima acquisizione non valido'
  if (input.latestError) return 'Aggiornamento non riuscito'
  if (input.freshness === 'empty') return input.historicalOnly ? 'Solo dati storici disponibili' : 'Nessuna misura disponibile'
  if (input.freshness === 'delayed') return 'Stazione in ritardo'
  if (input.freshness === 'current') return 'Misure aggiornate'
  return 'Freschezza non determinabile'
}

// Ogni valore nullo/sospetto interrompe la linea; i valori originali restano nella tabella.
export function chartSegments(rows: Measurement[], field: Metric): Measurement[][] {
  const result: Measurement[][] = []
  let current: Measurement[] = []
  for (const row of rows) {
    if (row[field] === null || isSuspect(row, field) || !row.captured_at) {
      if (current.length) result.push(current)
      current = []
    } else current.push(row)
  }
  if (current.length) result.push(current)
  return result
}
