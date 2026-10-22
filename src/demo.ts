import { READ_ENDPOINT } from './weather.ts'
import type { Measurement } from './weather.ts'

/** Legge solo la sorgente DEMO separata tramite il backend. Nessuna modifica al DB. */
export async function readDemoMeasurements(signal: AbortSignal): Promise<Measurement[]> {
  const endpoint = READ_ENDPOINT.replace('/read-measurements', '/read-demo-measurements')
  const response = await fetch(endpoint, { signal, headers: { Accept: 'application/json' }, credentials: 'omit' })
  if (!response.ok) throw new Error('API DEMO non disponibile')
  const value: unknown = await response.json()
  if (!value || typeof value !== 'object' || !('items' in value) || !Array.isArray(value.items)) throw new Error('Risposta DEMO non valida')
  return value.items as Measurement[]
}
