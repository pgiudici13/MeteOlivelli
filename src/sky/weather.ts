import { STATION } from './location.ts'
export type Condition = 'clear' | 'partly-cloudy' | 'overcast' | 'fog' | 'drizzle' | 'rain' | 'heavy-rain' | 'snow' | 'thunderstorm' | 'unknown'
export interface ForecastHour { time: number; precipitationProbability: number | null; condition: Condition }
export interface SolarEvents { sunrise: number | null; sunset: number | null }
export interface Weather { condition: Condition; cloud: number | null; precipitation: number | null; rain?: number | null; showers?: number | null; snowfall?: number | null; wind: number | null; observedAt: number; fetchedAt: number; forecast?: ForecastHour[]; solarEvents?: SolarEvents }
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
export function classify(code: number | null): Condition {
  if (code === null) return 'unknown'
  if ([95, 96, 97, 99].includes(code)) return 'thunderstorm'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow'
  if ([65, 67, 82].includes(code)) return 'heavy-rain'
  if ([61, 63, 66, 80, 81].includes(code)) return 'rain'
  if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle'
  if ([45, 48].includes(code)) return 'fog'
  if (code === 3) return 'overcast'
  if (code === 1 || code === 2) return 'partly-cloudy'
  if (code === 0) return 'clear'
  return 'unknown'
}
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const number = (v: unknown, min: number, max: number): number | null => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : null
export function parseWeather(value: unknown, now: number): Weather {
  if (!record(value) || !record(value.current)) throw Error('Risposta meteo non valida')
  const c = value.current
  const time = number(c.time, 0, 1e11)
  if (time === null || now - time * 1000 > 3 * 3600000 || time * 1000 - now > 5 * 60000) throw Error('Orario meteo non valido')
  const condition = classify(number(c.weather_code, 0, 99))
  const cloud = number(c.cloud_cover, 0, 100)
  // Un timestamp da solo non costituisce una condizione meteo utilizzabile.
  if (condition === 'unknown' && cloud === null) throw Error('Condizioni meteo non disponibili')
  const forecast: ForecastHour[] = []
  if (record(value.hourly) && Array.isArray(value.hourly.time) && value.hourly.time.length <= 72) {
    const hourly = value.hourly
    const times = hourly.time as unknown[]
    const probabilities = Array.isArray(hourly.precipitation_probability) ? hourly.precipitation_probability : []
    const codes = Array.isArray(hourly.weather_code) ? hourly.weather_code : []
    for (let i = 0; i < times.length; i++) {
      const stamp = number(times[i], 0, 1e11)
      if (stamp === null || stamp * 1000 < now - 3600000 || stamp * 1000 > now + 26 * 3600000) continue
      forecast.push({ time: stamp * 1000, precipitationProbability: number(probabilities[i], 0, 100), condition: classify(number(codes[i], 0, 99)) })
    }
    forecast.sort((a, b) => a.time - b.time)
  }
  // Dati giornalieri facoltativi: usati per confronto diagnostico, non per sostituire SunCalc.
  const daily = record(value.daily) ? value.daily : null
  const event = (key: string) => {
    const values = daily?.[key]
    if (!Array.isArray(values)) return null
    const stamp = number(values[0], 0, 1e11)
    return stamp === null ? null : stamp * 1000
  }
  return { condition, cloud, precipitation: number(c.precipitation, 0, 500), rain: number(c.rain, 0, 500), showers: number(c.showers, 0, 500), snowfall: number(c.snowfall, 0, 500), wind: number(c.wind_speed_10m, 0, 500), observedAt: time * 1000, fetchedAt: now, forecast, solarEvents: { sunrise: event('sunrise'), sunset: event('sunset') } }
}
const key = 'meteolivelli-sky-v1', fresh = 15 * 60000, maxAge = 6 * 3600000

