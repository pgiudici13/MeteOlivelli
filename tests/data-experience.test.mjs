import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createChartLink, readChartLink } from '../src/chart-links.ts'
import { normalizedHeight, prepareCombinedChart } from '../src/combined-chart.ts'

const chartSource = readFileSync(new URL('../src/components/HistoryChart.tsx', import.meta.url), 'utf8')
const appSource = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')

test('grafici ingrandibili con dialogo, Escape, focus e chiusura', () => {
  assert.match(chartSource, /createPortal\(<div className="chart-lightbox"/)
  assert.match(chartSource, /role=\{expanded \? 'dialog'/)
  assert.match(chartSource, /aria-modal=\{expanded \|\| undefined\}/)
  assert.match(chartSource, /event\.key === 'Escape'/)
  assert.match(chartSource, /openerRef\.current\?\.focus\(\)/)
  assert.match(chartSource, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(chartSource, /setExpandedPeriod\('auto'\)/)
  assert.match(chartSource, /role="group" aria-label="Grandezza"/)
  assert.match(chartSource, /role="group" aria-label="Periodo del grafico"/)
  assert.match(chartSource, /event\.target === event\.currentTarget/)
})

test('cronologia: data esatta consultabile con feedback per le date assenti', () => {
  assert.match(appSource, /id="history-jump-date" type="date"/)
  assert.match(appSource, /days\.findIndex\(day => day\.key === key\)/)
  assert.match(appSource, /Nessuna misurazione registrata in questa data/)
})

test('condivisione: link conserva metrica, periodo e intervallo personalizzato valido', () => {
  const until = Date.parse('2026-10-27T12:00:00Z')
  const url = createChartLink('https://meteolivelli.vercel.app', '7g', 'humidity_pct')
  assert.match(url, /period=7g#chart-humidity_pct/)
  assert.deepEqual(readChartLink(new URL(url).search, until), { period: '7g', customRange: null })
  const customRange = { start: until - 3600000, end: until }
  const custom = createChartLink('https://meteolivelli.vercel.app', '30g', 'pressure_hpa', customRange)
  assert.equal(new URL(custom).hash, '#chart-pressure_hpa')
  assert.deepEqual(readChartLink(new URL(custom).search, until), { period: '30g', customRange })
  assert.deepEqual(readChartLink('?period=custom&from=bad&to=bad', until), { period: 'auto', customRange: null })
})

test('grafico combinato: ogni grandezza usa una scala autonoma, senza punti fittizi', () => {
  assert.equal(normalizedHeight(5, 5, 5), 0.5)
  assert.equal(normalizedHeight(15, 10, 20), 0.5)
  const prepared = prepareCombinedChart([], '24h', '2026-10-27T12:00:00Z')
  assert.equal(prepared.series.length, 3)
  assert.ok(prepared.series.every(item => item.min === null && item.segments.length === 0))
})
