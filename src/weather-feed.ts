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
          const capturedAt = options.anchorToLatest ? state.latest?.captured_at : null
          // L'API richiede UTC canonico; PostgreSQL può restituire +00:00 e microsecondi.
          // Arrotondare in alto evita di escludere l'ultimo campione sub-millisecondo.
          const fraction = capturedAt?.match(/\.(\d+)/)?.[1] ?? ''
          const anchor = capturedAt ? new Date(Date.parse(capturedAt) + (/[1-9]/.test(fraction.slice(3)) ? 1 : 0)).toISOString() : null
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
        state = { ...state, latest, latestLoaded: true, latestError: false, checkedAt: Date.now() }
        if ((nextSignature !== signature || !state.historyLoaded || state.historyError) && !historyStarted) await updateHistory()
        // Anche senza nuovi campioni la finestra deve avanzare, senza nuove letture di serie.
        const windowUntil = options.anchorToLatest ? state.windowUntil ?? response.until : response.until
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
