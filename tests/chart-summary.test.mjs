import assert from 'node:assert/strict'
import test from 'node:test'
import { summarizeChart } from '../src/chart-summary.ts'

const point = (time, value, count = 1) => ({ id: String(time), time, value, count, label: '', sources: { live: count, historical: 0, synthetic: 0, unknown: 0 } })

test('statistiche assenti quando non esistono osservazioni', () => {
  assert.equal(summarizeChart([]), null)
})

test('media ponderata per campioni e variazione cronologica', () => {
  assert.deepEqual(summarizeChart([point(20, 20, 3), point(10, 10, 1)]), {
    minimum: 10, maximum: 20, average: 17.5, change: 10, samples: 4,
  })
})

test('una sola osservazione non produce una variazione fittizia', () => {
  assert.equal(summarizeChart([point(10, 12)])?.change, null)
})
