const measurementId = 'G-F2LRCD93NW'
const consentKey = 'meteolivelli-analytics-consent'

function consentExpired(decidedAt: number, now: number) {
  const decisionDate = new Date(decidedAt)
  const expiry = new Date(decisionDate)
  const day = decisionDate.getDate()
  expiry.setDate(1)
  expiry.setMonth(expiry.getMonth() + 6)
  const lastDay = new Date(expiry.getFullYear(), expiry.getMonth() + 1, 0).getDate()
  expiry.setDate(Math.min(day, lastDay))
  return now >= expiry.getTime()
}

export type AnalyticsConsent = 'granted' | 'denied' | null

export function readAnalyticsConsent(): AnalyticsConsent {
  try {
    const stored = window.localStorage.getItem(consentKey)
    if (!stored) return null
    const choice = JSON.parse(stored) as { value?: unknown; decidedAt?: unknown }
    if ((choice.value !== 'granted' && choice.value !== 'denied') || typeof choice.decidedAt !== 'number') {
      window.localStorage.removeItem(consentKey)
      return null
    }
    const now = Date.now()
    if (consentExpired(choice.decidedAt, now) || choice.decidedAt > now) {
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
    // Senza una scelta persistibile il tag non viene caricato.
    return false
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
  let saved = saveAnalyticsConsent('denied')
  if (!saved) {
    try {
      window.localStorage.removeItem(consentKey)
      saved = true
    } catch {
      saved = false
    }
  }
  window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=', 1)[0]?.trim()
    if (name?.startsWith('_ga')) document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
  }
  return saved
}

declare global {
  interface Window {
    dataLayer?: unknown[][]
    gtag?: (...args: unknown[]) => void
  }
}
