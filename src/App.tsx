import { formatCivilDay } from './weather.ts'
import { displayUnit } from './preferences.ts'
import { translate } from './i18n.ts'
import { usePreferences } from './use-preferences.ts'
import { animate } from 'motion/mini'
import { AnimatedHeading } from './components/AnimatedHeading.tsx'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { HistoryChart } from './components/HistoryChart.tsx'
import { CombinedChart } from './components/CombinedChart.tsx'
import { Reveal } from './components/Reveal.tsx'
import { ForecastSection } from './components/ForecastSection.tsx'
import { DailyCuriosity } from './components/DailyCuriosity.tsx'
import { DailyStatistics } from './components/DailyStatistics.tsx'
import { WeatherRecords } from './components/WeatherRecords.tsx'
import { MeteorologyGlossary } from './components/MeteorologyGlossary.tsx'
import { useCompleteHistory, useWeather } from './use-weather.ts'
import { formatTime, formatValue, getFreshness, groupHistoryByLocalDay, isSuspect, metrics, observationTime, periods, stationStatusText } from './weather.ts'
import type { Measurement, ChartMode } from './weather.ts'
import { useBorderLight } from './use-border-light.ts'
import { describeWeatherChange } from './weather-summary.ts'
import { measurementAge } from './measurement-age.ts'
import { localDateTimeValue, readChartLink } from './chart-links.ts'
import { browserChartPreference, isMetric, orderedMetrics, rememberBrowserChartPreference } from './chart-preferences.ts'
import { metricExplanations } from './metric-explanations.ts'
import { ThemeToggle } from './components/ThemeToggle.tsx'
import { BrandMark } from './components/BrandMark.tsx'
import { SchoolLogo } from './components/SchoolLogo.tsx'
import { SchoolSiteLink } from './components/SchoolSiteLink.tsx'
import { SiteFooter } from './components/SiteFooter.tsx'
import { readFreshChartData } from './pdf-chart-data.ts'
import { buildGraphsDocument } from './pdf-graphs-document.ts'
import { createPdfBlob } from './pdf-runtime.ts'
import { downloadPdfBlob } from './pdf-download.ts'
import { createFreshHistoryPdf } from './pdf-history-export.ts'
import './App.css'

function Value({ row, metric }: { row: Measurement; metric: typeof metrics[number] }) {
  usePreferences()
  const value = row[metric.key]
  return <>
    <span>{translate(formatValue(value, metric.key))}{translate(value !== null && ` ${displayUnit(metric.key)}`)}</span>
    {translate(isSuspect(row, metric.key) && <span className="quality-warning">{translate("Probabile errato")}</span>)}
  </>
}

