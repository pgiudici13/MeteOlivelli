import { formatValue, isSuspect, metrics } from './weather.ts'
import type { Measurement } from './weather.ts'

const thresholds = { temperature_c: 0.2, humidity_pct: 1, pressure_hpa: 0.5 }

/** Solo confronti fra letture fisiche con data PC e valori validi. */
export function describeWeatherChange(latest: Measurement | null, history: Measurement[]) {
  if (!latest?.captured_at || !['live', 'historical'].includes(latest.acquisition_kind ?? '')) return null
  const lastTime = Date.parse(latest.captured_at)
  if (!Number.isFinite(lastTime)) return null
  const comparisons = metrics.flatMap(metric => {
    const value = latest[metric.key]
    if (value === null || isSuspect(latest, metric.key)) return []
    const previous = history.filter(row => row.ingestion_id !== latest.ingestion_id &&
      ['live', 'historical'].includes(row.acquisition_kind ?? '') && row.captured_at &&
      Date.parse(row.captured_at) < lastTime && row[metric.key] !== null && !isSuspect(row, metric.key))
      .sort((a, b) => Date.parse(b.captured_at!) - Date.parse(a.captured_at!))[0]
    if (!previous) return []
    const change = value - previous[metric.key]!
    const state = Math.abs(change) < thresholds[metric.key] ? 'stabile' : change > 0 ? 'in aumento' : 'in diminuzione'
    return [{ metric: metric.name.toLowerCase(), unit: metric.unit, state, change, comparedAt: previous.captured_at! }]
  })
  if (!comparisons.length) return null
  return comparisons.map(item => item.state === 'stabile'
    ? `${item.metric[0].toUpperCase()}${item.metric.slice(1)} sostanzialmente stabile rispetto alla lettura precedente.`
    : `${item.metric[0].toUpperCase()}${item.metric.slice(1)} ${item.state} di ${formatValue(Math.abs(item.change))} ${item.unit} rispetto alla lettura precedente.`)
}
