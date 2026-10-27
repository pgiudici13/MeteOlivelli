import { isSuspect, metrics } from './weather.ts'
import type { Measurement, Metric } from './weather.ts'

export interface WeatherRecord { value: number; measuredAt: string; ingestionId: string }
export type WeatherRecords = Partial<Record<Metric, { minimum: WeatherRecord; maximum: WeatherRecord; count: number }>>

/** Record solo dei campioni fisici verificabili, senza completare lacune temporali. */
export function collectWeatherRecords(rows: Measurement[], serverUntil: string): WeatherRecords {
  const until = Date.parse(serverUntil)
  if (!Number.isFinite(until)) return {}
  const records: WeatherRecords = {}
  for (const row of rows) {
    if (row.acquisition_kind !== 'live' && row.acquisition_kind !== 'historical') continue
    const measuredAt = row.measured_at ?? row.captured_at
    if (!measuredAt) continue
    const time = Date.parse(measuredAt)
    if (!Number.isFinite(time) || time > until) continue
    for (const metric of metrics) {
      const value = row[metric.key]
      if (value === null || !Number.isFinite(value) || isSuspect(row, metric.key)) continue
      const candidate = { value, measuredAt, ingestionId: row.ingestion_id }
      const current = records[metric.key]
      if (!current) records[metric.key] = { minimum: candidate, maximum: candidate, count: 1 }
      else {
        current.count++
        if (value < current.minimum.value || (value === current.minimum.value && measuredAt < current.minimum.measuredAt)) current.minimum = candidate
        if (value > current.maximum.value || (value === current.maximum.value && measuredAt < current.maximum.measuredAt)) current.maximum = candidate
      }
    }
  }
  return records
}
