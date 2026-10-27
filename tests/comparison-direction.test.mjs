import assert from 'node:assert/strict'
import test from 'node:test'
import { comparisonDirection } from '../src/comparison-direction.ts'

test('il confronto distingue media crescente, calante e invariata al decimo', () => {
  assert.deepEqual(comparisonDirection(1.2), { symbol: '↑', label: 'Media più alta', tone: 'higher' })
  assert.deepEqual(comparisonDirection(-0.8), { symbol: '↓', label: 'Media più bassa', tone: 'lower' })
  assert.deepEqual(comparisonDirection(0.02), { symbol: '→', label: 'Media invariata', tone: 'equal' })
  assert.deepEqual(comparisonDirection(-0.02), { symbol: '→', label: 'Media invariata', tone: 'equal' })
})
