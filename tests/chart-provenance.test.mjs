import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prepareChart } from '../src/chart.ts'

test('le medie manuali includono sia misure live sia storiche', () => {
  const sample = (id, acquisition_kind, captured_at, temperature_c) => ({
    ingestion_id: id, acquisition_kind, captured_at, measured_at: captured_at, received_at: captured_at,
    temperature_c, humidity_pct: 50, pressure_hpa: 1013, quality_flags: [],
  })
  const rows = [
    sample('storico', 'historical', '2026-10-21T10:00:00.000Z', 10),
    sample('live', 'live', '2026-10-21T11:00:00.000Z', 20),
  ]
  for (const mode of ['7g', '14g', '30g']) {
    const points = prepareChart(rows, 'temperature_c', mode, '2026-10-22T12:00:00.000Z').segments.flat()
    assert.equal(points.length, 1, mode)
    assert.equal(points[0].value, 15, mode)
    assert.equal(points[0].count, 2, mode)
    assert.deepEqual(points[0].sources, { live: 1, historical: 1, synthetic: 0, unknown: 0 }, mode)
  }
})
