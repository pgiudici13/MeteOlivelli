import { useEffect, useState } from 'react'
import { createWeatherFeed, initialWeatherState } from './weather-feed.ts'
import { readAllHistory } from './weather.ts'
import type { Measurement, Period } from './weather.ts'

export function useWeather(period: Period, anchorToLatest = false) {
  const [state, setState] = useState(() => initialWeatherState(period, anchorToLatest))
  useEffect(() => {
    const feed = createWeatherFeed(period, setState, undefined, { anchorToLatest })
    const refresh = () => { if (document.visibilityState === 'visible') void feed.refresh() }
    refresh()
    const timer = window.setInterval(refresh, 15000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', refresh)
    return () => {
      feed.stop()
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('online', refresh)
    }
  }, [period, anchorToLatest])
  return state
}

export function useCompleteHistory() {
  const [state, setState] = useState<{ rows: Measurement[]; loading: boolean; error: boolean }>({ rows: [], loading: true, error: false })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    void readAllHistory(controller.signal).then(
      rows => setState({ rows, loading: false, error: false }),
      () => { if (!controller.signal.aborted) setState(previous => ({ ...previous, loading: false, error: true })) },
    )
    return () => controller.abort()
  }, [attempt])
  return { ...state, retry: () => {
    setState(previous => ({ ...previous, loading: true, error: false }))
    setAttempt(value => value + 1)
  } }
}
