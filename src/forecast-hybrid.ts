import { isSuspect, metrics } from './weather.ts'
import type { Measurement, Metric } from './weather.ts'
import { horizons, type ForecastEstimate, type ForecastRun } from './forecast.ts'
import type { ProviderForecast, ProviderHour } from './forecast-provider.ts'

const hour = 60 * 60_000
const bounds: Record<Metric, number> = { temperature_c: 3, humidity_pct: 12, pressure_hpa: 6 }
const correctionWeight = 0.25

function valueAt(hours: ProviderHour[], metric: Metric, time: number): number | null {
  let right = hours.findIndex(point => point.time >= time)
  if (right < 0) right = hours.length
  const leftPoint = hours[right - 1]
  const rightPoint = hours[right]
  const key = metric
  if (leftPoint?.time === time) return leftPoint[key]
  if (!leftPoint || !rightPoint || rightPoint.time - leftPoint.time > 2 * hour ||
    leftPoint[key] === null || rightPoint[key] === null) return null
  const fraction = (time - leftPoint.time) / (rightPoint.time - leftPoint.time)
  return leftPoint[key]! + fraction * (rightPoint[key]! - leftPoint[key]!)
}

function localCorrection(rows: Measurement[], provider: ProviderForecast, metric: Metric, now: number, target: number): { value: number; origin: string | null; id: string | null; adjusted: boolean } | null {
  const candidates = rows.filter(row => row.acquisition_kind === 'live' || row.acquisition_kind === 'historical')
    .filter(row => row.captured_at && Number.isFinite(Date.parse(row.captured_at)) && Date.parse(row.captured_at!) <= now)
    .sort((a, b) => Date.parse(b.captured_at!) - Date.parse(a.captured_at!))
  for (const row of candidates) {
    const observedAt = Date.parse(row.captured_at!)
    const age = now - observedAt
    const observed = row[metric]
    if (age > 6 * hour || observed === null || isSuspect(row, metric)) continue
    const reference = valueAt(provider.hours, metric, observedAt)
    const base = valueAt(provider.hours, metric, target)
    if (reference === null || base === null) continue
    // Correzione ridotta e limitata: un solo campione recente aiuta a calibrare
    // il livello, ma non può trascinare la previsione lontano dal quadro orario.
    const residual = Math.max(-bounds[metric], Math.min(bounds[metric], observed - reference))
    const adjustment = residual * correctionWeight * Math.exp(-age / (4 * hour)) * Math.exp(-(target - now) / (12 * hour))
    return { value: base + adjustment, origin: row.captured_at, id: row.ingestion_id, adjusted: Math.abs(adjustment) >= 0.01 }
  }
  return null
}

function estimate(rows: Measurement[], provider: ProviderForecast, metric: Metric, hoursAhead: number, now: number): ForecastEstimate {
  const target = now + hoursAhead * hour
  const base = valueAt(provider.hours, metric, target)
  if (base === null) return {
    metric, value: null, reason: 'Il dato orario non è disponibile per questo intervallo.', method: null,
    mae: null, baselineMae: null, cases: 0, selectionCases: 0, origin: provider.generatedAt,
    target: new Date(target).toISOString(), validUntil: new Date(Date.parse(provider.generatedAt) + 6 * hour).toISOString(), lastObservationId: null,
  }
  const local = localCorrection(rows, provider, metric, now, target)
  const rawValue = local?.value ?? base
  const value = metric === 'humidity_pct' ? Math.max(0, Math.min(100, rawValue)) : rawValue
  return {
    metric, value, reason: null, method: local?.adjusted ? 'local-adjustment' : 'provider',
    mae: null, baselineMae: null, cases: 0, selectionCases: 0,
    origin: local?.origin ?? provider.generatedAt, target: new Date(target).toISOString(),
    validUntil: new Date(Date.parse(provider.generatedAt) + 6 * hour).toISOString(), lastObservationId: local?.id ?? null,
  }
}

/** Base oraria per Pavia, con una correzione locale prudente quando c’è una lettura recente. */
export function buildHybridForecast(rows: Measurement[], provider: ProviderForecast, now: number): ForecastRun {
  const inputCount = rows.filter(row => (row.acquisition_kind === 'live' || row.acquisition_kind === 'historical') && row.captured_at).length
  return {
    dataKind: inputCount ? 'physical' : 'none',
    inputCount,
    version: 'station-hybrid-v1',
    generatedAt: provider.generatedAt,
    horizons: horizons.map(horizon => ({ ...horizon, estimates: metrics.map(({ key }) => estimate(rows, provider, key, horizon.hours, now)) })),
  }
}
