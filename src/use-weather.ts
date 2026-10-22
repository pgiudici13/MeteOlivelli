import { useEffect, useState } from 'react'
import { createWeatherFeed, initialWeatherState } from './weather-feed.ts'
import type { Period } from './weather.ts'

export function useWeather(period: Period) {
  const [state, setState] = useState(() => initialWeatherState(period))
  useEffect(() => {
    const feed = createWeatherFeed(period, setState)
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
  }, [period])
  return state
}
