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

test('cronologia estesa solo su richiesta senza nascondere il download PDF', () => {
  assert.match(app, /useState\(false\).*\n.*const queryPeriod/s)
  assert.match(app, /aria-expanded=\{showChronology\}/)
  assert.match(app, /\{showChronology && <HistoryTable/)
  assert.ok(app.indexOf('downloadHistoryPdf()') < app.indexOf('aria-expanded={showChronology}'))
})

test('spiegazioni tecniche dei grafici disponibili su richiesta', () => {
  assert.match(app, /<details className="chart-methodology">/)
  assert.match(app, /Come leggere i grafici e le medie/)
  assert.match(app, /09:00 e le 18:00/)
})
