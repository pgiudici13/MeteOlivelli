import assert from 'node:assert/strict'
import test from 'node:test'
import { aggregatePeriod, collectDailyStatistics, monthExtremes, shiftCivilDay } from '../src/daily-statistics.ts'

const row = (time, temperature, flags = [], kind = 'live') => ({
  acquisition_kind: kind, ingestion_id: String(time), captured_at: time, measured_at: time,
  received_at: time, temperature_c: temperature, humidity_pct: 60, pressure_hpa: 1010, quality_flags: flags,
})

test('riepilogo giornaliero usa soltanto campioni validi senza inventare un giorno intero', () => {
  const rows = [row('2026-10-27T09:00:00Z', 10), row('2026-10-27T10:00:00Z', 14), row('2026-10-27T11:00:00Z', 50, [{ field: 'temperature_c', code: 'outside_configured_range', label: 'probabile errato', reason: 'test' }]), row('2026-10-27T12:00:00Z', 100, [], 'synthetic')]
  const summary = collectDailyStatistics(rows, '2026-10-27T13:00:00Z')
  assert.equal(summary.days[0].metrics.temperature_c.count, 2)
  assert.equal(summary.days[0].metrics.temperature_c.minimum, 10)
  assert.equal(summary.days[0].metrics.temperature_c.maximum, 14)
  assert.equal(summary.days[0].metrics.temperature_c.average, 12)
})

test('il giorno civile segue Europe/Rome anche prima della mezzanotte UTC', () => {
  const summary = collectDailyStatistics([row('2026-10-26T23:30:00Z', 12)], '2026-10-27T00:00:00Z')
  assert.equal(summary.days[0].key, '2026-10-27')
})

test('estremi mensili valutati sulle medie delle sole giornate disponibili', () => {
  const rows = [row('2026-10-20T12:00:00Z', 10), row('2026-10-21T12:00:00Z', 20), row('2026-09-30T12:00:00Z', 50)]
  const summary = collectDailyStatistics(rows, '2026-10-27T12:00:00Z')
  const month = monthExtremes(summary.days, summary.month)
  assert.equal(month.days, 2)
  assert.equal(month.warmest.key, '2026-10-21')
  assert.equal(month.coldest.key, '2026-10-20')
})

test('confronto settimanale pondera i campioni senza inventare i giorni mancanti', () => {
  const rows = [row('2026-10-20T12:00:00Z', 10), row('2026-10-20T13:00:00Z', 20), row('2026-10-23T12:00:00Z', 30)]
  const { days } = collectDailyStatistics(rows, '2026-10-27T12:00:00Z')
  const period = aggregatePeriod(days, '2026-10-20', '2026-10-26')
  assert.equal(period.observedDays, 2)
  assert.equal(period.metrics.temperature_c.count, 3)
  assert.equal(period.metrics.temperature_c.average, 20)
  assert.equal(period.metrics.temperature_c.minimum, 10)
  assert.equal(period.metrics.temperature_c.maximum, 30)
})

test('confronto di periodi vuoti non restituisce valori simulati', () => {
  const period = aggregatePeriod([], '2026-10-20', '2026-10-26')
  assert.equal(period.observedDays, 0)
  assert.deepEqual(period.metrics, {})
})

test('intervalli civili conservano le date anche con il cambio ora solare', () => {
  assert.equal(shiftCivilDay('2026-10-27', -2), '2026-10-25')
  assert.equal(shiftCivilDay('2026-11-01', -7), '2026-10-25')
  assert.equal(shiftCivilDay('2026-01-01', -1), '2025-12-31')
})
