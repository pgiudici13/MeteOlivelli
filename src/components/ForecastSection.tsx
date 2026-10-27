import { horizons, methodNames } from '../forecast.ts'
import { useForecast } from '../use-forecast.ts'
import { formatTime, formatValue, metrics } from '../weather.ts'

export function ForecastSection() {
  const forecast = useForecast()
  const forecastCards = (forecast.run?.horizons ?? horizons).map((horizon, index) => {
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
              <p>Ultima misura fisica: {formatTime(estimate.origin)}. Previsione valida fino alle {formatTime(estimate.validUntil, true)}; può scadere prima dell’orario previsto se non arrivano nuove misure.</p>
            </details>
          </> : <>
            <span className="forecast-unavailable">{!forecast.loaded ? 'Valutazione in corso…' : 'Previsione non disponibile'}</span>
            <p className="small">{forecast.error ? 'Lettura o calcolo non riusciti.' : expired ? 'Previsione scaduta: servono nuove osservazioni.' : estimate?.reason}</p>
          </>}</dd>
        </div>
      })}</dl>
    </article>
  })
  return <section className="panel forecast-section" aria-labelledby="forecast-title" aria-busy={!forecast.loaded}>
    <p className="eyebrow section-index">04 / Previsioni meteo</p>
    <h2 id="forecast-title">Previsioni meteo MeteOlivelli</h2>
    <p className="secondary">Le previsioni di temperatura, umidità e pressione sono mostrate separatamente dalle osservazioni della stazione.</p>
    <p className="small">La previsione a 24 ore indica il valore atteso tra 24 ore, non le massime e minime del giorno. Questo modello non prevede sole, pioggia o altri fenomeni atmosferici.</p>
    <div role="status" className="small">{!forecast.loaded ? 'Valutazione dello storico…' : forecast.error ? 'Lettura o calcolo non riusciti. Nuovo tentativo automatico.' : 'Le previsioni della stazione richiedono osservazioni fisiche datate e uno storico verificabile. Gli orari di sola acquisizione sul PC non sono sufficienti.'}</div>
    <div className="forecast-grid">{forecastCards}</div>
    <details className="forecast-method"><summary>Come vengono calcolate le previsioni</summary>
      <p>Il modello confronta ultimo valore, tendenza recente smorzata e ciclo di 24 ore corretto. Selezione e verifica usano periodi separati: nessun dato futuro viene usato per calcolare una previsione passata. Ogni grandezza e orizzonte ha una propria verifica.</p>
      <p>Campioni mancanti, sospetti o troppo vecchi non producono numeri sostitutivi. L’ultimo valore è usato come riferimento: se nessun metodo lo supera nel periodo di selezione, il modello ritira il risultato invece di ripetere la misura come previsione. Uno storico insufficiente o un modello che peggiora rispetto al riferimento resta non disponibile.</p>
      {forecast.run && <p>Versione: {forecast.run.version}. Valutazione: {formatTime(forecast.run.generatedAt)} · {forecast.run.inputCount} osservazioni fisiche datate considerate. Fonte: stazione MeteOlivelli.</p>}
    </details>
  </section>
}
