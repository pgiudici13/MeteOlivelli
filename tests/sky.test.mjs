import test from 'node:test'
import assert from 'node:assert/strict'
import { astronomy, moonVisibility } from '../src/sky/astronomy.ts'
import { startSkyClock } from '../src/sky/clock.ts'
import { skyPalette, sunPalette } from '../src/sky/palette.ts'
import { classify, parseWeather, visualWeather, loadWeather, nextPrecipitationForecast, isWeatherUsable, isWeatherStale, precipitationAppearance, precipitationLayers, cloudAppearance } from '../src/sky/weather.ts'

test('orologio del cielo: sospensione in background, ripresa immediata e pulizia', () => {
  const page = new EventTarget()
  page.visibilityState = 'visible'
  let tick, interval, cleared, updates = 0
  const timers = { setInterval: (callback, delay) => { tick = callback; interval = delay; return 17 }, clearInterval: id => { cleared = id } }
  const stop = startSkyClock(() => { updates++ }, page, timers)
  assert.equal(interval, 60000)
  tick()
  assert.equal(updates, 1)
  page.visibilityState = 'hidden'
  page.dispatchEvent(new Event('visibilitychange'))
  tick()
  assert.equal(updates, 1)
  page.visibilityState = 'visible'
  page.dispatchEvent(new Event('visibilitychange'))
  assert.equal(updates, 2)
  stop()
  assert.equal(cleared, 17)
  page.dispatchEvent(new Event('visibilitychange'))
  assert.equal(updates, 2)
})

test('astronomia: percorso diurno, stagioni e cambio ora legale', () => {
  const winter = astronomy(new Date('2026-01-15T12:00:00Z'))
  const summer = astronomy(new Date('2026-06-15T12:00:00Z'))
  assert.ok(summer.sun.altitude > winter.sun.altitude + 30)
  assert.ok(summer.times.sunset - summer.times.sunrise > winter.times.sunset - winter.times.sunrise)
  const noon = summer.times.solarNoon.getTime(), sunrise = summer.times.sunrise.getTime(), sunset = summer.times.sunset.getTime()
  assert.ok(astronomy(new Date(sunrise + 60000)).sunX < astronomy(new Date(noon)).sunX)
  assert.ok(astronomy(new Date(noon)).sunX < astronomy(new Date(sunset - 60000)).sunX)
  const before = astronomy(new Date('2026-03-29T00:59:00Z'))
  const after = astronomy(new Date('2026-03-29T01:01:00Z'))
  assert.ok(Math.abs(before.sun.altitude - after.sun.altitude) < 1)
  assert.ok(summer.illumination.fraction >= 0 && summer.illumination.fraction <= 1)
  assert.equal(typeof summer.moon.altitude, 'number')
})


test('eventi solari appartengono al giorno civile di Pavia anche intorno a mezzanotte e ai cambi d’ora', () => {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' })
  for (const [early, later, expected] of [
    ['2026-06-30T22:10:00Z', '2026-07-01T10:00:00Z', '2026-07-01'],
    ['2026-03-28T23:10:00Z', '2026-03-29T10:00:00Z', '2026-03-29'],
    ['2026-10-24T22:10:00Z', '2026-10-25T10:00:00Z', '2026-10-25'],
  ]) {
    const first = astronomy(new Date(early)), second = astronomy(new Date(later))
    for (const name of ['sunrise', 'sunset', 'solarNoon', 'dawn', 'dusk']) {
      assert.equal(day.format(first.times[name]), expected, `${early} ${name}`)
      assert.equal(first.times[name].getTime(), second.times[name].getTime(), `${early} ${name}`)
    }
  }
  // Le ore UTC a cavallo di mezzanotte attraversano entrambe le mezzanotti civili CET/CEST.
  for (let index = 0; index < 365; index++) {
    for (const hour of [22, 23]) {
      const instant = new Date(Date.UTC(2026, 0, 1 + index, hour, 10))
      assert.equal(day.format(astronomy(instant).times.sunrise), day.format(instant), instant.toISOString())
    }
  }
  // I due istanti con la stessa ora civile nel ritorno all'ora solare restano distinti.
  const first = astronomy(new Date('2026-10-25T00:30:00Z'))
  const second = astronomy(new Date('2026-10-25T01:30:00Z'))
  assert.equal(first.times.sunrise.getTime(), second.times.sunrise.getTime())
  assert.notEqual(first.moon.azimuth, second.moon.azimuth)
})

