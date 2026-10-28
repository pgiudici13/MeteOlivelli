import { displayUnit } from '../preferences.ts'
import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { useMemo } from 'react'
import { collectWeatherRecords } from '../weather-records.ts'
import { formatTime, formatValue, metrics } from '../weather.ts'
import type { Measurement } from '../weather.ts'

export function WeatherRecords({ rows, until, loading }: { rows: Measurement[]; until: string | null; loading: boolean }) {
  usePreferences()
  const records = useMemo(() => until ? collectWeatherRecords(rows, until) : {}, [rows, until])
  const any = Object.values(records).some(record => record && record.count > 0)
  return <section className="panel weather-records" aria-labelledby="records-title">
    <p className="eyebrow section-index">{translate("L'archivio in evidenza")}</p>
    <h2 id="records-title">{translate("I record della stazione")}</h2>
    <p className="secondary">{translate("Estremi osservati nei dati fisici finora disponibili. Sono record dell'archivio, non record meteorologici della città.")}</p>
    {translate(loading && !any ? <p className="small">{translate("Lettura dell'archivio in corso…")}</p> : any ? <div className="daily-stats-grid">
      {translate(metrics.map(metric => {
        const record = records[metric.key]
        return <article className="daily-stat-card" key={metric.key}>
          <h3>{translate(metric.name)}</h3>
          {translate(record ? <dl>
            <div><dt>{translate("Minimo")}</dt><dd>{translate(formatValue(record.minimum.value, metric.key))} {translate(displayUnit(metric.key))}<small>{translate(formatTime(record.minimum.measuredAt))}</small></dd></div>
            <div><dt>{translate("Massimo")}</dt><dd>{translate(formatValue(record.maximum.value, metric.key))} {translate(displayUnit(metric.key))}<small>{translate(formatTime(record.maximum.measuredAt))}</small></dd></div>
          </dl> : <p className="small">{translate("Nessun dato valido.")}</p>)}
          {translate(record && <p className="small">{translate(record.count)}{translate(" campioni validi per questa grandezza.")}</p>)}
        </article>
      }))}</div> : <p className="small">{translate("Nessun record disponibile: verranno mostrati quando arriveranno misurazioni fisiche valide e datate.")}</p>)}
    <p className="small">{translate("I valori sospetti e i dati sintetici sono esclusi. Gli orari sono in Europe/Rome; la misura fisica ha precedenza sull'acquisizione sul PC.")}</p>
  </section>
}
