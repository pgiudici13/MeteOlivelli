import { metrics } from './weather.ts'
import type { Metric } from './weather.ts'

const STORAGE_KEY = 'meteolivelli:first-chart:v1'
const allowed = new Set<string>(metrics.map(metric => metric.key))

export function isMetric(value: unknown): value is Metric {
  return typeof value === 'string' && allowed.has(value)
}

export function readFirstChart(storage?: Pick<Storage, 'getItem'> | null): Metric {
  try {
    const value = storage?.getItem(STORAGE_KEY)
    return isMetric(value) ? value : 'temperature_c'
  } catch { return 'temperature_c' }
}

export function saveFirstChart(value: Metric, storage?: Pick<Storage, 'setItem'> | null): boolean {
  if (!isMetric(value)) return false
  try { storage?.setItem(STORAGE_KEY, value); return Boolean(storage) } catch { return false }
}

export function orderedMetrics(first: Metric) {
  return [...metrics].sort((a, b) => Number(b.key === first) - Number(a.key === first))
}

export function browserChartPreference(): Metric {
  try { return readFirstChart(window.localStorage) } catch { return 'temperature_c' }
}

export function rememberBrowserChartPreference(value: Metric): void {
  try { saveFirstChart(value, window.localStorage) } catch { /* Preferenza facoltativa. */ }
}
