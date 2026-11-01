import { useEffect, useState } from 'react'
import { createForecastFeed, initialForecastState } from './forecast-feed.ts'
import type { ForecastRun } from './forecast.ts'
import { loadProviderForecast } from './forecast-provider.ts'
import { buildHybridForecast } from './forecast-hybrid.ts'
import type { Measurement } from './weather.ts'

function runLocalFallback(rows: Measurement[], now: number): Promise<ForecastRun> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./forecast.worker.ts', import.meta.url), { type: 'module' })
    const timeout = window.setTimeout(() => { worker.terminate(); reject(new Error('Tempo di valutazione superato')) }, 10000)
    worker.onmessage = (event: MessageEvent<{ run?: ForecastRun }>) => {
      window.clearTimeout(timeout); worker.terminate()
      if (event.data.run) resolve(event.data.run)
      else reject(new Error('Valutazione non disponibile'))
    }
    worker.onerror = () => { window.clearTimeout(timeout); worker.terminate(); reject(new Error('Valutazione non disponibile')) }
    worker.postMessage({ rows, now })
  })
}

export function useForecast() {
  const [state, setState] = useState(initialForecastState)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    let rows: Measurement[] = []
    let providerRun: ForecastRun | null = null
    let stopped = false
    const compute = async (input: Measurement[], evaluatedAt: number) => {
      rows = input
      try {
        const provider = await loadProviderForecast(evaluatedAt)
        providerRun = buildHybridForecast(input, provider, evaluatedAt)
        return providerRun
      } catch {
        return runLocalFallback(input, evaluatedAt)
      }
    }
    const feed = createForecastFeed(next => setState({
      ...next, run: providerRun ?? next.run, error: next.error && !providerRun,
    }), compute)
    const refreshProvider = async () => {
      try {
        const evaluatedAt = Date.now()
        const provider = await loadProviderForecast(evaluatedAt)
        if (stopped) return
        providerRun = buildHybridForecast(rows, provider, evaluatedAt)
        setState(current => ({ ...current, loaded: true, error: false, run: providerRun }))
      } catch { /* Il modello locale resta disponibile se la rete esterna non risponde. */ }
    }
    void refreshProvider()
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now())
        void feed.refresh()
        void refreshProvider()
      }
    }
    refresh()
    const timer = window.setInterval(refresh, 15000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', refresh)
    return () => {
      stopped = true
      feed.stop()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('online', refresh)
    }
  }, [])
  return { ...state, now: now + state.serverOffset }
}
