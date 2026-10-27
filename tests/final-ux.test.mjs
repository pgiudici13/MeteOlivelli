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

test('grafici: navigazione per punti utilizzabile da touch con etichette accessibili', () => {
  const chart = readFileSync(new URL('../src/components/HistoryChart.tsx', import.meta.url), 'utf8')
  assert.match(chart, /className="chart-touch-controls" role="group"/)
  assert.match(chart, /aria-label=\{`\$\{metric\.name\}: punto precedente`\}/)
  assert.match(chart, /aria-label=\{`\$\{metric\.name\}: punto successivo`\}/)
  assert.match(styles, /\.chart-touch-controls button \{ min-width: 0; min-height: 44px/)
})

test('l’orario di acquisizione compare una volta nella sezione, non su ogni scheda', () => {
  assert.match(app, /Acquisizione sul PC: \$\{formatTime\(latest\.captured_at\)\}/)
  assert.doesNotMatch(app, /className="small metric-source"/)
  assert.match(app, /metricExplanations\[metric\.key\]/)
})

test('focus evidente e aree di tocco per dettagli, pulsanti e grafici', () => {
  assert.match(styles, /\.site-shell svg\[tabindex\]:focus-visible \{ outline: 3px solid var\(--mint\)/)
  assert.match(styles, /\.metric-explanation summary, \.time-details summary, \.forecast-method summary, \.history-table summary/)
  assert.match(styles, /min-height: 44px; padding-block: 12px/)
})

test('contrasto dei testi secondari e degli avvisi supera il rapporto WCAG AA 4,5:1', () => {
  const luminance = (hex) => {
    const channels = hex.slice(1).match(/../g).map(part => parseInt(part, 16) / 255)
      .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
  }
  const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05)
  for (const [text, background] of [['#b8b3b0', '#101010'], ['#68625d', '#ffffff'], ['#ee6018', '#171615'], ['#a54017', '#ffffff']]) {
    assert.ok(contrast(text, background) >= 4.5, `${text} su ${background}`)
  }
})
