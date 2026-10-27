#!/usr/bin/env node
// Controllo salute della pipeline dati MeteOlivelli: sola lettura sull'endpoint
// pubblico, senza credenziali o segreti. Ideale per un controllo pianificato.
// Uso: node scripts/check-station-health.mjs [--max-age-hours N] [--json]
// Esito: 0 = ok, 1 = avviso, 2 = endpoint non raggiungibile o risposta non valida.
import { evaluateStationHealth } from '../src/station-health.ts'
import { readPage } from '../src/weather.ts'

const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')
const maxAgeIndex = args.indexOf('--max-age-hours')
const maxAgeHours = maxAgeIndex >= 0 ? Number(args[maxAgeIndex + 1]) : 26
if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0) {
  console.error('Uso: node scripts/check-station-health.mjs [--max-age-hours N] [--json]')
  process.exit(2)
}

let items = []
let serverUntil = null
try {
  const controller = new AbortController()
  const page = await readPage(new URLSearchParams({ view: 'latest' }), controller.signal)
  items = page.items
  serverUntil = page.until
} catch {
  // L'endpoint non risponde o il contratto non è valido: l'errore è gestito sotto.
  serverUntil = null
}

const report = evaluateStationHealth({ now: Date.now(), serverUntil, items }, { maxAgeHours })
if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(`Stato: ${report.status.toUpperCase()} · controllo ${new Date().toISOString()}`)
  for (const message of report.messages) console.log(`- ${message}`)
}
process.exit(report.status === 'ok' ? 0 : report.status === 'warning' ? 1 : 2)
