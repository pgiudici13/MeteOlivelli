import assert from 'node:assert/strict'
import test from 'node:test'
import { prepareChart } from '../src/chart.ts'

const at = time => new Date(time).toISOString()
const row = (time, value) => ({
  ingestion_id: `00000000-0000-4000-8000-${String(time).padStart(12, '0')}`,
  acquisition_kind: 'live', captured_at: at(time), measured_at: at(time), received_at: at(time),
  temperature_c: value, humidity_pct: 60, pressure_hpa: 1010, quality_flags: [],
})

test('intervallo personalizzato mostra soltanto campioni originali compresi nei confini', () => {
  const origin = Date.parse('2026-10-20T12:00:00Z')
  const rows = [row(origin, 10), row(origin + 3600000, 11), row(origin + 7200000, 12)]
  const result = prepareChart(rows, 'temperature_c', '30g', at(origin + 7200000), { start: origin + 3600000, end: origin + 7200000 })
  assert.equal(result.averaged, false)
  assert.deepEqual(result.segments.flat().map(point => point.value), [11, 12])
  assert.equal(result.timeline.start, origin + 3600000)
})

test('intervallo invertito rifiutato', () => {
  assert.throws(() => prepareChart([], 'temperature_c', '30g', at(Date.now()), { start: 10, end: 9 }), /Intervallo personalizzato/)
})
