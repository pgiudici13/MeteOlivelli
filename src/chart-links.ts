import type { ChartMode, Metric } from './weather.ts'

const periods: ChartMode[] = ['auto', '24h', '7g', '14g', '30g']
const maxRangeMs = 30 * 24 * 60 * 60 * 1000

export function readChartLink(search: string, now = Date.now()): { period: ChartMode; customRange: { start: number; end: number } | null } {
  const params = new URLSearchParams(search)
  const period = params.get('period')
  if (period === 'custom') {
    const start = Date.parse(params.get('from') ?? '')
    const end = Date.parse(params.get('to') ?? '')
    if (Number.isFinite(start) && Number.isFinite(end) && start < end && end <= now && now - start <= maxRangeMs) {
      return { period: '30g', customRange: { start, end } }
    }
  }
  return { period: periods.find(value => value === period) ?? 'auto', customRange: null }
}

export function createChartLink(origin: string, period: ChartMode, metric: Metric, range?: { start: number; end: number } | null) {
  const url = new URL('/home', origin)
  if (range) {
    url.searchParams.set('period', 'custom')
    url.searchParams.set('from', new Date(range.start).toISOString())
    url.searchParams.set('to', new Date(range.end).toISOString())
  } else url.searchParams.set('period', period)
  url.hash = `chart-${metric}`
  return url.toString()
}

export function localDateTimeValue(timestamp: number) {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
