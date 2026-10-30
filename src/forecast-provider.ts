/** Previsioni orarie per la posizione fissa della stazione scolastica di Pavia. */
export interface ProviderHour {
  time: number
  temperature_c: number | null
  humidity_pct: number | null
  pressure_hpa: number | null
}
export interface ProviderForecast {
  generatedAt: string
  hours: ProviderHour[]
}

const cacheKey = 'meteolivelli-forecast-cache-v1'
const cacheFor = 30 * 60_000
const maximumAge = 6 * 60 * 60_000
const retryAfterFailure = 5 * 60_000
const api = new URL('https://api.open-meteo.com/v1/forecast')
api.search = new URLSearchParams({
  latitude: '45.185', longitude: '9.156',
  hourly: 'temperature_2m,relative_humidity_2m,surface_pressure',
  timezone: 'Europe/Rome', timeformat: 'unixtime', forecast_days: '2', past_hours: '6',
}).toString()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Convalida e normalizza la risposta senza fidarsi dei dati ricevuti dalla rete. */
export function parseProviderForecast(value: unknown, now: number): ProviderForecast {
  if (!isRecord(value) || !isRecord(value.hourly)) throw new Error('Risposta meteo non valida')
  const hourly = value.hourly
  const times = hourly.time
  const temperature = hourly.temperature_2m
  const humidity = hourly.relative_humidity_2m
  const pressure = hourly.surface_pressure
  if (!Array.isArray(times) || !Array.isArray(temperature) || !Array.isArray(humidity) || !Array.isArray(pressure) ||
    !times.length || times.length > 80 || [temperature, humidity, pressure].some(values => values.length !== times.length)) {
    throw new Error('Serie meteo non valida')
  }
  const hours = times.flatMap((value, index) => {
    // Unix time evita di interpretare le ore Europe/Rome nel fuso del visitatore.
    const time = typeof value === 'number' && Number.isFinite(value) ? value * 1000 : NaN
    if (!Number.isFinite(time) || time > now + 50 * 60 * 60_000) return []
    const metric = (candidate: unknown, key: 'temperature_c' | 'humidity_pct' | 'pressure_hpa') => {
      if (typeof candidate !== 'number' || !Number.isFinite(candidate)) return null
      if (key === 'humidity_pct' && (candidate < 0 || candidate > 100)) throw new Error('Umidità oraria fuori limite')
      if (key === 'pressure_hpa' && (candidate < 700 || candidate > 1200)) throw new Error('Pressione oraria fuori limite')
      if (key === 'temperature_c' && (candidate < -80 || candidate > 65)) throw new Error('Temperatura oraria fuori limite')
      return candidate
    }
    return [{ time, temperature_c: metric(temperature[index], 'temperature_c'), humidity_pct: metric(humidity[index], 'humidity_pct'), pressure_hpa: metric(pressure[index], 'pressure_hpa') }]
  }).sort((a, b) => a.time - b.time)
  if (!hours.some(hour => hour.time >= now - 60 * 60_000 && hour.time <= now + 26 * 60 * 60_000)) throw new Error('Orari meteo non disponibili')
  return { generatedAt: new Date(now).toISOString(), hours }
}

function readCache(now: number): { forecast: ProviderForecast; fetchedAt: number } | null {
  try {
    const raw = window.localStorage.getItem(cacheKey)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.fetchedAt !== 'number') return null
    if (!isRecord(parsed.forecast) || typeof parsed.forecast.generatedAt !== 'string' || !Array.isArray(parsed.forecast.hours)) return null
    const hours = parsed.forecast.hours.filter((point): point is ProviderHour => isRecord(point) &&
      typeof point.time === 'number' && Number.isFinite(point.time) &&
      ['temperature_c', 'humidity_pct', 'pressure_hpa'].every(key => point[key] === null || (typeof point[key] === 'number' && Number.isFinite(point[key]))))
    if (hours.length !== parsed.forecast.hours.length || !hours.length) return null
    const forecast: ProviderForecast = { generatedAt: parsed.forecast.generatedAt, hours: hours.sort((a, b) => a.time - b.time) }
    if (parsed.fetchedAt > now || now - parsed.fetchedAt > maximumAge) return null
    return { forecast, fetchedAt: parsed.fetchedAt }
  } catch { return null }
}

let inMemory: { forecast: ProviderForecast; fetchedAt: number } | null = null
let pending: Promise<{ forecast: ProviderForecast; fetchedAt: number }> | null = null
let lastAttemptAt = -Infinity

/** Cache client di 30 minuti, con uso dell’ultima risposta per un massimo di 6 ore. */
export async function loadProviderForecast(now: number, fetcher: typeof fetch = fetch): Promise<ProviderForecast> {
  const cached = inMemory && now >= inMemory.fetchedAt && now - inMemory.fetchedAt <= maximumAge ? inMemory : readCache(now)
  if (cached && now - cached.fetchedAt < cacheFor) {
    inMemory = cached
    return cached.forecast
  }
  if (pending) return (await pending).forecast
  const stale = cached ?? inMemory
  if (now - lastAttemptAt < retryAfterFailure) {
    if (stale && now >= stale.fetchedAt && now - stale.fetchedAt <= maximumAge) return stale.forecast
    throw new Error('Servizio meteo in attesa del prossimo tentativo')
  }
  lastAttemptAt = now
  pending = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetcher(api, { signal: controller.signal, headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`Servizio meteo: HTTP ${response.status}`)
      const forecast = parseProviderForecast(await response.json(), now)
      const result = { forecast, fetchedAt: now }
      inMemory = result
      try { window.localStorage.setItem(cacheKey, JSON.stringify(result)) } catch { /* Cache facoltativa. */ }
      return result
    } catch (error) {
      if (stale && now >= stale.fetchedAt && now - stale.fetchedAt <= maximumAge) return stale
      throw error
    } finally {
      clearTimeout(timeout)
      pending = null
    }
  })()
  return (await pending).forecast
}
