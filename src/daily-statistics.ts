import { isSuspect, metrics } from './weather.ts'
import type { Measurement, Metric } from './weather.ts'

const calendar = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' })
const dayLabel = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', year: 'numeric' })

export interface MetricStatistics { count: number; minimum: number; maximum: number; average: number; observedHours: number }
export interface DayStatistics {
  key: string
  label: string
  metrics: Partial<Record<Metric, MetricStatistics>>
  first: number
  last: number
}

function dayKey(time: number) {
  const parts = Object.fromEntries(calendar.formatToParts(time).map(part => [part.type, part.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}

/** Campioni reali, datati e validi; la raccolta parziale non viene completata artificialmente. */
export function collectDailyStatistics(rows: Measurement[], serverUntil: string): { days: DayStatistics[]; today: string; month: string } {
  const now = Date.parse(serverUntil)
  if (!Number.isFinite(now)) throw new Error('Tempo server non valido')
  type Acc = { sum: number; count: number; minimum: number; maximum: number; hours: Set<number> }
  const grouped = new Map<string, { first: number; last: number; metrics: Partial<Record<Metric, Acc>> }>()
  for (const row of rows) {
    if (!['live', 'historical'].includes(row.acquisition_kind ?? '')) continue
    const stamp = row.measured_at ?? row.captured_at
    if (!stamp) continue
    const time = Date.parse(stamp)
    if (!Number.isFinite(time) || time > now) continue
    const key = dayKey(time)
    const entry = grouped.get(key) ?? { first: time, last: time, metrics: {} }
    let valid = false
    for (const metric of metrics) {
      const value = row[metric.key]
      if (value === null || !Number.isFinite(value) || isSuspect(row, metric.key)) continue
      valid = true
      const acc = entry.metrics[metric.key] ?? { sum: 0, count: 0, minimum: value, maximum: value, hours: new Set<number>() }
      acc.sum += value
      acc.count++
      acc.hours.add(Math.floor(time / 3_600_000))
      acc.minimum = Math.min(acc.minimum, value)
      acc.maximum = Math.max(acc.maximum, value)
      entry.metrics[metric.key] = acc
    }
    if (!valid) continue
    entry.first = Math.min(entry.first, time)
    entry.last = Math.max(entry.last, time)
    grouped.set(key, entry)
  }
  const days = [...grouped.entries()].map(([key, entry]): DayStatistics => ({
    key, label: dayLabel.format(new Date(entry.first)), first: entry.first, last: entry.last,
    metrics: Object.fromEntries(Object.entries(entry.metrics).map(([metric, value]) => [metric, {
      count: value!.count, minimum: value!.minimum, maximum: value!.maximum, average: value!.sum / value!.count,
      observedHours: value!.hours.size,
    }])),
  })).sort((a, b) => b.key.localeCompare(a.key))
  const today = dayKey(now)
  return { days, today, month: today.slice(0, 7) }
}

export function monthExtremes(days: DayStatistics[], month: string) {
  const eligible = days.filter(day => day.key.startsWith(`${month}-`) && day.metrics.temperature_c)
  if (!eligible.length) return null
  return {
    warmest: eligible.reduce((a, b) => a.metrics.temperature_c!.average >= b.metrics.temperature_c!.average ? a : b),
    coldest: eligible.reduce((a, b) => a.metrics.temperature_c!.average <= b.metrics.temperature_c!.average ? a : b),
    days: eligible.length,
  }
}

/** Intervalli di giorni civili italiani; giorni senza misure restano senza peso. */
export function aggregatePeriod(days: DayStatistics[], start: string, end: string) {
  const selected = days.filter(day => day.key >= start && day.key <= end)
  const values: Partial<Record<Metric, MetricStatistics>> = {}
  for (const metric of metrics) {
    const samples = selected.map(day => day.metrics[metric.key]).filter((value): value is MetricStatistics => value !== undefined)
    const count = samples.reduce((sum, value) => sum + value.count, 0)
    if (!count) continue
    values[metric.key] = {
      count,
      minimum: Math.min(...samples.map(value => value.minimum)),
      maximum: Math.max(...samples.map(value => value.maximum)),
      average: samples.reduce((sum, value) => sum + value.average * value.count, 0) / count,
      observedHours: samples.reduce((sum, value) => sum + value.observedHours, 0),
    }
  }
  return { metrics: values, observedDays: selected.length }
}

export function shiftCivilDay(key: string, offset: number) {
  const date = new Date(`${key}T12:00:00Z`)
  if (!Number.isFinite(date.getTime())) throw new Error('Giorno non valido')
  date.setUTCDate(date.getUTCDate() + offset)
  return date.toISOString().slice(0, 10)
}

/** Statistiche su un intervallo esatto, mai interpolate e senza campioni sintetici. */
export function collectRangeStatistics(rows: Measurement[], range: { start: number; end: number }, serverUntil: string) {
  const now = Date.parse(serverUntil)
  if (!Number.isFinite(now) || !Number.isFinite(range.start) || !Number.isFinite(range.end) || range.start >= range.end) return null
  type Acc = { sum: number; count: number; minimum: number; maximum: number; hours: Set<number> }
  const grouped: Partial<Record<Metric, Acc>> = {}
  let samples = 0
  for (const row of rows) {
    if (!['live', 'historical'].includes(row.acquisition_kind ?? '')) continue
    const time = Date.parse(row.measured_at ?? row.captured_at ?? '')
    if (!Number.isFinite(time) || time < range.start || time > range.end || time > now) continue
    let any = false
    for (const metric of metrics) {
      const value = row[metric.key]
      if (value === null || !Number.isFinite(value) || isSuspect(row, metric.key)) continue
      any = true
      const acc = grouped[metric.key] ?? { sum: 0, count: 0, minimum: value, maximum: value, hours: new Set<number>() }
      acc.sum += value
      acc.count++
      acc.minimum = Math.min(acc.minimum, value)
      acc.maximum = Math.max(acc.maximum, value)
      acc.hours.add(Math.floor(time / 3_600_000))
      grouped[metric.key] = acc
    }
    if (any) samples++
  }
  const values: Partial<Record<Metric, MetricStatistics>> = {}
  for (const metric of metrics) {
    const item = grouped[metric.key]
    if (item) values[metric.key] = { count: item.count, minimum: item.minimum, maximum: item.maximum, average: item.sum / item.count, observedHours: item.hours.size }
  }
  return { metrics: values, samples }
}
