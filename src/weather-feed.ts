import { readPage, readHistory, trimHistory } from './weather.ts'
import type { Measurement, PageReader, Period } from './weather.ts'

export interface WeatherState {
  period: Period
  anchorToLatest: boolean
  latest: Measurement | null
  history: Measurement[]
  latestLoaded: boolean
  historyLoaded: boolean
  latestError: boolean
  historyError: boolean
  checkedAt: number | null
  windowUntil: string | null
}
export function initialWeatherState(period: Period, anchorToLatest = false): WeatherState {
  return { period, anchorToLatest, latest: null, history: [], latestLoaded: false, historyLoaded: false, latestError: false, historyError: false, checkedAt: null, windowUntil: null }
}

/** Un solo ciclo alla volta; un errore conserva gli ultimi valori e ne segnala lo stato. */
export function createWeatherFeed(period: Period, publish: (state: WeatherState) => void, reader: PageReader = readPage, options: { anchorToLatest?: boolean } = {}) {
  let state = initialWeatherState(period, Boolean(options.anchorToLatest))
  let signature: string | undefined
  let busy = false
  let stopped = false
  const controller = new AbortController()
  return {
    async refresh() {
      if (busy || stopped) return
      busy = true
      let historyStarted = false
      const updateHistory = async () => {
        historyStarted = true
        try {
          const anchor = options.anchorToLatest ? state.latest?.captured_at : null
          let windowUntil: string | null = null
          const history = await readHistory(period, controller.signal, async (params, signal) => {
            if (anchor) params.set('until', anchor)
            const page = await reader(params, signal)
            windowUntil = page.until
            return page
          })
          state = { ...state, history, windowUntil, historyLoaded: true, historyError: false }
        } catch { state = { ...state, historyLoaded: true, historyError: true } }
      }
      // Prima apertura: richieste indipendenti in parallelo.
      const historyRequest = !options.anchorToLatest && (!state.historyLoaded || state.historyError) ? updateHistory() : Promise.resolve()
      try {
        const response = await reader(new URLSearchParams({ view: 'latest' }), controller.signal)
        if (response.items.length > 1 || response.next_cursor) throw new Error('Ultima misura incoerente')
        const latest = response.items[0] ?? null
        const nextSignature = JSON.stringify(latest)
        state = { ...state, latest, latestLoaded: true, latestError: false, checkedAt: Date.now(), windowUntil: response.until }
        if ((nextSignature !== signature || !state.historyLoaded || state.historyError) && !historyStarted) await updateHistory()
        // Anche senza nuovi campioni la finestra deve avanzare, senza nuove letture di serie.
        const windowUntil = options.anchorToLatest ? latest?.captured_at ?? response.until : response.until
        state = { ...state, windowUntil, history: trimHistory(state.history, period, windowUntil) }
        signature = nextSignature
      } catch {
        state = { ...state, latestLoaded: true, latestError: true }
        if (options.anchorToLatest && !historyStarted && (!state.historyLoaded || state.historyError)) await updateHistory()
      }
      if (!stopped) publish({ ...state })
      await historyRequest
      busy = false
      if (!stopped) publish({ ...state })
    },
    stop() { stopped = true; controller.abort() },
  }
}
