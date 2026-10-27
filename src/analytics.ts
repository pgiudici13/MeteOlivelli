const measurementId = 'G-F2LRCD93NW'
const consentKey = 'meteolivelli-analytics-consent'
const publicHostname = 'meteolivelli.vercel.app'
let trackingEnabled = true

/** Valutato al momento dell'invio anche dagli script già caricati. */
export function filterAnalyticsEvent<T>(event: T): T | null {
  return trackingEnabled ? event : null
}

export function setAnalyticsTrackingEnabled(enabled: boolean) {
  trackingEnabled = enabled
  window['ga-disable-G-F2LRCD93NW'] = !enabled
  if (enabled) window.gtag?.('consent', 'update', { analytics_storage: 'granted' })
}

export function isGoogleAnalyticsHost(hostname: string) {
  return hostname === publicHostname
}

export type AnalyticsConsent = 'granted' | 'denied' | null

export function areAnalyticsEnabled(consent: AnalyticsConsent) {
  return consent !== 'denied'
}

export function readAnalyticsConsent(): AnalyticsConsent {
  try {
    const stored = window.localStorage.getItem(consentKey)
    if (!stored) return null
    const choice = JSON.parse(stored) as { value?: unknown }
    if (choice.value !== 'granted' && choice.value !== 'denied') {
      window.localStorage.removeItem(consentKey)
      return null
    }
    return choice.value
  } catch {
    return null
  }
}

export function saveAnalyticsConsent(consent: Exclude<AnalyticsConsent, null>) {
  try {
    window.localStorage.setItem(consentKey, JSON.stringify({ value: consent, decidedAt: Date.now() }))
    return true
  } catch {
    // Il comportamento predefinito resta attivo; la scelta vale per la sessione corrente.
    return false
  }
}

export function loadGoogleAnalytics() {
  // Le URL di deploy Vercel sono anteprime/versioni tecniche, non host pubblici
  // del sito: non inviare da lì hit al flusso GA4 di produzione.
  if (!isGoogleAnalyticsHost(window.location.hostname)) return
  if (document.querySelector(`script[data-google-analytics="${measurementId}"]`)) return

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js elabora l'oggetto Arguments; un array di rest non è equivalente.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  }
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.gtag('js', new Date())
  window.gtag('config', measurementId, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: false,
  })
  window.gtag('event', 'page_view', {
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname,
  })

  const script = document.createElement('script')
  script.async = true
  script.dataset.googleAnalytics = measurementId
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.append(script)
}

export function revokeAnalyticsConsent() {
  setAnalyticsTrackingEnabled(false)
  const saved = saveAnalyticsConsent('denied')
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=', 1)[0]?.trim()
    if (name?.startsWith('_ga')) document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
  }
  return saved
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    'ga-disable-G-F2LRCD93NW'?: boolean
  }
}
