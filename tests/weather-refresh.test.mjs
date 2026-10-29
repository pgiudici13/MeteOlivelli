import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createWeatherFeed } from '../src/weather-feed.ts'

// Fixture sintetiche locali, mai inviate alla stazione o al database.
const row = (index, value) => ({
  acquisition_kind: 'live',
  ingestion_id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  captured_at: `2026-10-27T${index === 1 ? '10' : '11'}:00:00.000Z`,
  measured_at: `2026-10-27T${index === 1 ? '10' : '11'}:00:00.000Z`, received_at: '2026-10-27T12:00:00.000Z',
  temperature_c: value, humidity_pct: 60, pressure_hpa: 1015, quality_flags: [],
})

for (const anchorToLatest of [false, true]) {
  test(`grafici ${anchorToLatest ? 'Auto' : '24h'}: riconciliano correzioni e cancellazioni precedenti a latest ogni cinque minuti`, async () => {
    const originalNow = Date.now
    let now = Date.parse('2026-10-27T12:00:00.000Z')
    Date.now = () => now
    const latest = row(2, 20)
    let rows = [row(1, 19), latest], histories = 0, state
    const feed = createWeatherFeed(anchorToLatest ? '30g' : '24h', value => { state = value }, async params => {
      const history = params.get('view') === 'history'
      if (history) histories++
      return {
        items: history ? structuredClone(rows) : [latest], next_cursor: null,
        until: params.get('until') ?? new Date(now).toISOString(), time_basis: 'captured_at',
      }
    }, { anchorToLatest })
    try {
      await feed.refresh()
      assert.equal(state.history[0].temperature_c, 19)
      rows = [row(1, 17), latest]
      now += 299999
      await feed.refresh()
      assert.equal(histories, 1, 'polling leggero prima della soglia')
      now++
      await feed.refresh()
      assert.equal(histories, 2)
      assert.equal(state.history[0].temperature_c, 17)
      rows = [latest]
      now += 300000
      await feed.refresh()
      assert.equal(histories, 3)
      assert.deepEqual(state.history.map(item => item.ingestion_id), [latest.ingestion_id])
    } finally {
      feed.stop()
      Date.now = originalNow
    }
  })
}

test('grafici: errore nella riconciliazione conserva i valori e ritenta al ciclo successivo', async () => {
  const originalNow = Date.now
  let now = Date.parse('2026-10-27T12:00:00.000Z')
  Date.now = () => now
  const latest = row(2, 20)
  let rows = [row(1, 19), latest], fail = false, state
  const feed = createWeatherFeed('30g', value => { state = value }, async params => {
    const history = params.get('view') === 'history'
    if (history && fail) throw new Error('Guasto sintetico')
    return { items: history ? structuredClone(rows) : [latest], next_cursor: null,
      until: params.get('until') ?? new Date(now).toISOString(), time_basis: 'captured_at' }
  }, { anchorToLatest: true })
  try {
    await feed.refresh()
    now += 300000
    fail = true
    await feed.refresh()
    assert.equal(state.historyError, true)
    assert.equal(state.history[0].temperature_c, 19)
    fail = false
    rows = [row(1, 18), latest]
    now += 15000
    await feed.refresh()
    assert.equal(state.historyError, false)
    assert.equal(state.history[0].temperature_c, 18)
  } finally {
    feed.stop()
    Date.now = originalNow
  }
})
