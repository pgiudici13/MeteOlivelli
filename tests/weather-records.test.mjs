import assert from 'node:assert/strict'
import test from 'node:test'
import { collectWeatherRecords } from '../src/weather-records.ts'

const row = (time, value, kind = 'live', quality_flags = []) => ({
  acquisition_kind: kind, ingestion_id: time + String(value), measured_at: time,
  captured_at: time, received_at: time, temperature_c: value,
  humidity_pct: 60, pressure_hpa: 1010, quality_flags,
})

test('record reali escludono sintetici, futuri e valori sospetti', () => {
  const rows = [
    row('2026-10-25T09:00:00Z', 8), row('2026-10-26T09:00:00Z', 20),
    row('2026-10-26T10:00:00Z', 99, 'synthetic'),
    row('2026-10-26T11:00:00Z', 90, 'live', [{ field: 'temperature_c', label: 'probabile errato', code: 'outside_configured_range', reason: 'test' }]),
    row('2026-10-28T09:00:00Z', 100),
  ]
  const records = collectWeatherRecords(rows, '2026-10-27T12:00:00Z')
  assert.equal(records.temperature_c.count, 2)
  assert.equal(records.temperature_c.minimum.value, 8)
  assert.equal(records.temperature_c.maximum.value, 20)
  assert.equal(records.humidity_pct.count, 3)
})

test('nessun record fittizio se archivio vuoto o orario server non valido', () => {
  assert.deepEqual(collectWeatherRecords([], '2026-10-27T12:00:00Z'), {})
  assert.deepEqual(collectWeatherRecords([row('2026-10-25T09:00:00Z', 8)], 'non-valido'), {})
})
