import { translate } from './i18n.ts'
import { displayUnit } from './preferences.ts'
import { prepareChart } from './chart.ts'
import type { ChartSource } from './chart.ts'
import { formatValue, metrics } from './weather.ts'
import type { ChartMode, Measurement, Metric } from './weather.ts'

const width = 820
const height = 330
const plot = { left: 74, top: 24, width: 710, height: 248 }
const xml = (value: string) => translate(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')

export interface PdfChart {
  svg: string
  metric: (typeof metrics)[number]
  note: string
  minimum: number | null
  maximum: number | null
  pointCount: number
  sampleCount: number
  averaged: boolean
  provenance: string
}

export function buildPdfChart(rows: Measurement[], field: Metric, mode: ChartMode, until: string, customRange?: { start: number; end: number }): PdfChart {
  if (!Number.isFinite(Date.parse(until))) throw new Error('Fine del periodo non valida')
  const metric = metrics.find(item => item.key === field)
  if (!metric) throw new Error('Grandezza non valida')
  const prepared = prepareChart(rows, field, mode, until, customRange)
  const points = prepared.segments.flat()
  const sources = points.reduce<Record<ChartSource, number>>((total, point) => {
    for (const source of Object.keys(total) as ChartSource[]) total[source] += point.sources[source]
    return total
  }, { live: 0, historical: 0, synthetic: 0, unknown: 0 })
  const hasStation = sources.live + sources.historical > 0
  const hasSynthetic = sources.synthetic > 0
  const hasUnknown = sources.unknown > 0
  const provenance = !points.length ? 'Nessuna serie tracciata' : [
    ...(hasStation ? [`stazione${sources.live && sources.historical ? ' (live e storico)' : sources.live ? ' (live)' : ' (storico)'}`] : []),
    ...(hasSynthetic ? ['sintetica'] : []),
    ...(hasUnknown ? ['origine non specificata'] : []),
  ].map(value => translate(value)).join(translate(' e '))
  const values = points.map(point => point.value)
  const minimum = values.length ? Math.min(...values) : null
  const maximum = values.length ? Math.max(...values) : null
  const padding = minimum === null || maximum === null ? 0.5 : Math.max((maximum - minimum) * 0.15, 0.5)
  const low = (minimum ?? 0) - padding
  const high = (maximum ?? 1) + padding
  const { start, end } = prepared.timeline
  const x = (time: number) => plot.left + (time - start) / (end - start) * plot.width
  const y = (value: number) => plot.top + plot.height - (value - low) / (high - low) * plot.height
  const horizontal = Array.from({ length: 4 }, (_, index) => {
    const value = high - index * (high - low) / 3
    const lineY = plot.top + index * plot.height / 3
    return `<g><line x1="${plot.left}" y1="${lineY}" x2="${plot.left + plot.width}" y2="${lineY}" stroke="#D5D0CA" stroke-width="1"/><text x="${plot.left - 10}" y="${lineY + 4}" text-anchor="end" font-size="12" fill="#68625D">${xml(formatValue(value, field))}</text></g>`
  }).join('')
  const vertical = prepared.timeline.ticks.map(tick => {
    const position = x(tick.time)
    const dash = tick.major ? '' : ' stroke-dasharray="2 4"'
    return `<g><line x1="${position}" y1="${plot.top}" x2="${position}" y2="${plot.top + plot.height}" stroke="#D5D0CA" stroke-width="1"${dash}/>${tick.label ? `<text x="${position}" y="${plot.top + plot.height + 21}" text-anchor="middle" font-size="11" fill="#68625D">${xml(tick.label)}</text>` : ''}</g>`
  }).join('')
  const series = prepared.segments.map(segment => {
    if (segment.length > 1) {
      const line = segment.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.time)} ${y(point.value)}`).join(' ')
      const area = `${line} L ${x(segment.at(-1)!.time)} ${plot.top + plot.height} L ${x(segment[0].time)} ${plot.top + plot.height} Z`
      return `<path d="${area}" fill="#A5481A" fill-opacity="0.08"/><path d="${line}" fill="none" stroke="#A5481A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${segment.map(point => `<circle cx="${x(point.time)}" cy="${y(point.value)}" r="3" fill="#A5481A"/>`).join('')}`
    }
    return segment.map(point => `<circle cx="${x(point.time)}" cy="${y(point.value)}" r="3" fill="#A5481A"/>`).join('')
  }).join('')
  const periodLabel = customRange ? 'Personalizzato' : mode === 'auto' ? 'Auto' : mode === '24h' ? '24 ore' : mode === '7g' ? '7 giorni' : mode === '14g' ? '14 giorni' : '30 giorni'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#FFFFFF"/><text x="${plot.left}" y="15" font-family="Roboto, sans-serif" font-size="13" fill="#68625D">${xml(translate(metric.name))} · ${xml(displayUnit(metric.key))} · ${xml(translate(periodLabel))}</text>${vertical}${horizontal}${series}<text x="${plot.left}" y="${height - 4}" font-size="11" fill="#68625D">${xml(prepared.timeline.startLabel)}</text><text x="${plot.left + plot.width}" y="${height - 4}" text-anchor="end" font-size="11" fill="#68625D">${xml(prepared.timeline.endLabel)}</text></svg>`
  return { svg, metric, note: prepared.note, minimum, maximum, pointCount: points.length, sampleCount: points.reduce((sum, point) => sum + point.count, 0), averaged: prepared.averaged, provenance }
}
