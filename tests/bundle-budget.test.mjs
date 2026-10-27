import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateBudget } from '../scripts/check-bundle-budget.mjs'

test('budget iniziale distingue superamento da asset ammessi', () => {
  const result = evaluateBudget({ javascript: 1024, css: 2048 }, { javascript: 2048, css: 1024 })
  assert.equal(result.javascript.passed, true)
  assert.equal(result.css.passed, false)
})
