import { historyAnchor, isAfterServerTime, observationTime, readPage, readObservationHistory, stationMeasurements, trimHistory } from './weather.ts'
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
  serverUntil: string | null
  invalidLatestTime: boolean
}
export function initialWeatherState(period: Period, anchorToLatest = false): WeatherState {
  return { period, anchorToLatest, latest: null, history: [], latestLoaded: false, historyLoaded: false, latestError: false, historyError: false, checkedAt: null, windowUntil: null, serverUntil: null, invalidLatestTime: false }
}

/** Un solo ciclo alla volta; un errore conserva gli ultimi valori e ne segnala lo stato. */
export function createWeatherFeed(period: Period, publish: (state: WeatherState) => void, reader: PageReader = readPage, options: { anchorToLatest?: boolean } = {}) {
  let state = initialWeatherState(period, Boolean(options.anchorToLatest))
  let signature: string | undefined
  let historyCheckedAt = -Infinity
  let busy = false
  let stopped = false
  const controller = new AbortController()
  return {
    async refresh() {
      if (busy || stopped) return
      busy = true
      let historyStarted = false
      // Una modifica/cancellazione retroattiva non cambia necessariamente latest.
      const reconcileHistory = Date.now() - historyCheckedAt >= 5 * 60000
      let serverUntil: string | null = null
      const updateHistory = async () => {
        historyStarted = true
        try {
          const anchor = options.anchorToLatest && serverUntil ? historyAnchor(state.latest?.measured_at, serverUntil) : null
          const history = await readObservationHistory(period, controller.signal, async (params, signal) => {
            if (anchor) params.set('until', anchor)
            return reader(params, signal)
          }, anchor)
          state = { ...state, history: stationMeasurements(history.rows), windowUntil: anchor ?? history.until, historyLoaded: true, historyError: false }
          historyCheckedAt = Date.now()
        } catch { state = { ...state, historyLoaded: true, historyError: true } }
      }
      // Prima apertura: richieste indipendenti in parallelo.
      const historyRequest = !options.anchorToLatest && (!state.historyLoaded || state.historyError || reconcileHistory) ? updateHistory() : Promise.resolve()
      try {
        const response = await reader(new URLSearchParams({ view: 'latest' }), controller.signal)
        serverUntil = response.until
        if (response.items.length > 1 || response.next_cursor) throw new Error('Ultima misura incoerente')
        const candidate = stationMeasurements(response.items)[0] ?? null
        const candidateTime = candidate ? observationTime(candidate) : null
        const invalidLatestTime = Boolean(candidateTime && isAfterServerTime(candidateTime, response.until))
        const latest = invalidLatestTime ? null : candidate
        const nextSignature = JSON.stringify([response.items, invalidLatestTime])
        state = { ...state, latest, invalidLatestTime, latestLoaded: true, latestError: false, checkedAt: Date.now(), serverUntil: response.until }
        if ((nextSignature !== signature || !state.historyLoaded || state.historyError || reconcileHistory) && !historyStarted) await updateHistory()
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
