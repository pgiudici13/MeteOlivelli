import { stationMeasurements } from './weather.ts'
import type { Measurement } from './weather.ts'

/** Esito del controllo salute: error > warning > ok. */
export type HealthStatus = 'ok' | 'warning' | 'error'

export interface HealthReport {
  status: HealthStatus
  messages: string[]
  details: {
    serverUntil: string | null
    latestReceivedAt: string | null
    latestMeasuredAt: string | null
    latestCapturedAt: string | null
    receivedAgeHours: number | null
    measuredAgeHours: number | null
    clockSkewMinutes: number | null
  }
}

export interface HealthInput {
  /** Orologio del sistema che esegue il controllo. */
  now: number
  /** Istante `until` restituito dall'API; null se l'endpoint non è raggiungibile. */
  serverUntil: string | null
  /** Campioni della risposta `view=latest` (al massimo uno). */
  items: Measurement[]
}

export interface HealthOptions {
  /** Ore massime senza nuovi campioni ricevuti prima dell'avviso. */
  maxAgeHours?: number
  /** Soglia di scostamento orologio locale vs server, in minuti. */
  maxClockSkewMinutes?: number
}

const hours = 3600000

/**
 * Valutazione pura della salute della pipeline dati pubblica.
 * L'età dei campioni è sempre calcolata sul tempo del server: l'orologio locale
 * è solo un controllo separato, mai una fonte di date.
 */
export function evaluateStationHealth(input: HealthInput, options: HealthOptions = {}): HealthReport {
  const maxAgeHours = options.maxAgeHours ?? 26
  const maxClockSkewMinutes = options.maxClockSkewMinutes ?? 5
  const messages: string[] = []
  let warned = false
  const number = (value: number) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(value)
  const details: HealthReport['details'] = {
    serverUntil: input.serverUntil,
    latestReceivedAt: null,
    latestMeasuredAt: null,
    latestCapturedAt: null,
    receivedAgeHours: null,
    measuredAgeHours: null,
    clockSkewMinutes: null,
  }
  const serverTime = input.serverUntil ? Date.parse(input.serverUntil) : NaN
  if (!Number.isFinite(serverTime)) {
    return {
      status: 'error',
      messages: ['Endpoint di lettura non raggiungibile o risposta non valida.'],
      details,
    }
  }
  details.clockSkewMinutes = Math.round((input.now - serverTime) / 60000)
  if (Math.abs(input.now - serverTime) > maxClockSkewMinutes * 60000) {
    warned = true
    messages.push(
      `Orologio locale distante dal tempo del server di ${Math.abs(details.clockSkewMinutes)} minuti: verificare la sincronizzazione.`,
    )
  }
  const rawLatest = input.items[0] ?? null
  const latest = stationMeasurements(input.items)[0] ?? null
  if (!rawLatest) {
    messages.push('Nessun campione presente nel database.')
    return { status: 'warning', messages, details }
  }
  if (!latest) {
    messages.push('Presenti solo campioni sintetici o senza provenienza: nessuna misura della stazione.')
    return { status: 'warning', messages, details }
  }
  details.latestReceivedAt = latest.received_at
  details.latestMeasuredAt = latest.measured_at
  details.latestCapturedAt = latest.captured_at
  const receivedAge = (serverTime - Date.parse(latest.received_at)) / hours
  details.receivedAgeHours = Math.round(receivedAge * 10) / 10
  if (latest.measured_at) {
    const measuredAge = (serverTime - Date.parse(latest.measured_at)) / hours
    details.measuredAgeHours = Math.round(measuredAge * 10) / 10
  }
  if (receivedAge < 0) {
    messages.push('L’ultimo campione ha una ricezione futura rispetto al tempo del server.')
    return { status: 'warning', messages, details }
  }
  if (receivedAge > maxAgeHours) {
    messages.push(
      `Nessun nuovo campione ricevuto da ${number(details.receivedAgeHours)} ore (soglia ${maxAgeHours}). Verificare writer CSV, uploader e stazione.`,
    )
    return { status: 'warning', messages, details }
  }
  messages.push(
    `Pipeline entro i limiti: ultimo campione ricevuto ${number(details.receivedAgeHours)} ore fa.` +
      (latest.measured_at ? '' : ' L’ora di misura non è attestata: l’età è calcolata sulla ricezione server.'),
  )
  return { status: warned ? 'warning' : 'ok', messages, details }
}
