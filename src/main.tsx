import { initializeLanguage } from './i18n.ts'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AnalyticsConsent } from './components/AnalyticsConsent.tsx'
import { PageErrorBoundary } from './components/PageErrorBoundary.tsx'
import './index.css'
import { SiteRoute } from './SiteRoute.tsx'

void initializeLanguage().catch(() => {}).then(() => {
  createRoot(document.getElementById('root')!, {
    // Gli errori catturati hanno una schermata di recupero, senza dettagli nei log.
    onCaughtError: () => {},
  }).render(
    <StrictMode>
      <PageErrorBoundary><SiteRoute /></PageErrorBoundary>
      <AnalyticsConsent />
    </StrictMode>,
  )
})
