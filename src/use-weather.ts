import { useEffect, useState } from 'react'
import { createWeatherFeed, initialWeatherState } from './weather-feed.ts'
import { readAllHistory, stationMeasurements } from './weather.ts'
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

export function useCompleteHistory(latestId: string | null) {
  const [state, setState] = useState<{ rows: Measurement[]; loading: boolean; error: boolean; checkedAt: string | null }>({ rows: [], loading: true, error: false, checkedAt: null })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (latestId === null) return
    const controller = new AbortController()
    let active = true
    void readAllHistory(controller.signal).then(
      rows => { if (active) setState({ rows: stationMeasurements(rows), loading: false, error: false, checkedAt: new Date().toISOString() }) },
      () => { if (active) setState(previous => ({ ...previous, loading: false, error: true })) },
    )
    return () => { active = false; controller.abort() }
  }, [attempt, latestId])
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') setAttempt(value => value + 1)
    }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('online', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('online', refresh)
    }
  }, [])
  return { ...state, retry: () => {
    setState(previous => ({ ...previous, loading: true, error: false }))
    setAttempt(value => value + 1)
  } }
}
