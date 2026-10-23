import { useEffect, useState } from 'react'
import { createForecastFeed, initialForecastState } from './forecast-feed.ts'
import type { ForecastRun } from './forecast.ts'

export function useForecast() {
  const [state, setState] = useState(initialForecastState)
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    let worker: Worker | null = null
    let timeout: number | undefined
    const feed = createForecastFeed(setState, (rows, now) => new Promise((resolve, reject) => {
      worker ??= new Worker(new URL('./forecast.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<{ run?: ForecastRun; error?: boolean }>) => {
        window.clearTimeout(timeout)
        if (event.data.run) resolve(event.data.run)
        else reject(new Error('Valutazione non disponibile'))
      }
      worker.onerror = () => { window.clearTimeout(timeout); worker?.terminate(); worker = null; reject(new Error('Valutazione non disponibile')) }
      timeout = window.setTimeout(() => {
        worker?.terminate()
        worker = null
        reject(new Error('Tempo di valutazione superato'))
      }, 10000)
      worker.postMessage({ rows, now })
    }))
    const refresh = () => {
      if (document.visibilityState === 'visible') {
        setNow(Date.now())
        void feed.refresh()
      }
    }
    refresh()
    const timer = window.setInterval(refresh, 15000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', refresh)
    return () => {
      feed.stop()
      worker?.terminate()
      window.clearTimeout(timeout)
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('online', refresh)
    }
  }, [])
  return { ...state, now: now + state.serverOffset }
}
