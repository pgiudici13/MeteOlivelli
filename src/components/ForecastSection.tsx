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
            <details className="forecast-evidence"><summary>{translate("Come è stimato questo valore")}</summary>
              <p>{translate(estimate.method && methodNames[estimate.method])}.</p>
              {estimate.method === 'provider' || estimate.method === 'local-adjustment' ? <p>{translate(estimate.method === 'local-adjustment' ? "La lettura recente della stazione calibra con cautela il valore previsto; l’effetto diminuisce con il tempo e l’orizzonte." : "Il valore segue l’andamento meteorologico orario previsto per Pavia; non richiede uno storico minimo della stazione.")}</p> : <>
                <p>{translate("Errore medio assoluto: ")}{translate(formatValue(estimate.mae, metric.key, true))} {translate(displayUnit(metric.key))}{translate(", su ")}{translate(estimate.cases)}{translate(" confronti successivi alla selezione del metodo. Riferimento “ultimo valore”: ")}{translate(formatValue(estimate.baselineMae, metric.key, true))} {translate(displayUnit(metric.key))}.</p>
                <p>{translate("È un errore storico, non una garanzia o una probabilità di riuscita.")}</p>
              </>}
              <p>{translate(estimate.lastObservationId ? "Ultima osservazione usata: " : "Dati orari aggiornati: ")}{translate(formatTime(estimate.origin))}{translate(estimate.lastObservationId ? ". Previsione valida fino alle " : ". Valori attesi per ")}{estimate.lastObservationId ? translate(formatTime(estimate.validUntil, true)) : translate(formatTime(estimate.target))}{estimate.lastObservationId && translate("; la correzione locale decade progressivamente.")}</p>
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
    <div role="status" className="small">{translate(!forecast.loaded ? 'Caricamento delle previsioni…' : forecast.error ? 'Previsione temporaneamente non disponibile; nuovo tentativo automatico.' : 'Le stime orarie sono riferite a Pavia. Le letture recenti della stazione possono applicare una correzione limitata; l’orario di acquisizione sul PC non certifica l’ora fisica della misura.')}</div>
    <div className="forecast-grid">{translate(forecastCards)}</div>
    <details className="forecast-method"><summary>{translate("Come vengono calcolate le previsioni")}</summary>
      <p>{translate("La previsione oraria per Pavia fornisce la base anche quando lo storico scolastico è breve. Una lettura reale recente e confrontabile può correggere lievemente ogni grandezza; il contributo si attenua con il tempo e non sostituisce i dati meteorologici previsti.")}</p>
      <p>{translate("Campioni mancanti, sospetti o troppo vecchi non correggono la stima. Senza una previsione oraria disponibile il modello locale verificato resta un ripiego e può indicare che lo storico non basta. Le previsioni sono stime, non garanzie, e descrivono temperatura, umidità e pressione senza prevedere pioggia o altri fenomeni.")}</p>
      {translate(forecast.run && <p>{translate("Ultimo aggiornamento: ")}{translate(formatTime(forecast.run.generatedAt))}{translate(". Campioni fisici nello storico consultato: ")}{translate(forecast.run.inputCount)}{translate(". Le ore sono interpretate in Europe/Rome e tengono conto del ciclo giornaliero previsto.")}</p>)}
    </details>
  </section>
}
