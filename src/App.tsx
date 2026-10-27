import { animate } from 'motion/mini'
import { AnimatedHeading } from './components/AnimatedHeading.tsx'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { HistoryChart } from './components/HistoryChart.tsx'
import { Reveal } from './components/Reveal.tsx'
import { ForecastSection } from './components/ForecastSection.tsx'
import { useCompleteHistory, useWeather } from './use-weather.ts'
import { formatTime, formatValue, getFreshness, groupHistoryByLocalDay, isSuspect, metrics, periods, stationStatusText } from './weather.ts'
import type { Measurement, ChartMode } from './weather.ts'
import { useBorderLight } from './use-border-light.ts'
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
  const value = row[metric.key]
  return <>
    <span>{formatValue(value)}{value !== null && ` ${metric.unit}`}</span>
    {isSuspect(row, metric.key) && <span className="quality-warning">Probabile errato</span>}
  </>
}

function HistoryTable({ rows }: { rows: Measurement[] }) {
  const tableRef = useRef<HTMLTableElement>(null)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [transition, setTransition] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [nextDay, setNextDay] = useState<string | null>(null)
  const [direction, setDirection] = useState<'older' | 'newer'>('older')
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
    const animations = Array.from(tableRef.current.querySelectorAll('tbody tr'), (row, index) => animate(row,
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSelectedDay(target === 0 ? null : days[target].key)
      return
    }
    setDirection(target > current ? 'older' : 'newer')
    setNextDay(target === 0 ? null : days[target].key)
    setTransition('exiting')
  }

  return <>
    {visibleDay && <div className="history-day-heading"><h3>{visibleDay.label}</h3><p className="small">{visible.length} {visible.length === 1 ? 'campione' : 'campioni'} acquisiti in questo giorno</p></div>}
    <div className="history-table-wrap" aria-busy={transition !== 'idle'}>
    <table ref={tableRef} className={`history-table ${transition === 'exiting' ? 'is-exiting' : transition === 'entering' ? 'is-entering' : ''}`} data-direction={direction} key={current}>
      <caption className="sr-only">Campioni del {visibleDay?.label ?? 'giorno selezionato'} in ordine dal più recente. I campioni senza ora di acquisizione sono ordinati per ricezione. Valori sospetti segnalati per campo.</caption>
      <thead><tr><th scope="col">Acquisizione / ricezione</th>{metrics.map(metric => <th key={metric.key} scope="col">{metric.name}</th>)}<th scope="col">Tempi e qualità</th></tr></thead>
      <tbody>{visible.map(row => <tr key={row.ingestion_id}>
        <th scope="row">{row.captured_at ? <time dateTime={row.captured_at}>{formatTime(row.captured_at)}</time> : <><span>Senza ora di acquisizione</span><br /><time dateTime={row.received_at}>Ricevuto {formatTime(row.received_at)}</time></>}</th>
        {metrics.map(metric => <td key={metric.key} data-label={metric.name}><Value row={row} metric={metric} /></td>)}
        <td className="sample-details" data-label="Tempi e qualità"><details><summary>Dettagli campione</summary>
          <p>{row.measured_at ? `Misura: ${formatTime(row.measured_at)}.` : 'Orario della misura non disponibile.'}</p>
          <p>Ricezione: {formatTime(row.received_at)}.</p>
          {row.quality_flags.map((flag, index) => <p key={index}>{metrics.find(metric => metric.key === flag.field)?.name}: {flag.label} · {flag.reason}</p>)}
        </details></td>
      </tr>)}</tbody>
    </table>
    </div>
    {pages > 1 && <nav className="pagination" aria-label="Pagine dei campioni">
      <button disabled={current === 0 || transition !== 'idle'} onClick={() => changePage(current - 1)}>Più recenti</button>
      <p aria-live="polite">Giorno {current + 1} di {pages}<span className="pagination-range"> · {visibleDay?.label} · {visible.length} campioni</span></p>
      <button disabled={current + 1 === pages || transition !== 'idle'} onClick={() => changePage(current + 1)}>Precedenti</button>
    </nav>}
  </>
}

