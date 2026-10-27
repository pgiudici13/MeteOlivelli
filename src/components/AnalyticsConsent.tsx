import { useEffect, useState } from 'react'
import { inject } from '@vercel/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { areAnalyticsEnabled, filterAnalyticsEvent, loadGoogleAnalytics, readAnalyticsConsent, revokeAnalyticsConsent, saveAnalyticsConsent, setAnalyticsTrackingEnabled, subscribeAnalyticsConsent } from '../analytics.ts'

export function AnalyticsConsent() {
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
    <button className="privacy-settings" type="button" onClick={() => setShowChoices(true)}>Preferenze statistiche</button>
    {showChoices && <section className="analytics-consent" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description">
      <div>
        <h2 id="analytics-consent-title">Preferenze statistiche</h2>
        <p id="analytics-consent-description">Google Analytics, Vercel Analytics e Speed Insights sono attivi per impostazione predefinita per misurare in forma aggregata l’uso e le prestazioni di MeteOlivelli. Puoi disattivarli o riattivarli qui in qualsiasi momento. <a href="/privacy">Leggi l’informativa privacy</a>.</p>
        {storageError && <p role="alert">Non riesco a salvare questa preferenza nel browser. La scelta vale per questa pagina fino al prossimo caricamento; verifica le impostazioni di archiviazione per conservarla.</p>}
      </div>
      <div className="analytics-consent-actions">
        {areAnalyticsEnabled(consent)
          ? <>
            <button type="button" onClick={() => choose(false)}>Disattiva statistiche</button>
            <button type="button" className="consent-accept" onClick={() => choose(true)}>Lascia attive</button>
          </>
          : <>
            <button type="button" onClick={() => setShowChoices(false)}>Resta disattivata</button>
            <button type="button" className="consent-accept" onClick={() => choose(true)}>Attiva statistiche</button>
          </>}
      </div>
    </section>}
    {areAnalyticsEnabled(consent) && <SpeedInsights beforeSend={filterAnalyticsEvent} />}
  </>
}
