import assert from 'node:assert/strict'
import test from 'node:test'
import { orderedMetrics, readFirstChart, saveFirstChart } from '../src/chart-preferences.ts'

test('metrica iniziale predefinita e ordinamento con tutte le grandezze', () => {
  assert.equal(readFirstChart(), 'temperature_c')
  assert.deepEqual(orderedMetrics('pressure_hpa').map(metric => metric.key), ['pressure_hpa', 'temperature_c', 'humidity_pct'])
})

test('preferenza salvata solo localmente e input estranei ignorati', () => {
  const values = new Map()
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
  assert.equal(saveFirstChart('humidity_pct', storage), true)
  assert.equal(readFirstChart(storage), 'humidity_pct')
  assert.equal(saveFirstChart('not-a-metric', storage), false)
  assert.equal(readFirstChart(storage), 'humidity_pct')
  values.set('meteolivelli:first-chart:v1', '__proto__')
  assert.equal(readFirstChart(storage), 'temperature_c')
})

test('preferenza non blocca la pagina quando la memoria è disabilitata', () => {
  const storage = { getItem() { throw Error('denied') }, setItem() { throw Error('denied') } }
  assert.equal(readFirstChart(storage), 'temperature_c')
  assert.equal(saveFirstChart('humidity_pct', storage), false)
})
