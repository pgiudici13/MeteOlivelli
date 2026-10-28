import { getLocale } from './preferences.ts'
import { prepareChart } from './chart.ts'
import { metrics } from './weather.ts'
import type { Measurement, ChartMode } from './weather.ts'

export function prepareCombinedChart(rows: Measurement[], mode: ChartMode, until: string, range?: { start: number; end: number }, locale = getLocale()) {
  const series = metrics.map(metric => {
    const prepared = prepareChart(rows, metric.key, mode, until, range, locale)
    const points = prepared.segments.flat()
    const values = points.map(point => point.value)
    return { metric, segments: prepared.segments, min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null, timeline: prepared.timeline }
  })
  const start = Math.min(...series.map(item => item.timeline.start))
  const end = Math.max(...series.map(item => item.timeline.end))
  return { series, start, end }
}

export function normalizedHeight(value: number, min: number, max: number) {
  return max === min ? 0.5 : (value - min) / (max - min)
}
