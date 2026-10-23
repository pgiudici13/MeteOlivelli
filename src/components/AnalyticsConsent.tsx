import { useEffect, useState } from 'react'
import { inject } from '@vercel/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { loadGoogleAnalytics, readAnalyticsConsent, revokeAnalyticsConsent, saveAnalyticsConsent } from '../analytics.ts'

export function AnalyticsConsent() {
  const [consent, setConsent] = useState(readAnalyticsConsent)
  const [showChoices, setShowChoices] = useState(consent === null)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    if (consent === 'granted') {
      loadGoogleAnalytics()
      inject()
    }
  }, [consent])

  function choose(accepted: boolean) {
    if (!accepted && consent === 'granted') {
      if (revokeAnalyticsConsent()) window.location.reload()
      else {
        setConsent('denied')
        setStorageError(true)
      }
      return
    }
    const next = accepted ? 'granted' : 'denied'
    const saved = saveAnalyticsConsent(next)
    if (!saved) {
      setStorageError(true)
      if (!accepted) setConsent('denied')
      return
    }
    setStorageError(false)
    setConsent(next)
    setShowChoices(false)
  }

  return <>
    <button className="privacy-settings" type="button" onClick={() => setShowChoices(true)}>Preferenze statistiche</button>
    {showChoices && <section className="analytics-consent" aria-labelledby="analytics-consent-title" aria-describedby="analytics-consent-description">
      <div>
        <h2 id="analytics-consent-title">Statistiche facoltative</h2>
        <p id="analytics-consent-description">Google Analytics, Vercel Analytics e Speed Insights misurano l’uso e le prestazioni di MeteOlivelli. Restano disattivati finché non scegli “Accetta”. Puoi cambiare idea in qualsiasi momento da Preferenze statistiche. <a href="/privacy">Leggi l’informativa privacy</a>.</p>
        {storageError && <p role="alert">Non riesco a salvare la scelta nel browser. Le statistiche restano disattivate; controlla le impostazioni di archiviazione e riprova. Se stai revocando un consenso già dato, cancella i dati del sito e ricarica la pagina.</p>}
      </div>
      <div className="analytics-consent-actions">
        <button type="button" onClick={() => choose(false)}>Rifiuta</button>
        <button type="button" className="consent-accept" onClick={() => choose(true)}>Accetta</button>
      </div>
    </section>}
    {consent === 'granted' && <SpeedInsights />}
  </>
}
