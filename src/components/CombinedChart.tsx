import { useMemo } from 'react'
import { normalizedHeight, prepareCombinedChart } from '../combined-chart.ts'
import { formatValue } from '../weather.ts'
import type { Measurement, ChartMode } from '../weather.ts'

export function CombinedChart({ rows, period, until, customRange }: {
  rows: Measurement[]; period: ChartMode; until: string | null; customRange: { start: number; end: number } | null
}) {
  const prepared = useMemo(() => until ? prepareCombinedChart(rows, period, until, customRange ?? undefined) : null, [rows, period, until, customRange])
  const series = prepared?.series ?? []
  const any = series.some(item => item.min !== null)
  const x = (time: number) => 30 + (time - prepared!.start) / (prepared!.end - prepared!.start || 1) * 640
  const y = (value: number, min: number, max: number) => 175 - normalizedHeight(value, min, max) * 145
  return <section className="combined-chart panel" aria-labelledby="combined-chart-title">
    <h3 id="combined-chart-title">Le tre grandezze a confronto</h3>
    <p className="small">Ogni linea usa una scala propria, dal minimo al massimo dei valori disponibili. Le altezze indicano l’andamento relativo, non valori confrontabili tra unità diverse.</p>
    {!any || !prepared ? <p className="small">Il confronto apparirà quando saranno disponibili campioni validi nel periodo selezionato.</p> : <>
      <svg viewBox="0 0 700 205" role="img" aria-label="Andamento relativo di temperatura, umidità e pressione con scale separate">
        {[30, 102, 175].map(position => <line key={position} x1="30" x2="670" y1={position} y2={position} className="chart-gridline" />)}
        {series.map((item, index) => item.min === null || item.max === null ? null : <g key={item.metric.key} className={`combined-series combined-series-${index}`}>
          {item.segments.map((segment, segmentIndex) => segment.length > 1 ? <polyline key={segmentIndex} fill="none" points={segment.map(point => `${x(point.time)},${y(point.value, item.min!, item.max!)}`).join(' ')} /> : segment.map(point => <circle key={point.id} cx={x(point.time)} cy={y(point.value, item.min!, item.max!)} r="3"><title>{item.metric.name}: {point.label} · {formatValue(point.value)} {item.metric.unit}</title></circle>))}
        </g>)}
        <text x="30" y="198" textAnchor="start">{new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit' }).format(prepared.start)}</text>
        <text x="670" y="198" textAnchor="end">{new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit' }).format(prepared.end)}</text>
      </svg>
      <ul className="combined-legend">{series.map((item, index) => <li key={item.metric.key} className={`combined-legend-${index}`}>
        <strong>{item.metric.name}</strong>
        <span>{item.min === null ? 'Nessun dato' : `${formatValue(item.min)}–${formatValue(item.max)} ${item.metric.unit}`}</span>
      </li>)}</ul>
    </>}
  </section>
}
