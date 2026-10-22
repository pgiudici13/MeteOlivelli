import { useState } from 'react'
import { HistoryChart } from './components/HistoryChart.tsx'
import { Reveal } from './components/Reveal.tsx'
import { useWeather } from './use-weather.ts'
import { formatTime, formatValue, getFreshness, isSuspect, metrics, periods } from './weather.ts'
import type { Measurement, Period } from './weather.ts'
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
  const ordered = [...rows].reverse()
  const pages = Math.ceil(ordered.length / 6)
  const current = Math.min(page, Math.max(0, pages - 1))
  const visible = ordered.slice(current * 6, current * 6 + 6)
  return <>
    <table className="history-table">
      <caption className="sr-only">Campioni in ordine dal più recente, orari di acquisizione sul PC, Europe/Rome. Valori sospetti segnalati per campo.</caption>
      <thead><tr><th scope="col">Acquisizione PC</th>{metrics.map(metric => <th key={metric.key} scope="col">{metric.name}</th>)}<th scope="col">Tempi e qualità</th></tr></thead>
      <tbody>{visible.map(row => <tr key={row.ingestion_id}>
        <th scope="row"><time dateTime={row.captured_at ?? undefined}>{formatTime(row.captured_at)}</time></th>
        {metrics.map(metric => <td key={metric.key} data-label={metric.name}><Value row={row} metric={metric} /></td>)}
        <td className="sample-details" data-label="Tempi e qualità"><details><summary>Dettagli campione</summary>
          <p>Misura: {formatTime(row.measured_at)}.</p>
          <p>Ricezione: {formatTime(row.received_at)}.</p>
          {row.quality_flags.length ? row.quality_flags.map((flag, index) => <p key={index}>{metrics.find(metric => metric.key === flag.field)?.name}: {flag.label} · {flag.reason}</p>) : <p>Nessuna anomalia segnalata dal backend.</p>}
        </details></td>
      </tr>)}</tbody>
    </table>
    {pages > 1 && <nav className="pagination" aria-label="Pagine dei campioni">
      <button disabled={current === 0} onClick={() => setPage(current - 1)}>Più recenti</button>
      <p aria-live="polite">Pagina {current + 1} di {pages}</p>
      <button disabled={current + 1 === pages} onClick={() => setPage(current + 1)}>Precedenti</button>
    </nav>}
  </>
}

