import { formatValue, isSuspect, metrics, observationTime } from './weather.ts'
import type { Measurement } from './weather.ts'

const thresholds = { temperature_c: 0.2, humidity_pct: 1, pressure_hpa: 0.5 }

/** Solo confronti fra letture fisiche con data PC e valori validi. */
export function describeWeatherChange(latest: Measurement | null, history: Measurement[]) {
  if (!latest || !['live', 'historical'].includes(latest.acquisition_kind ?? '')) return null
  const latestTime = observationTime(latest)
  if (!latestTime) return null
  const lastTime = Date.parse(latestTime)
  if (!Number.isFinite(lastTime)) return null
  const comparisons = metrics.flatMap(metric => {
    const value = latest[metric.key]
    if (value === null || isSuspect(latest, metric.key)) return []
    const previous = history.filter(row => {
      const time = observationTime(row)
      return row.ingestion_id !== latest.ingestion_id && ['live', 'historical'].includes(row.acquisition_kind ?? '') &&
        time !== null && Date.parse(time) < lastTime && row[metric.key] !== null && !isSuspect(row, metric.key)
    }).sort((a, b) => Date.parse(observationTime(b)!) - Date.parse(observationTime(a)!))[0]
    if (!previous) return []
    const change = value - previous[metric.key]!
    const state = Math.abs(change) < thresholds[metric.key] ? 'stabile' : change > 0 ? 'in aumento' : 'in diminuzione'
    return [{ metric: metric.name.toLowerCase(), unit: metric.unit, state, change, comparedAt: observationTime(previous)! }]
  })
  if (!comparisons.length) return null
  return comparisons.map(item => item.state === 'stabile'
    ? `${item.metric[0].toUpperCase()}${item.metric.slice(1)} sostanzialmente stabile rispetto alla lettura precedente.`
    : `${item.metric[0].toUpperCase()}${item.metric.slice(1)} ${item.state} di ${formatValue(Math.abs(item.change))} ${item.unit} rispetto alla lettura precedente.`)
}
