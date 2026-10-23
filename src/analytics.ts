const measurementId = 'G-F2LRCD93NW'
const consentKey = 'meteolivelli-analytics-consent'

export type AnalyticsConsent = 'granted' | 'denied' | null

export function readAnalyticsConsent(): AnalyticsConsent {
  try {
    const value = window.localStorage.getItem(consentKey)
    return value === 'granted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export function saveAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>) {
  try {
    window.localStorage.setItem(consentKey, consent)
  } catch {
    // Senza una scelta persistibile il tag non viene caricato.
  }
}

export function loadGoogleAnalytics() {
  if (document.querySelector(`script[data-google-analytics="${measurementId}"]`)) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(...args: unknown[]) { window.dataLayer?.push(args) }
  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  })

  const script = document.createElement('script')
  script.async = true
  script.dataset.googleAnalytics = measurementId
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.append(script)
}

export function revokeAnalyticsConsent() {
  saveAnalyticsConsent('denied')
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=', 1)[0]?.trim()
    if (name?.startsWith('_ga')) document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
  }
  window.location.reload()
}

declare global {
  interface Window {
    dataLayer?: unknown[][]
    gtag?: (...args: unknown[]) => void
  }
}