function App() {
  useEffect(() => {
    document.title = 'MeteOlivelli | Meteo scolastico a Pavia'
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = 'https://meteolivelli.vercel.app/'
  }, [])

  useBorderLight()
  const [period, setPeriod] = useState<ChartMode>('auto')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfMessage, setPdfMessage] = useState('')
  const [historyPdfBusy, setHistoryPdfBusy] = useState(false)
  const [historyPdfMessage, setHistoryPdfMessage] = useState('')
  const queryPeriod = period === 'auto' ? '30g' : period
  const data = useWeather(queryPeriod, period === 'auto')
  const completeHistory = useCompleteHistory(data.latestLoaded ? JSON.stringify([data.latest, data.invalidLatestTime]) : null)
  const latest = data.latest
  const matchingHistory = data.period === queryPeriod && data.anchorToLatest === (period === 'auto')
  const historyLoading = !matchingHistory || !data.historyLoaded
  const rows = matchingHistory ? data.history : []
  const latestLoaded = data.latestLoaded
  const latestError = data.latestError
  const historyError = data.historyError
  // Cadenza e ancoraggio non sono ancora verificati, quindi la freschezza resta sconosciuta.
  const freshness = getFreshness(latest, data.checkedAt ?? 0, null)
  // Solo importazioni storiche: la dashboard lo dichiara invece di apparire vuota.
  const historicalOnly = Boolean(!latest && completeHistory.rows.some(row => row.acquisition_kind === 'historical'))
  const stationStatus = stationStatusText({ latestLoaded, invalidLatestTime: data.invalidLatestTime, latestError, freshness, historicalOnly })

  async function downloadGraphsPdf() {
    if (pdfBusy) return
    setPdfBusy(true)
    setPdfMessage('Aggiornamento dei dati e preparazione del PDF…')
    try {
      const { rows: freshRows, until } = await readFreshChartData(period, new AbortController().signal)
      const generatedAt = new Date()
      const blob = await createPdfBlob(buildGraphsDocument(freshRows, period, until, generatedAt))
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
    <a className="skip-link" href="#contenuto">Vai al contenuto</a>
    <header className="site-header">
      <a className="brand" href="/home"><BrandMark />MeteOlivelli<span className="brand-index"> / 01</span></a>
      <SchoolSiteLink className="school-logo"><SchoolLogo /></SchoolSiteLink>
      <div className="header-actions">
        <nav aria-label="Navigazione principale"><a href="/home" aria-current="page">Home</a><a href="/info">Informazioni</a><a href="/gioca">Gioca</a><a href="#history-title">Archivio <span aria-hidden="true">↗</span></a></nav>
        <ThemeToggle />
      </div>
    </header>
    <main id="contenuto" tabIndex={-1}>
      <div className="hero">
        <Reveal><section className="intro" aria-labelledby="page-title">
          <p className="eyebrow"><span className="signal-mark" aria-hidden="true" /> Pavia · Stazione scolastica</p>
          <AnimatedHeading id="page-title" lines={["Il meteo,", "qui all’Olivelli"]} />
          <p className="hero-description">Uno sguardo fuori, un dato alla volta.<br />Temperatura, umidità e pressione, osservate dalla nostra scuola.</p>
          <a className="hero-link" href="#history-title">Esplora le misure <span aria-hidden="true">↗</span></a>
          <p className={`station-status ${latestError ? 'warning' : ''}`} role="status"><span className="status-dot" aria-hidden="true" />{stationStatus}</p>
          <p className="small freshness-note">{latest ? 'Ultima lettura disponibile. La freschezza della misura non è ancora verificabile.' : historicalOnly ? 'Sono disponibili solo importazioni storiche: non risultano letture recenti della stazione.' : 'Le osservazioni appariranno appena saranno disponibili.'}</p>
        </section></Reveal>
        <Reveal><section className="hero-instrument" aria-labelledby="temperature-title" aria-busy={!latestLoaded}>
          <div className="instrument-heading"><h2 id="temperature-title">All’Olivelli / Temperatura</h2><span aria-hidden="true">↗</span></div>
          <p className="instrument-caption">Ultima lettura della stazione</p>
          <div className="hero-readings">
            <p className="hero-temperature">{latestLoaded && latest && latest.temperature_c !== null ? <Value row={latest} metric={metrics[0]} /> : <><span>—</span><span className="temperature-unit"> °C</span></>}</p>
            <dl className="hero-secondary-readings">{metrics.slice(1).map(metric => <div key={metric.key}>
              <dt>{metric.name}</dt>
              <dd>{latestLoaded && latest ? <Value row={latest} metric={metric} /> : `— ${metric.unit}`}</dd>
            </div>)}</dl>
          </div>
          <p className="instrument-time">{!latestLoaded ? 'Connessione alla stazione…' : latestError ? 'Aggiornamento non riuscito · eventuale valore conservato' : latest ? `Acquisizione PC · ${formatTime(latest.captured_at)}` : 'In attesa del primo campione'}</p>
          <HistoryChart period={period} until={data.windowUntil} metric={metrics[0]} rows={rows} loading={historyLoading} error={historyError && !historyLoading} />
          <div className="instrument-footer"><span><span className="signal-mark" aria-hidden="true" /> Osservazioni · {periods.find(item => item.value === period)?.label}</span><a href="#history-title">Cambia periodo ↗</a></div>
        </section></Reveal>
      </div>
      <Reveal><section className="latest-section" aria-labelledby="latest-title" aria-busy={!latestLoaded}>
        <div className="section-heading"><div><p className="eyebrow section-index">01 / Osservazioni</p><h2 id="latest-title">Le ultime misure</h2></div>
          <p className="small">{latest ? `Acquisizione sul PC: ${formatTime(latest.captured_at)} · Europe/Rome` : 'In attesa del primo campione della stazione.'}</p>
        </div>
        {data.invalidLatestTime && <div className="error-message" role="alert">L’ultima acquisizione ha un orario futuro rispetto al server e non viene mostrata. Verificare l’orologio del PC della stazione.</div>}
        {latestError && <div className="error-message" role="alert">Non è stato possibile aggiornare le misure. Riproviamo automaticamente; gli eventuali valori visibili sono dell’ultima lettura riuscita.</div>}
        <div className="metric-grid">{metrics.map(metric => <article key={metric.key} className={`metric-card panel tone-${metric.tone}`}>
          <h3>{metric.name}</h3>
          <p className={`metric-value ${!latest || latest[metric.key] === null ? 'value-empty' : ''}`}>
            {!latestLoaded ? 'Caricamento…' : latest ? <Value row={latest} metric={metric} /> : latestError ? 'Lettura non disponibile' : historicalOnly ? 'Nessuna lettura recente' : 'Nessun dato disponibile'}
          </p>
          <p className="small metric-source">{latest ? `Acquisizione PC · ${formatTime(latest.captured_at, true)}` : `Unità di misura: ${metric.unit}`}</p>
        </article>)}</div>
        {latest && <details className="time-details"><summary>Provenienza degli orari</summary>
          <p>Misura fisica: {formatTime(latest.measured_at)}.</p>
          <p>Acquisizione della riga sul PC: {formatTime(latest.captured_at)}.</p>
          <p>Prima ricezione del backend: {formatTime(latest.received_at)}. Tutti gli orari sono visualizzati in Europe/Rome.</p>
          <p>La ricezione di un campione non dimostra che la misura sia recente. Il contatore Arduino non è una data.</p>
        </details>}
      </section></Reveal>
      <Reveal><section className="panel history-section" aria-labelledby="history-title">
        <p className="eyebrow section-index">02 / Archivio della stazione</p>
        <h2 id="history-title">Andamento delle misure</h2>
        <p className="secondary">{rows.length ? `${rows.length} campioni disponibili nel periodo selezionato.` : 'Lo storico mostra i campioni disponibili per il periodo selezionato.'} Orari di acquisizione sul PC · Europe/Rome.</p>
        <div className="period-picker" role="group" aria-label="Periodo dello storico">{periods.map(item => <button key={item.value} aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>{item.label}</button>)}</div>
        <div className="pdf-export-controls">
          <button type="button" onClick={() => void downloadGraphsPdf()} disabled={pdfBusy} aria-busy={pdfBusy}>{pdfBusy ? 'Preparazione PDF…' : `Scarica PDF dei grafici · ${periods.find(item => item.value === period)?.label}`}</button>
          <p role="status" aria-live="polite">{pdfMessage}</p>
        </div>
        <div className="history-feedback" role="status" aria-live="polite">{historyLoading ? 'Caricamento dello storico…' : historyError ? 'Storico non aggiornato. Nuovo tentativo automatico.' : rows.length ? `${periods.find(item => item.value === period)?.label}: ${rows.length} campioni.` : latest ? 'Nessuna misura nel periodo selezionato.' : 'L’archivio non contiene ancora misure in questo periodo.'}</div>
        <div className="chart-grid" aria-busy={historyLoading}>{metrics.map(metric => <HistoryChart period={period} until={data.windowUntil} key={metric.key} metric={metric} rows={rows} loading={historyLoading} error={historyError && !historyLoading} />)}</div>
        <p className="small">24 ore mostra tutti i campioni. Le viste da 7, 14 e 30 giorni mostrano la media giornaliera dei campioni validi acquisiti fra le 09:00 e le 18:00 (Europe/Rome). In Auto lo storico breve mostra i campioni originali; oltre 7 giorni mostra le medie per fascia dell’ultima settimana disponibile. La cronologia conserva i campioni originali. I valori assenti o “probabili errati” interrompono il tracciato e restano consultabili nella cronologia.</p>
      </section></Reveal>
      <Reveal><section className="panel chronology-section" aria-labelledby="chronology-title">
        <p className="eyebrow section-index">03 / I campioni</p>
        <h2 id="chronology-title">Cronologia</h2>
        <p className="secondary">Tutti i campioni registrati finora, dal più recente. Le date di acquisizione e ricezione sono indicate separatamente. Unità: °C, %, hPa.</p>
        <div className="pdf-export-controls">
          <button type="button" onClick={completeHistory.retry} disabled={completeHistory.loading}>Aggiorna cronologia</button>
          <button type="button" onClick={() => void downloadHistoryPdf()} disabled={historyPdfBusy || completeHistory.loading || completeHistory.error} aria-busy={historyPdfBusy}>{historyPdfBusy ? 'Preparazione PDF…' : 'Scarica PDF della cronologia completa'}</button>
          <p role="status" aria-live="polite">{historyPdfMessage}</p>
        </div>
        {completeHistory.checkedAt && <p className="small">Cronologia riletta il {formatTime(completeHistory.checkedAt)} · Europe/Rome. Si aggiorna quando cambia l’ultima lettura e al ritorno alla pagina o online, al più una volta al minuto. Per includere importazioni storiche usa “Aggiorna cronologia”.</p>}
        {completeHistory.loading && <p className="empty-state" role="status">{completeHistory.checkedAt ? 'Aggiornamento della cronologia…' : 'Caricamento di tutta la cronologia…'}</p>}
        {completeHistory.error && <div className="warning" role="alert"><p>Cronologia completa temporaneamente non disponibile. Gli eventuali campioni visibili sono dell’ultima lettura riuscita.</p><button onClick={completeHistory.retry}>Riprova</button></div>}
        {completeHistory.rows.length ? <><p className="history-feedback" role="status">{completeHistory.rows.length} campioni registrati.</p><HistoryTable key="all-history" rows={completeHistory.rows} /></> : !completeHistory.loading && !completeHistory.error && <p className="empty-state">Non risultano campioni registrati.</p>}
      </section></Reveal>
      <Reveal><ForecastSection /></Reveal>
      <Reveal><section className="panel about-section" aria-labelledby="about-title">
        <p className="eyebrow section-index">Il progetto / MeteOlivelli</p>
        <h2 id="about-title">Un progetto per osservare e imparare.</h2>
        <p className="secondary">MeteOlivelli è il progetto meteo del Liceo Teresio Olivelli di Pavia, realizzato da Pietro Giudici e Nicholas Borin. Attraverso Arduino GIGA R1 e i sensori della stazione, esploriamo come temperatura, umidità e pressione cambiano nel tempo.</p>
        <p className="reflection">Imparare non significa soltanto trovare risposte, ma anche scoprire nuove domande e comprendere quanto ci sia ancora da conoscere.</p>
      </section></Reveal>
    </main>
    <SiteFooter />
  </div>
}
export default App
