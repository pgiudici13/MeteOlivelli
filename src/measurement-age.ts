import { message, translate } from './i18n.ts'
import type { Measurement } from './weather.ts'

function ageLabel(elapsed: number) {
  const minutes = Math.floor(elapsed / 60000)
  if (minutes < 1) return 'meno di un minuto fa'
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minuto' : 'minuti'} fa`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours < 24) return message('{0} {1}{2} fa', hours, translate(hours === 1 ? 'ora' : 'ore'), remaining ? ' ' + message('e {0} {1}', remaining, translate(remaining === 1 ? 'minuto' : 'minuti')) : '')
  const days = Math.floor(hours / 24)
  const extraHours = hours % 24
  return message('{0} {1}{2} fa', days, translate(days === 1 ? 'giorno' : 'giorni'), extraHours ? ' ' + message('e {0} {1}', extraHours, translate(extraHours === 1 ? 'ora' : 'ore')) : '')
}

/** La distanza temporale è misurata rispetto al server, non all'orologio del visitatore. */
export function measurementAge(row: Measurement | null, serverUntil: string | null): string | null {
  if (!row || !serverUntil) return null
  const basis = row.measured_at ? 'measured' : row.captured_at ? 'captured' : 'received'
  const instant = row.measured_at ?? row.captured_at ?? row.received_at
  const age = Date.parse(serverUntil) - Date.parse(instant)
  if (!Number.isFinite(age) || age < 0) return 'Orario non coerente con quello del server: età della misura non determinabile.'
  const prefix = basis === 'measured' ? 'Misura fisica effettuata' : basis === 'captured' ? 'Riga acquisita dal PC' : 'Riga ricevuta dal server'
  const caution = basis === 'measured' ? '' : ' L’orario della misura fisica non è attestato.'
  return `${translate(prefix)} ${translate(ageLabel(age))}.${translate(caution)}`
}
