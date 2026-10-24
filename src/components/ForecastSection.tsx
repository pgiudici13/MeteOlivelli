import { horizons, methodNames } from '../forecast.ts'
import { useForecast } from '../use-forecast.ts'
import { formatTime, formatValue, metrics } from '../weather.ts'

export function ForecastSection() {
  const forecast = useForecast()
  return <section className="panel forecast-section" aria-labelledby="forecast-title" aria-busy={!forecast.loaded}>
    <p className="eyebrow section-index">04 / Stime statistiche</p>
    <h2 id="forecast-title">Stime sperimentali MeteOlivelli</h2>
    <p className="secondary">Temperatura, umidità e pressione stimate separatamente dalle serie disponibili. Le simulazioni basate su campioni fittizi sono sempre indicate e non rappresentano previsioni della stazione reale.</p>
    <p className="small">La giornata indica il valore tra 24 ore, non le massime e minime del giorno. Queste stime statistiche locali non prevedono sole, pioggia o fenomeni atmosferici.</p>
    <div role="status" className="small">{!forecast.loaded ? 'Valutazione dello storico…' : forecast.error ? 'Lettura o calcolo non riusciti. Nuovo tentativo automatico.' : forecast.run?.dataKind === 'synthetic' ? 'SIMULAZIONE: risultati calcolati su dati fittizi e orari di scenario; non sono osservazioni né previsioni meteo reali.' : 'I dati fittizi e gli orari di sola acquisizione sul PC sono esclusi dalle stime fisiche.'}</div>
    <div className="forecast-grid">{(forecast.run?.horizons ?? horizons).map((horizon, index) => {
      const result = forecast.run?.horizons[index]
      return <article className="forecast-card" key={horizon.hours}>
        <h3>{horizon.label}</h3>
        <dl className="forecast-estimates">{metrics.map(metric => {
          const estimate = result?.estimates.find(item => item.metric === metric.key)
          const expired = estimate?.validUntil ? forecast.now >= Date.parse(estimate.validUntil) : false
          const available = estimate?.value !== null && estimate?.value !== undefined && !expired && !forecast.error
          return <div className="forecast-estimate" key={metric.key}>
            <dt>{metric.name}</dt>
            <dd>{available ? <>
              <span className="forecast-value">{formatValue(estimate.value)} <span>{metric.unit}</span></span>
              <p className="small">Per <time dateTime={estimate.target!}>{formatTime(estimate.target)}</time></p>
              <details className="forecast-evidence"><summary>Metodo ed errore osservato</summary>
                <p>{estimate.method && methodNames[estimate.method]}.</p>
                <p>Errore medio assoluto: {formatValue(estimate.mae)} {metric.unit}, su {estimate.cases} confronti successivi alla selezione del metodo. Riferimento “ultimo valore”: {formatValue(estimate.baselineMae)} {metric.unit}.</p>
                <p>È un errore storico, non una garanzia o una probabilità di riuscita.</p>
                <p>{forecast.run?.dataKind === 'synthetic' ? 'Ultimo orario di scenario' : 'Ultima misura fisica'}: {formatTime(estimate.origin)}. Stima valida fino alle {formatTime(estimate.validUntil, true)}; può scadere prima dell’orario previsto se non arrivano nuove misure.</p>
              </details>
            </> : <>
              <span className="forecast-unavailable">{!forecast.loaded ? 'Valutazione in corso…' : 'Stima non disponibile'}</span>
              <p className="small">{forecast.error ? 'Lettura o calcolo non riusciti.' : expired ? 'Stima scaduta: servono nuove osservazioni.' : estimate?.reason}</p>
            </>}</dd>
          </div>
        })}</dl>
      </article>
    })}</div>
    <details className="forecast-method"><summary>Come vengono calcolate le stime</summary>
      <p>Il modello confronta ultimo valore, tendenza recente smorzata e ciclo di 24 ore corretto. Selezione e verifica usano periodi separati: nessun dato futuro viene usato per calcolare una previsione passata. Ogni grandezza e orizzonte ha una propria verifica.</p>
      <p>Campioni mancanti, sospetti o troppo vecchi non producono numeri sostitutivi. La simulazione usa solo campioni fittizi e orizzonti compatibili con la loro cadenza; non va interpretata come previsione della stazione o bollettino meteo. Uno storico insufficiente o un modello che peggiora rispetto al riferimento resta indisponibile.</p>
      {forecast.run && <p>Versione: {forecast.run.version}. Valutazione: {formatTime(forecast.run.generatedAt)} · {forecast.run.inputCount} {forecast.run.dataKind === 'synthetic' ? 'campioni fittizi di scenario' : 'osservazioni fisiche datate'} considerati. Fonte: {forecast.run.dataKind === 'synthetic' ? 'simulazione locale' : 'stazione MeteOlivelli'}.</p>}
    </details>
  </section>
}
