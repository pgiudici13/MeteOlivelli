import { getLocale } from './preferences.ts'
import { chartSegments, formatTime, isSuspect } from './weather.ts'
import type { Period, ChartMode, Measurement, Metric } from './weather.ts'

const hour = 3600000
const clock = new Intl.DateTimeFormat(getLocale(), { timeZone: 'Europe/Rome', hour: '2-digit', hourCycle: 'h23' })
const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', weekday: 'short' })
export interface TimeTick { time: number; label: string; major: boolean }

/** Finestra mobile API, con separatori di calendario in Europe/Rome (anche al cambio d'ora). */
export function chartTimeline(period: Period, until: string, range?: { start: number; end: number }, locale = getLocale()) {
  const timeLabel = new Intl.DateTimeFormat(locale, { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  const dateLabel = new Intl.DateTimeFormat(locale, { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit' })
  const end = range?.end ?? Date.parse(until)
  if (!Number.isFinite(end)) throw new Error('Fine della finestra non valida')
  const start = range?.start ?? end - (period === '24h' ? 24 : period === '7g' ? 168 : period === '14g' ? 336 : 720) * hour
  const ticks: TimeTick[] = []
  let day = 0
  for (let instant = Math.ceil(start / hour) * hour; instant < end; instant += hour) {
    if (instant <= start) continue
    const localHour = Number(clock.format(instant))
    if (period === '24h' ? localHour % 6 !== 0 : localHour !== 0) continue
    const major = !['14g', '30g'].includes(period) || weekday.format(instant) === 'Mon'
    // Le linee giornaliere restano presenti, le etichette hanno spazio per respirare.
    const show = period === '24h' || (period === '7g' ? day++ % 2 === 0 : major)
    const awayFromEdges = (instant - start) / (end - start) > 0.19 && (end - instant) / (end - start) > 0.19
    ticks.push({ time: instant, label: show && awayFromEdges ? (period === '24h' ? timeLabel : dateLabel).format(instant) : '', major })
  }
  const boundaryLabel = period === '24h' ? timeLabel : dateLabel
  return { start, end, ticks, startLabel: boundaryLabel.format(start), endLabel: boundaryLabel.format(end) }
}

const calendar = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
function localParts(time: number) {
  return Object.fromEntries(calendar.formatToParts(time).filter(part => part.type !== 'literal').map(part => [part.type, part.value]))
}
function dayKey(time: number) {
  const p = localParts(time)
  return `${p.year}-${p.month}-${p.day}`
}
function zonedTime(day: string, hours: number) {
  const target = Date.parse(`${day}T00:00:00Z`) + hours * hour
  let guess = target
  for (let pass = 0; pass < 3; pass++) {
    const p = localParts(guess)
    const local = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second))
    guess += target - local
  }
  return guess
}
export type ChartSource = 'live' | 'historical' | 'synthetic' | 'unknown'
export type ChartSourceCounts = Record<ChartSource, number>
export interface ChartPoint { id: string; time: number; value: number; count: number; label: string; sources: ChartSourceCounts }

function sourceCounts(row: Measurement): ChartSourceCounts {
  return { live: row.acquisition_kind === 'live' ? 1 : 0, historical: row.acquisition_kind === 'historical' ? 1 : 0, synthetic: row.acquisition_kind === 'synthetic' ? 1 : 0, unknown: row.acquisition_kind === undefined ? 1 : 0 }
}

/** I punti medi sono derivati per il grafico: non diventano eventi nella cronologia. */
export function prepareChart(rows: Measurement[], metric: Metric, mode: ChartMode, until: string, customRange?: { start: number; end: number }, locale = getLocale()) {
  if (customRange) {
    if (!Number.isFinite(customRange.start) || !Number.isFinite(customRange.end) || customRange.start >= customRange.end) throw new Error('Intervallo personalizzato non valido')
    const selected = rows.filter(row => {
      const time = row.measured_at
      return time && Date.parse(time) >= customRange.start && Date.parse(time) <= customRange.end
    })
    const segments = chartSegments(selected, metric).map(segment => segment.map(row => ({
      id: row.ingestion_id, time: Date.parse(row.measured_at!), value: row[metric] as number, count: 1, label: formatTime(row.measured_at), sources: sourceCounts(row),
    })))
    const duration = customRange.end - customRange.start
    return { segments, timeline: chartTimeline(duration <= 2 * 24 * hour ? '24h' : '7g', until, customRange, locale), averaged: false, note: 'Intervallo personalizzato · campioni originali' }
  }
  const candidates = rows.filter(row => row.measured_at !== null)
  const dated = mode === 'auto' && candidates.some(row => row.acquisition_kind === 'live')
    ? candidates.filter(row => row.acquisition_kind === 'live' || row.entry_method === 'manual')
    : candidates
  const first = dated.length ? Date.parse(dated[0].measured_at!) : Date.parse(until)
  const last = dated.length ? Date.parse(dated[dated.length - 1].measured_at!) : Date.parse(until)
  const averaged = mode === 'auto' ? last - first > 7 * 24 * hour : mode !== '24h'
  if (!averaged) {
    const segments = chartSegments(dated, metric).map(segment => segment.map(row => ({
      id: row.ingestion_id, time: Date.parse(row.measured_at!), value: row[metric] as number, count: 1, label: formatTime(row.measured_at), sources: sourceCounts(row),
    })))
    const span = Math.max(last - first, hour)
    const range = mode === 'auto' && dated.length ? { start: last - span, end: last } : undefined
    const basis = mode === 'auto' ? (span <= 24 * hour ? '24h' : '7g') : mode
    return { segments, timeline: chartTimeline(basis, until, range, locale), averaged, note: mode === 'auto' ? 'Auto · campioni originali · intervallo adattato ai dati' : '' }
  }
  const finalDay = dayKey(mode === 'auto' ? last : Date.parse(until))
  const shiftDay = (offset: number) => new Date(Date.parse(`${finalDay}T00:00:00Z`) + offset * 24 * hour).toISOString().slice(0, 10)
  const days = mode === 'auto' ? 7 : mode === '7g' ? 7 : mode === '14g' ? 14 : 30
  const firstOffset = 1 - days
  const start = zonedTime(shiftDay(firstOffset), 0)
  const end = zonedTime(shiftDay(1), 0)
  const selected = dated.filter(row => {
    const time = Date.parse(row.measured_at!)
    return time >= start && time < end
  })
  const buckets = new Map<string, { sum: number; count: number; sources: ChartSourceCounts }>()
  for (const row of selected) {
    const time = Date.parse(row.measured_at!)
    if (row[metric] === null || isSuspect(row, metric)) continue
    const local = localParts(time)
    const localHour = Number(local.hour)
    if (mode !== 'auto' && (localHour < 9 || localHour >= 18)) continue
    if (mode === 'auto') {
      const band = localHour < 12 ? 0 : localHour < 17 ? 1 : 2
      const key = `${local.year}-${local.month}-${local.day}/${band}`
      const bucket = buckets.get(key) ?? { sum: 0, count: 0, sources: { live: 0, historical: 0, synthetic: 0, unknown: 0 } }
      bucket.sum += row[metric] as number
      bucket.count++
      for (const [kind, count] of Object.entries(sourceCounts(row)) as [ChartSource, number][]) bucket.sources[kind] += count
      buckets.set(key, bucket)
    } else {
      const key = `${local.year}-${local.month}-${local.day}`
      const bucket = buckets.get(key) ?? { sum: 0, count: 0, sources: { live: 0, historical: 0, synthetic: 0, unknown: 0 } }
      bucket.sum += row[metric] as number
      bucket.count++
      for (const [kind, count] of Object.entries(sourceCounts(row)) as [ChartSource, number][]) bucket.sources[kind] += count
      buckets.set(key, bucket)
    }
  }
  const segments: ChartPoint[][] = []
  let segment: ChartPoint[] = []
  for (let offset = firstOffset; offset <= 0; offset++) {
    const day = shiftDay(offset)
    const keys = mode === 'auto' ? ['0', '1', '2'] : ['day']
    keys.forEach((bandIndex) => {
      const key = mode === 'auto' ? `${day}/${bandIndex}` : day
      const bucket = buckets.get(key)
      if (!bucket) {
        if (segment.length) segments.push(segment)
        segment = []
        return
      }
      const label = mode === 'auto' ? ['Mattina 00–12', 'Primo pomeriggio 12–17', 'Sera 17–24'][Number(bandIndex)] : '09:00–18:00'
      const middle = mode === 'auto' ? [6, 14.5, 20.5][Number(bandIndex)] : 13.5
      segment.push({ id: key, time: zonedTime(day, middle), value: bucket.sum / bucket.count, count: bucket.count, label: `${day.split('-').reverse().join('/')} · ${label} · media di ${bucket.count} campioni`, sources: bucket.sources })
    })
  }
  if (segment.length) segments.push(segment)
  const timelinePeriod = mode === 'auto' ? '7g' : mode
  const note = mode === 'auto' ? 'Auto · ultime 7 giornate disponibili · medie per fascia 00–12 / 12–17 / 17–24' : `Media giornaliera 09:00–18:00 · ${days} giorni`
  return { segments, timeline: chartTimeline(timelinePeriod, until, { start, end }, locale), averaged, note }
}
