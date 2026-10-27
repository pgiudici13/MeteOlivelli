import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('stazione priva di letture: un solo stato informativo al posto delle tre schede vuote', () => {
  assert.match(app, /latestLoaded && !latest \? <div className="station-empty panel"/)
  assert.match(app, /historicalOnly \? 'Sono disponibili soltanto dati storici'/)
  assert.match(app, /'In attesa delle prime misure'/)
  assert.match(app, /\{latest && <div className="weather-summary panel"/)
})
