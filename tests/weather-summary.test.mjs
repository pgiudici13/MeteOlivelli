import assert from 'node:assert/strict'
import test from 'node:test'
import { describeWeatherChange } from '../src/weather-summary.ts'

const row = (time, values = {}, flags = [], kind = 'live') => ({
  ingestion_id: String(time), acquisition_kind: kind, captured_at: new Date(time).toISOString(), measured_at: new Date(time).toISOString(), received_at: new Date(time).toISOString(),
  temperature_c: 12, humidity_pct: 65, pressure_hpa: 1013, quality_flags: flags, ...values,
})

test('non inventa variazioni in assenza di una misura precedente valida', () => {
  const latest = row(86401000)
  assert.equal(describeWeatherChange(latest, [latest]), null)
  assert.equal(describeWeatherChange(latest, [row(1000, {}, [], 'synthetic')]), null)
})

test('riassume solo grandezze confrontabili e distingue stabilità e differenza', () => {
  const older = row(1000, { temperature_c: 10, pressure_hpa: 1012.8 })
  const newest = row(86401000, { temperature_c: 11.5, humidity_pct: 66, pressure_hpa: 1013 })
  const result = describeWeatherChange(newest, [newest, older])
  assert.ok(result.some(text => /Temperatura in aumento di 1,5 °C/.test(text)))
  assert.ok(result.some(text => /Pressione sostanzialmente stabile/.test(text)))
})

test('esclude valori sospetti senza attribuire loro una tendenza', () => {
  const latest = row(86401000, {}, [{ field: 'temperature_c', code: 'outside_configured_range', label: 'probabile errato', reason: 'test' }])
  assert.equal(describeWeatherChange(latest, [row(1000), latest])?.some(text => /Temperatura/.test(text)), false)
})

test('usa il giorno civile precedente alla stessa ora anche al cambio ora', () => {
  const latest = row(Date.parse('2026-10-25T11:00:15Z'))
  const previous = row(Date.parse('2026-10-24T10:00:45Z'), { temperature_c: 10 })
  const wrong = row(Date.parse('2026-10-24T11:00:15Z'), { temperature_c: 1 })
  assert.match(describeWeatherChange(latest, [previous, wrong])[0], /2,0 °C.*stessa ora del giorno precedente/)
  assert.equal(describeWeatherChange(latest, [wrong]), null)
})
