import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { useEffect, useState } from 'react'
import { inject } from '@vercel/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { areAnalyticsEnabled, filterAnalyticsEvent, loadGoogleAnalytics, readAnalyticsConsent, revokeAnalyticsConsent, saveAnalyticsConsent, setAnalyticsTrackingEnabled, subscribeAnalyticsConsent } from '../analytics.ts'

export function AnalyticsConsent() {
  usePreferences()
  const [consent, setConsent] = useState(readAnalyticsConsent)
  const [showChoices, setShowChoices] = useState(false)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => subscribeAnalyticsConsent(choice => {
    setConsent(choice)
    setStorageError(false)
  }), [])

  useEffect(() => {
    setAnalyticsTrackingEnabled(areAnalyticsEnabled(consent))
    if (areAnalyticsEnabled(consent)) {
      loadGoogleAnalytics()
      inject({ beforeSend: filterAnalyticsEvent })
    }
  }, [consent])

  function choose(accepted: boolean) {
    if (!accepted) {
      const saved = revokeAnalyticsConsent()
      setConsent('denied')
      setStorageError(!saved)
      if (saved) window.location.reload()
      return
    }
    setAnalyticsTrackingEnabled(true)
    const saved = saveAnalyticsConsent('granted')
    if (!saved) {
      setStorageError(true)
      setConsent('granted')
      setShowChoices(true)
      return
    } else {
      setStorageError(false)
    }
    setConsent('granted')
    setShowChoices(false)
  }

  return <>
    <button className="privacy-settings" type="button" onClick={() => setShowChoices(true)}>{translate("Preferenze statistiche")}</button>
    {translate(showChoices && <section className="analytics-consent" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description">
      <div>
        <h2 id="analytics-consent-title">{translate("Preferenze statistiche")}</h2>
        <p id="analytics-consent-description">{translate("Google Analytics, Vercel Analytics e Speed Insights sono attivi per impostazione predefinita per misurare l’uso e le prestazioni di MeteOlivelli. Per il quiz registriamo avvio e punteggio finale, senza le risposte. Puoi disattivare o riattivare le statistiche qui in qualsiasi momento. ")}<a href="/privacy">{translate("Leggi l’informativa privacy")}</a>.</p>
        {translate(storageError && <p role="alert">{translate("Non riesco a salvare questa preferenza nel browser. La scelta vale per questa pagina fino al prossimo caricamento; verifica le impostazioni di archiviazione per conservarla.")}</p>)}
      </div>
      <div className="analytics-consent-actions">
        {translate(areAnalyticsEnabled(consent)
          ? <>
            <button type="button" onClick={() => choose(false)}>{translate("Disattiva statistiche")}</button>
            <button type="button" className="consent-accept" onClick={() => choose(true)}>{translate("Lascia attive")}</button>
          </>
          : <>
            <button type="button" onClick={() => setShowChoices(false)}>{translate("Resta disattivata")}</button>
            <button type="button" className="consent-accept" onClick={() => choose(true)}>{translate("Attiva statistiche")}</button>
          </>)}
      </div>
    </section>)}
    {translate(areAnalyticsEnabled(consent) && <SpeedInsights beforeSend={filterAnalyticsEvent} />)}
  </>
}
