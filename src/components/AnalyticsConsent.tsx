import { useEffect, useState } from 'react'
import { inject } from '@vercel/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { areAnalyticsEnabled, loadGoogleAnalytics, readAnalyticsConsent, revokeAnalyticsConsent, saveAnalyticsConsent } from '../analytics.ts'

export function AnalyticsConsent() {
  const [consent, setConsent] = useState(readAnalyticsConsent)
  const [showChoices, setShowChoices] = useState(false)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    if (areAnalyticsEnabled(consent)) {
      loadGoogleAnalytics()
      inject()
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
        {storageError && <p role="alert">Non riesco a salvare questa preferenza nel browser. La scelta vale per questa visita; verifica le impostazioni di archiviazione per conservarla anche nelle visite successive.</p>}
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
    {areAnalyticsEnabled(consent) && <SpeedInsights />}
  </>
}
