import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AnalyticsConsent } from './components/AnalyticsConsent.tsx'
import './index.css'
import { SiteRoute } from './SiteRoute.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteRoute />
    <AnalyticsConsent />
  </StrictMode>,
)
