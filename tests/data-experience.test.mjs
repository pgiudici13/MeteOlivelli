import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const chartSource = readFileSync(new URL('../src/components/HistoryChart.tsx', import.meta.url), 'utf8')

test('grafici ingrandibili con dialogo, Escape, focus e chiusura', () => {
  assert.match(chartSource, /createPortal\(chart, document\.body\)/)
  assert.match(chartSource, /role=\{expanded \? 'dialog'/)
  assert.match(chartSource, /aria-modal=\{expanded \|\| undefined\}/)
  assert.match(chartSource, /event\.key === 'Escape'/)
  assert.match(chartSource, /openerRef\.current\?\.focus\(\)/)
})