function HistoryTable({ rows }: { rows: Measurement[] }) {
  usePreferences()
  const tableRef = useRef<HTMLTableElement>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [transition, setTransition] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [nextDay, setNextDay] = useState<string | null>(null)
  const [direction, setDirection] = useState<'older' | 'newer'>('older')
  const [requestedDate, setRequestedDate] = useState('')
  const [dateError, setDateError] = useState('')
  // Raggruppamento costoso solo quando cambiano i campioni, non a ogni render di transizione.
  const days = useMemo(() => groupHistoryByLocalDay([...rows].reverse()), [rows])
  const pages = days.length
  const selectedIndex = selectedDay === null ? 0 : days.findIndex(day => day.key === selectedDay)
  const current = Math.max(0, selectedIndex)
  const visibleDay = days[current]
  const visible = visibleDay?.rows ?? []

  useLayoutEffect(() => {
    if (transition === 'idle' || !tableRef.current) return
    let cancelled = false
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const advance = () => {
      if (cancelled) return
      if (transition === 'exiting') {
        setSelectedDay(nextDay)
        setTransition(media.matches ? 'idle' : 'entering')
      } else setTransition('idle')
    }
    const sign = direction === 'older' ? 1 : -1
    const body = tableRef.current.tBodies[0]
    // Una giornata molto fitta non deve creare migliaia di animazioni o attese
    // proporzionali al numero di campioni. Per quelle pagine si anima il gruppo.
    const targets = body.rows.length > 12 ? [body] : Array.from(body.rows)
    const animations = targets.map((row, index) => animate(row,
      transition === 'exiting'
        ? { opacity: [1, 0], transform: ['translateY(0px)', `translateY(${sign * 6}px)`] }
        : { opacity: [0, 1], transform: [`translateY(${-sign * 6}px)`, 'translateY(0px)'] },
      { duration: media.matches ? 0 : 0.18, delay: media.matches ? 0 : index * 0.025, ease: 'easeOut' }))
    void Promise.all(animations).then(advance)
    const onPreference = () => { if (media.matches) advance() }
    media.addEventListener('change', onPreference)
    return () => {
      cancelled = true
      media.removeEventListener('change', onPreference)
      animations.forEach(animation => animation.cancel())
    }
  }, [nextDay, transition, direction])

  function changePage(target: number) {
    if (transition !== 'idle' || target < 0 || target >= pages || target === current) return
    setRequestedDate(days[target].key)
    setDateError('')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSelectedDay(target === 0 ? null : days[target].key)
      return
    }
    setDirection(target > current ? 'older' : 'newer')
    setNextDay(target === 0 ? null : days[target].key)
    setTransition('exiting')
  }

  return <>
    {translate(pages > 1 && <div className="history-date-search">
      <label htmlFor="history-jump-date">{translate("Vai direttamente a una data")}</label>
      <input id="history-jump-date" type="date" value={requestedDate || visibleDay?.key || ''} min={days.at(-1)?.key} max={days[0]?.key} disabled={transition !== 'idle'} onChange={event => {
        const key = event.target.value
        setRequestedDate(key)
        const index = days.findIndex(day => day.key === key)
        if (index < 0) setDateError('Nessuna misurazione registrata in questa data. Scegli un giorno presente nell’archivio.')
        else { setDateError(''); changePage(index) }
      }} />
      {translate(dateError && <p role="status">{translate(dateError)}</p>)}
    </div>)}
    {translate(visibleDay && <div className="history-day-heading"><h3>{translate(formatCivilDay(visibleDay.key))}</h3><p className="small">{translate(visible.length)} {translate(visible.length === 1 ? 'misura' : 'misure')}{translate(" · giorno della misura; se manca, acquisizione o ricezione")}</p></div>)}
    <div className="history-table-wrap" aria-busy={transition !== 'idle'}>
    <table ref={tableRef} className={`history-table ${transition === 'exiting' ? 'is-exiting' : transition === 'entering' ? 'is-entering' : ''}`} data-direction={direction} key={current}>
      <caption className="sr-only">{translate("Misure del ")}{translate((visibleDay ? formatCivilDay(visibleDay.key) : undefined) ?? 'giorno selezionato')}{translate(" in ordine dal più recente. I valori sospetti sono segnalati per campo.")}</caption>
      <thead><tr><th scope="col">{translate("Misura / acquisizione")}</th>{translate(metrics.map(metric => <th key={metric.key} scope="col">{translate(metric.name)}</th>))}<th scope="col">{translate("Tempi e qualità")}</th></tr></thead>
      <tbody>{translate(visible.map(row => <tr key={row.ingestion_id}>
        <th scope="row">{translate(row.entry_method === 'manual' && <span className="history-origin">{translate("Misura reale · inserita manualmente")}</span>)}{translate(row.measured_at ? <><span>{translate("Misurata ")}</span><time dateTime={row.measured_at}>{translate(formatTime(row.measured_at))}</time></> : row.captured_at ? <><span>{translate("Acquisita ")}</span><time dateTime={row.captured_at}>{translate(formatTime(row.captured_at))}</time></> : <><span>{translate("Senza orario della misura")}</span><br /><time dateTime={row.received_at}>{translate("Ricevuta ")}{translate(formatTime(row.received_at))}</time></>)}</th>
        {translate(metrics.map(metric => <td key={metric.key} data-label={translate(metric.name)}><Value row={row} metric={metric} /></td>))}
        <td className="sample-details" data-label={translate("Tempi e qualità")}><details><summary>{translate("Dettagli campione")}</summary>
          <p>{translate(row.measured_at ? `Misura: ${formatTime(row.measured_at)}.` : 'Orario della misura non disponibile.')}</p>
          <p>{translate("Ricezione: ")}{translate(formatTime(row.received_at))}.</p>
          {translate(row.quality_flags.map((flag, index) => <p key={index}>{translate(metrics.find(metric => metric.key === flag.field)?.name)}: {translate(flag.label)} · {translate(flag.reason)}</p>))}
        </details></td>
      </tr>))}</tbody>
    </table>
    </div>
    {translate(pages > 1 && <nav className="pagination" aria-label={translate("Pagine dei campioni")}>
      <button disabled={current === 0 || transition !== 'idle'} onClick={() => changePage(current - 1)}>{translate("Più recenti")}</button>
      <p aria-live="polite">{translate("Giorno ")}{translate(current + 1)}{translate(" di ")}{translate(pages)}<span className="pagination-range"> · {translate((visibleDay ? formatCivilDay(visibleDay.key) : undefined))} · {translate(visible.length)}{translate(" campioni")}</span></p>
      <button disabled={current + 1 === pages || transition !== 'idle'} onClick={() => changePage(current + 1)}>{translate("Precedenti")}</button>
    </nav>)}
  </>
}

