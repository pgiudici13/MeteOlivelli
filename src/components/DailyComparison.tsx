import { useState } from 'react'
import { aggregatePeriod, shiftCivilDay } from '../daily-statistics.ts'
import type { DayStatistics, MetricStatistics } from '../daily-statistics.ts'
import { formatValue, metrics } from '../weather.ts'
import { comparisonDirection } from '../comparison-direction.ts'

type Mode = 'days' | 'weeks'

export function DailyComparison({ days, today }: { days: DayStatistics[]; today: string | null }) {
  const [mode, setMode] = useState<Mode>('days')
  const [firstKey, setFirstKey] = useState('')
  const [secondKey, setSecondKey] = useState('')
  const available = days.slice(0, 90)
  const first = available.find(day => day.key === firstKey) ?? available[1] ?? available[0]
  const second = available.find(day => day.key === secondKey) ?? available[0]
  const periods = today ? [
    aggregatePeriod(days, shiftCivilDay(today, -13), shiftCivilDay(today, -7)),
    aggregatePeriod(days, shiftCivilDay(today, -6), today),
  ] : null
  const left = mode === 'days' ? first?.metrics : periods?.[0].metrics
  const right = mode === 'days' ? second?.metrics : periods?.[1].metrics
  const comparable = mode === 'weeks' ? Boolean(today) : Boolean(first && second && first.key !== second.key)

  return <div className="daily-comparison" aria-labelledby="daily-comparison-title">
    <h3 id="daily-comparison-title">Confronta le osservazioni</h3>
    <div className="comparison-modes" role="group" aria-label="Tipo di confronto">
      <button type="button" aria-pressed={mode === 'days'} onClick={() => setMode('days')}>Due giornate</button>
      <button type="button" aria-pressed={mode === 'weeks'} onClick={() => setMode('weeks')}>Due periodi di 7 giorni</button>
    </div>
    {mode === 'days' ? <div className="comparison-selects">
      <label>Prima giornata
        <select value={first?.key ?? ''} onChange={event => setFirstKey(event.target.value)} disabled={available.length < 2}>
          {available.map(day => <option key={day.key} value={day.key}>{day.label}</option>)}
        </select>
      </label>
      <label>Seconda giornata
        <select value={second?.key ?? ''} onChange={event => setSecondKey(event.target.value)} disabled={available.length < 2}>
          {available.map(day => <option key={day.key} value={day.key}>{day.label}</option>)}
        </select>
      </label>
    </div> : today && periods ? <p className="secondary">{shiftCivilDay(today, -13)} – {shiftCivilDay(today, -7)} ({periods[0].observedDays}/7 giorni con misure) rispetto a {shiftCivilDay(today, -6)} – {today} ({periods[1].observedDays}/7).</p> : null}
    {!comparable ? <p className="small">Servono almeno due giornate diverse con osservazioni per effettuare il confronto.</p> : <div className="comparison-grid">{metrics.map(metric => {
      const a: MetricStatistics | undefined = left?.[metric.key]
      const b: MetricStatistics | undefined = right?.[metric.key]
      const delta = a && b ? b.average - a.average : null
      const direction = delta === null ? null : comparisonDirection(delta)
      return <article className="comparison-card" key={metric.key}>
        <h4>{metric.name}</h4>
        {a && b ? <>
          <p><span>Prima</span><strong>{formatValue(a.average)} {metric.unit}</strong><small>{a.count} campioni</small></p>
          <p><span>Seconda</span><strong>{formatValue(b.average)} {metric.unit}</strong><small>{b.count} campioni</small></p>
          <p className={`comparison-delta comparison-${direction!.tone}`}>
            <span className="comparison-direction" aria-label={direction!.label}>{direction!.symbol} {direction!.label}</span>
            <span>Differenza delle medie: <strong>{delta! > 0 && Math.round(delta! * 10) !== 0 ? '+' : ''}{formatValue(delta!)} {metric.unit}</strong></span>
          </p>
        </> : <p className="small">Campioni insufficienti per confrontare questa misura.</p>}
      </article>
    })}</div>}
    <p className="small">Le medie considerano solo i campioni realmente registrati (ponderati per numero nei periodi). Giorni e orari con osservazioni mancanti non vengono stimati: coperture diverse possono rendere i confronti poco rappresentativi.</p>
  </div>
}
