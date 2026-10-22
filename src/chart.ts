import { chartSegments, formatTime, isSuspect } from './weather.ts'
import type { Period, ChartMode, Measurement, Metric } from './weather.ts'

const hour = 3600000
const clock = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', hourCycle: 'h23' })
const timeLabel = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' })
const dateLabel = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit' })
const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', weekday: 'short' })
export interface TimeTick { time: number; label: string; major: boolean }

/** Finestra mobile API, con separatori di calendario in Europe/Rome (anche al cambio d'ora). */
export function chartTimeline(period: Period, until: string, range?: { start: number; end: number }) {
  const end = range?.end ?? Date.parse(until)
  if (!Number.isFinite(end)) throw new Error('Fine della finestra non valida')
  const start = range?.start ?? end - (period === '24h' ? 24 : period === '7g' ? 168 : 720) * hour
  const ticks: TimeTick[] = []
  let day = 0
  for (let instant = Math.ceil(start / hour) * hour; instant < end; instant += hour) {
    if (instant <= start) continue
    const localHour = Number(clock.format(instant))
    if (period === '24h' ? localHour % 6 !== 0 : localHour !== 0) continue
    const major = period !== '30g' || weekday.format(instant) === 'Mon'
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
export const dayBands = [
  { name: 'Mattina', hours: '00–12', middle: 6 },
  { name: 'Primo pomeriggio', hours: '12–17', middle: 14.5 },
  { name: 'Sera', hours: '17–24', middle: 20.5 },
] as const
export interface ChartPoint { id: string; time: number; value: number; count: number; label: string }

/** I punti medi sono derivati per il grafico: non diventano eventi nella cronologia. */
export function prepareChart(rows: Measurement[], metric: Metric, mode: ChartMode, until: string) {
  const candidates = rows.filter(row => row.captured_at !== null)
  const dated = mode === 'auto' && candidates.some(row => row.acquisition_kind === 'live') ? candidates.filter(row => row.acquisition_kind === 'live') : candidates
  const first = dated.length ? Date.parse(dated[0].captured_at!) : Date.parse(until)
  const last = dated.length ? Date.parse(dated[dated.length - 1].captured_at!) : Date.parse(until)
  const averaged = mode === 'auto' && last - first > 7 * 24 * hour
  if (!averaged) {
    const segments = chartSegments(dated, metric).map(segment => segment.map(row => ({
      id: row.ingestion_id, time: Date.parse(row.captured_at!), value: row[metric] as number, count: 1, label: formatTime(row.captured_at),
    })))
    const span = Math.max(last - first, hour)
    const range = mode === 'auto' && dated.length ? { start: last - span, end: last } : undefined
    const basis = mode === 'auto' ? (span <= 24 * hour ? '24h' : '7g') : mode
    return { segments, timeline: chartTimeline(basis, until, range), averaged, note: mode === 'auto' ? 'Auto · campioni originali · intervallo adattato ai dati' : '' }
  }
  const finalDay = dayKey(last)
  const shiftDay = (offset: number) => new Date(Date.parse(`${finalDay}T00:00:00Z`) + offset * 24 * hour).toISOString().slice(0, 10)
  const start = zonedTime(shiftDay(-6), 0)
  const end = zonedTime(shiftDay(1), 0)
  // Le medie della stazione non incorporano il batch di prova quando sono presenti misure live.
  const live = dated.some(row => row.acquisition_kind === 'live')
  const selected = dated.filter(row => {
    const time = Date.parse(row.captured_at!)
    return time >= start && time < end && (!live || row.acquisition_kind === 'live')
  })
  const buckets = new Map<string, { sum: number; count: number }>()
  for (const row of selected) {
    const time = Date.parse(row.captured_at!)
    if (row[metric] === null || isSuspect(row, metric)) continue
    const local = localParts(time)
    const localHour = Number(local.hour)
    const band = localHour < 12 ? 0 : localHour < 17 ? 1 : 2
    const key = `${local.year}-${local.month}-${local.day}/${band}`
    const bucket = buckets.get(key) ?? { sum: 0, count: 0 }
    bucket.sum += row[metric] as number
    bucket.count++
    buckets.set(key, bucket)
  }
  const segments: ChartPoint[][] = []
  let segment: ChartPoint[] = []
  for (let offset = -6; offset <= 0; offset++) {
    const day = shiftDay(offset)
    dayBands.forEach((band, index) => {
      const key = `${day}/${index}`
      const bucket = buckets.get(key)
      if (!bucket) {
        if (segment.length) segments.push(segment)
        segment = []
        return
      }
      segment.push({ id: key, time: zonedTime(day, band.middle), value: bucket.sum / bucket.count, count: bucket.count, label: `${day.split('-').reverse().join('/')} · ${band.name} ${band.hours} · media di ${bucket.count} campioni` })
    })
  }
  if (segment.length) segments.push(segment)
  return { segments, timeline: chartTimeline('7g', until, { start, end }), averaged, note: 'Auto · ultime 7 giornate disponibili · medie 00–12 / 12–17 / 17–24' }
}