function App() {
  const [period, setPeriod] = useState<Period>('24h')
  const data = useWeather(period)
  const latest = data.latest
  const historyLoading = data.period !== period || !data.historyLoaded
  const rows = data.period === period ? data.history : []
  const latestLoaded = data.latestLoaded
  const latestError = data.latestError
  const historyError = data.historyError
  // Cadenza e ancoraggio non sono ancora verificati, quindi la freschezza resta sconosciuta.
  const freshness = getFreshness(latest, data.checkedAt ?? 0, null)
  const stationStatus = !data.latestLoaded ? 'Caricamento delle misure…' : data.latestError ? 'Aggiornamento non riuscito' :
    freshness === 'empty' ? 'Nessuna misura disponibile' : freshness === 'delayed' ? 'Stazione in ritardo' :
      freshness === 'current' ? 'Misure aggiornate' : 'Freschezza non determinabile'

  return <div className="site-shell">
    <a className="skip-link" href="#contenuto">Vai al contenuto</a>
    <header className="site-header panel">
      <a className="brand" href="#contenuto">MeteOlivelli</a>
      <p>La stazione della nostra scuola</p>
    </header>
    <main id="contenuto" tabIndex={-1}>
      <div className="notice"><span className="notice-dot" aria-hidden="true" /><p>Progetto in sviluppo · osservazioni della stazione, quando disponibili.</p></div>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">Stazione scolastica / MeteOlivelli</p>
        <h1 id="page-title">Il meteo a scuola.</h1>
        <p className={`station-status ${latestError ? 'warning' : ''}`} role="status">{stationStatus}</p>
        <p className="secondary">{latest ? 'Orari e cadenza devono essere verificati per determinare la freschezza.' : 'Temperatura, umidità e pressione dalla nostra stazione scolastica.'}</p>
      </section>
      <section className="latest-section" aria-labelledby="latest-title" aria-busy={!latestLoaded}>
        <div className="section-heading"><h2 id="latest-title">Le ultime misure</h2>
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
      </section>
      <Reveal><section className="panel history-section" aria-labelledby="history-title">
        <h2 id="history-title">Andamento delle misure</h2>
        <p className="secondary">{rows.length ? `${rows.length} campioni disponibili nel periodo selezionato.` : 'Lo storico mostra i campioni disponibili per il periodo selezionato.'} Orari di acquisizione sul PC · Europe/Rome.</p>
        <div className="period-picker" role="group" aria-label="Periodo dello storico">{periods.map(item => <button key={item.value} aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>{item.label}</button>)}</div>
        <div className="history-feedback" role="status" aria-live="polite">{historyLoading ? 'Caricamento dello storico…' : historyError ? 'Storico non aggiornato. Nuovo tentativo automatico.' : rows.length ? `${periods.find(item => item.value === period)?.label}: ${rows.length} campioni.` : latest ? 'Nessuna misura nel periodo selezionato.' : 'L’archivio non contiene ancora misure in questo periodo.'}</div>
        <div className="chart-grid" aria-busy={historyLoading}>{metrics.map(metric => <HistoryChart key={metric.key} metric={metric} rows={rows} loading={historyLoading} error={historyError && !historyLoading} />)}</div>
        <p className="small">Le linee collegano i campioni validi disponibili. I valori assenti o “probabili errati” interrompono il tracciato e restano consultabili nella cronologia.</p>
      </section></Reveal>
      <Reveal><section className="panel chronology-section" aria-labelledby="chronology-title">
        <h2 id="chronology-title">Cronologia</h2>
        <p className="secondary">Campioni del periodo selezionato, dal più recente. Unità: °C, %, hPa.</p>
        {historyError && !historyLoading && <p className="warning">Aggiornamento dello storico non riuscito. Eventuali campioni conservati dall’ultima lettura.</p>}
        {historyLoading ? <p className="empty-state">Caricamento dei campioni…</p> : rows.length ? <HistoryTable key={period} rows={rows} /> : <p className="empty-state">{historyError ? 'Cronologia temporaneamente non disponibile.' : 'Nessun campione da mostrare per questo periodo.'}</p>}
      </section></Reveal>
      <Reveal><section className="panel forecast-section" aria-labelledby="forecast-title">
        <h2 id="forecast-title">Stime sperimentali MeteOlivelli</h2>
        <p className="secondary">Separate dalle osservazioni della stazione. Il modello locale deve ancora essere valutato su uno storico datato idoneo.</p>
        <div className="forecast-grid">{['+30 minuti', '+1 ora', 'Giornata'].map(horizon => <article className="forecast-card" key={horizon}>
          <h3>{horizon}</h3><p>Stima non disponibile</p><p className="small">Orizzonte non validato · nessuna previsione generata.</p>
        </article>)}</div>
      </section></Reveal>
      <Reveal><section className="panel about-section" aria-labelledby="about-title">
        <h2 id="about-title">Un progetto per osservare e imparare.</h2>
        <p className="secondary">MeteOlivelli è il progetto meteo del Liceo Teresio Olivelli di Pavia, realizzato da Pietro Giudici e Nicholas Borin. Attraverso Arduino GIGA R1 e i sensori della stazione, esploriamo come temperatura, umidità e pressione cambiano nel tempo.</p>
        <p className="reflection">Imparare non significa soltanto trovare risposte, ma anche scoprire nuove domande e comprendere quanto ci sia ancora da conoscere.</p>
      </section></Reveal>
    </main>
    <footer className="site-footer"><p>MeteOlivelli · Il meteo, visto da scuola.</p><p>Aggiornamento automatico ogni 15 secondi a pagina visibile.</p></footer>
  </div>
}
export default App
