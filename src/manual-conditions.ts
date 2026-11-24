import type { Measurement } from './weather.ts'
import { isSuspect } from './weather.ts'

export type ManualConditions = { observed_at: string; cloud: string; rain: string; wind: string }
export const conditionLabels: Record<string, string> = { sereno: 'Sereno', poco_nuvoloso: 'Poco nuvoloso', nuvoloso: 'Nuvoloso', coperto: 'Coperto', assente: 'Assente', debole: 'Debole', moderata: 'Moderata', forte: 'Forte', calmo: 'Calmo', moderato: 'Moderato' }
const endpoint = 'https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/read-manual-conditions'
export async function readManualConditions(signal: AbortSignal, fetcher: typeof fetch = fetch): Promise<ManualConditions[]> {
  const all: ManualConditions[] = []
  for (let offset = 0; offset <= 99000; offset += 100) {
    const url = new URL(endpoint); url.searchParams.set('offset', String(offset))
    const response = await fetcher(url, { signal, cache: 'no-store' })
    if (!response.ok) throw new Error('Osservazioni non disponibili')
    const data = await response.json() as { items?: unknown; next_offset?: unknown }
    if (!Array.isArray(data.items) || data.items.length > 100) throw new Error('Risposta non valida')
    for (const item of data.items) {
      if (!item || typeof item !== 'object' || typeof item.observed_at !== 'string' || !Number.isFinite(Date.parse(item.observed_at)) || !['sereno','poco_nuvoloso','nuvoloso','coperto'].includes(item.cloud) || !['assente','debole','moderata','forte'].includes(item.rain) || !['calmo','debole','moderato','forte'].includes(item.wind)) throw new Error('Osservazione non valida')
      all.push(item as ManualConditions)
    }
    if (data.next_offset === null) return all
    if (data.next_offset !== offset + 100 || data.items.length !== 100) throw new Error('Paginazione non valida')
  }
  throw new Error('Limite storico superato')
}
/** Associa soltanto misure con orario fisico attestato; non sostituire con orario di ricezione. */
export function nearestMeasurement(observedAt: string, rows: Measurement[]): Measurement | null {
  const time = Date.parse(observedAt)
  if (!Number.isFinite(time)) return null
  return rows.filter(row => (row.acquisition_kind === 'live' || row.acquisition_kind === 'historical') && row.measured_at && Number.isFinite(Date.parse(row.measured_at)) && ((row.humidity_pct !== null && !isSuspect(row, 'humidity_pct')) || (row.pressure_hpa !== null && !isSuspect(row, 'pressure_hpa'))))
    .sort((a, b) => Math.abs(Date.parse(a.measured_at!) - time) - Math.abs(Date.parse(b.measured_at!) - time) || Date.parse(a.measured_at!) - Date.parse(b.measured_at!) || a.ingestion_id.localeCompare(b.ingestion_id))[0] ?? null
}
