import { useEffect, useState } from 'react'
import { HistoryChart } from './components/HistoryChart.tsx'
import { Reveal } from './components/Reveal.tsx'
import { ForecastSection } from './components/ForecastSection.tsx'
import { useCompleteHistory, useWeather } from './use-weather.ts'
import { formatTime, formatValue, getFreshness, isSuspect, metrics, periods } from './weather.ts'
import type { Measurement, ChartMode } from './weather.ts'
import { useBorderLight } from './use-border-light.ts'
import { ThemeToggle } from './components/ThemeToggle.tsx'
import { readFreshChartData } from './pdf-chart-data.ts'
import { buildGraphsDocument } from './pdf-graphs-document.ts'
import { createPdfBlob } from './pdf-runtime.ts'
import { reportFilename } from './pdf-export.ts'
import './App.css'

function Value({ row, metric }: { row: Measurement; metric: typeof metrics[number] }) {
  const value = row[metric.key]
  return <>
    <span>{formatValue(value)}{value !== null && ` ${metric.unit}`}</span>
    {isSuspect(row, metric.key) && <span className="quality-warning">Probabile errato</span>}
  </>
}

function HistoryTable({ rows }: { rows: Measurement[] }) {
  const [page, setPage] = useState(0)
  const [transition, setTransition] = useState<'idle' | 'exiting' | 'entering'>('idle')
  const [nextPage, setNextPage] = useState(0)
  const [direction, setDirection] = useState<'older' | 'newer'>('older')
  const ordered = [...rows].reverse()
  const pages = Math.ceil(ordered.length / 6)
  const current = Math.min(page, Math.max(0, pages - 1))
  const visible = ordered.slice(current * 6, current * 6 + 6)
  const firstVisible = current * 6 + 1
  const lastVisible = Math.min((current + 1) * 6, ordered.length)

  useEffect(() => {
    if (transition === 'idle') return
    const duration = transition === 'exiting' ? 360 : 470
    const timer = window.setTimeout(() => {
      if (transition === 'exiting') {
        setPage(nextPage)
        setTransition('entering')
      } else {
        setTransition('idle')
      }
    }, duration)
    return () => window.clearTimeout(timer)
  }, [nextPage, transition])

  function changePage(target: number) {
    if (transition !== 'idle' || target < 0 || target >= pages || target === current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPage(target)
      return
    }
    setDirection(target > current ? 'older' : 'newer')
    setNextPage(target)
    setTransition('exiting')
  }

  return <>
    <div className="history-table-wrap" aria-busy={transition !== 'idle'}>
    <table className={`history-table ${transition === 'exiting' ? 'is-exiting' : transition === 'entering' ? 'is-entering' : ''}`} data-direction={direction} key={current}>
      <caption className="sr-only">Tutti i campioni in ordine dal più recente. I campioni senza ora di acquisizione sono ordinati per ricezione e indicati come tali. Valori sospetti segnalati per campo.</caption>
      <thead><tr><th scope="col">Acquisizione / ricezione</th>{metrics.map(metric => <th key={metric.key} scope="col">{metric.name}</th>)}<th scope="col">Tempi e qualità</th></tr></thead>
      <tbody>{visible.map(row => <tr key={row.ingestion_id}>
        <th scope="row">{row.captured_at ? <time dateTime={row.captured_at}>{formatTime(row.captured_at)}</time> : <><span>Senza ora di acquisizione</span><br /><time dateTime={row.received_at}>Ricevuto {formatTime(row.received_at)}</time></>}</th>
        {metrics.map(metric => <td key={metric.key} data-label={metric.name}><Value row={row} metric={metric} /></td>)}
        <td className="sample-details" data-label="Tempi e qualità"><details><summary>Dettagli campione</summary>
          <p>Misura: {formatTime(row.measured_at)}.</p>
          <p>Ricezione: {formatTime(row.received_at)}.</p>
          {row.quality_flags.length ? row.quality_flags.map((flag, index) => <p key={index}>{metrics.find(metric => metric.key === flag.field)?.name}: {flag.label} · {flag.reason}</p>) : <p>Nessuna anomalia segnalata dal backend.</p>}
        </details></td>
      </tr>)}</tbody>
    </table>
    </div>
    {pages > 1 && <nav className="pagination" aria-label="Pagine dei campioni">
      <button disabled={current === 0 || transition !== 'idle'} onClick={() => changePage(current - 1)}>Più recenti</button>
      <p aria-live="polite">Pagina {current + 1} di {pages}<span className="pagination-range"> · Campioni {firstVisible}–{lastVisible} di {ordered.length}</span></p>
      <button disabled={current + 1 === pages || transition !== 'idle'} onClick={() => changePage(current + 1)}>Precedenti</button>
    </nav>}
  </>
}

