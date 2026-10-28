import { animate } from 'motion/mini'
import type { AnimationPlaybackControls } from 'motion'
import { useLayoutEffect, useEffect, useId, useRef, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { prepareChart } from '../chart.ts'
import { summarizeChart } from '../chart-summary.ts'
import { animateOnEntrance } from '../motion.ts'
import { formatValue, metrics, periods } from '../weather.ts'
import { createChartLink } from '../chart-links.ts'
import type { Measurement, ChartMode } from '../weather.ts'

export function HistoryChart({ metric, rows, loading, error, period, until, customRange, shareable = true }: {
  period: ChartMode; until: string | null;
  customRange?: { start: number; end: number } | null;
  shareable?: boolean;
  metric: typeof metrics[number]; rows: Measurement[]; loading: boolean; error: boolean
}) {
  const id = useId()
  const [selection, setSelection] = useState<{ id: string; series: string } | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [expandedMetricKey, setExpandedMetricKey] = useState<typeof metrics[number]['key']>(metric.key)
  const [expandedPeriod, setExpandedPeriod] = useState<ChartMode>('auto')
  const [shareMessage, setShareMessage] = useState('')
  const ref = useRef<HTMLElement>(null)
  const openerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasExpandedRef = useRef(false)
  const shownMetric = expanded ? metrics.find(item => item.key === expandedMetricKey) ?? metric : metric
  const shownPeriod = expanded ? expandedPeriod : period
  useLayoutEffect(() => {
    if (!expanded) return
    const previousOverflow = document.body.style.overflow
    const previousPaddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    return () => {
      document.body.style.overflow = previousOverflow
      document.body.style.paddingRight = previousPaddingRight
    }
  }, [expanded])
  useEffect(() => {
    if (expanded) { wasExpandedRef.current = true; closeRef.current?.focus() }
    else if (wasExpandedRef.current) openerRef.current?.focus()
  }, [expanded])
  const prepared = useMemo(() => until ? prepareChart(rows, shownMetric.key, shownPeriod, until, expanded ? undefined : customRange ?? undefined) : null, [rows, shownMetric.key, shownPeriod, until, customRange, expanded])
  const segments = prepared?.segments ?? []
  const points = segments.flat()
  const values = points.map(point => point.value)
  const min = values.length ? Math.min(...values) : 0
  const max = values.length ? Math.max(...values) : 1
  const summary = summarizeChart(points)
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
  }, [seriesKey, shownPeriod, loading, error])
  const active = selection?.series === seriesKey ? points.find(point => point.id === selection.id) : undefined
  const activeIndex = active ? points.indexOf(active) : points.length - 1
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
  const chart = (
    <article id={shareable ? `chart-${metric.key}` : undefined} ref={ref} className={`chart tone-${metric.tone}${expanded ? ' chart-expanded' : ''}`} aria-labelledby={`${id}-title`} role={expanded ? 'dialog' : undefined} aria-modal={expanded || undefined}
      onKeyDown={event => {
        if (!expanded) return
        if (event.key === 'Escape') { event.preventDefault(); setExpanded(false); return }
        if (event.key !== 'Tab') return
        const controls = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), svg[tabindex]') ?? [])
        if (!controls.length) return
        if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1)?.focus() }
        else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus() }
      }}>
      <h3 id={`${id}-title`}>{shownMetric.name} · {shownMetric.unit}</h3>
      {expanded && <div className="chart-expanded-controls">
        <div className="chart-expanded-group" role="group" aria-label="Grandezza">
          {metrics.map(item => <button key={item.key} type="button" aria-pressed={shownMetric.key === item.key} onClick={() => { setExpandedMetricKey(item.key); setSelection(null) }}>{item.name}</button>)}
        </div>
        <div className="chart-expanded-group chart-expanded-periods" role="group" aria-label="Periodo del grafico">
          {periods.map(item => <button key={item.value} type="button" aria-pressed={shownPeriod === item.value} onClick={() => { setExpandedPeriod(item.value); setSelection(null) }}>{item.label}</button>)}
        </div>
      </div>}
      <div className="chart-expand-actions">
        {!expanded ? <button ref={openerRef} type="button" onClick={() => { setExpandedMetricKey(metric.key); setExpandedPeriod('auto'); setExpanded(true) }} aria-label={`Ingrandisci il grafico di ${metric.name}`}>Ingrandisci ↗</button>
          : <button ref={closeRef} type="button" onClick={() => setExpanded(false)} aria-label={`Chiudi il grafico ingrandito di ${shownMetric.name}`}>Chiudi ×</button>}
        {shareable && <button type="button" onClick={async () => {
          const link = createChartLink(window.location.origin, shownPeriod, shownMetric.key, expanded ? null : customRange)
          try { await navigator.clipboard.writeText(createChartLink(window.location.origin, shownPeriod, shownMetric.key, expanded ? null : customRange)); setShareMessage('Collegamento copiato.') }
          catch { setShareMessage(`Copia il collegamento: ${link}`) }
        }} aria-label={`Copia il link al grafico di ${shownMetric.name}`}>Condividi ↗</button>}
      </div>
      {shareMessage && <p className="chart-share-message small" role="status">{shareMessage}</p>}
      <p className="chart-value">{prepared?.averaged && <span className="chart-average-label">Ultima media · </span>}{last ? `${formatValue(last.value)} ${shownMetric.unit}` : 'Nessun valore disponibile'}</p>
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
          <desc id={`${id}-desc`}>{points.length} {prepared?.averaged ? 'medie giornaliere calcolate dai campioni validi' : 'campioni validi'}, minimo {formatValue(min)} e massimo {formatValue(max)} {shownMetric.unit}. {prepared?.averaged ? 'Asse orizzontale: giorni in Europe/Rome; i punti sono posizionati al centro della giornata o della fascia, non all’ora di una singola misura.' : 'Asse orizzontale: ora della misura fisica (measured_at), Europe/Rome.'} I campioni senza measured_at sono esclusi; valori assenti o sospetti interrompono la linea. Da {new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' }).format(start)} a {new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' }).format(end)}. Finestra completa: {shownPeriod === 'auto' ? 'adattata ai dati' : shownPeriod === '24h' ? '24 ore' : shownPeriod === '7g' ? '7 giorni' : shownPeriod === '14g' ? '14 giorni' : '30 giorni'}. Tutti i campioni sono consultabili sotto.</desc>
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
            {segment.map(row => <circle key={row.id} cx={x(row)} cy={y(row)} r="2.6" className="chart-point"><title>{row.label} · {formatValue(row.value)} {shownMetric.unit}</title></circle>)}
          </g>)}</g>
          {active && <g className="chart-selection" aria-hidden="true">
            <line x1={x(active)} x2={x(active)} y1="16" y2="176" />
            <circle cx={x(active)} cy={y(active)} r="5" />
          </g>}
          <text x="58" y="202" textAnchor="start">{timeline.startLabel}</text>
          <text x="336" y="202" textAnchor="end">{timeline.endLabel}</text>
        </svg>
      )}
      {points.length > 0 && <p id={`${id}-interaction`} className="chart-inspection small" aria-live="polite" aria-atomic="true">{active ? `${active.label} · ${formatValue(active.value)} ${shownMetric.unit}` : 'Esplora i valori con puntatore, tocco o tasti ← →.'}</p>}
      {points.length > 1 && <div className="chart-touch-controls" role="group" aria-label={`Scorri i valori di ${shownMetric.name}`}>
        <button type="button" disabled={activeIndex <= 0} onClick={() => selectPoint(activeIndex - 1)} aria-label={`${shownMetric.name}: punto precedente`}>← Precedente</button>
        <span className="small">{activeIndex + 1} di {points.length}</span>
        <button type="button" disabled={activeIndex >= points.length - 1} onClick={() => selectPoint(activeIndex + 1)} aria-label={`${shownMetric.name}: punto successivo`}>Successivo →</button>
      </div>}
      <p className="chart-statistics small">{summary ? `Minimo ${formatValue(summary.minimum)} · massimo ${formatValue(summary.maximum)} · media ${formatValue(summary.average)} ${shownMetric.unit} (${summary.samples} campioni validi)${summary.change === null ? '' : ` · variazione dall’ultimo punto ${summary.change > 0 ? '+' : ''}${formatValue(summary.change)} ${shownMetric.unit}`}` : 'I valori mancanti non vengono interpolati.'}</p>
      <p className="chart-period-note small">{!expanded && customRange ? 'Intervallo personalizzato · tutti i campioni validi' : shownPeriod === 'auto' ? prepared?.note ?? 'Auto · in attesa dei campioni' : shownPeriod === '24h' ? 'Ultime 24 ore · tutti i campioni · riferimenti ogni 6 ore' : `Ultimi ${shownPeriod === '7g' ? '7' : shownPeriod === '14g' ? '14' : '30'} giorni · media giornaliera 09:00–18:00`}</p>
    </article>
  )
  return expanded ? createPortal(<div className="chart-lightbox" onMouseDown={event => { if (event.target === event.currentTarget) setExpanded(false) }}>{chart}</div>, document.body) : chart
}
