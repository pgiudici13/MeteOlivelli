import { useLayoutEffect, useId, useRef } from 'react'
import { animateOnEntrance } from '../motion.ts'
import { chartSegments, formatTime, formatValue, metrics } from '../weather.ts'
import type { Measurement } from '../weather.ts'

export function HistoryChart({ metric, rows, loading, error }: {
  metric: typeof metrics[number]; rows: Measurement[]; loading: boolean; error: boolean
}) {
  const id = useId()
  const ref = useRef<HTMLElement>(null)
  const segments = chartSegments(rows, metric.key)
  const points = segments.flat()
  const values = points.map(row => row[metric.key] as number)
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const padding = Math.max((max - min) * 0.15, 0.5)
  const low = min - padding
  const high = max + padding
  const start = rows.length ? Date.parse(rows[0].captured_at!) : 0
  const end = rows.length ? Date.parse(rows[rows.length - 1].captured_at!) : 1
  const x = (row: Measurement) => start === end ? 180 : 58 + (Date.parse(row.captured_at!) - start) / (end - start) * 278
  const y = (row: Measurement) => 176 - ((row[metric.key] as number) - low) / (high - low) * 160
  const last = points.at(-1)
  // Una nuova serie riparte; polling invariato e render estranei non riavviano il disegno.
  const seriesKey = points.map(row => `${row.ingestion_id}:${row[metric.key]}`).join('|')
  useLayoutEffect(() => {
    const element = ref.current
    if (!element || loading || error || !seriesKey) return
    const plot = element.querySelector('svg')
    if (!plot) return
    return animateOnEntrance(plot, () => {
      const animations: Animation[] = []
      element.querySelectorAll('.chart-line').forEach(line => {
        animations.push(line.animate([
          { strokeDasharray: '1', strokeDashoffset: '1' },
          { strokeDasharray: '1', strokeDashoffset: '0' },
        ], { duration: 1400, delay: 180, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'backwards' }))
      })
      element.querySelectorAll('.chart-gridline').forEach((line, index) => {
        animations.push(line.animate([{ opacity: 0 }, { opacity: 1 }],
          { duration: 400, delay: index * 55, fill: 'backwards' }))
      })
      element.querySelectorAll('.chart-area').forEach(area => {
        animations.push(area.animate([{ opacity: 0 }, { opacity: 0.06 }],
          { duration: 900, delay: 500, easing: 'ease-out', fill: 'backwards' }))
      })
      element.querySelectorAll<SVGCircleElement>('.chart-point').forEach(point => {
        // Il punto appare quando la progressione raggiunge la sua posizione sull’asse.
        const progress = Math.max(0, Math.min(1, (point.cx.baseVal.value - 58) / 278))
        animations.push(point.animate([{ opacity: 0 }, { opacity: 1 }],
          { duration: 280, delay: 180 + progress * 1400, easing: 'ease-out', fill: 'backwards' }))
      })
      return animations
    })
  }, [seriesKey, loading, error])
  return (
    <article ref={ref} className={`chart tone-${metric.tone}`} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>{metric.name} · {metric.unit}</h3>
      <p className="chart-value">{last ? `${formatValue(last[metric.key])} ${metric.unit}` : 'Nessun valore disponibile'}</p>
      {loading || error || !points.length ? (
        <div className="chart-empty">{loading ? 'Caricamento del grafico…' : error ? 'Grafico temporaneamente non disponibile.' : rows.length ? 'Nessun valore valido da tracciare. Consulta i campioni nella tabella.' : 'Il grafico apparirà quando saranno disponibili misure in questo periodo.'}</div>
      ) : (
        <svg viewBox="0 0 352 210" role="img" aria-labelledby={`${id}-title ${id}-desc`}>
          <desc id={`${id}-desc`}>{points.length} valori validi, minimo {formatValue(min)} e massimo {formatValue(max)} {metric.unit}. Asse orizzontale: acquisizione sul PC, Europe/Rome. Valori assenti o sospetti interrompono la linea. Tutti i campioni sono consultabili sotto.</desc>
          {[0, 1, 2, 3].map(index => {
            const position = 16 + index * 160 / 3
            return <g key={index}><line x1="58" x2="336" y1={position} y2={position} className="chart-gridline" /><text x="0" y={position + 4}>{formatValue(high - index * (high - low) / 3)}</text></g>
          })}
          {segments.map((segment, index) => <g key={index}>
            {segment.length > 1 && <><polygon points={`${x(segment[0])},176 ${segment.map(row => `${x(row)},${y(row)}`).join(' ')} ${x(segment[segment.length - 1])},176`} className="chart-area" /><polyline pathLength="1" points={segment.map(row => `${x(row)},${y(row)}`).join(' ')} className="chart-line" /></>}
            {segment.map(row => <circle key={row.ingestion_id} cx={x(row)} cy={y(row)} r="2.6" className="chart-point"><title>{formatTime(row.captured_at)} · {formatValue(row[metric.key])} {metric.unit}</title></circle>)}
          </g>)}
          {[0, 1, 2, 3].map(index => {
            const date = new Date(start + (end - start) * index / 3)
            const label = end - start > 86400000 ? new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', day: '2-digit', month: '2-digit' }).format(date) : formatTime(date.toISOString(), true)
            return <text key={index} x={58 + index * 278 / 3} y="202" textAnchor={index === 0 ? 'start' : index === 3 ? 'end' : 'middle'}>{label}</text>
          })}
        </svg>
      )}
      <p className="small">{points.length ? `Min ${formatValue(min)} · max ${formatValue(max)} ${metric.unit}` : 'Nessuna interpolazione dei dati mancanti.'}</p>
    </article>
  )
}
