export const languages = ['it', 'en', 'es', 'fr', 'de'] as const
export type Language = typeof languages[number]
export type TemperatureUnit = 'C' | 'F'
export type Preferences = { language: Language; temperatureUnit: TemperatureUnit }
export const preferenceKey = 'meteolivelli-display'
export const locales: Record<Language, string> = { it: 'it-IT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' }
const initial: Preferences = { language: 'it', temperatureUnit: 'C' }
let current: Preferences = initial
const listeners = new Set<() => void>()

/** Primo idioma supportato nella lista ordinata del dispositivo; italiano come ripiego. */
export function detectDeviceLanguage(preferredLanguages: readonly string[]): Language {
  for (const locale of preferredLanguages) {
    const language = locale.trim().toLowerCase().split(/[-_]/)[0]
    if (languages.includes(language as Language)) return language as Language
  }
  return 'it'
}

export function parsePreferences(raw: string | null, fallbackLanguage: Language = 'it'): Preferences {
  const fallback = { ...initial, language: fallbackLanguage }
  try {
    const value: unknown = JSON.parse(raw ?? 'null')
    if (!value || typeof value !== 'object') return fallback
    const entry = value as Record<string, unknown>
    return { language: languages.includes(entry.language as Language) ? entry.language as Language : fallbackLanguage, temperatureUnit: entry.temperatureUnit === 'F' ? 'F' : 'C' }
  } catch { return fallback }
}
export const getPreferences = () => current
export const getLocale = () => locales[current.language]
export function subscribePreferences(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function updatePreferences(value: Preferences, persist = true) {
  if (current.language === value.language && current.temperatureUnit === value.temperatureUnit) return
  current = value
  const documentTarget = (globalThis as { document?: { documentElement: { lang: string } } }).document
  if (documentTarget) documentTarget.documentElement.lang = value.language
  if (persist) {
    try { window.localStorage.setItem(preferenceKey, JSON.stringify(value)) } catch { /* La scelta resta attiva nella pagina. */ }
  }
  for (const listener of listeners) listener()
}
export function temperatureValue(value: number | null, unit: TemperatureUnit, difference = false): number | null {
  return value === null ? null : unit === 'F' ? value * 9 / 5 + (difference ? 0 : 32) : value
}
export function displayValue(value: number | null, metric?: string, difference = false) {
  return metric === 'temperature_c' ? temperatureValue(value, current.temperatureUnit, difference) : value
}
export function displayUnit(metric: string) {
  return metric === 'temperature_c' ? `°${current.temperatureUnit}` : metric === 'humidity_pct' ? '%' : 'hPa'
}
