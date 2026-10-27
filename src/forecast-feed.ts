import { readHistory, readPage, stationMeasurements } from './weather.ts'
import type { Measurement, PageReader } from './weather.ts'
import type { ForecastRun } from './forecast.ts'

export interface ForecastState {
  loaded: boolean
  error: boolean
  run: ForecastRun | null
  serverOffset: number
}
export const initialForecastState = (): ForecastState => ({ loaded: false, error: false, run: null, serverOffset: 0 })
export type ForecastRunner = (rows: Measurement[], now: number) => Promise<ForecastRun>

/** Serie previsiva indipendente dai filtri grafico, limitata alle osservazioni fisiche. */
export function createForecastFeed(publish: (state: ForecastState) => void, compute: ForecastRunner, reader: PageReader = readPage) {
  let state = initialForecastState()
  let signature: string | null = null
  let inputSignature: string | null = null
  let historyCheckedAt = -Infinity
  let busy = false
  let stopped = false
  const controller = new AbortController()
  return {
    async refresh() {
      if (busy || stopped) return
      busy = true
      try {
        const latest = await reader(new URLSearchParams({ view: 'latest' }), controller.signal)
        if (latest.items.length > 1 || latest.next_cursor) throw new Error('Ultima misura incoerente')
        const nextSignature = JSON.stringify(latest.items)
        const basis = 'measured_at'
        state = { ...state, serverOffset: Date.parse(latest.until) - Date.now() }
        if (nextSignature !== signature || state.error || !state.loaded || Date.parse(latest.until) - historyCheckedAt >= 5 * 60000) {
          let until = latest.until
          const rows = stationMeasurements(await readHistory('30g', controller.signal, async (params, signal) => {
            const response = await reader(params, signal)
            until = response.until
            return response
          }, basis))
          if (stopped) return
          const nextInputSignature = JSON.stringify(rows)
          const run = nextInputSignature === inputSignature && state.run ? state.run : await compute(rows, Date.parse(until))
          if (stopped) return
          state = { ...state, run }
          signature = nextSignature
          inputSignature = nextInputSignature
          historyCheckedAt = Date.parse(until)
        }
        state = { ...state, loaded: true, error: false }
      } catch {
        state = { ...state, loaded: true, error: true }
      } finally {
        busy = false
        if (!stopped) publish({ ...state })
      }
    },
    stop() { stopped = true; controller.abort() },
  }
}
