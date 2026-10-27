import { useMemo } from 'react'
import { collectWeatherRecords } from '../weather-records.ts'
import { formatTime, formatValue, metrics } from '../weather.ts'
import type { Measurement } from '../weather.ts'

export function WeatherRecords({ rows, until, loading }: { rows: Measurement[]; until: string | null; loading: boolean }) {
  const records = useMemo(() => until ? collectWeatherRecords(rows, until) : {}, [rows, until])
  const any = Object.values(records).some(record => record && record.count > 0)
  return <section className="panel weather-records" aria-labelledby="records-title">
    <p className="eyebrow section-index">L'archivio in evidenza</p>
    <h2 id="records-title">I record della stazione</h2>
    <p className="secondary">Estremi osservati nei dati fisici finora disponibili. Sono record dell'archivio, non record meteorologici della città.</p>
    {loading && !any ? <p className="small">Lettura dell'archivio in corso…</p> : any ? <div className="daily-stats-grid">
      {metrics.map(metric => {
        const record = records[metric.key]
        return <article className="daily-stat-card" key={metric.key}>
          <h3>{metric.name}</h3>
          {record ? <dl>
            <div><dt>Minimo</dt><dd>{formatValue(record.minimum.value)} {metric.unit}<small>{formatTime(record.minimum.measuredAt)}</small></dd></div>
            <div><dt>Massimo</dt><dd>{formatValue(record.maximum.value)} {metric.unit}<small>{formatTime(record.maximum.measuredAt)}</small></dd></div>
          </dl> : <p className="small">Nessun dato valido.</p>}
          {record && <p className="small">{record.count} campioni validi per questa grandezza.</p>}
        </article>
      })}</div> : <p className="small">Nessun record disponibile: verranno mostrati quando arriveranno misurazioni fisiche valide e datate.</p>}
    <p className="small">I valori sospetti e i dati sintetici sono esclusi. Gli orari sono in Europe/Rome; la misura fisica ha precedenza sull'acquisizione sul PC.</p>
  </section>
}
