import { formatValue } from './weather.ts'

const reportTime = new Intl.DateTimeFormat('it-IT', {
  timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short',
})

export function formatReportTime(value: string | null): string {
  if (value === null || !Number.isFinite(Date.parse(value))) return 'Orario sconosciuto'
  return reportTime.format(new Date(value))
}

export function formatReportValue(value: number | null, unit: string): string {
  return value === null ? 'Dato assente' : `${formatValue(value)} ${unit}`
}

export function reportFilename(kind: 'grafici' | 'cronologia', generatedAt: Date): string {
  if (!Number.isFinite(generatedAt.getTime())) throw new Error('Data di generazione non valida')
  const date = generatedAt.toISOString().slice(0, 10)
  return `MeteOlivelli-${kind}-${date}.pdf`
}
