import { useMemo } from 'react'
import { collectDailyStatistics, monthExtremes } from '../daily-statistics.ts'
import { formatTime, formatValue, metrics } from '../weather.ts'
import type { Measurement } from '../weather.ts'
import { DailyComparison } from './DailyComparison.tsx'

export function DailyStatistics({ rows, serverUntil, loading, error }: { rows: Measurement[]; serverUntil: string | null; loading: boolean; error: boolean }) {
  const summary = useMemo(() => serverUntil ? collectDailyStatistics(rows, serverUntil) : null, [rows, serverUntil])
  const day = summary?.days.find(item => item.key === summary.today) ?? summary?.days[0]
  const monthly = summary ? monthExtremes(summary.days, summary.month) : null
  return <section className="daily-statistics panel" aria-labelledby="daily-stats-title">
    <p className="eyebrow section-index">Riepiloghi delle osservazioni</p>
    <h2 id="daily-stats-title">I numeri della giornata</h2>
    {loading && !day ? <p className="small">Raccolta delle osservazioni in corso…</p> : !day ? <p className="small">Le statistiche appariranno quando saranno disponibili misure fisiche valide e datate.</p> : <>
      <p className="secondary">{day.key === summary?.today ? 'Oggi' : 'Ultimo giorno con misure'} · {day.label}. Le statistiche riguardano soltanto i campioni disponibili.</p>
      <div className="daily-stats-grid">{metrics.map(metric => {
        const stats = day.metrics[metric.key]
        return <article key={metric.key} className="daily-stat-card">
          <h3>{metric.name}</h3>
          {stats ? <dl>
            <div><dt>Minimo</dt><dd>{formatValue(stats.minimum)} {metric.unit}</dd></div>
            <div><dt>Massimo</dt><dd>{formatValue(stats.maximum)} {metric.unit}</dd></div>
            <div><dt>Media</dt><dd>{formatValue(stats.average)} {metric.unit}</dd></div>
          </dl> : <p className="small">Nessun valore valido.</p>}
          {stats && <p className="small">{stats.count} {stats.count === 1 ? 'campione valido' : 'campioni validi'}</p>}
        </article>
      })}</div>
      <p className="small">Intervallo osservato nella giornata: {formatTime(new Date(day.first).toISOString(), true)}–{formatTime(new Date(day.last).toISOString(), true)}. Non indica necessariamente copertura continua.</p>
    </>}
    <div className="monthly-extremes">
      <h3>Questo mese</h3>
      {monthly ? <><p>Giornata mediamente più calda: <strong>{monthly.warmest.label}</strong> · {formatValue(monthly.warmest.metrics.temperature_c!.average)} °C.</p>
        <p>Giornata mediamente più fredda: <strong>{monthly.coldest.label}</strong> · {formatValue(monthly.coldest.metrics.temperature_c!.average)} °C.</p>
        <p className="small">Confronto fra {monthly.days} giornate con campioni validi di temperatura nel mese corrente; le medie non garantiscono osservazioni per l’intera giornata.</p></> : <p className="small">Non sono ancora disponibili giornate confrontabili nel mese corrente.</p>}
    </div>
    <DailyComparison days={summary?.days ?? []} today={summary?.today ?? null} />
    {error && <p className="small" role="status">Aggiornamento dello storico non riuscito: gli eventuali riepiloghi si basano sui dati precedentemente caricati.</p>}
    <p className="small">Data della misura fisica, se attestata; altrimenti data di acquisizione sul PC. Dati sintetici e valori sospetti esclusi.</p>
  </section>
}
