import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nearestMeasurement, readManualConditions } from '../src/manual-conditions.ts'
const at = '2026-11-24T12:00:00.000Z'
const row = (id, time, options = {}) => ({ ingestion_id: id, measured_at: time, captured_at: null, received_at: at, acquisition_kind: 'live', humidity_pct: 70, pressure_hpa: 1010, quality_flags: [], ...options })
test('confronto usa la misura reale con ora fisica più vicina anche oltre mezz’ora', () => {
  const rows = [row('synthetic', at, { acquisition_kind: 'synthetic' }), row('received-only', null), row('late', '2026-11-24T12:31:00.000Z'), row('near', '2026-11-24T12:10:00.000Z')]
  assert.equal(nearestMeasurement(at, rows)?.ingestion_id, 'near')
  assert.equal(nearestMeasurement(at, [rows[0], rows[1], rows[2]])?.ingestion_id, 'late')
  assert.equal(nearestMeasurement(at, [rows[0], rows[1]]), null)
})
test('confronto ignora misure senza valori affidabili e risolve parità temporalmente', () => {
  const flags = [{ field: 'humidity_pct', code: 'outside_physical_bounds' }, { field: 'pressure_hpa', code: 'outside_physical_bounds' }]
  const rows = [row('bad', at, { quality_flags: flags }), row('after', '2026-11-24T12:05:00.000Z'), row('before', '2026-11-24T11:55:00.000Z')]
  assert.equal(nearestMeasurement(at, rows)?.ingestion_id, 'before')
})
test('lettura delle osservazioni convalida contenuto e segnala errore', async () => {
  const item = { observed_at: at, cloud: 'sereno', rain: 'assente', wind: 'calmo' }
  assert.deepEqual(await readManualConditions(new AbortController().signal, async () => Response.json({ items: [item], next_offset: null })), [item])
  await assert.rejects(() => readManualConditions(new AbortController().signal, async () => Response.json({ items: [{ ...item, rain: 'sconosciuta' }], next_offset: null })))
  await assert.rejects(() => readManualConditions(new AbortController().signal, async () => new Response(null, { status: 503 })))
})