function App() {
  useEffect(() => {
    document.title = 'MeteOlivelli — Il meteo a scuola'
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) canonical.href = 'https://meteolivelli.vercel.app/home'
  }, [])

  useBorderLight()
  const [period, setPeriod] = useState<ChartMode>('auto')
  const [pdfBusy, setPdfBusy] = useState(false)
  const [pdfMessage, setPdfMessage] = useState('')
  const queryPeriod = period === 'auto' ? '30g' : period
  const data = useWeather(queryPeriod, period === 'auto')
  const completeHistory = useCompleteHistory()
  const latest = data.latest
  const matchingHistory = data.period === queryPeriod && data.anchorToLatest === (period === 'auto')
  const historyLoading = !matchingHistory || !data.historyLoaded
  const rows = matchingHistory ? data.history : []
  const latestLoaded = data.latestLoaded
  const latestError = data.latestError
  const historyError = data.historyError
  // Cadenza e ancoraggio non sono ancora verificati, quindi la freschezza resta sconosciuta.
  const freshness = getFreshness(latest, data.checkedAt ?? 0, null)
  const stationStatus = !data.latestLoaded ? 'Caricamento delle misure…' : data.latestError ? 'Aggiornamento non riuscito' :
    freshness === 'empty' ? 'Nessuna misura disponibile' : freshness === 'delayed' ? 'Stazione in ritardo' :
      freshness === 'current' ? 'Misure aggiornate' : 'Freschezza non determinabile'

  async function downloadGraphsPdf() {
    if (pdfBusy) return
    setPdfBusy(true)
    setPdfMessage('Aggiornamento dei dati e preparazione del PDF…')
    try {
      const { rows: freshRows, until } = await readFreshChartData(period, new AbortController().signal)
      const generatedAt = new Date()
      const blob = await createPdfBlob(buildGraphsDocument(freshRows, period, until, generatedAt))
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = reportFilename('grafici', generatedAt)
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      setPdfMessage('PDF dei grafici scaricato.')
    } catch {
      setPdfMessage('PDF non disponibile: aggiornamento o generazione non riusciti. Riprova.')
    } finally {
      setPdfBusy(false)
    }
  }

  return <div className="site-shell">
    <a className="skip-link" href="#contenuto">Vai al contenuto</a>
    <header className="site-header">
      <a className="brand" href="/home"><span className="brand-symbol" aria-hidden="true">MO.</span>MeteOlivelli<span className="brand-index"> / 01</span></a>
      <a className="school-logo" href="/info"><img src="/logo-liceo-scientifico-stem-olivelli-pavia.png" alt="Liceo Olivelli — Scientifico + STEM" /></a>
      <div className="header-actions">
        <nav aria-label="Navigazione principale"><a href="/home" aria-current="page">Home</a><a href="/info">Informazioni</a><a href="/gioca">Gioca</a><a href="#history-title">Archivio <span aria-hidden="true">↗</span></a></nav>
        <ThemeToggle />
      </div>
    </header>
    <main id="contenuto" tabIndex={-1}>
      <p className="development-notice">Work in progress · Possibili dati presenti fittizi</p>
      <div className="hero">
        <Reveal><section className="intro" aria-labelledby="page-title">
          <p className="eyebrow"><span className="signal-mark" aria-hidden="true" /> Pavia · Stazione scolastica</p>
          <h1 id="page-title">Il meteo,<br />qui all’Olivelli<span className="title-stop">.</span></h1>
          <p className="hero-description">Uno sguardo fuori, un dato alla volta.<br />Temperatura, umidità e pressione, osservate dalla nostra scuola.</p>
          <a className="hero-link" href="#history-title">Esplora le misure <span aria-hidden="true">↗</span></a>
          <p className={`station-status ${latestError ? 'warning' : ''}`} role="status"><span className="status-dot" aria-hidden="true" />{stationStatus}</p>
          <p className="small freshness-note">{latest ? 'Ultima lettura disponibile. La freschezza della misura non è ancora verificabile.' : 'Le osservazioni appariranno appena saranno disponibili.'}</p>
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
        {latestError && <div className="error-message" role="alert">Non è stato possibile aggiornare le misure. Riproviamo automaticamente; gli eventuali valori visibili sono dell’ultima lettura riuscita.</div>}
        <div className="metric-grid">{metrics.map(metric => <article key={metric.key} className={`metric-card panel tone-${metric.tone}`}>
          <h3>{metric.name}</h3>
          <p className={`metric-value ${!latest || latest[metric.key] === null ? 'value-empty' : ''}`}>
            {!latestLoaded ? 'Caricamento…' : latest ? <Value row={latest} metric={metric} /> : latestError ? 'Lettura non disponibile' : 'Nessun dato disponibile'}
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
        {completeHistory.loading ? <p className="empty-state" role="status">Caricamento di tutta la cronologia…</p> : completeHistory.error ? <div className="warning" role="alert"><p>Cronologia completa temporaneamente non disponibile.</p><button onClick={completeHistory.retry}>Riprova</button></div> : completeHistory.rows.length ? <><p className="history-feedback" role="status">{completeHistory.rows.length} campioni registrati.</p><HistoryTable key="all-history" rows={completeHistory.rows} /></> : <p className="empty-state">Non risultano campioni registrati.</p>}
      </section></Reveal>
      <Reveal><ForecastSection /></Reveal>
      <Reveal><section className="panel about-section" aria-labelledby="about-title">
        <p className="eyebrow section-index">Il progetto / MeteOlivelli</p>
        <h2 id="about-title">Un progetto per osservare e imparare.</h2>
        <p className="secondary">MeteOlivelli è il progetto meteo del Liceo Teresio Olivelli di Pavia, realizzato da Pietro Giudici e Nicholas Borin. Attraverso Arduino GIGA R1 e i sensori della stazione, esploriamo come temperatura, umidità e pressione cambiano nel tempo.</p>
        <p className="reflection">Imparare non significa soltanto trovare risposte, ma anche scoprire nuove domande e comprendere quanto ci sia ancora da conoscere.</p>
      </section></Reveal>
    </main>
    <footer className="site-footer"><a className="school-logo footer-school-logo" href="/info"><img src="/logo-liceo-scientifico-stem-olivelli-pavia.png" alt="Liceo Olivelli — Scientifico + STEM" /></a><p>MeteOlivelli · Il meteo, visto da scuola.</p><p><a href="/info">Il progetto e la stazione</a> · <a href="/gioca">Gioca con il meteo</a> · <a href="/privacy">Privacy</a> · Aggiornamento automatico ogni 15 secondi a pagina visibile.</p></footer>
  </div>
}
export default App