function App() {
  const preferences = usePreferences()
  useEffect(() => {
    document.title = translate('MeteOlivelli | Meteo scolastico a Pavia')
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (description) description.content = translate('Consulta temperatura, umidità, pressione e storico della stazione meteorologica del Liceo Teresio Olivelli di Pavia, quando disponibili.')
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = 'https://meteolivelli.vercel.app/'
  }, [preferences])
  useEffect(() => {
    let id: string
    try { id = decodeURIComponent(window.location.hash.slice(1)) } catch { return }
    if (!['chart-temperature_c', 'chart-humidity_pct', 'chart-pressure_hpa'].includes(id)) return
    const frame = requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
    return () => cancelAnimationFrame(frame)
  }, [])

  useBorderLight()
  const initialChartLink = useMemo(() => readChartLink(window.location.search), [])
  const [period, setPeriod] = useState<ChartMode>(initialChartLink.period)
  const [customStart, setCustomStart] = useState(() => initialChartLink.customRange ? localDateTimeValue(initialChartLink.customRange.start) : '')
  const [customEnd, setCustomEnd] = useState(() => initialChartLink.customRange ? localDateTimeValue(initialChartLink.customRange.end) : '')
  const [customRange, setCustomRange] = useState<{ start: number; end: number } | null>(initialChartLink.customRange)
  const [customError, setCustomError] = useState('')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfMessage, setPdfMessage] = useState('')
  const [historyPdfBusy, setHistoryPdfBusy] = useState(false)
  const [historyPdfMessage, setHistoryPdfMessage] = useState('')
  const [showChronology, setShowChronology] = useState(false)
  const [firstChart, setFirstChart] = useState(browserChartPreference)
  const queryPeriod = period === 'auto' ? '30g' : period
  const data = useWeather(queryPeriod, period === 'auto')
  const completeHistory = useCompleteHistory(data.latestLoaded ? JSON.stringify([data.latest, data.invalidLatestTime]) : null)
  const latest = data.latest
  const matchingHistory = data.period === queryPeriod && data.anchorToLatest === (period === 'auto')
  const historyLoading = !matchingHistory || !data.historyLoaded
  const rows = useMemo(() => matchingHistory ? data.history : [], [matchingHistory, data.history])
  const latestLoaded = data.latestLoaded
  const latestError = data.latestError
  const historyError = data.historyError
  // Cadenza e ancoraggio non sono ancora verificati, quindi la freschezza resta sconosciuta.
  const freshness = getFreshness(latest, data.checkedAt ?? 0, null)
  // Solo importazioni storiche: la dashboard lo dichiara invece di apparire vuota.
  const historicalOnly = Boolean(!latest && completeHistory.rows.some(row => row.acquisition_kind === 'historical'))
  const stationStatus = stationStatusText({ latestLoaded, invalidLatestTime: data.invalidLatestTime, latestError, freshness, historicalOnly })
  const weatherSummary = useMemo(() => describeWeatherChange(latest, rows, preferences.temperatureUnit, preferences.language), [latest, rows, preferences.temperatureUnit, preferences.language])
  const ageDescription = measurementAge(latest, data.serverUntil)

  function applyCustomRange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const start = new Date(customStart).getTime()
    const end = new Date(customEnd).getTime()
    const now = Date.now()
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end || end > now || now - start > 30 * 24 * 3600000) {
      setCustomError('Scegli un intervallo valido, nel passato, compreso negli ultimi 30 giorni.')
      return
    }
    setCustomError('')
    setPeriod('30g')
    setCustomRange({ start, end })
  }

  async function downloadGraphsPdf() {
    if (pdfBusy) return
    setPdfBusy(true)
    setPdfMessage('Aggiornamento dei dati e preparazione del PDF…')
    try {
      const { rows: freshRows, until } = await readFreshChartData(customRange ? '30g' : period, new AbortController().signal)
      const generatedAt = new Date()
      const blob = await createPdfBlob(buildGraphsDocument(freshRows, customRange ? '30g' : period, until, generatedAt, customRange ?? undefined))
      downloadPdfBlob(blob, 'grafici', generatedAt)
      setPdfMessage('PDF dei grafici scaricato.')
    } catch {
      setPdfMessage('PDF non disponibile: aggiornamento o generazione non riusciti. Riprova.')
    } finally {
      setPdfBusy(false)
    }
  }

  async function downloadHistoryPdf() {
    if (historyPdfBusy) return
    setHistoryPdfBusy(true)
    setHistoryPdfMessage('Rilettura di tutte le pagine e preparazione del PDF…')
    try {
      const { blob, rows, generatedAt } = await createFreshHistoryPdf(new AbortController().signal)
      downloadPdfBlob(blob, 'cronologia', generatedAt)
      setHistoryPdfMessage(`PDF scaricato con ${rows.length} campioni.`)
    } catch {
      setHistoryPdfMessage('PDF non disponibile: la cronologia completa non è stata letta o generata. Riprova.')
    } finally {
      setHistoryPdfBusy(false)
    }
  }

  return <div className="site-shell">
    <a className="skip-link" href="#contenuto">{translate("Vai al contenuto")}</a>
    <header className="site-header">
      <a className="brand" href="/home"><BrandMark />{translate("MeteOlivelli")}<span className="brand-index"> / 01</span></a>
      <SchoolSiteLink className="school-logo"><SchoolLogo /></SchoolSiteLink>
      <div className="header-actions">
        <nav aria-label={translate("Navigazione principale")}><a href="/home" aria-current="page">{translate("Home")}</a><a href="/info">{translate("Informazioni")}</a><a href="/gioca">{translate("Gioca")}</a><a href="#history-title">{translate("Archivio ")}<span aria-hidden="true">↗</span></a></nav>
        <ThemeToggle />
      </div>
    </header>
    <main id="contenuto" tabIndex={-1}>
      <div className="hero">
        <Reveal><section className="intro" aria-labelledby="page-title">
          <p className="eyebrow"><span className="signal-mark" aria-hidden="true" />{translate(" Pavia · Stazione scolastica")}</p>
          <AnimatedHeading id="page-title" lines={translate(["Il meteo,", "qui all’Olivelli"])} />
          <p className="hero-description">{translate("Uno sguardo fuori, un dato alla volta.")}<br />{translate("Temperatura, umidità e pressione, osservate dalla nostra scuola.")}</p>
          <a className="hero-link" href="#history-title">{translate("Esplora le misure ")}<span aria-hidden="true">↗</span></a>
          <p className={`station-status ${latestError ? 'warning' : ''}`} role="status"><span className="status-dot" aria-hidden="true" />{translate(stationStatus)}</p>
          <p className="small freshness-note">{translate(ageDescription ?? (historicalOnly ? 'Sono disponibili solo importazioni storiche: non risultano letture recenti della stazione.' : 'Le osservazioni appariranno appena saranno disponibili.'))}</p>
        </section></Reveal>
        <Reveal><section className="hero-instrument" aria-labelledby="temperature-title" aria-busy={!latestLoaded}>
          <div className="instrument-heading"><h2 id="temperature-title">{translate("All’Olivelli / Temperatura")}</h2><span aria-hidden="true">↗</span></div>
          <p className="instrument-caption">{translate(latest?.entry_method === 'manual' ? 'Ultima misura reale inserita manualmente' : 'Ultima lettura della stazione')}</p>
          <div className="hero-readings">
            <p className="hero-temperature">{translate(latestLoaded && latest && latest.temperature_c !== null ? <Value row={latest} metric={metrics[0]} /> : <><span>—</span><span className="temperature-unit">{' ' + displayUnit('temperature_c')}</span></>)}</p>
            <dl className="hero-secondary-readings">{translate(metrics.slice(1).map(metric => <div key={metric.key}>
              <dt>{translate(metric.name)}</dt>
              <dd>{translate(latestLoaded && latest ? <Value row={latest} metric={metric} /> : `— ${displayUnit(metric.key)}`)}</dd>
            </div>))}</dl>
          </div>
          <p className="instrument-time">{translate(!latestLoaded ? 'Connessione alle misure…' : latestError ? 'Aggiornamento non riuscito · eventuale valore conservato' : latest ? latest.entry_method === 'manual' ? `Inserita manualmente · misurata ${formatTime(latest.measured_at)}` : `Acquisizione PC · ${formatTime(latest.captured_at)}` : 'La prima misura della stazione non è ancora arrivata')}</p>
          <HistoryChart shareable={false} period={period} until={data.windowUntil} customRange={customRange} metric={metrics[0]} rows={rows} loading={historyLoading} error={historyError && !historyLoading} />
          <div className="instrument-footer"><span><span className="signal-mark" aria-hidden="true" />{translate(" Osservazioni · ")}{translate(periods.find(item => item.value === period)?.label)}</span><a href="#history-title">{translate("Cambia periodo ↗")}</a></div>
        </section></Reveal>
      </div>
      <nav className="section-jump-nav" aria-label={translate("Vai a una sezione della homepage")}>
        <span>{translate("Vai a")}</span>
        <a href="#latest-title">{translate("Misure")}</a>
        <a href="#forecast-title">{translate("Previsioni")}</a>
        <a href="#daily-curiosity-title">{translate("Curiosità")}</a>
        <a href="#history-title">{translate("Grafici")}</a>
        <a href="#daily-stats-title">{translate("Statistiche")}</a>
        <a href="#chronology-title">{translate("Cronologia")}</a>
      </nav>
      <Reveal><section className="latest-section" aria-labelledby="latest-title" aria-busy={!latestLoaded}>
        <div className="section-heading"><div><p className="eyebrow section-index">{translate("01 / Osservazioni")}</p><h2 id="latest-title">{translate("Le ultime misure")}</h2></div>
          <p className="small">{translate(latest ? latest.entry_method === 'manual' ? `Misurata: ${formatTime(observationTime(latest))} · inserita manualmente` : `Acquisizione sul PC: ${formatTime(latest.captured_at)} · Europe/Rome` : 'In attesa del primo campione della stazione.')}</p>
        </div>
        {translate(data.invalidLatestTime && <div className="error-message" role="alert">{translate("L’ultima misura ha un orario futuro rispetto al server e non viene mostrata. Verificare l’orario inserito.")}</div>)}
        {translate(latestError && <div className="error-message" role="alert">{translate("Non è stato possibile aggiornare le misure. Riproviamo automaticamente; gli eventuali valori visibili sono dell’ultima lettura riuscita.")}</div>)}
        {translate(latestLoaded && !latest ? <div className="station-empty panel" role="status">
          <span className="station-empty-symbol" aria-hidden="true">—</span>
          <div>
            <h3>{translate(latestError ? 'La stazione non è raggiungibile' : historicalOnly ? 'Sono disponibili soltanto dati storici' : 'In attesa delle prime misure')}</h3>
            <p>{translate(latestError ? 'Non riusciamo ad aggiornare i valori. Riproveremo automaticamente.' : historicalOnly ? 'La stazione non ha ancora inviato nuove letture. Puoi esplorare l’archivio già disponibile.' : 'Qui compariranno temperatura, umidità e pressione quando la stazione invierà i primi dati reali.')}</p>
            <a href={historicalOnly ? '#history-title' : '/info'}>{translate(historicalOnly ? 'Esplora lo storico' : 'Scopri come funziona la stazione')} <span aria-hidden="true">↗</span></a>
          </div>
        </div> : <div className="metric-grid">{translate(metrics.map(metric => <article key={metric.key} className={`metric-card panel tone-${metric.tone}`}>
          <h3>{translate(metric.name)}</h3>
          <p className={`metric-value ${!latest || latest[metric.key] === null ? 'value-empty' : ''}`}>
            {translate(!latestLoaded ? 'Caricamento…' : latest ? <Value row={latest} metric={metric} /> : latestError ? 'Lettura non disponibile' : historicalOnly ? 'Nessuna lettura recente' : 'Nessun dato disponibile')}
          </p>
          <details className="metric-explanation"><summary><span aria-hidden="true">ⓘ</span>{translate(" Cosa indica?")}</summary><p>{translate(metricExplanations[metric.key])}</p></details>
        </article>))}</div>)}
        {translate(latest && <div className="weather-summary panel" aria-labelledby="weather-summary-title">
          <h3 id="weather-summary-title">{translate("Come stanno cambiando le misure?")}</h3>
          {translate(weatherSummary ? <><ul>{translate(weatherSummary.map(sentence => <li key={sentence}>{translate(sentence)}</li>))}</ul><p className="small">{translate("Confronto descrittivo fra letture della stazione, non una previsione. Gli intervalli fra misure possono essere diversi.")}</p></> : <p className="small">{translate("La sintesi sarà disponibile quando arriveranno almeno due letture fisiche valide e confrontabili.")}</p>)}
        </div>)}
        {translate(latest && <details className="time-details"><summary>{translate("Provenienza degli orari")}</summary>
          <p>{translate("Misura fisica: ")}{translate(formatTime(latest.measured_at))}.</p>
          <p>{translate("Acquisizione della riga sul PC: ")}{translate(formatTime(latest.captured_at))}.</p>
          <p>{translate("Prima ricezione del backend: ")}{translate(formatTime(latest.received_at))}{translate(". Tutti gli orari sono visualizzati in Europe/Rome.")}</p>
          <p>{translate("La ricezione di un campione non dimostra che la misura sia recente. Il contatore Arduino non è una data.")}</p>
        </details>)}
      </section></Reveal>
      <Reveal><ForecastSection /></Reveal>
      <Reveal><DailyCuriosity /></Reveal>
      <Reveal><section className="panel history-section" aria-labelledby="history-title">
        <p className="eyebrow section-index">{translate("02 / Archivio della stazione")}</p>
        <h2 id="history-title">{translate("Andamento delle misure")}</h2>
        <p className="secondary">{translate(rows.length ? `${rows.length} misurazioni nel periodo scelto.` : 'Esplora come sono cambiate le misure nel tempo.')}{translate(" Orari locali italiani.")}</p>
        <div className="period-picker" role="group" aria-label={translate("Periodo dello storico")}>{translate(periods.map(item => <button key={item.value} aria-pressed={!customRange && period === item.value} onClick={() => { setPeriod(item.value); setCustomRange(null); setCustomError('') }}>{translate(item.label)}</button>))}</div>
        <form className="custom-period" onSubmit={applyCustomRange}>
          <strong>{translate("Intervallo personalizzato")}</strong>
          <label>{translate("Da ")}<input type="datetime-local" value={customStart} onChange={event => setCustomStart(event.target.value)} required /></label>
          <label>{translate("A ")}<input type="datetime-local" value={customEnd} onChange={event => setCustomEnd(event.target.value)} required /></label>
          <button type="submit" aria-pressed={customRange !== null}>{translate("Applica intervallo")}</button>
          {translate(customRange && <button type="button" onClick={() => { setCustomRange(null); setPeriod('auto') }}>{translate("Torna ad Auto")}</button>)}
          {translate(customError && <p role="alert">{translate(customError)}</p>)}
          <p className="small">{translate("Fino a 30 giorni recenti; i grafici personalizzati mostrano i campioni originali.")}</p>
        </form>
        <div className="pdf-export-controls">
          <button type="button" onClick={() => void downloadGraphsPdf()} disabled={pdfBusy} aria-busy={pdfBusy}>{translate(pdfBusy ? 'Preparazione PDF…' : `Scarica PDF dei grafici · ${customRange ? 'Personalizzato' : periods.find(item => item.value === period)?.label}`)}</button>
          <p role="status" aria-live="polite">{translate(pdfMessage)}</p>
        </div>
        <div className="history-feedback" role="status" aria-live="polite">{translate(historyLoading ? 'Caricamento dello storico…' : historyError ? 'Storico non aggiornato. Nuovo tentativo automatico.' : rows.length ? `${customRange ? 'Intervallo personalizzato' : periods.find(item => item.value === period)?.label}: ${rows.length} campioni caricati.` : latest ? 'Nessuna misura nel periodo selezionato.' : 'L’archivio non contiene ancora misure in questo periodo.')}</div>
        <label className="first-chart-picker">{translate("Mostra per primo ")}<select value={firstChart} onChange={event => { if (isMetric(event.target.value)) { setFirstChart(event.target.value); rememberBrowserChartPreference(event.target.value) } }}>
            {translate(metrics.map(metric => <option key={metric.key} value={metric.key}>{translate(metric.name)}</option>))}
          </select>
        </label>
        <p className="small">{translate("La scelta viene ricordata solo su questo dispositivo. Tutti e tre i grafici restano disponibili.")}</p>
        <div className="chart-grid" aria-busy={historyLoading}>{translate(orderedMetrics(firstChart).map(metric => <HistoryChart period={period} until={data.windowUntil} customRange={customRange} key={metric.key} metric={metric} rows={rows} loading={historyLoading} error={historyError && !historyLoading} />))}</div>
        {translate(!historyLoading && !historyError && <CombinedChart rows={rows} period={period} until={data.windowUntil} customRange={customRange} />)}
        <p className="small">{translate("Le linee rappresentano misure effettive o medie dei campioni disponibili, mai valori inventati.")}</p>
        <details className="chart-methodology"><summary>{translate("Come leggere i grafici e le medie")}</summary>
          <p>{translate("La vista di 24 ore mostra tutti i campioni. Le viste da 7, 14 e 30 giorni mostrano medie giornaliere dei campioni validi acquisiti fra le 09:00 e le 18:00 (Europe/Rome).")}</p>
          <p>{translate("In Auto, lo storico breve mostra i campioni originali; oltre 7 giorni mostra le medie per fascia dell’ultima settimana disponibile. Un intervallo personalizzato e la cronologia mostrano i campioni originali.")}</p>
          <p>{translate("Misure assenti o indicate come «probabili errate» interrompono il tracciato. Rimangono consultabili nella cronologia.")}</p>
        </details>
      </section></Reveal>
      <Reveal><DailyStatistics rows={completeHistory.rows} serverUntil={data.serverUntil} selectedRange={customRange} loading={completeHistory.loading} error={completeHistory.error} /></Reveal>
      <Reveal><WeatherRecords rows={completeHistory.rows} until={data.serverUntil} loading={completeHistory.loading} /></Reveal>
      <Reveal><section className="panel chronology-section" aria-labelledby="chronology-title">
        <p className="eyebrow section-index">{translate("03 / I campioni")}</p>
        <h2 id="chronology-title">{translate("Cronologia")}</h2>
        <p className="secondary">{translate("Consulta tutte le letture, dalla più recente, oppure scarica l'archivio in PDF.")}</p>
        <div className="pdf-export-controls">
          <button type="button" onClick={completeHistory.retry} disabled={completeHistory.loading}>{translate("Aggiorna cronologia")}</button>
          <button type="button" onClick={() => void downloadHistoryPdf()} disabled={historyPdfBusy || completeHistory.loading || completeHistory.error} aria-busy={historyPdfBusy}>{translate(historyPdfBusy ? 'Preparazione PDF…' : 'Scarica PDF della cronologia completa')}</button>
          <p role="status" aria-live="polite">{translate(historyPdfMessage)}</p>
        </div>
        {translate(completeHistory.checkedAt && <p className="small">{translate("Cronologia riletta il ")}{translate(formatTime(completeHistory.checkedAt))}{translate(" · Europe/Rome. Si aggiorna quando cambia l’ultima lettura e al ritorno alla pagina o online, al più una volta al minuto. Per includere importazioni storiche usa “Aggiorna cronologia”.")}</p>)}
        {translate(completeHistory.loading && <p className="empty-state" role="status">{translate(completeHistory.checkedAt ? 'Aggiornamento della cronologia in corso…' : 'Lettura di tutta la cronologia in corso…')}</p>)}
        {translate(completeHistory.error && <div className="warning" role="alert"><p>{translate("Cronologia completa temporaneamente non disponibile. Gli eventuali campioni visibili sono dell’ultima lettura riuscita.")}</p><button onClick={completeHistory.retry}>{translate("Ritenta")}</button></div>)}
        {translate(completeHistory.rows.length ? <>
          <p className="history-feedback" role="status">{translate(completeHistory.rows.length)}{translate(" campioni registrati, consultabili giorno per giorno.")}</p>
          <p className="small">{translate("Le misure inserite manualmente sono reali e partecipano a grafici, statistiche, record e previsioni usando l’orario della misura. Il database conserva comunque il contrassegno del metodo di inserimento.")}</p>
          <button type="button" className="chronology-toggle" aria-expanded={showChronology} aria-controls="chronology-data" onClick={() => setShowChronology(value => !value)}>{translate(showChronology ? 'Nascondi le misurazioni' : 'Mostra le misurazioni')}</button>
          <div id="chronology-data" hidden={!showChronology}>{translate(showChronology && <HistoryTable key="all-history" rows={completeHistory.rows} />)}</div>
        </> : !completeHistory.loading && !completeHistory.error && <p className="empty-state">{translate("Non risultano campioni registrati.")}</p>)}
      </section></Reveal>
      <Reveal><section className="panel about-section" aria-labelledby="about-title">
        <p className="eyebrow section-index">{translate("Il progetto / MeteOlivelli")}</p>
        <h2 id="about-title">{translate("Un progetto per osservare e imparare.")}</h2>
        <p className="secondary">{translate("MeteOlivelli è il progetto meteo del Liceo Teresio Olivelli di Pavia, realizzato da Pietro Giudici e Nicholas Borin. Attraverso Arduino GIGA R1 e i sensori della stazione, esploriamo come temperatura, umidità e pressione cambiano nel tempo.")}</p>
        <p className="reflection">{translate("Imparare non significa soltanto trovare risposte, ma anche scoprire nuove domande e comprendere quanto ci sia ancora da conoscere.")}</p>
      </section></Reveal>
      <Reveal><MeteorologyGlossary /></Reveal>
    </main>
    <SiteFooter />
  </div>
}
export default App
