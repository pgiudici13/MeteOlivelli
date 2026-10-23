import { useEffect, useState } from 'react'
import { loadGoogleAnalytics, readAnalyticsConsent, revokeAnalyticsConsent, saveAnalyticsConsent } from '../analytics.ts'

export function AnalyticsConsent() {
  const [consent, setConsent] = useState(readAnalyticsConsent)
  const [showChoices, setShowChoices] = useState(consent === null)

  useEffect(() => {
    if (consent === 'granted') loadGoogleAnalytics()
  }, [consent])

  function choose(accepted: boolean) {
    if (!accepted && consent === 'granted') {
      revokeAnalyticsConsent()
      return
    }
    const next = accepted ? 'granted' : 'denied'
    saveAnalyticsConsent(next)
    setConsent(next)
    setShowChoices(false)
  }

  return <>
    <button className="privacy-settings" type="button" onClick={() => setShowChoices(true)}>Preferenze Google Analytics</button>
    {showChoices && <section className="analytics-consent" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description">
      <div>
        <h2 id="analytics-consent-title">Google Analytics (facoltativo)</h2>
        <p id="analytics-consent-description">Google Analytics ci aiuta a capire come viene usato MeteOlivelli. Resta disattivato finché non scegli “Accetta”. Puoi cambiare idea in qualsiasi momento da Preferenze Google Analytics.</p>
      </div>
      <div className="analytics-consent-actions">
        <button type="button" onClick={() => choose(false)}>Rifiuta</button>
        <button type="button" className="consent-accept" onClick={() => choose(true)}>Accetta</button>
      </div>
    </section>}
  </>
}