test('la Luna non compare sotto l’orizzonte e si attenua con luce e nuvole', () => {
  assert.equal(moonVisibility(-30, -1, 0), 0)
  assert.equal(moonVisibility(10, 20, 0), 0)
  assert.equal(moonVisibility(-30, 20, 0), 1)
  assert.ok(moonVisibility(-30, 20, 1) < moonVisibility(-30, 20, 0))
  assert.ok(moonVisibility(-8, 20, 0) > 0 && moonVisibility(-8, 20, 0) < 1)
})

test('la proiezione lunare rimane continua sopra l’orizzonte durante il 2026', () => {
  const start = Date.parse('2026-01-01T00:00:00Z')
  let previous = null, visibleSamples = 0
  for (let time = start; time < start + 365 * 86400000; time += 300000) {
    const state = astronomy(new Date(time))
    if (state.moon.altitude > 0) {
      visibleSamples++
      if (previous !== null) assert.ok(Math.abs(state.moonX - previous) < 1.5, new Date(time).toISOString())
      previous = state.moonX
    } else previous = null
  }
  assert.ok(visibleSamples > 50000)
})

test('classificazione WMO e dati mancanti', () => {
  // Codici documentati da Open-Meteo, raggruppati per la resa grafica del sito.
  const groups = [
    ['clear', [0]], ['partly-cloudy', [1, 2]], ['overcast', [3]], ['fog', [45, 48]],
    ['drizzle', [51, 53, 55, 56, 57]], ['rain', [61, 63, 66, 80, 81]],
    ['heavy-rain', [65, 67, 82]], ['snow', [71, 73, 75, 77, 85, 86]],
    ['thunderstorm', [95, 96, 97, 99]], ['unknown', [4, 999, null]],
  ]
  for (const [expected, codes] of groups) for (const code of codes) assert.equal(classify(code), expected, `codice ${code}`)
  assert.equal(visualWeather(null).cloud, null)
  const now = Date.parse('2026-06-01T12:00:00Z')
  const w = parseWeather({current: {time: now/1000, weather_code: 75, cloud_cover: 90, precipitation: 2, wind_speed_10m: 10}}, now)
  assert.equal(w.condition, 'snow')
  assert.equal(visualWeather(w).precipitation, .4)
  assert.throws(() => parseWeather({current: {time: 0}}, now))
  assert.throws(() => parseWeather({current: {time: now / 1000}}, now), /Condizioni meteo non disponibili/)
  assert.equal(parseWeather({current: {time: now / 1000, cloud_cover: 80}}, now).condition, 'unknown')
  assert.throws(() => parseWeather({current: {time: (now + 6 * 60000) / 1000, weather_code: 0}}, now), /Orario meteo non valido/)
})
test('cache condivide le richieste e conserva dati validi', async () => {
  const now = Date.now(); let calls = 0
  globalThis.localStorage = { getItem: () => null, setItem: () => {} }
  const fetcher = async () => { calls++; await new Promise(resolve => setTimeout(resolve, 10)); return { ok: true, json: async () => ({ current: { time: Math.floor(now/1000), weather_code: 0 } }) } }
  const [a,b] = await Promise.all([loadWeather(now, fetcher), loadWeather(now, fetcher)])
  assert.equal(calls, 1); assert.deepEqual(a,b)
  await loadWeather(now + 60000, fetcher); assert.equal(calls, 1)
  const stale = await loadWeather(now + 16 * 60000, async () => { throw Error('offline') })
  assert.equal(stale.fetchedAt, now)
  const malformed = await loadWeather(now + 31 * 60000, async () => ({ ok: true, json: async () => ({ current: { time: Math.floor((now + 31 * 60000) / 1000) } }) }))
  assert.equal(malformed.fetchedAt, now, 'una risposta priva di condizioni non sostituisce la cache')
  const older = await loadWeather(now + 46 * 60000, async () => ({ ok: true, json: async () => ({ current: { time: Math.floor((now - 30 * 60000) / 1000), weather_code: 3 } }) }))
  assert.equal(older.condition, 'clear', 'una risposta più vecchia non sostituisce il dato recente')
  await assert.rejects(loadWeather(now + 7 * 3600000, async () => { throw Error('offline') }))
})

