import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/App.css', import.meta.url), 'utf8')

test('stazione priva di letture: un solo stato informativo al posto delle tre schede vuote', () => {
  assert.match(app, /latestLoaded && !latest \? <div className="station-empty panel"/)
  assert.match(app, /historicalOnly \? 'Sono disponibili soltanto dati storici'/)
  assert.match(app, /'In attesa delle prime misure'/)
  assert.match(app, /\{latest && <div className="weather-summary panel"/)
})

test('controlli mobili: testata flessibile, bersagli ampi e PDF a tutta larghezza', () => {
  assert.match(styles, /\.site-header nav \{ flex: 1 1 auto; min-width: 0; flex-wrap: wrap/)
  assert.match(styles, /\.site-header nav a \{ display: inline-flex; align-items: center; min-height: 44px/)
  assert.match(styles, /\.pdf-export-controls button \{ flex: 1 1 100%/)
})
