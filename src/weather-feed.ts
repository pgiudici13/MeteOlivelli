import { readPage, readHistory, trimHistory } from './weather.ts'
import type { Measurement, PageReader, Period } from './weather.ts'

export interface WeatherState {
  period: Period
  latest: Measurement | null
  history: Measurement[]
  latestLoaded: boolean
  historyLoaded: boolean
  latestError: boolean
  historyError: boolean
  checkedAt: number | null
}
export function initialWeatherState(period: Period): WeatherState {
  return { period, latest: null, history: [], latestLoaded: false, historyLoaded: false, latestError: false, historyError: false, checkedAt: null }
}

/** Un solo ciclo alla volta; un errore conserva gli ultimi valori e ne segnala lo stato. */
export function createWeatherFeed(period: Period, publish: (state: WeatherState) => void, reader: PageReader = readPage) {
  let state = initialWeatherState(period)
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
          const history = await readHistory(period, controller.signal, reader)
          state = { ...state, history, historyLoaded: true, historyError: false }
        } catch { state = { ...state, historyLoaded: true, historyError: true } }
      }
      // Prima apertura: richieste indipendenti in parallelo.
      const historyRequest = !state.historyLoaded || state.historyError ? updateHistory() : Promise.resolve()
      try {
        const response = await reader(new URLSearchParams({ view: 'latest' }), controller.signal)
        if (response.items.length > 1 || response.next_cursor) throw new Error('Ultima misura incoerente')
        const latest = response.items[0] ?? null
        const nextSignature = JSON.stringify(latest)
        state = { ...state, latest, latestLoaded: true, latestError: false, checkedAt: Date.now() }
        if (nextSignature !== signature && !historyStarted) await updateHistory()
        // Anche senza nuovi campioni la finestra deve avanzare, senza nuove letture di serie.
        state = { ...state, history: trimHistory(state.history, period, response.until) }
        signature = nextSignature
      } catch { state = { ...state, latestLoaded: true, latestError: true } }
      if (!stopped) publish({ ...state })
      await historyRequest
      busy = false
      if (!stopped) publish({ ...state })
    },
    stop() { stopped = true; controller.abort() },
  }
}
