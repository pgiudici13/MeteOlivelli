import { getLocale, getPreferences, temperatureValue, type TemperatureUnit } from './preferences.ts'
import { formatValue, isSuspect, metrics, observationTime } from './weather.ts'
import type { Measurement } from './weather.ts'

const romeClock = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })

function localMinute(time: number) {
  const parts = Object.fromEntries(romeClock.formatToParts(time).map(part => [part.type, part.value]))
  return { day: Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)), minute: `${parts.hour}:${parts.minute}` }
}

const thresholds = { temperature_c: 0.2, humidity_pct: 1, pressure_hpa: 0.5 }

/** Solo confronti fra letture fisiche con data PC e valori validi. */
export function describeWeatherChange(latest: Measurement | null, history: Measurement[], unit: TemperatureUnit = getPreferences().temperatureUnit, locale = getLocale()) {
  if (!latest || !['live', 'historical'].includes(latest.acquisition_kind ?? '')) return null
  const latestTime = observationTime(latest)
  if (!latestTime) return null
  const lastTime = Date.parse(latestTime)
  if (!Number.isFinite(lastTime)) return null
  const target = localMinute(lastTime)
  const comparisons = metrics.flatMap(metric => {
    const value = latest[metric.key]
    if (value === null || isSuspect(latest, metric.key)) return []
    const previous = history.filter(row => {
      const time = observationTime(row)
      if (!time || !Number.isFinite(Date.parse(time))) return false
      const local = localMinute(Date.parse(time))
      return row.ingestion_id !== latest.ingestion_id && ['live', 'historical'].includes(row.acquisition_kind ?? '') &&
        local.day === target.day - 86400000 && local.minute === target.minute && row[metric.key] !== null && !isSuspect(row, metric.key)
    }).sort((a, b) => Date.parse(observationTime(b)!) - Date.parse(observationTime(a)!))[0]
    if (!previous) return []
    const change = value - previous[metric.key]!
    const state = Math.abs(change) < thresholds[metric.key] ? 'stabile' : change > 0 ? 'in aumento' : 'in diminuzione'
    return [{ metric: metric.name.toLowerCase(), unit: metric.key === 'temperature_c' ? `°${unit}` : metric.unit, state, change: metric.key === 'temperature_c' ? temperatureValue(change, unit, true)! : change, comparedAt: observationTime(previous)! }]
  })
  if (!comparisons.length) return null
  return comparisons.map(item => item.state === 'stabile'
    ? `${item.metric[0].toUpperCase() + item.metric.slice(1)} sostanzialmente stabile rispetto alla stessa ora del giorno precedente.`
    : `${item.metric[0].toUpperCase() + item.metric.slice(1)} ${item.state} di ${formatValue(Math.abs(item.change), undefined, false, locale)} ${item.unit} rispetto alla stessa ora del giorno precedente.`)
}
