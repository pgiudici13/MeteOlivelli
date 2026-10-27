import { isSuspect, metrics } from './weather.ts'
import type { Measurement, Metric } from './weather.ts'

export const FORECAST_VERSION = 'station-statistical-v3'
export const horizons = [
  { hours: 1, label: '+1 ora' },
  { hours: 6, label: '+6 ore' },
  { hours: 24, label: 'Giornata · +24 ore' },
] as const
export const methodNames = {
  persistence: 'Ultimo valore', trend: 'Tendenza recente smorzata', daily: 'Ciclo di 24 ore corretto',
} as const
export type Method = keyof typeof methodNames
interface Point { time: number; value: number; received: number }
export interface ForecastEstimate {
  metric: Metric
  value: number | null
  reason: string | null
  method: Method | null
  mae: number | null
  baselineMae: number | null
  cases: number
  selectionCases: number
  origin: string | null
  target: string | null
  validUntil: string | null
  lastObservationId: string | null
}
export interface ForecastRun {
  version: string
  dataKind: 'physical' | 'synthetic' | 'none'
  generatedAt: string
  inputCount: number
  horizons: { hours: number; label: string; estimates: ForecastEstimate[] }[]
}
const simulationHorizons = [
  { hours: 1, label: '+1 ora · simulazione' },
  { hours: 6, label: '+6 ore · simulazione' },
  { hours: 24, label: 'Giornata · +24 ore · simulazione' },
] as const
const hour = 3600000
const methods: Method[] = ['persistence', 'trend', 'daily']
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
const median = (values: number[]) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const iso = (time: number) => new Date(time).toISOString()
const physical = (metric: Metric, value: number) => Number.isFinite(value) &&
  (metric === 'humidity_pct' ? value >= 0 && value <= 100 : metric === 'pressure_hpa' ? value > 0 : value >= -273.15)

function nearest(points: Point[], time: number, tolerance: number, end = points.length): Point | null {
  let low = 0
  let high = end
  while (low < high) {
    const middle = (low + high) >>> 1
    if (points[middle].time < time) low = middle + 1
    else high = middle
  }
  const candidates = [low - 1, low].filter(index => index >= 0 && index < end).map(index => points[index])
  const best = candidates.sort((a, b) => Math.abs(a.time - time) - Math.abs(b.time - time))[0]
  return best && Math.abs(best.time - time) <= tolerance ? best : null
}

function predict(points: Point[], end: number, hours: number, method: Method, cadence: number, tolerance: number): number | null {
  const last = points[end - 1]
  if (!last) return null
  if (method === 'persistence') return last.value
  if (method === 'daily') {
    const target = last.time + hours * hour
    const season = target - Math.ceil(hours / 24) * 24 * hour
    const seasonal = nearest(points, season, tolerance, end)
    const yesterday = nearest(points, last.time - 24 * hour, tolerance, end)
    return seasonal && yesterday ? seasonal.value + (last.value - yesterday.value) * 0.5 : null
  }
  if (hours === 1 && cadence > 30 * 60000) return null
  const recent: Point[] = []
  for (let i = end - 1; i >= 0 && points[i].time >= last.time - 3 * hour; i--) {
    if (i < end - 1 && points[i + 1].time - points[i].time > cadence * 2) break
    recent.push(points[i])
  }
  if (recent.length < 4 || last.time - recent.at(-1)!.time < hour) return null
  const recentValues = recent.map(point => point.value)
  // La tendenza usa solo il segno della variazione recente, non un fit lineare locale.
  const delta = recentValues[0] - recentValues.at(-1)!
  return last.value + Math.sign(delta) * Math.min(Math.abs(delta), delta > 0 ? 0.2 : -0.2) * hours
}

function unavailable(metric: Metric, reason: string): ForecastEstimate {
  return { metric, value: null, reason, method: null, mae: null, baselineMae: null, cases: 0, selectionCases: 0, origin: null, target: null, validUntil: null, lastObservationId: null }
}

