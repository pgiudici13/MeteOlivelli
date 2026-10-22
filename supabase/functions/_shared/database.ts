import type { Measurement, QualityFlag } from './measurement.ts'

export interface Receipt {
  status: 'accepted' | 'duplicate'
  source_id: string
  ingestion_id: string
  received_at: string
  quality_flags: QualityFlag[]
}
export type SaveResult = Receipt | { status: 'conflict' }
export interface PublicMeasurement {
  ingestion_id: string
  temperature_c: number | null
  humidity_pct: number | null
  pressure_hpa: number | null
  captured_at: string | null
  measured_at: string | null
  received_at: string
  quality_flags: QualityFlag[]
}
export interface ReadQuery {
  view: 'latest' | 'history'
  period: '24h' | '7g' | '30g'
  basis: 'captured_at' | 'measured_at'
  until: string
  limit: number
  after_time: string | null
  after_id: string | null
}
export interface MeasurementStore {
  save(measurement: Measurement, flags: QualityFlag[], raw: string): Promise<SaveResult>
  read(source: string, query: ReadQuery): Promise<PublicMeasurement[]>
}

/** Solo server; fetch iniettato nei test, nessun accesso all'ambiente all'import. */
export function createRestStore(
  url: string,
  serviceKey: string,
  request: typeof fetch = fetch,
): MeasurementStore {
  const base = new URL(url)
  if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) {
    throw new Error('URL backend non valido')
  }
  async function rpc(name: string, args: Record<string, unknown>): Promise<unknown> {
    const response = await request(new URL(`/rest/v1/rpc/${name}`, base), {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(8000),
    })
    // Non leggere o propagare errori del DB (query, dettagli o altri dati interni).
    if (!response.ok) {
      await response.body?.cancel()
      throw new Error('Database non disponibile')
    }
    return response.json()
  }
  return {
    async save(measurement, flags, raw) {
      const value = await rpc('ingest_station_measurement', {
        p_measurement: measurement,
        p_quality_flags: flags,
        p_raw_payload: raw,
      }) as SaveResult
      if (value?.status === 'conflict') return { status: 'conflict' }
      if (
        !value || !['accepted', 'duplicate'].includes(value.status) ||
        value.source_id !== measurement.source_id ||
        value.ingestion_id !== measurement.ingestion_id ||
        !Number.isFinite(Date.parse(value.received_at)) || !Array.isArray(value.quality_flags)
      ) throw new Error('Conferma database non valida')
      return value
    },
    async read(source, query) {
      const value = await rpc('read_station_measurements', {
        p_source_id: source,
        p_view: query.view,
        p_period: query.period,
        p_basis: query.basis,
        p_until: query.until,
        p_limit: query.limit,
        p_after_time: query.after_time,
        p_after_id: query.after_id,
      })
      if (!Array.isArray(value) || value.length > query.limit + 1) {
        throw new Error('Risposta database non valida')
      }
      // Proiezione esplicita: non propagare colonne interne anche dopo cambi SQL.
      return value.map((row) => ({
        ingestion_id: row.ingestion_id,
        temperature_c: row.temperature_c,
        humidity_pct: row.humidity_pct,
        pressure_hpa: row.pressure_hpa,
        captured_at: row.captured_at,
        measured_at: row.measured_at,
        received_at: row.received_at,
        quality_flags: row.quality_flags,
      }))
    },
  }
}