/** La validità del modello non si rinnova solo perché la stessa risposta è stata riscaricata. */
export function isWeatherUsable(weather: Weather | null, now: number): boolean {
  return weather !== null && now >= weather.fetchedAt - 60000 && now - weather.fetchedAt <= maxAge && now >= weather.observedAt - 5 * 60000 && now - weather.observedAt <= maxAge
}
export function isWeatherStale(weather: Weather, now: number): boolean {
  return now - weather.fetchedAt >= fresh || now - weather.observedAt > 45 * 60000
}
let memory: Weather | null = null
let pending: Promise<Weather> | null = null
let lastAttempt = -Infinity
function cache(now: number): Weather | null {
  try {
    const item: unknown = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (!record(item) || typeof item.fetchedAt !== 'number' || !Number.isFinite(item.fetchedAt) || item.fetchedAt <= 0 || item.fetchedAt > now || now - item.fetchedAt > maxAge || typeof item.observedAt !== 'number' || !Number.isFinite(item.observedAt) || item.observedAt <= 0 || item.fetchedAt - item.observedAt > 3 * 3600000 || item.observedAt - item.fetchedAt > 5 * 60000 || now - item.observedAt > maxAge || typeof item.condition !== 'string' || !['clear','partly-cloudy','overcast','fog','drizzle','rain','heavy-rain','snow','thunderstorm','unknown'].includes(item.condition)) return null
    if (!(item.cloud === null || number(item.cloud, 0, 100) !== null) || !(item.precipitation === null || number(item.precipitation, 0, 500) !== null) || !(item.wind === null || number(item.wind, 0, 500) !== null) || (item.condition === 'unknown' && item.cloud === null)) return null
    const forecast = Array.isArray(item.forecast) && item.forecast.length <= 72 ? item.forecast.filter((point): point is ForecastHour => record(point) && typeof point.time === 'number' && Number.isFinite(point.time) && point.time >= now - 3600000 && point.time <= now + 26 * 3600000 && (point.precipitationProbability === null || number(point.precipitationProbability, 0, 100) !== null) && typeof point.condition === 'string' && ['clear','partly-cloudy','overcast','fog','drizzle','rain','heavy-rain','snow','thunderstorm','unknown'].includes(point.condition)) : []
    return { ...(item as unknown as Weather), rain: number(item.rain, 0, 500), showers: number(item.showers, 0, 500), snowfall: number(item.snowfall, 0, 500), forecast }
  } catch { return null }
}
export async function loadWeather(now = Date.now(), fetcher: typeof fetch = fetch): Promise<Weather> {
  const stored = isWeatherUsable(memory, now) && memory && now >= memory.fetchedAt ? memory : cache(now)
  if (stored && now - stored.fetchedAt < fresh) return stored
  if (pending) return pending
  if (now - lastAttempt < 5 * 60000) { if (stored) return stored; throw Error('Attesa nuovo tentativo') }
  lastAttempt = now
  pending = (async () => {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000)
    try {
      const url = new URL('https://api.open-meteo.com/v1/forecast')
      url.search = new URLSearchParams({ latitude: String(STATION.latitude), longitude: String(STATION.longitude), current: 'weather_code,cloud_cover,is_day,precipitation,rain,showers,snowfall,wind_speed_10m,temperature_2m', hourly: 'weather_code,precipitation_probability', daily: 'sunrise,sunset', forecast_days: '2', timeformat: 'unixtime', timezone: 'GMT' }).toString()
      const response = await fetcher(url, { signal: controller.signal })
      if (!response.ok) throw Error('Servizio meteo non disponibile')
      const result = parseWeather(await response.json(), now)
      // Una risposta arretrata non deve soppiantare un dato più recente già in cache.
      if (stored && result.observedAt < stored.observedAt) return stored
      memory = result
      try { localStorage.setItem(key, JSON.stringify(result)) } catch { /* Cache facoltativa. */ }
      return result
    } catch (error) { if (stored) return stored; throw error }
    finally { clearTimeout(timer); pending = null }
  })()
  return pending
}
export function visualWeather(w: Weather | null) {
  const condition = w?.condition ?? 'unknown'
  const cloud = w?.cloud === null || w?.cloud === undefined ? null : clamp(w.cloud / 100, 0, 1)
  return { condition, cloud, precipitation: w?.precipitation == null ? null : clamp(w.precipitation / 5, 0, 1), wind: w?.wind == null ? null : clamp(w.wind / 50, 0, 1) }
}

/** Valori grafici normalizzati per fase, conservando null quando i componenti non sono noti. */
export function precipitationLayers(weather: Weather | null) {
  const condition = weather?.condition ?? 'unknown'
  const rain = weather?.rain ?? null, showers = weather?.showers ?? null, snowfall = weather?.snowfall ?? null
  const liquid = (rain ?? 0) + (showers ?? 0)
  let liquidIntensity = rain !== null && showers !== null || liquid > 0 ? clamp(liquid / 5, 0, 1) : null
  // Open-Meteo indica snowfall in cm e precipitation in mm di acqua equivalente:
  // 7 cm di neve corrispondono approssimativamente a 10 mm d'acqua.
  let snowIntensity = snowfall === null ? null : clamp(snowfall / 3.5, 0, 1)
  const total = weather?.precipitation == null ? null : clamp(weather.precipitation / 5, 0, 1)
  if (liquidIntensity === null && ['rain', 'heavy-rain', 'drizzle'].includes(condition) && !(snowfall !== null && snowfall > 0)) liquidIntensity = total
  if (snowIntensity === null && condition === 'snow' && liquid === 0) snowIntensity = total
  return { rain: liquidIntensity, snow: snowIntensity }
}

/** Opacità illustrativa: se manca la copertura, usa soltanto il significato qualitativo del codice WMO. */
export function cloudAppearance(condition: Condition, coverage: number | null): number {
  if (coverage !== null) return clamp(coverage, 0, 1)
  const qualitative: Record<Condition, number> = { clear: 0, 'partly-cloudy': .35, overcast: .9, fog: 0, drizzle: .65, rain: .8, 'heavy-rain': .9, snow: .8, thunderstorm: .95, unknown: 0 }
  return qualitative[condition]
}

/** Parametri grafici qualitativi, senza trasformare un dato assente in misura. */
export function precipitationAppearance(condition: Condition, amount: number | null, maximum: number) {
  const hasPrecipitationCode = ['rain', 'heavy-rain', 'drizzle', 'snow'].includes(condition)
  const intensity = amount === null ? (hasPrecipitationCode ? .35 : 0) : Math.sqrt(clamp(amount, 0, 1))
  return { count: intensity > 0 ? Math.max(4, Math.ceil(maximum * intensity)) : 0, opacity: intensity > 0 ? .3 + .7 * intensity : 0 }
}

/** Previsione per un'ora ancora interamente futura, mai usata come condizione attuale. */
export function nextPrecipitationForecast(weather: Weather | null, now: number): ForecastHour | null {
  if (!isWeatherUsable(weather, now) || !weather) return null
  return weather.forecast?.find(hour => hour.time >= now + 3600000 && hour.time <= now + 2 * 3600000 && hour.precipitationProbability !== null) ?? null
}
