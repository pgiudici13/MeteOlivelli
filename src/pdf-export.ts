import { getLocale, displayUnit } from './preferences.ts'
import { formatValue } from './weather.ts'

const reportTime = () => new Intl.DateTimeFormat(getLocale(), {
  timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short',
})
const reportDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
})

export function formatReportTime(value: string | null): string {
  if (value === null || !Number.isFinite(Date.parse(value))) return 'Orario sconosciuto'
  return reportTime().format(new Date(value))
}

export function formatReportValue(value: number | null, unit: string, metric?: string): string {
  return value === null ? 'Dato assente' : `${formatValue(value, metric)} ${metric ? displayUnit(metric) : unit}`
}

export function reportFilename(kind: 'grafici' | 'cronologia', generatedAt: Date): string {
  if (!Number.isFinite(generatedAt.getTime())) throw new Error('Data di generazione non valida')
  const date = reportDate.format(generatedAt)
  return `MeteOlivelli-${kind}-${date}.pdf`
}
