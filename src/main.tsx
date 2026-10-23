import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { inject } from '@vercel/analytics'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { AnalyticsConsent } from './components/AnalyticsConsent.tsx'
import './index.css'
import { SiteRoute } from './SiteRoute.tsx'

inject()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteRoute />
    <AnalyticsConsent />
    <SpeedInsights />
  </StrictMode>,
)
