import { displayUnit } from '../preferences.ts'
import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { horizons, methodNames } from '../forecast.ts'
import { useForecast } from '../use-forecast.ts'
import { formatTime, formatValue, metrics } from '../weather.ts'

export function ForecastSection() {
  usePreferences()
  const forecast = useForecast()
  const forecastCards = (forecast.run?.horizons ?? horizons).map((horizon, index) => {
    const result = forecast.run?.horizons[index]
    return <article className="forecast-card" key={horizon.hours}>
      <h3>{translate(horizon.label)}</h3>
      <dl className="forecast-estimates">{translate(metrics.map(metric => {
        const estimate = result?.estimates.find(item => item.metric === metric.key)
        const expired = estimate?.validUntil ? forecast.now >= Date.parse(estimate.validUntil) : false
        const available = estimate?.value !== null && estimate?.value !== undefined && !expired && !forecast.error
        return <div className="forecast-estimate" key={metric.key}>
          <dt>{translate(metric.name)}</dt>
          <dd>{translate(available ? <>
            <span className="forecast-value">{translate(formatValue(estimate.value, metric.key))} <span>{translate(displayUnit(metric.key))}</span></span>
            <p className="small">{translate("Per ")}<time dateTime={estimate.target!}>{translate(formatTime(estimate.target))}</time></p>
            <details className="forecast-evidence"><summary>{translate("Metodo ed errore osservato")}</summary>
              <p>{translate(estimate.method && methodNames[estimate.method])}.</p>
              <p>{translate("Errore medio assoluto: ")}{translate(formatValue(estimate.mae, metric.key, true))} {translate(displayUnit(metric.key))}{translate(", su ")}{translate(estimate.cases)}{translate(" confronti successivi alla selezione del metodo. Riferimento “ultimo valore”: ")}{translate(formatValue(estimate.baselineMae, metric.key, true))} {translate(displayUnit(metric.key))}.</p>
              <p>{translate("È un errore storico, non una garanzia o una probabilità di riuscita.")}</p>
              <p>{translate("Ultima osservazione usata: ")}{translate(formatTime(estimate.origin))}{translate(". Previsione valida fino alle ")}{translate(formatTime(estimate.validUntil, true))}{translate("; può scadere prima dell’orario previsto se non arrivano nuove misure.")}</p>
            </details>
          </> : <>
            <span className="forecast-unavailable">{translate(!forecast.loaded ? 'Valutazione in corso…' : 'Previsione non disponibile')}</span>
            <p className="small">{translate(forecast.error ? 'Lettura o calcolo non riusciti.' : expired ? 'Previsione scaduta: servono nuove osservazioni.' : estimate?.reason)}</p>
          </>)}</dd>
        </div>
      }))}</dl>
    </article>
  })
  return <section className="panel forecast-section" aria-labelledby="forecast-title" aria-busy={!forecast.loaded}>
    <p className="eyebrow section-index">{translate("04 / Previsioni meteo")}</p>
    <h2 id="forecast-title">{translate("Previsioni meteo MeteOlivelli")}</h2>
    <p className="secondary">{translate("Le previsioni di temperatura, umidità e pressione sono mostrate separatamente dalle osservazioni della stazione.")}</p>
    <p className="small">{translate("La previsione a 24 ore indica il valore atteso tra 24 ore, non le massime e minime del giorno. Questo modello non prevede nuvole, pioggia o altri fenomeni atmosferici.")}</p>
    <div role="status" className="small">{translate(!forecast.loaded ? 'Valutazione dello storico…' : forecast.error ? 'Lettura o calcolo non riusciti. Nuovo tentativo automatico.' : 'Il modello usa l’orario di acquisizione sul PC per ordinare i campioni. Non certifica l’ora fisica della misura; servono comunque uno storico e confronti sufficienti.')}</div>
    <div className="forecast-grid">{translate(forecastCards)}</div>
    <details className="forecast-method"><summary>{translate("Come vengono calcolate le previsioni")}</summary>
      <p>{translate("Il modello confronta ultimo valore, tendenza recente smorzata e ciclo di 24 ore corretto. Selezione e verifica usano periodi separati: nessun dato futuro viene usato per calcolare una previsione passata. Ogni grandezza e orizzonte ha una propria verifica.")}</p>
      <p>{translate("Campioni mancanti, sospetti o troppo vecchi non producono numeri sostitutivi. L’ultimo valore è usato come riferimento: se nessun metodo lo supera nel periodo di selezione, il modello ritira il risultato invece di ripetere la misura come previsione. Uno storico insufficiente o un modello che peggiora rispetto al riferimento resta non disponibile.")}</p>
      {translate(forecast.run && <p>{translate("Versione: ")}{translate(forecast.run.version)}{translate(". Valutazione: ")}{translate(formatTime(forecast.run.generatedAt))} · {translate(forecast.run.inputCount)}{translate(" campioni con orario di acquisizione PC considerati. Fonte: stazione MeteOlivelli.")}</p>)}
    </details>
  </section>
}
