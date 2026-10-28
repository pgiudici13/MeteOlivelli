import { useEffect, useRef, useState } from 'react'
import { createWeatherFeed, initialWeatherState } from './weather-feed.ts'
import { publicHistoryMeasurements, readAllHistory, shouldAutoRefreshHistory } from './weather.ts'
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

export function useCompleteHistory(latestSignature: string | null) {
  const [state, setState] = useState<{ rows: Measurement[]; loading: boolean; error: boolean; checkedAt: string | null }>({ rows: [], loading: true, error: false, checkedAt: null })
  const [attempt, setAttempt] = useState(0)
  const lastAutoRefresh = useRef(-Infinity)
  useEffect(() => {
    if (latestSignature === null) return
    const controller = new AbortController()
    let active = true
    void readAllHistory(controller.signal).then(
      rows => { if (active) setState({ rows: publicHistoryMeasurements(rows), loading: false, error: false, checkedAt: new Date().toISOString() }) },
      () => { if (active) setState(previous => ({ ...previous, loading: false, error: true })) },
    )
    return () => { active = false; controller.abort() }
  }, [attempt, latestSignature])
  useEffect(() => {
    const refresh = () => {
      // Il cambio dell’ultima lettura rilegge sempre; ritorno alla pagina e rete
      // sono stimoli costosi da non ripetere ad ogni focus della finestra.
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (!shouldAutoRefreshHistory(lastAutoRefresh.current, now)) return
      lastAutoRefresh.current = now
      setAttempt(value => value + 1)
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('online', refresh)
    }
  }, [])
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return
      const now = Date.now()
      if (!shouldAutoRefreshHistory(lastAutoRefresh.current, now, 5 * 60_000)) return
      lastAutoRefresh.current = now
      setAttempt(value => value + 1)
    }
    const timer = window.setInterval(refresh, 5 * 60_000)
    return () => window.clearInterval(timer)
  }, [])
  return { ...state, retry: () => {
    lastAutoRefresh.current = Date.now()
    setState(previous => ({ ...previous, loading: true, error: false }))
    setAttempt(value => value + 1)
  } }
}