test('cache persistente: ripristino dopo il riavvio e rifiuto dei dati non validi', async () => {
  const now = Date.parse('2026-06-01T12:00:00Z')
  const valid = { condition: 'rain', cloud: 90, precipitation: 2, wind: 12, observedAt: now - 60000, fetchedAt: now - 60000 }
  let saved = JSON.stringify(valid), calls = 0
  globalThis.localStorage = { getItem: () => saved, setItem: (_key, value) => { saved = value } }
  const restoredModule = await import('../src/sky/weather.ts?persistent-cache-test')
  const offline = async () => { calls++; throw Error('offline') }
  const restored = await restoredModule.loadWeather(now, offline)
  assert.equal(restored.condition, 'rain')
  assert.equal(calls, 0, 'una cache recente evita la rete')
  saved = JSON.stringify({ ...valid, cloud: 500 })
  const invalidModule = await import('../src/sky/weather.ts?invalid-cache-test')
  await assert.rejects(invalidModule.loadWeather(now, offline), /offline/)
  assert.equal(calls, 1, 'una cache non valida non viene presentata come dato reale')
})

test('timeout meteo interrompe la richiesta e consente un nuovo tentativo', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  globalThis.localStorage = { getItem: () => null, setItem: () => {} }
  const { loadWeather: load } = await import('../src/sky/weather.ts?timeout-test')
  const now = Date.parse('2026-06-01T12:00:00Z')
  let signal
  const stalled = (_url, options) => new Promise((_resolve, reject) => {
    signal = options.signal
    signal.addEventListener('abort', () => reject(new Error('richiesta interrotta')), { once: true })
  })
  const pending = load(now, stalled)
  const rejected = assert.rejects(pending, /richiesta interrotta/)
  t.mock.timers.tick(7999)
  assert.equal(signal.aborted, false)
  t.mock.timers.tick(1)
  await rejected
  assert.equal(signal.aborted, true)
  const later = now + 6 * 60000
  const result = await load(later, async () => ({ ok: true, json: async () => ({ current: { time: later / 1000, weather_code: 0 } }) }))
  assert.equal(result.condition, 'clear')
})


test('previsione oraria resta distinta dalle condizioni correnti e non usa un’ora già iniziata', () => {
  const now = Date.parse('2026-06-01T12:15:00Z')
  const result = parseWeather({
    current: { time: now / 1000, weather_code: 0, cloud_cover: 8, precipitation: 0 },
    hourly: { time: [Date.parse('2026-06-01T13:00:00Z') / 1000, Date.parse('2026-06-01T14:00:00Z') / 1000], precipitation_probability: [90, 60], weather_code: [95, 97] },
    daily: { sunrise: [Date.parse('2026-06-01T03:40:00Z') / 1000], sunset: [Date.parse('2026-06-01T19:10:00Z') / 1000] },
  }, now)
  assert.equal(result.condition, 'clear')
  assert.equal(result.solarEvents.sunrise, Date.parse('2026-06-01T03:40:00Z'))
  assert.equal(result.forecast[1].condition, 'thunderstorm')
  assert.deepEqual(nextPrecipitationForecast(result, now), { time: Date.parse('2026-06-01T14:00:00Z'), precipitationProbability: 60, condition: 'thunderstorm' })
  assert.equal(nextPrecipitationForecast(result, now + 7 * 3600000), null)
  const invalid = parseWeather({ current: { time: now / 1000, weather_code: 3 }, hourly: { time: [(now + 7200000) / 1000], precipitation_probability: [101] } }, now)
  assert.equal(nextPrecipitationForecast(invalid, now), null)
})

