import { animate } from 'motion/mini'
import type { AnimationPlaybackControls } from 'motion'
import { useLayoutEffect, useId, useRef, useMemo, useState } from 'react'
import { prepareChart } from '../chart.ts'
import { animateOnEntrance } from '../motion.ts'
import { formatValue, metrics } from '../weather.ts'
import type { Measurement, ChartMode } from '../weather.ts'

export function HistoryChart({ metric, rows, loading, error, period, until }: {
  period: ChartMode; until: string | null;
  metric: typeof metrics[number]; rows: Measurement[]; loading: boolean; error: boolean
}) {
  const id = useId()
  const [selection, setSelection] = useState<{ id: string; series: string } | null>(null)
  const ref = useRef<HTMLElement>(null)
  const prepared = useMemo(() => until ? prepareChart(rows, metric.key, period, until) : null, [rows, metric.key, period, until])
  const segments = prepared?.segments ?? []
  const points = segments.flat()
  const values = points.map(point => point.value)
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const padding = Math.max((max - min) * 0.15, 0.5)
  const low = min - padding
  const high = max + padding
  const timeline = prepared?.timeline ?? null
  const start = timeline?.start ?? 0
  const end = timeline?.end ?? 1
  const toX = (time: number) => 58 + (time - start) / (end - start) * 278
  const x = (point: typeof points[number]) => toX(point.time)
  const y = (point: typeof points[number]) => 176 - (point.value - low) / (high - low) * 160
  const last = points.at(-1)
  // Una nuova serie riparte; polling invariato e render estranei non riavviano il disegno.
  const seriesKey = segments.map(segment => segment.map(row => `${row.id}:${row.time}:${row.value}:${row.count}`).join('|')).join('/')
  const revealStart = points.length ? x(points[0]) - 4 : 54
  const revealWidth = points.length ? x(points[points.length - 1]) - revealStart + 4 : 286
  useLayoutEffect(() => {
    const element = ref.current
    if (!element || loading || error || !seriesKey) return
    const plot = element.querySelector('svg')
    if (!plot) return
    return animateOnEntrance(plot, () => {
      const animations: AnimationPlaybackControls[] = []
      const mask = element.querySelector('.chart-reveal-mask')
      if (mask) animations.push(animate(mask, { width: ['0px', `${mask.getAttribute('width')}px`] }, { duration: 0.7, delay: 0.06, ease: 'linear' }))
      element.querySelectorAll('.chart-gridline').forEach((line, index) => {
        animations.push(animate(line, { opacity: [0, 1] },
          { duration: 0.22, delay: index * 0.03 }))
      })
      return animations
    }, () => {
      // Motion conserva lo stile finale: ripristina la larghezza SVG dichiarata
      // prima di una nuova serie o quando si attiva il movimento ridotto.
      element.querySelector<SVGElement>('.chart-reveal-mask')?.style.removeProperty('width')
      element.querySelectorAll<SVGElement>('.chart-gridline').forEach(line => line.style.removeProperty('opacity'))
    })
  }, [seriesKey, period, loading, error])
  const active = selection?.series === seriesKey ? points.find(point => point.id === selection.id) : undefined
  function selectPoint(index: number) {
    const point = points[Math.max(0, Math.min(points.length - 1, index))]
    if (point) setSelection(previous => previous?.id === point.id && previous.series === seriesKey ? previous : { id: point.id, series: seriesKey })
  }
  function selectAt(clientX: number, clientY: number, svg: SVGSVGElement) {
    const matrix = svg.getScreenCTM()
    if (!matrix) return
    // Il viewBox può avere margini interni quando max-height limita il grafico:
    // la matrice SVG conserva il punto corretto anche in quel layout.
    const position = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse()).x
    const nearest = points.reduce((best, point, index) => Math.abs(x(point) - position) < Math.abs(x(points[best]) - position) ? index : best, 0)
    selectPoint(nearest)
  }
  return (
    <article ref={ref} className={`chart tone-${metric.tone}`} aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>{metric.name} · {metric.unit}</h3>
      <p className="chart-value">{prepared?.averaged && <span className="chart-average-label">Ultima media · </span>}{last ? `${formatValue(last.value)} ${metric.unit}` : 'Nessun valore disponibile'}</p>
      {loading || error || !points.length || !timeline ? (
        <div className="chart-empty">{loading ? 'Caricamento del grafico…' : error ? 'Grafico temporaneamente non disponibile.' : rows.length ? 'Nessun valore valido da tracciare. Consulta i campioni nella tabella.' : 'Il grafico apparirà quando saranno disponibili misure in questo periodo.'}</div>
      ) : (
        <svg viewBox="0 0 352 210" role="img" tabIndex={0}
          aria-describedby={`${id}-interaction`}
          onPointerMove={event => { if (event.pointerType !== 'touch') selectAt(event.clientX, event.clientY, event.currentTarget) }}
          onPointerDown={event => { if (event.pointerType === 'touch') selectAt(event.clientX, event.clientY, event.currentTarget) }}
          onPointerLeave={event => { if (document.activeElement !== event.currentTarget) setSelection(null) }}
          onFocus={() => selectPoint(points.length - 1)} onBlur={() => setSelection(null)}
          onKeyDown={event => {
            if (event.key === 'Escape') { setSelection(null); return }
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
            event.preventDefault()
            const index = active ? points.indexOf(active) : points.length - 1
            selectPoint(event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : index + (event.key === 'ArrowLeft' ? -1 : 1))
          }} aria-labelledby={`${id}-title ${id}-desc`}>
          <desc id={`${id}-desc`}>{points.length} {prepared?.averaged ? 'medie giornaliere calcolate dai campioni validi' : 'campioni validi'}, minimo {formatValue(min)} e massimo {formatValue(max)} {metric.unit}. {prepared?.averaged ? 'Asse orizzontale: giorni in Europe/Rome; i punti sono posizionati al centro della giornata o della fascia, non all’ora di una singola misura.' : 'Asse orizzontale: acquisizione sul PC, Europe/Rome.'} Valori assenti o sospetti interrompono la linea. Da {new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' }).format(start)} a {new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' }).format(end)}. Finestra completa: {period === 'auto' ? 'adattata ai dati' : period === '24h' ? '24 ore' : period === '7g' ? '7 giorni' : period === '14g' ? '14 giorni' : '30 giorni'}. Tutti i campioni sono consultabili sotto.</desc>
          <defs><clipPath id={`${id}-reveal`}><rect className="chart-reveal-mask" x={revealStart} y="12" width={revealWidth} height="168" /></clipPath></defs>
          {timeline.ticks.map(tick => <g key={tick.time}>
            <line x1={toX(tick.time)} x2={toX(tick.time)} y1="16" y2="176" className={`chart-time-gridline ${tick.major ? 'major' : 'minor'}`} />
            {tick.label && <text x={toX(tick.time)} y="202" textAnchor="middle">{tick.label}</text>}
          </g>)}
          {[0, 1, 2, 3].map(index => {
            const position = 16 + index * 160 / 3
            return <g key={index}><line x1="58" x2="336" y1={position} y2={position} className="chart-gridline" /><text x="0" y={position + 4}>{formatValue(high - index * (high - low) / 3)}</text></g>
          })}
          <g clipPath={`url(#${id}-reveal)`} className="chart-series">{segments.map((segment, index) => <g key={index}>
            {segment.length > 1 && <><polygon points={`${x(segment[0])},176 ${segment.map(row => `${x(row)},${y(row)}`).join(' ')} ${x(segment[segment.length - 1])},176`} className="chart-area" /><polyline points={segment.map(row => `${x(row)},${y(row)}`).join(' ')} className="chart-line" /></>}
            {segment.map(row => <circle key={row.id} cx={x(row)} cy={y(row)} r="2.6" className="chart-point"><title>{row.label} · {formatValue(row.value)} {metric.unit}</title></circle>)}
          </g>)}</g>
          {active && <g className="chart-selection" aria-hidden="true">
            <line x1={x(active)} x2={x(active)} y1="16" y2="176" />
            <circle cx={x(active)} cy={y(active)} r="5" />
          </g>}
          <text x="58" y="202" textAnchor="start">{timeline.startLabel}</text>
          <text x="336" y="202" textAnchor="end">{timeline.endLabel}</text>
        </svg>
      )}
      {points.length > 0 && <p id={`${id}-interaction`} className="chart-inspection small" aria-live="polite" aria-atomic="true">{active ? `${active.label} · ${formatValue(active.value)} ${metric.unit}` : 'Esplora i valori con puntatore, tocco o tasti ← →.'}</p>}
      <p className="small">{points.length ? `Minimo ${formatValue(min)} · massimo ${formatValue(max)} ${metric.unit}` : 'I valori mancanti non vengono interpolati.'}</p>
      <p className="chart-period-note small">{period === 'auto' ? prepared?.note ?? 'Auto · in attesa dei campioni' : period === '24h' ? 'Ultime 24 ore · tutti i campioni · riferimenti ogni 6 ore' : `Ultimi ${period === '7g' ? '7' : period === '14g' ? '14' : '30'} giorni · media giornaliera 09:00–18:00`}</p>
    </article>
  )
}
