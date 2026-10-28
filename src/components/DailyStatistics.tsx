import { formatCivilDay } from '../weather.ts'
import { displayUnit } from '../preferences.ts'
import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { useMemo } from 'react'
import { collectDailyStatistics, collectRangeStatistics, monthExtremes } from '../daily-statistics.ts'
import { formatTime, formatValue, metrics } from '../weather.ts'
import type { Measurement } from '../weather.ts'
import { DailyComparison } from './DailyComparison.tsx'

export function DailyStatistics({ rows, serverUntil, loading, error, selectedRange }: { rows: Measurement[]; serverUntil: string | null; loading: boolean; error: boolean; selectedRange?: { start: number; end: number } | null }) {
  usePreferences()
  const summary = useMemo(() => serverUntil ? collectDailyStatistics(rows, serverUntil) : null, [rows, serverUntil])
  const rangeStats = useMemo(() => serverUntil && selectedRange ? collectRangeStatistics(rows, selectedRange, serverUntil) : null, [rows, serverUntil, selectedRange])
  const day = summary?.days.find(item => item.key === summary.today) ?? summary?.days[0]
  const monthly = summary ? monthExtremes(summary.days, summary.month) : null
  return <section className="daily-statistics panel" aria-labelledby="daily-stats-title">
    <p className="eyebrow section-index">{translate("Riepiloghi delle osservazioni")}</p>
    <h2 id="daily-stats-title">{translate("I numeri della giornata")}</h2>
    {translate(loading && !day ? <p className="small">{translate("Raccolta delle osservazioni in corso…")}</p> : !day ? <p className="small">{translate("Le statistiche appariranno quando saranno disponibili misure fisiche valide e datate.")}</p> : <>
      <p className="secondary">{translate(day.key === summary?.today ? 'Oggi' : 'Ultimo giorno con misure')} · {translate(formatCivilDay(day.key))}{translate(". Le statistiche riguardano soltanto i campioni disponibili.")}</p>
      <div className="daily-stats-grid">{translate(metrics.map(metric => {
        const stats = day.metrics[metric.key]
        return <article key={metric.key} className="daily-stat-card">
          <h3>{translate(metric.name)}</h3>
          {translate(stats ? <dl>
            <div><dt>{translate("Minimo")}</dt><dd>{translate(formatValue(stats.minimum, metric.key))} {translate(displayUnit(metric.key))}</dd></div>
            <div><dt>{translate("Massimo")}</dt><dd>{translate(formatValue(stats.maximum, metric.key))} {translate(displayUnit(metric.key))}</dd></div>
            <div><dt>{translate("Media")}</dt><dd>{translate(formatValue(stats.average, metric.key))} {translate(displayUnit(metric.key))}</dd></div>
          </dl> : <p className="small">{translate("Nessun valore valido.")}</p>)}
          {translate(stats && <p className="small">{translate(stats.count)} {translate(stats.count === 1 ? 'campione valido' : 'campioni validi')}{translate(" distribuiti in ")}{translate(stats.observedHours)} {translate(stats.observedHours === 1 ? 'ora distinta' : 'ore distinte')}.</p>)}
        </article>
      }))}</div>
      <p className="small">{translate("Intervallo osservato nella giornata: ")}{translate(formatTime(new Date(day.first).toISOString(), true))}–{translate(formatTime(new Date(day.last).toISOString(), true))}{translate(". Il numero di ore con campioni non equivale a una copertura continua della giornata.")}</p>
    </>)}
    <div className="monthly-extremes">
      <h3>{translate("Questo mese")}</h3>
      {translate(monthly ? <><p>{translate("Giornata mediamente più calda: ")}<strong>{translate(formatCivilDay(monthly.warmest.key))}</strong> · {translate(formatValue(monthly.warmest.metrics.temperature_c!.average, 'temperature_c'))}{' ' + displayUnit('temperature_c') + '.'}</p>
        <p>{translate("Giornata mediamente più fredda: ")}<strong>{translate(formatCivilDay(monthly.coldest.key))}</strong> · {translate(formatValue(monthly.coldest.metrics.temperature_c!.average, 'temperature_c'))}{' ' + displayUnit('temperature_c') + '.'}</p>
        <p className="small">{translate("Confronto fra ")}{translate(monthly.days)}{translate(" giornate con campioni validi di temperatura nel mese corrente; le medie non garantiscono osservazioni per l’intera giornata.")}</p></> : <p className="small">{translate("Non sono ancora disponibili giornate confrontabili nel mese corrente.")}</p>)}
    </div>
    {translate(selectedRange && <div className="range-statistics" aria-labelledby="range-statistics-title">
      <h3 id="range-statistics-title">{translate("Statistiche dell’intervallo personalizzato")}</h3>
      <p className="small">{translate("Dal ")}{translate(formatTime(new Date(selectedRange.start).toISOString()))}{translate(" al ")}{translate(formatTime(new Date(selectedRange.end).toISOString()))} · {translate(rangeStats?.samples ?? 0)}{translate(" campioni con almeno una grandezza valida.")}</p>
      <div className="daily-stats-grid">{translate(metrics.map(metric => {
        const stats = rangeStats?.metrics[metric.key]
        return <article key={metric.key} className="daily-stat-card">
          <h3>{translate(metric.name)}</h3>
          {translate(stats ? <><dl>
            <div><dt>{translate("Minimo")}</dt><dd>{translate(formatValue(stats.minimum, metric.key))} {translate(displayUnit(metric.key))}</dd></div>
            <div><dt>{translate("Massimo")}</dt><dd>{translate(formatValue(stats.maximum, metric.key))} {translate(displayUnit(metric.key))}</dd></div>
            <div><dt>{translate("Media")}</dt><dd>{translate(formatValue(stats.average, metric.key))} {translate(displayUnit(metric.key))}</dd></div>
          </dl><p className="small">{translate(stats.count)}{translate(" campioni · ")}{translate(stats.observedHours)}{translate(" ore distinte")}</p></> : <p className="small">{translate("Nessun valore valido nel periodo.")}</p>)}
        </article>
      }))}</div>
      <p className="small">{translate("Media dei soli campioni validi effettivamente registrati: le ore senza dati non vengono stimate.")}</p>
    </div>)}
    <DailyComparison days={summary?.days ?? []} today={summary?.today ?? null} />
    {translate(error && <p className="small" role="status">{translate("Aggiornamento dello storico non riuscito: gli eventuali riepiloghi si basano sui dati precedentemente caricati.")}</p>)}
    <p className="small">{translate("Data della misura fisica, se attestata; altrimenti data di acquisizione sul PC. Dati sintetici e valori sospetti esclusi.")}</p>
  </section>
}