function estimate(rows: Measurement[], metric: Metric, hours: number, now: number, basis: 'measured_at' | 'captured_at', minimumCases: number): ForecastEstimate {
  // L’ultima osservazione ammessa governa anche assenze e allarmi del singolo campo.
  const lastRow = rows.at(-1)
  if (!lastRow) return unavailable(metric, 'Servono campioni ammessi con un timestamp valido.')
  if (lastRow[metric] === null || isSuspect(lastRow, metric) || !physical(metric, lastRow[metric])) {
    return unavailable(metric, 'L’ultima osservazione di questa grandezza è assente o sospetta.')
  }
  const points = rows.filter(row => row[metric] !== null && !isSuspect(row, metric) && physical(metric, row[metric]!))
    .map(row => {
      const time = Date.parse(row[basis]!)
      // In una simulazione, la ricezione segue il tempo dello scenario: i record
      // sono stati caricati insieme e received_at descrive solo l'importazione.
      return { time, value: row[metric]!, received: basis === 'captured_at' ? time : Date.parse(row.received_at) }
    })
  const last = points.at(-1)!
  const gaps = points.slice(-49).slice(1).map((point, index) => point.time - points.slice(-49)[index].time)
  const cadence = median(gaps)
  if (!Number.isFinite(cadence) || cadence <= 0) return unavailable(metric, 'Campioni datati insufficienti per valutare il modello.')
  if (cadence > hours * hour) return unavailable(metric, 'La cadenza dei campioni non consente di verificare questo orizzonte.')
  const expires = Math.min(last.time + cadence + 20 * 60000, last.time + hours * hour)
  if (now >= expires) return unavailable(metric, 'Campioni troppo vecchi: in attesa di nuovi dati.')
  const tolerance = Math.min(hours * hour / 10, 5 * 60000)
  // Al massimo 96 origini distanziate almeno quanto l’orizzonte, senza target sovrapposti.
  const spacing = Math.max(hours * hour, (last.time - points[0].time) / 96)
  const cutoff = points[0].time + (last.time - points[0].time) / 2
  const scores: { time: number; target: number; errors: Partial<Record<Method, number>> }[] = []
  let previousOrigin = -Infinity
  for (let i = 3; i < points.length - 1; i++) {
    const origin = points[i]
    if (origin.time - points[0].time < 24 * hour || origin.time - previousOrigin < spacing) continue
    const known = points.slice(0, i + 1).filter(point => point.received <= origin.received)
    const recent = known.slice(-49)
    const localCadence = median(recent.slice(1).map((point, index) => point.time - recent[index].time))
    if (!Number.isFinite(localCadence) || localCadence <= 0 || localCadence > hours * hour) continue
    const localTolerance = Math.min(localCadence / 4, tolerance)
    const actual = nearest(points, origin.time + hours * hour, localTolerance)
    if (!actual || actual.time <= origin.received) continue
    const errors: Partial<Record<Method, number>> = {}
    for (const method of methods) {
      const value = predict(known, known.length, hours, method, localCadence, localTolerance)
      if (value !== null && physical(metric, value)) errors[method] = Math.abs(value - actual.value)
    }
    scores.push({ time: origin.received, target: actual.received, errors })
    previousOrigin = origin.time
  }
  // Gli esiti usati per scegliere il metodo devono essere già noti prima dei test.
  const selection = scores.filter(score => score.target < cutoff)
  const holdout = scores.filter(score => score.time >= cutoff)
  const eligible = methods.filter(method => selection.length >= minimumCases && holdout.length >= minimumCases &&
    selection.every(score => score.errors[method] !== undefined) && holdout.every(score => score.errors[method] !== undefined))
  if (!eligible.length) return unavailable(metric, 'Storico insufficiente: servono confronti datati per selezionare e poi verificare il modello.')
  const mae = (method: Method, sample: typeof scores) => mean(sample.map(score => score.errors[method]!))
  // Si richiede il 5% di miglioramento sulla selezione per lasciare la persistenza.
  let method: Method = 'persistence'
  for (const candidate of eligible) {
    if (mae(candidate, selection) < mae(method, selection) * 0.95) method = candidate
  }
  // La persistenza è il riferimento ingenuo, non una previsione informativa:
  // non riproporre l'ultima misura a tutti gli orizzonti come se fosse un forecast.
  if (method === 'persistence') return unavailable(metric, 'Nessun metodo ha dimostrato un miglioramento rispetto all’ultimo valore; previsione ritirata.')
  const error = mae(method, holdout)
  const baseline = mae('persistence', holdout)
  if (error > baseline) return unavailable(metric, 'Il modello scelto non conferma il miglioramento sui dati di verifica.')
  const value = predict(points, points.length, hours, method, cadence, tolerance)
  if (value === null || !physical(metric, value)) return unavailable(metric, 'Le ultime misure non consentono una stima valida.')
  return { metric, value, reason: null, method, mae: error, baselineMae: baseline, cases: holdout.length, selectionCases: selection.length,
    origin: iso(last.time), target: iso(last.time + hours * hour), validUntil: iso(expires), lastObservationId: lastRow.ingestion_id }
}

/** Valutazione deterministica; i sintetici restano una simulazione separata dalle stime fisiche. */
export function buildForecast(input: Measurement[], now: number): ForecastRun {
  if (!Number.isFinite(now)) throw new Error('Orario di valutazione non valido')
  const physicalInput = input.some(row => ['live', 'historical'].includes(row.acquisition_kind ?? '') && row.measured_at)
  const dataKind: ForecastRun['dataKind'] = physicalInput ? 'physical' : input.some(row => row.acquisition_kind === 'synthetic' && row.captured_at) ? 'synthetic' : 'none'
  const basis = dataKind === 'synthetic' ? 'captured_at' : 'measured_at'
  const selectedHorizons = dataKind === 'synthetic' ? simulationHorizons : horizons
  const byTime = new Map<number, Measurement | null>()
  for (const row of input) {
    if (dataKind === 'synthetic' ? row.acquisition_kind !== 'synthetic' || !row.captured_at : !['live', 'historical'].includes(row.acquisition_kind ?? '') || !row.measured_at) continue
    const time = Date.parse(row[basis]!)
    const received = Date.parse(row.received_at)
    if (!Number.isFinite(time) || !Number.isFinite(received) || time > now || received > now || time > received || time < now - 30 * 24 * hour) continue
    const existing = byTime.get(time)
    // Escludere duplicati temporali ambigui, senza inventare un valore medio.
    byTime.set(time, existing === undefined ? row : existing?.ingestion_id === row.ingestion_id ? existing : null)
  }
  const rows = [...byTime.entries()].sort(([a], [b]) => a - b).flatMap(([, row]) => row ? [row] : [])
  return { version: FORECAST_VERSION, dataKind, generatedAt: iso(now), inputCount: rows.length,
    horizons: selectedHorizons.map(horizon => ({ ...horizon, estimates: metrics.map(({ key }) => estimate(rows, key, horizon.hours, now, basis, dataKind === 'synthetic' ? 4 : 12)) })) }
}
