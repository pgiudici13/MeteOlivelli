import { historyAnchor, readHistory, readPage, stationMeasurements } from './weather.ts'
import type { ChartMode, Measurement, PageReader } from './weather.ts'

export async function readFreshChartData(period: ChartMode, signal: AbortSignal, reader: PageReader = readPage): Promise<{ rows: Measurement[]; until: string }> {
  let until: string | null = null
  const apiPeriod = period === 'auto' ? '30g' : period
  let anchor: string | null = null
  if (period === 'auto') {
    const latest = await reader(new URLSearchParams({ view: 'latest' }), signal)
    if (latest.items.length > 1 || latest.next_cursor) throw new Error('Ultimo campione incoerente')
    anchor = historyAnchor(stationMeasurements(latest.items)[0]?.captured_at, latest.until)
  }
  const rows = await readHistory(apiPeriod, signal, async (params, requestSignal) => {
    if (anchor) params.set('until', anchor)
    const page = await reader(params, requestSignal)
    if (until !== null && page.until !== until) throw new Error('Finestra del report incoerente')
    until = page.until
    return page
  })
  if (until === null) throw new Error('Finestra del report non disponibile')
  return { rows: stationMeasurements(rows), until }
}
