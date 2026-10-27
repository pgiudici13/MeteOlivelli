import assert from 'node:assert/strict'
import test from 'node:test'
import { metricExplanations } from '../src/metric-explanations.ts'
import { metrics } from '../src/weather.ts'

test('ogni grandezza osservata ha una spiegazione breve senza scambiarla per previsione', () => {
  assert.deepEqual(Object.keys(metricExplanations).sort(), metrics.map(metric => metric.key).sort())
  assert.ok(Object.values(metricExplanations).every(text => text.length > 80 && text.length < 350))
  assert.match(metricExplanations.humidity_pct, /relativa/)
  assert.match(metricExplanations.pressure_hpa, /una singola lettura non basta/)
})