test('contrasto del testo sul cielo e sulle card nei casi limite', async () => {
  const { readFile } = await import('node:fs/promises')
  const css = await readFile(new URL('../src/sky/scene.css', import.meta.url), 'utf8')
  const baseCss = await readFile(new URL('../src/index.css', import.meta.url), 'utf8')
  const hex = value => value.match(/[0-9a-f]{2}/gi).map(part => parseInt(part, 16))
  const dark = hex(css.match(/\.site-shell \{[^}]*--secondary: #(\w{6})/)[1])
  const light = hex(css.match(/:root\[data-theme="light"\] \.site-shell \{[^}]*--secondary: #(\w{6})/)[1])
  const darkWarning = hex(css.match(/\.site-shell \{[^}]*--accent-text: #(\w{6})/)[1])
  const lightWarning = hex(css.match(/:root\[data-theme="light"\] \.site-shell \{[^}]*--accent-text: #(\w{6})/)[1])
  const darkPrimary = hex(baseCss.match(/:root \{[^}]*--text: #(\w{6})/)[1])
  const lightPrimary = hex(baseCss.match(/:root\[data-theme="light"\] \{[^}]*--text: #(\w{6})/)[1])
  const srgb = channel => { const c = channel / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4 }
  const luminance = channels => channels.reduce((sum, value, index) => sum + srgb(value) * [.2126, .7152, .0722][index], 0)
  const contrast = (a, b) => { const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (high + .05) / (low + .05) }
  const veil = expression => {
    const match = css.match(expression)
    assert.ok(match, 'velatura del cielo non trovata')
    return { rgb: match.slice(1, 4).map(Number), opacity: Number(match[4]) }
  }
  const darkVeil = veil(/\.site-shell::before \{[^}]*background: rgb\((\d+) (\d+) (\d+) \/ ([.\d]+)\)/)
  const lightVeil = veil(/:root\[data-theme='light'\] \.site-shell::before \{[^}]*background: rgb\((\d+) (\d+) (\d+) \/ ([.\d]+)\)/)
  // Bianco e nero puri delimitano le scene possibili dietro il velo, anche sotto il disco solare.
  const darkWorst = darkVeil.rgb.map(value => value * darkVeil.opacity + 255 * (1 - darkVeil.opacity))
  const lightWorst = lightVeil.rgb.map(value => value * lightVeil.opacity)
  assert.ok(contrast(dark, darkWorst) >= 4.5)
  assert.ok(contrast(light, lightWorst) >= 4.5)
  assert.ok(contrast(darkWarning, darkWorst) >= 4.5)
  assert.ok(contrast(lightWarning, lightWorst) >= 4.5)
  assert.ok(contrast(darkPrimary, darkWorst) >= 4.5)
  assert.ok(contrast(lightPrimary, lightWorst) >= 4.5)
  const glass = expression => {
    const match = css.match(expression)
    assert.ok(match, 'superficie traslucida non trovata')
    return { rgb: match.slice(1, 4).map(Number), opacity: Number(match[4]) }
  }
  const layers = [
    [darkWorst, darkPrimary, dark, glass(/\.site-shell \{[^}]*--sky-glass: rgb\((\d+) (\d+) (\d+) \/ ([.\d]+)\)/)],
    [darkWorst, darkPrimary, dark, glass(/\.site-shell:has\(\.sky-is-night\) \{[^}]*--sky-glass: rgb\((\d+) (\d+) (\d+) \/ ([.\d]+)\)/)],
    [lightWorst, lightPrimary, light, glass(/:root\[data-theme="light"\] \.site-shell \{[^}]*--sky-glass: rgb\((\d+) (\d+) (\d+) \/ ([.\d]+)\)/)],
    [lightWorst, lightPrimary, light, glass(/:root\[data-theme="light"\] \.site-shell:has\(\.sky-is-night\) \{[^}]*--sky-glass: rgb\((\d+) (\d+) (\d+) \/ ([.\d]+)\)/)],
  ]
  for (const [background, primary, secondary, surface] of layers) {
    const composite = surface.rgb.map((value, i) => value * surface.opacity + background[i] * (1 - surface.opacity))
    assert.ok(contrast(primary, composite) >= 4.5)
    assert.ok(contrast(secondary, composite) >= 4.5)
  }
})


test('freschezza legata all’ora del modello e non soltanto al download', () => {
  const now = Date.parse('2026-06-01T12:00:00Z')
  const delayed = parseWeather({ current: { time: (now - 2 * 3600000) / 1000, weather_code: 3 } }, now)
  assert.equal(isWeatherStale(delayed, now), true)
  assert.equal(isWeatherUsable(delayed, now), true)
  assert.equal(isWeatherUsable(delayed, now + 4 * 3600000 + 1), false)
  const fresh = parseWeather({ current: { time: now / 1000, weather_code: 0 } }, now)
  assert.equal(isWeatherStale(fresh, now + 14 * 60000), false)
  assert.equal(isWeatherStale(fresh, now + 15 * 60000), true)
  assert.equal(isWeatherUsable(fresh, now - 6 * 60000), false)
})


test('densità visiva delle precipitazioni cresce con il dato disponibile', () => {
  const weak = precipitationAppearance('snow', .04, 28)
  const heavy = precipitationAppearance('snow', .81, 28)
  assert.ok(weak.count > 0 && heavy.count > weak.count && heavy.count <= 28)
  assert.ok(heavy.opacity > weak.opacity && heavy.opacity <= 1)
  assert.equal(precipitationAppearance('thunderstorm', null, 28).count, 0)
  assert.equal(precipitationAppearance('rain', 0, 28).count, 0)
  assert.ok(precipitationAppearance('rain', null, 28).count > 0, 'il codice WMO permette una rappresentazione qualitativa')
})


test('la scena rispetta la copertura disponibile e usa il codice quando manca', () => {
  const now = Date.parse('2026-06-01T12:00:00Z')
  const w = parseWeather({ current: { time: now / 1000, weather_code: 3 } }, now)
  const visual = visualWeather(w)
  assert.equal(visual.cloud, null, 'una copertura assente resta assente nei dati')
  assert.ok(cloudAppearance(visual.condition, visual.cloud) > .7, 'il codice coperto produce nuvole visibili')
  assert.ok(cloudAppearance('thunderstorm', null) > cloudAppearance('partly-cloudy', null))
  assert.equal(cloudAppearance('overcast', .25), .25, 'il valore disponibile prevale sulla stima grafica')
  assert.equal(cloudAppearance('unknown', null), 0)
})


test('pioggia e neve restano distinte anche durante un temporale', () => {
  const now = Date.parse('2026-06-01T12:00:00Z')
  const build = current => parseWeather({ current: { time: now / 1000, weather_code: 95, ...current } }, now)
  const snowOnly = build({ precipitation: 3, rain: 0, showers: 0, snowfall: 2.1 })
  const snowLayers = precipitationLayers(snowOnly)
  assert.equal(snowLayers.rain, 0)
  assert.ok(Math.abs(snowLayers.snow - .6) < 1e-9)
  const mixed = precipitationLayers(build({ precipitation: 5, rain: 1, showers: 1, snowfall: 2.1 }))
  assert.equal(mixed.rain, .4)
  assert.ok(Math.abs(mixed.snow - .6) < 1e-9)
  const unknown = precipitationLayers(build({ precipitation: 3 }))
  assert.deepEqual(unknown, { rain: null, snow: null }, 'un totale senza fase non viene attribuito a pioggia o neve')
  const rainCode = parseWeather({ current: { time: now / 1000, weather_code: 61, precipitation: 1 } }, now)
  assert.equal(precipitationLayers(rainCode).rain, .2, 'il codice pioggia consente di usare il totale quando la fase non è disponibile')
})


test('colori solari e crepuscolari cambiano gradualmente con l’altezza', () => {
  const horizon = sunPalette(0), middle = sunPalette(7.5), high = sunPalette(20)
  assert.equal(horizon.warmth, 1)
  assert.equal(high.warmth, 0)
  assert.ok(middle.warmth > high.warmth && middle.warmth < horizon.warmth)
  assert.notEqual(horizon.edge, high.edge)
  assert.equal(skyPalette(-18, false).daylight, 0)
  assert.equal(skyPalette(25, false).daylight, 1)
  assert.notEqual(skyPalette(0, false).horizon, skyPalette(0, true).horizon)
})
