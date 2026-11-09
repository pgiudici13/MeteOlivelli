import { useEffect, useState, type CSSProperties } from 'react'
import { astronomy, moonVisibility } from './astronomy.ts'
import { startSkyClock } from './clock.ts'
import { skyPalette, sunPalette } from './palette.ts'
import { cloudAppearance, isWeatherStale, isWeatherUsable, loadWeather, nextPrecipitationForecast, precipitationAppearance, precipitationLayers, solarEventsForDay, visualWeather, type Condition, type Weather } from './weather.ts'
import { translate } from '../i18n.ts'
import { getLocale } from '../preferences.ts'
import { usePreferences } from '../use-preferences.ts'
import './scene.css'

const labels: Record<Condition, string> = { clear: 'Sereno', 'partly-cloudy': 'Poco nuvoloso', overcast: 'Coperto', fog: 'Nebbia', drizzle: 'Pioviggine', rain: 'Pioggia', 'heavy-rain': 'Pioggia intensa', snow: 'Neve', thunderstorm: 'Temporale', unknown: 'Condizioni non disponibili' }
const clamp = (n: number) => Math.max(0, Math.min(1, n))
const particles = Array.from({ length: 28 }, (_, i) => ({ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`, delay: `${-(i % 11) * .41}s`, size: `${2 + (i % 3)}px` }))
function previewDate(mode: string, now: Date): Date {
  const state = astronomy(now), t = state.times
  const selected = mode === 'alba' ? t.sunrise : mode === 'mattina' ? t.goldenHourEnd : mode === 'mezzogiorno' ? t.solarNoon : mode === 'tramonto' ? t.sunset : mode === 'notte' ? t.night : null
  return selected ? new Date(selected.getTime() + (mode === 'notte' ? 3600000 : mode === 'mattina' ? 3600000 : 0)) : now
}
export function WeatherScene() {
  usePreferences()
  const [now, setNow] = useState(() => new Date())
  const [weather, setWeather] = useState<Weather | null>(null)
  const [previewTime, setPreviewTime] = useState('reale')
  const [previewWeather, setPreviewWeather] = useState('reale')
  useEffect(() => startSkyClock(() => setNow(new Date())), [])
  useEffect(() => {
    let active = true
    const refresh = () => { if (document.visibilityState === 'visible') void loadWeather().then(result => { if (active && document.visibilityState === 'visible') { setWeather(result); setNow(new Date()) } }).catch(() => { if (active && document.visibilityState === 'visible') setWeather(null) }) }
    refresh()
    const timer = window.setInterval(refresh, 15 * 60000)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; clearInterval(timer); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  const date = import.meta.env.DEV ? previewDate(previewTime, now) : now
  const preview = import.meta.env.DEV && (previewWeather !== 'reale' || previewTime !== 'reale')
  const previewCondition = previewWeather === 'overcast-no-cloud' ? 'overcast' : previewWeather === 'thunder-snow' ? 'thunderstorm' : previewWeather as Condition
  const candidate = import.meta.env.DEV && previewWeather !== 'reale' ? previewWeather === 'offline' ? null : { condition: previewCondition, cloud: previewWeather === 'overcast-no-cloud' ? null : previewWeather === 'clear' ? 5 : 85, precipitation: ['rain','snow','thunderstorm','thunder-snow'].includes(previewWeather) ? 3 : 0, rain: ['rain','thunderstorm'].includes(previewWeather) ? 3 : 0, showers: 0, snowfall: ['snow','thunder-snow'].includes(previewWeather) ? 2.1 : 0, wind: 15, observedAt: now.getTime(), fetchedAt: now.getTime() } : weather
  const shown = isWeatherUsable(candidate, now.getTime()) ? candidate : null
  const scene = astronomy(date, preview ? null : solarEventsForDay(shown?.solarEvents, date.getTime()))
  const visual = visualWeather(shown)
  const nextRain = preview ? null : nextPrecipitationForecast(shown, now.getTime())
  const phases = precipitationLayers(shown)
  const rain = precipitationAppearance(['rain', 'heavy-rain', 'drizzle'].includes(visual.condition) ? 'rain' : 'unknown', phases.rain, particles.length)
  const snow = precipitationAppearance(visual.condition === 'snow' ? 'snow' : 'unknown', phases.snow, particles.length)
  const p = skyPalette(scene.sun.altitude, date.getTime() > scene.times.solarNoon.getTime())
  const sunColor = sunPalette(scene.sun.altitude)
  const clouds = cloudAppearance(visual.condition, visual.cloud)
  const sunOpacity = scene.sun.altitude > -0.83 ? (1 - clouds * .88) : 0
  const night = clamp((-scene.sun.altitude - 3) / 12)
  const styles = { '--sky-top': p.top, '--sky-horizon': p.horizon, '--sun-core': sunColor.core, '--sun-middle': sunColor.middle, '--sun-edge': sunColor.edge, '--sun-x': `${scene.sunX}vw`, '--sun-y': `${scene.sunY}vh`, '--sun-opacity': sunOpacity, '--moon-x': `${scene.moonX}vw`, '--moon-y': `${scene.moonY}vh`, '--moon-opacity': moonVisibility(scene.sun.altitude, scene.moon.altitude, clouds), '--stars-opacity': night * (1 - clouds * .9), '--cloud-opacity': clouds * .8, '--rain-opacity': rain.opacity, '--snow-opacity': snow.opacity, '--wind': `${(visual.wind ?? 0) * 14}deg`, '--twilight': p.twilight } as CSSProperties
  const phase = scene.illumination.phase, fraction = scene.illumination.fraction
  const ellipse = Math.abs(1 - 2 * fraction) * 20
  const waxing = phase < .5
  const moonPath = `M 20 0 A 20 20 0 0 ${waxing ? 1 : 0} 20 40 A ${Math.max(.01, ellipse)} 20 0 0 ${fraction < .5 ? (waxing ? 0 : 1) : (waxing ? 1 : 0)} 20 0 Z`
  return <>
    <div className={`weather-scene weather-${visual.condition}${night > .5 ? ' sky-is-night' : ''}${preview ? ' is-preview' : ''}`} style={styles} aria-hidden="true">
      <div className="sky-stars">{particles.map((p, i) => <i key={i} style={{ left: p.left, top: p.top }} />)}</div>
      <div className="sky-sun" /><div className="sky-moon"><svg viewBox="0 0 40 40"><path d={moonPath} fill="#f7f3df" /></svg></div>
      <div className="sky-clouds sky-clouds-back" /><div className="sky-clouds sky-clouds-front" />
      {[{ kind: 'rain', appearance: rain }, { kind: 'snow', appearance: snow }].map(layer => <div key={layer.kind} className={`sky-precipitation sky-${layer.kind}${layer.appearance.count > 0 ? ' is-active' : ''}`}>{particles.map((p, i) => <i key={i} style={{ left: p.left, top: p.top, animationDelay: p.delay, animationPlayState: i < layer.appearance.count ? 'running' : 'paused', opacity: i < layer.appearance.count ? 1 : 0, '--flake': p.size } as CSSProperties} />)}</div>)}
      {visual.condition === 'fog' && <div className="sky-fog" />}
    </div>
    <div className="sky-caption">{preview && <strong>Simulazione · sviluppo</strong>}<span>{translate('Cielo di Pavia · modello Open-Meteo')}</span><strong>{translate(labels[visual.condition])}</strong><span>{scene.sun.altitude > -.83 ? translate('Giorno') : translate('Notte')}{shown && <> · {translate('dato del')} <time dateTime={new Date(shown.observedAt).toISOString()}>{new Intl.DateTimeFormat(getLocale(), { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }).format(shown.observedAt)}</time>{isWeatherStale(shown, now.getTime()) && ` · ${translate('ultimo dato disponibile')}`}</>}</span>{nextRain && <span>{translate('Previsione precipitazioni nell’ora fino alle')} <time dateTime={new Date(nextRain.time).toISOString()}>{new Intl.DateTimeFormat(getLocale(), { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' }).format(nextRain.time)}</time>: {nextRain.precipitationProbability}%</span>}</div>
    {import.meta.env.DEV && <details className="sky-preview"><summary>Anteprima cielo · sviluppo</summary><label>Ora <select value={previewTime} onChange={e => setPreviewTime(e.target.value)}>{['reale','alba','mattina','mezzogiorno','tramonto','notte'].map(v => <option key={v}>{v}</option>)}</select></label><label>Meteo <select value={previewWeather} onChange={e => setPreviewWeather(e.target.value)}>{['reale','clear','partly-cloudy','overcast','overcast-no-cloud','rain','snow','fog','thunderstorm','thunder-snow','offline'].map(v => <option key={v}>{v}</option>)}</select></label></details>}
  </>
}

export default WeatherScene
