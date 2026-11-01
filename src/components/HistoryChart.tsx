import { displayUnit, getLocale, locales } from '../preferences.ts'
import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { animate } from 'motion/mini'
import type { AnimationPlaybackControls } from 'motion'
import { useLayoutEffect, useEffect, useId, useRef, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { prepareChart } from '../chart.ts'
import { animateOnEntrance } from '../motion.ts'
import { formatValue, metrics, periods } from '../weather.ts'
import { createChartLink } from '../chart-links.ts'
import { smoothPath } from '../chart-geometry.ts'
import type { Measurement, ChartMode } from '../weather.ts'

export function HistoryChart({ metric, rows, loading, error, period, until, customRange, shareable = true }: {
  period: ChartMode; until: string | null;
  customRange?: { start: number; end: number } | null;
  shareable?: boolean;
  metric: typeof metrics[number]; rows: Measurement[]; loading: boolean; error: boolean
}) {
  const { language } = usePreferences()
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
    const dialog = ref.current
    if (!expanded || !dialog) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (preference.matches) return
    const backdrop = dialog.parentElement
    const animations = [animate(dialog, { opacity: [0, 1], transform: ['translateY(12px) scale(0.985)', 'translateY(0px) scale(1)'] }, { duration: 0.26, ease: 'easeOut' })]
    if (backdrop) animations.push(animate(backdrop, { opacity: [0, 1] }, { duration: 0.18, ease: 'easeOut' }))
    const cancel = () => animations.forEach(animation => animation.cancel())
    const onPreference = () => { if (preference.matches) cancel() }
    preference.addEventListener('change', onPreference)
    return () => { preference.removeEventListener('change', onPreference); cancel() }
  }, [expanded])
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
  const prepared = useMemo(() => until ? prepareChart(rows, shownMetric.key, shownPeriod, until, expanded ? undefined : customRange ?? undefined, locales[language]) : null, [rows, shownMetric.key, shownPeriod, until, customRange, expanded, language])
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
  const svgPoints = (segment: typeof points) => segment.map(point => ({ x: x(point), y: y(point) }))
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
      <h3 id={`${id}-title`}>{translate(shownMetric.name)} · {translate(displayUnit(shownMetric.key))}</h3>
      {expanded && <div className="chart-expanded-controls">
        <div className="chart-expanded-group" role="group" aria-label={translate('Grandezza')}>
          {metrics.map(item => <button key={item.key} type="button" aria-pressed={shownMetric.key === item.key} onClick={() => { setExpandedMetricKey(item.key); setSelection(null) }}>{translate(item.name)}</button>)}
        </div>
        <div className="chart-expanded-group chart-expanded-periods" role="group" aria-label={translate('Periodo del grafico')}>
          {periods.map(item => <button key={item.value} type="button" aria-pressed={shownPeriod === item.value} onClick={() => { setExpandedPeriod(item.value); setSelection(null) }}>{translate(item.label)}</button>)}
        </div>
      </div>}
      <div className="chart-expand-actions">
        {translate(!expanded ? <button ref={openerRef} type="button" onClick={() => { setExpandedMetricKey(metric.key); setExpandedPeriod('auto'); setExpanded(true) }} aria-label={translate(`Ingrandisci il grafico di ${shownMetric.name}`)}>{translate("Ingrandisci ↗")}</button>
          : <button ref={closeRef} type="button" onClick={() => setExpanded(false)} aria-label={translate(`Chiudi il grafico ingrandito di ${shownMetric.name}`)}>{translate("Chiudi ×")}</button>)}
        {translate(shareable && <button type="button" onClick={async () => {
          const link = createChartLink(window.location.origin, shownPeriod, shownMetric.key, expanded ? null : customRange)
          try { await navigator.clipboard.writeText(link); setShareMessage('Collegamento copiato.') }
          catch { setShareMessage(`Copia il collegamento: ${link}`) }
        }} aria-label={translate(`Copia il link al grafico di ${shownMetric.name}`)}>{translate("Condividi ↗")}</button>)}
      </div>
      {translate(shareMessage && <p className="chart-share-message small" role="status">{translate(shareMessage)}</p>)}
      <p className="chart-value">{translate(prepared?.averaged && <span className="chart-average-label">{translate("Ultima media · ")}</span>)}{translate(last ? `${formatValue(last.value, shownMetric.key)} ${displayUnit(shownMetric.key)}` : 'Nessun valore disponibile')}</p>
      {translate(loading || error || !points.length || !timeline ? (
        <div className="chart-empty">{translate(loading ? 'Caricamento del grafico…' : error ? 'Grafico temporaneamente non disponibile.' : rows.length ? 'Nessun valore valido da tracciare. Consulta i campioni nella tabella.' : 'Il grafico apparirà quando saranno disponibili misure in questo periodo.')}</div>
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
          <desc id={`${id}-desc`}>{translate(points.length)} {translate(prepared?.averaged ? 'medie giornaliere calcolate dai campioni validi' : 'campioni validi')}{translate(", minimo ")}{translate(formatValue(min, shownMetric.key))}{translate(" e massimo ")}{translate(formatValue(max, shownMetric.key))} {translate(displayUnit(shownMetric.key))}. {translate(prepared?.averaged ? 'Asse orizzontale: giorni in Europe/Rome; ogni punto è una media del periodo indicato.' : 'Asse orizzontale: ora della misura fisica se attestata, altrimenti acquisizione sul PC, Europe/Rome.')}{' '}{translate('Valori assenti o sospetti interrompono la linea.')}{' '}{translate(new Intl.DateTimeFormat(getLocale(), { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' }).format(start))}{translate(" – ")}{translate(new Intl.DateTimeFormat(getLocale(), { timeZone: 'Europe/Rome', dateStyle: 'short', timeStyle: 'short' }).format(end))}</desc>
      <defs>
        <clipPath id={`${id}-reveal`}><rect className="chart-reveal-mask" x={revealStart} y="12" width={revealWidth} height="168" /></clipPath>
        <linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--tone)" stopOpacity=".18" /><stop offset="100%" stopColor="var(--tone)" stopOpacity="0" /></linearGradient>
      </defs>
          {translate(timeline.ticks.map(tick => <g key={tick.time}>
            <line x1={toX(tick.time)} x2={toX(tick.time)} y1="16" y2="176" className={`chart-time-gridline ${tick.major ? 'major' : 'minor'}`} />
            {translate(tick.label && <text x={toX(tick.time)} y="202" textAnchor="middle">{translate(tick.label)}</text>)}
          </g>))}
          {translate([0, 1, 2, 3].map(index => {
            const position = 16 + index * 160 / 3
            return <g key={index}><line x1="58" x2="336" y1={position} y2={position} className="chart-gridline" /><text x="0" y={position + 4}>{translate(formatValue(high - index * (high - low) / 3, shownMetric.key))}</text></g>
          }))}
          <g clipPath={`url(#${id}-reveal)`} className="chart-series">{translate(segments.map((segment, index) => <g key={index}>
            {translate(segment.length > 1 && <><path d={`${smoothPath(svgPoints(segment))} L${x(segment.at(-1)!)},176 L${x(segment[0])},176 Z`} className="chart-area" fill={`url(#${id}-area)`} /><path d={smoothPath(svgPoints(segment))} className="chart-line" /></>)}
            {translate(segment.map(row => <circle key={row.id} cx={x(row)} cy={y(row)} r="2.6" className="chart-point"><title>{translate(row.label)} · {translate(formatValue(row.value, shownMetric.key))} {translate(displayUnit(shownMetric.key))}</title></circle>))}
          </g>))}</g>
          {translate(active && <g className="chart-selection" aria-hidden="true">
            <line x1={x(active)} x2={x(active)} y1="16" y2="176" />
            <circle cx={x(active)} cy={y(active)} r="5" />
            <g className="chart-value-pill" transform={`translate(${Math.max(58, Math.min(248, x(active) - 44))} ${Math.max(18, y(active) - 36)})`}>
              <rect width="88" height="24" rx="12" />
              <text x="44" y="16" textAnchor="middle">{translate(formatValue(active.value, shownMetric.key))} {translate(displayUnit(shownMetric.key))}</text>
            </g>
          </g>)}
          <text x="58" y="202" textAnchor="start">{translate(timeline.startLabel)}</text>
          <text x="336" y="202" textAnchor="end">{translate(timeline.endLabel)}</text>
        </svg>
      ))}
      {translate(points.length > 0 && <p id={`${id}-interaction`} className="chart-inspection sr-only" aria-live="polite" aria-atomic="true">{translate(active ? `${active.label} · ${formatValue(active.value, shownMetric.key)} ${displayUnit(shownMetric.key)}` : 'Esplora i valori con puntatore, tocco o tasti ← →.')}</p>)}
      {translate(points.length > 1 && <div className="chart-touch-controls" role="group" aria-label={translate(`Scorri i valori di ${shownMetric.name}`)}>
        <button type="button" disabled={activeIndex <= 0} onClick={() => selectPoint(activeIndex - 1)} aria-label={translate(`${shownMetric.name}: punto precedente`)}>{translate("← Precedente")}</button>
        <span className="small">{translate(activeIndex + 1)}{translate(" di ")}{translate(points.length)}</span>
        <button type="button" disabled={activeIndex >= points.length - 1} onClick={() => selectPoint(activeIndex + 1)} aria-label={translate(`${shownMetric.name}: punto successivo`)}>{translate("Successivo →")}</button>
      </div>)}
    </article>
  )
  return expanded ? createPortal(<div className="chart-lightbox" onMouseDown={event => { if (event.target === event.currentTarget) setExpanded(false) }}>{chart}</div>, document.body) : chart
}
