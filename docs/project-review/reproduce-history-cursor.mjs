// Regressione locale COR-009: dopo la correzione recupera tutti i record.
// Tutti i record sono fixture sintetiche di collaudo.
// deno run --no-prompt --deny-env --deny-net --deny-read --deny-write docs/project-review/reproduce-history-cursor.mjs
import assert from 'node:assert/strict'
import { createReadHandler } from '../../supabase/functions/read-measurements/handler.ts'
import { readAllHistory } from '../../src/weather.ts'

const instant = value => {
  const [seconds, fraction = ''] = value.replace(/(?:Z|\+00:00)$/, '').split('.')
  return BigInt(Date.parse(`${seconds}Z`)) * 1000n + BigInt(fraction.padEnd(6, '0'))
}
const rows = Array.from({ length: 501 }, (_, index) => ({
  acquisition_kind: 'historical', // Simula lo storico reale senza data PC, non dati della stazione.
  ingestion_id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  captured_at: null, measured_at: null, received_at: '2026-10-23T10:00:00.123456+00:00',
  temperature_c: 20, humidity_pct: 60, pressure_hpa: 1015, quality_flags: [],
}))
let requests = 0
let cursorTime = null
const handler = createReadHandler({
  source: 'meteolivelli', now: () => new Date('2026-10-23T12:00:00Z'),
  store: {
    save: async () => { throw new Error('Nessuna scrittura ammessa') },
    read: async (_, query) => {
      requests++
      cursorTime = query.after_time
      // Replica il confronto SQL (coalesce(captured_at, received_at), ingestion_id)
      // senza perdere la precisione PostgreSQL al microsecondo.
      return rows.filter(row => !query.after_time ||
        instant(row.received_at) > instant(query.after_time) ||
        instant(row.received_at) === instant(query.after_time) && row.ingestion_id > query.after_id)
        .slice(0, query.limit + 1)
    },
  },
})
const result = await readAllHistory(new AbortController().signal, async params => {
  const response = await handler(new Request(`https://fixture.invalid/?${params}`))
  assert.equal(response.status, 200)
  return response.json()
})
assert.equal(requests, 2)
assert.equal(cursorTime, '2026-10-23T10:00:00.123456Z')
assert.equal(result.length, rows.length)
assert.equal(new Set(result.map(row => row.ingestion_id)).size, rows.length)
console.log(JSON.stringify({ defectFixed: true, requests, cursorTime, sourceTime: rows[0].received_at, count: result.length }))
