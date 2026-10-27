import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluateStationHealth } from '../src/station-health.ts'

// Valori interamente sintetici: nessuna rete, ambiente o credenziale.
const row = (overrides = {}) => ({
  acquisition_kind: 'live',
  ingestion_id: '00000000-0000-4000-8000-000000000001',
  temperature_c: 19.4,
  humidity_pct: 64,
  pressure_hpa: 1015.8,
  captured_at: '2026-10-27T10:00:00.000Z',
  measured_at: null,
  received_at: '2026-10-27T10:00:05.000Z',
  quality_flags: [],
  ...overrides,
})
const serverUntil = '2026-10-27T10:15:00.000Z'
const now = Date.parse('2026-10-27T10:16:00.000Z')

test('salute: pipeline entro i limiti con età calcolata sul tempo del server', () => {
  const report = evaluateStationHealth({ now, serverUntil, items: [row()] })
  assert.equal(report.status, 'ok')
  assert.equal(report.details.receivedAgeHours, 0.2)
  assert.equal(report.details.measuredAgeHours, null)
  assert.match(report.messages[0], /entro i limiti/)
  assert.match(report.messages[0], /ora di misura non è attestata/)
})

test('salute: endpoint non raggiungibile o risposta non valida', () => {
  for (const serverUntilValue of [null, 'non-un-timestamp']) {
    const report = evaluateStationHealth({ now, serverUntil: serverUntilValue, items: [] })
    assert.equal(report.status, 'error')
    assert.match(report.messages[0], /non raggiungibile/)
  }
})

test('salute: database vuoto e presenza di soli campioni sintetici', () => {
  const empty = evaluateStationHealth({ now, serverUntil, items: [] })
  assert.equal(empty.status, 'warning')
  assert.match(empty.messages[0], /Nessun campione/)
  const syntheticOnly = evaluateStationHealth({
    now,
    serverUntil,
    items: [row({ acquisition_kind: 'synthetic' })],
  })
  assert.equal(syntheticOnly.status, 'warning')
  assert.match(syntheticOnly.messages[0], /sintetici o senza provenienza/)
})

test('salute: nessun nuovo campione oltre la soglia, con soglia configurabile', () => {
  const old = row({ received_at: '2026-10-26T00:00:00.000Z' })
  const report = evaluateStationHealth({ now, serverUntil, items: [old] })
  assert.equal(report.status, 'warning')
  assert.match(report.messages[0], /Nessun nuovo campione ricevuto da 34,3 ore/)
  const tolerant = evaluateStationHealth({ now, serverUntil, items: [old] }, { maxAgeHours: 48 })
  assert.equal(tolerant.status, 'ok')
})

test('salute: orologio locale fuori sincronia e ricezione futura', () => {
  const skewed = evaluateStationHealth({
    now: Date.parse(serverUntil) + 20 * 60000,
    serverUntil,
    items: [row()],
  })
  assert.equal(skewed.status, 'warning')
  assert.match(skewed.messages[0], /Orologio locale distante.*20 minuti/)
  const future = evaluateStationHealth({
    now,
    serverUntil,
    items: [row({ received_at: '2026-10-27T11:00:00.000Z' })],
  })
  assert.equal(future.status, 'warning')
  assert.match(future.messages[0], /ricezione futura/)
})

test('salute: ora di misura attestata riportata fra i dettagli', () => {
  const report = evaluateStationHealth({
    now,
    serverUntil,
    items: [row({ measured_at: '2026-10-27T09:58:00.000Z' })],
  })
  assert.equal(report.status, 'ok')
  assert.equal(report.details.measuredAgeHours, 0.3)
  assert.equal(report.messages.length, 1)
  assert.doesNotMatch(report.messages[0], /ora di misura non è attestata/)
})
