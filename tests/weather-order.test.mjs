import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readHistory } from '../src/weather.ts'

// Fixture inventate e isolate: non sono osservazioni della stazione.
const row = (id, time, basis) => ({
  acquisition_kind: 'live',
  ingestion_id: `00000000-0000-4000-8000-${id.padStart(12, '0')}`,
  temperature_c: 20, humidity_pct: 60, pressure_hpa: 1015,
  captured_at: basis === 'captured_at' ? time : null,
  measured_at: basis === 'measured_at' ? time : null,
  received_at: '2026-10-27T12:00:00.000Z', quality_flags: [],
})

for (const basis of ['captured_at', 'measured_at']) {
  test(`storico ${basis}: conserva l'ordine dei microsecondi prima dello spareggio UUID`, async () => {
    const earlier = row('2', '2026-10-27T11:00:00.123456+00:00', basis)
    const later = row('1', '2026-10-27T11:00:00.123457Z', basis)
    let count = 0
    const rows = await readHistory('30g', new AbortController().signal, async () => ({
      items: ++count === 1 ? [earlier] : [later],
      next_cursor: count === 1 ? 'pagina-successiva' : null,
      time_basis: basis, until: '2026-10-27T12:00:00.000Z',
    }), basis)
    assert.deepEqual(rows.map(item => item.ingestion_id), [earlier.ingestion_id, later.ingestion_id])
  })
}

test('storico: UTC equivalenti usano lo spareggio UUID solo dopo il confronto temporale', async () => {
  const first = row('1', '2026-10-27T11:00:00.123Z', 'captured_at')
  const second = row('2', '2026-10-27T11:00:00.123000+00:00', 'captured_at')
  const rows = await readHistory('30g', new AbortController().signal, async () => ({
    items: [second, first], next_cursor: null,
    time_basis: 'captured_at', until: '2026-10-27T12:00:00.000Z',
  }))
  assert.deepEqual(rows.map(item => item.ingestion_id), [first.ingestion_id, second.ingestion_id])
})
