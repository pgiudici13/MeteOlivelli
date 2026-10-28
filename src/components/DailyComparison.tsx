import { formatCivilDay } from '../weather.ts'
import { displayUnit } from '../preferences.ts'
import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { useState } from 'react'
import { aggregatePeriod, shiftCivilDay } from '../daily-statistics.ts'
import type { DayStatistics, MetricStatistics } from '../daily-statistics.ts'
import { formatValue, metrics } from '../weather.ts'
import { comparisonDirection } from '../comparison-direction.ts'

type Mode = 'days' | 'weeks'

export function DailyComparison({ days, today }: { days: DayStatistics[]; today: string | null }) {
  usePreferences()
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
    <h3 id="daily-comparison-title">{translate("Confronta le osservazioni")}</h3>
    <div className="comparison-modes" role="group" aria-label={translate("Tipo di confronto")}>
      <button type="button" aria-pressed={mode === 'days'} onClick={() => setMode('days')}>{translate("Due giornate")}</button>
      <button type="button" aria-pressed={mode === 'weeks'} onClick={() => setMode('weeks')}>{translate("Due periodi di 7 giorni")}</button>
    </div>
    {translate(mode === 'days' ? <div className="comparison-selects">
      <label>{translate("Prima giornata ")}<select value={first?.key ?? ''} onChange={event => setFirstKey(event.target.value)} disabled={available.length < 2}>
          {translate(available.map(day => <option key={day.key} value={day.key}>{translate(formatCivilDay(day.key))}</option>))}
        </select>
      </label>
      <label>{translate("Seconda giornata ")}<select value={second?.key ?? ''} onChange={event => setSecondKey(event.target.value)} disabled={available.length < 2}>
          {translate(available.map(day => <option key={day.key} value={day.key}>{translate(formatCivilDay(day.key))}</option>))}
        </select>
      </label>
    </div> : today && periods ? <p className="secondary">{translate(shiftCivilDay(today, -13))} – {translate(shiftCivilDay(today, -7))} ({translate(periods[0].observedDays)}{translate("/7 giorni con misure) rispetto a ")}{translate(shiftCivilDay(today, -6))} – {translate(today)} ({translate(periods[1].observedDays)}/7).</p> : null)}
    {translate(!comparable ? <p className="small">{translate("Servono almeno due giornate diverse con osservazioni per effettuare il confronto.")}</p> : <div className="comparison-grid">{translate(metrics.map(metric => {
      const a: MetricStatistics | undefined = left?.[metric.key]
      const b: MetricStatistics | undefined = right?.[metric.key]
      const delta = a && b ? b.average - a.average : null
      const direction = delta === null ? null : comparisonDirection(delta)
      return <article className="comparison-card" key={metric.key}>
        <h4>{translate(metric.name)}</h4>
        {translate(a && b ? <>
          <p><span>{translate("Prima")}</span><strong>{translate(formatValue(a.average, metric.key))} {translate(displayUnit(metric.key))}</strong><small>{translate(a.count)}{translate(" campioni · ")}{translate(a.observedHours)}{translate(" ore con misure")}</small></p>
          <p><span>{translate("Seconda")}</span><strong>{translate(formatValue(b.average, metric.key))} {translate(displayUnit(metric.key))}</strong><small>{translate(b.count)}{translate(" campioni · ")}{translate(b.observedHours)}{translate(" ore con misure")}</small></p>
          <p className={`comparison-delta comparison-${direction!.tone}`}>
            <span className="comparison-direction" aria-label={translate(direction!.label)}>{translate(direction!.symbol)} {translate(direction!.label)}</span>
            <span>{translate("Differenza delle medie: ")}<strong>{translate(delta! > 0 && Math.round(delta! * 10) !== 0 ? '+' : '')}{translate(formatValue(delta!, metric.key, true))} {translate(displayUnit(metric.key))}</strong></span>
          </p>
        </> : <p className="small">{translate("Campioni insufficienti per confrontare questa misura.")}</p>)}
      </article>
    }))}</div>)}
    <p className="small">{translate("Le medie considerano solo i campioni realmente registrati (ponderati per numero nei periodi). Giorni e orari con osservazioni mancanti non vengono stimati: coperture diverse possono rendere i confronti poco rappresentativi.")}</p>
  </div>
}
