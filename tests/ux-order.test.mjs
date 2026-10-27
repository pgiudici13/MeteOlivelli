import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('previsioni e curiosità precedono lo storico completo nella home', () => {
  const forecast = app.indexOf('<ForecastSection />')
  const curiosity = app.indexOf('<DailyCuriosity />')
  const history = app.indexOf('className="panel history-section"')
  const chronology = app.indexOf('className="panel chronology-section"')
  assert.ok(forecast >= 0 && forecast < history)
  assert.ok(curiosity > forecast && curiosity < history)
  assert.ok(history < chronology)
})
