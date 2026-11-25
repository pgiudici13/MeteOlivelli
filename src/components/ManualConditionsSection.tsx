import { useEffect, useMemo, useState } from 'react'
import { conditionLabels, readManualConditions, type ManualConditions } from '../manual-conditions.ts'
import { translate } from '../i18n.ts'
import { collectDailyStatistics, dayKey } from '../daily-statistics.ts'
import { displayUnit, getLocale } from '../preferences.ts'
import { usePreferences } from '../use-preferences.ts'
import { formatTime, formatValue, type Measurement } from '../weather.ts'

type Props = { measurements: Measurement[]; serverUntil: string | null; loading: boolean; error: boolean }
type State = { rows: ManualConditions[]; loading: boolean; error: boolean }
const keys = ['cloud', 'rain', 'wind'] as const
const labels = { cloud: 'Cielo', rain: 'Intensità precipitazione', wind: 'Vento' }
export function ManualConditionsSection({ measurements, serverUntil, loading, error }: Props) {
  usePreferences()
  const [state, setState] = useState<State>({ rows: [], loading: true, error: false })
  useEffect(() => {
    let active = true
    let controller: AbortController | null = null
    const refresh = () => {
      if (document.visibilityState !== 'visible' || controller) return
      controller = new AbortController()
      void readManualConditions(controller.signal).then(rows => { if (active) setState({ rows, loading: false, error: false }) }).catch(() => { if (active) setState(previous => ({ ...previous, loading: false, error: true })) }).finally(() => { controller = null })
    }
    refresh()
    const timer = window.setInterval(refresh, 60000)
    document.addEventListener('visibilitychange', refresh); window.addEventListener('online', refresh)
    return () => { active = false; controller?.abort(); window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('online', refresh) }
  }, [])
  const paired = useMemo(() => {
    const days = serverUntil ? collectDailyStatistics(measurements, serverUntil).days : []
    const byDay = new Map(days.map(day => [day.key, day]))
    return state.rows.map(row => ({ row, day: byDay.get(dayKey(Date.parse(row.observed_at))) }))
  }, [state.rows, measurements, serverUntil])
  const latest = state.rows[0]
  const format = (n: number) => new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(n)
  const value = (n: number | undefined, unit: string) => n === undefined ? '—' : `${format(n)} ${unit}`
  return <section className="panel manual-conditions-section" aria-labelledby="manual-conditions-title" aria-busy={state.loading}>
    <p className="eyebrow section-index">{translate('Osservazioni manuali')}</p>
    <h2 id="manual-conditions-title">{translate('Cielo, pioggia e vento')}</h2>
    <p className="secondary">{translate('Condizioni compilate manualmente dalla scuola, separate dalle misure dei sensori e dalle previsioni.')}</p>
    {state.loading ? <p role="status">{translate('Caricamento delle osservazioni…')}</p> : state.error ? <p role="status">{translate('Osservazioni manuali temporaneamente non disponibili.')}</p> : !latest ? <p role="status">{translate('Nessuna osservazione manuale disponibile.')}</p> : <>
      <p className="small">{translate('Ultima osservazione manuale:')} <time dateTime={latest.observed_at}>{formatTime(latest.observed_at)}</time> · Europe/Rome</p>
      <dl className="manual-conditions-current">{keys.filter(key => key !== 'rain' || latest.phenomenon !== 'nessuna').map(key => <div key={key}><dt>{translate(labels[key])}</dt><dd>{translate(conditionLabels[latest[key]])}</dd></div>)}<div><dt>{translate('Fenomeno osservato')}</dt><dd>{latest.phenomenon === 'altro' ? latest.phenomenon_detail : translate(latest.phenomenon ? conditionLabels[latest.phenomenon] : 'Non indicato')}</dd></div></dl>
      <p className="small">{translate('Fenomeno osservato e inserito manualmente dalla scuola all’orario indicato; non è una previsione.')}</p>
      <details className="manual-conditions-history"><summary>{translate('Cronologia e confronto con i sensori')}</summary>
        <p className="small">{translate('Per ogni osservazione sono indicate le medie delle misure valide della stessa giornata in Europe/Rome. La media di oggi si aggiorna con le nuove misure disponibili; le ore senza campioni non sono stimate. Campioni sintetici e valori sospetti sono esclusi; il trattino indica un dato non disponibile. Il confronto è descrittivo e non dimostra causalità.')}</p>
        {loading ? <p role="status">{translate('Caricamento delle misure per il confronto…')}</p> : error ? <p role="status">{translate('Confronto temporaneamente non disponibile.')}</p> : <>
          <div className="manual-conditions-table"><table><thead><tr><th>{translate('Osservata')}</th>{keys.map(key => <th key={key}>{translate(labels[key])}</th>)}<th>{translate('Fenomeno osservato')}</th><th>{translate('Temperatura media')}</th><th>{translate('Umidità media')}</th><th>{translate('Pressione media')}</th></tr></thead><tbody>{paired.map(({ row, day }, index) => <tr key={`${row.observed_at}-${index}`}><td>{formatTime(row.observed_at)}</td>{keys.map(key => <td key={key}>{key === 'rain' && row.phenomenon === 'nessuna' ? '—' : translate(conditionLabels[row[key]])}</td>)}<td>{row.phenomenon === 'altro' ? row.phenomenon_detail : translate(row.phenomenon ? conditionLabels[row.phenomenon] : 'Non indicato')}</td><td>{day?.metrics.temperature_c ? `${formatValue(day.metrics.temperature_c.average, 'temperature_c')} ${displayUnit('temperature_c')}` : '—'}</td><td>{value(day?.metrics.humidity_pct?.average, '%')}</td><td>{value(day?.metrics.pressure_hpa?.average, 'hPa')}</td></tr>)}</tbody></table></div>
          <h3>{translate('Riepilogo per condizioni')}</h3><p className="small">{translate('Medie delle giornate associate alle osservazioni; il numero indica quante medie giornaliere contribuiscono. Una giornata può comparire più volte.')}</p>
          <div className="manual-conditions-table"><table><thead><tr><th>{translate('Condizione')}</th><th>{translate('Osservazioni')}</th><th>{translate('Umidità media')}</th><th>{translate('Pressione media')}</th></tr></thead><tbody>{keys.flatMap(key => [...new Set(state.rows.filter(row => key !== 'rain' || row.phenomenon !== 'nessuna').map(row => row[key]))].map(category => {
            const entries = paired.filter(item => item.row[key] === category && (key !== 'rain' || item.row.phenomenon !== 'nessuna'))
            const mean = (metric: 'humidity_pct' | 'pressure_hpa') => { const values = entries.flatMap(({ day }) => day?.metrics[metric] ? [day.metrics[metric].average] : []); return values.length ? `${format(values.reduce((a, b) => a + b, 0) / values.length)} ${metric === 'humidity_pct' ? '%' : 'hPa'} (n=${values.length})` : '—' }
            return <tr key={`${key}-${category}`}><td>{translate(labels[key])}: {translate(conditionLabels[category])}</td><td>{entries.length}</td><td>{mean('humidity_pct')}</td><td>{mean('pressure_hpa')}</td></tr>
          }))}</tbody></table></div>
        </>}
      </details>
    </>}
  </section>
}
