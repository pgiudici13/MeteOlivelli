import { detectDeviceLanguage, getPreferences, languages, preferenceKey, parsePreferences, updatePreferences, type Language } from './preferences.ts'
export type Catalogue = Record<string, string>
const catalogues: Partial<Record<Language, Catalogue>> = {}
const loaders = {
  en: () => import('./locales/en.ts'), es: () => import('./locales/es.ts'),
  fr: () => import('./locales/fr.ts'), de: () => import('./locales/de.ts'),
}
const pending = new Map<Language, Promise<void>>()
const patterns = new Map<Language, { pattern: RegExp; target: string; slots: number[] }[]>()
const normalize = (value: string) => value.replace(/\s+/g, ' ').trim()
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function installCatalogue(language: Language, catalogue: Catalogue) {
  catalogues[language] = catalogue
  patterns.set(language, Object.entries(catalogue).filter(([key]) => /\{\d+\}/.test(key)).sort(([a], [b]) => b.replace(/\{\d+\}/g, '').length - a.replace(/\{\d+\}/g, '').length).map(([key, target]) => {
    const slots: number[] = []
    const source = key.split(/(\{\d+\})/).map(part => /^\{\d+\}$/.test(part) ? (slots.push(Number(part.slice(1, -1))), '(.*?)') : escape(part)).join('')
    return { pattern: new RegExp(`^${source}$`, 'u'), target, slots }
  }))
}
export async function loadLanguage(language: Language) {
  if (language === 'it' || catalogues[language]) return
  let request = pending.get(language)
  if (!request) {
    request = loaders[language]().then(module => { installCatalogue(language, module.default) }).finally(() => pending.delete(language))
    pending.set(language, request)
  }
  await request
}
let selection = 0
export async function selectLanguage(language: Language) {
  const ticket = ++selection
  await loadLanguage(language)
  if (ticket === selection) updatePreferences({ ...getPreferences(), language })
}
export async function initializeLanguage() {
  const deviceLanguage = () => detectDeviceLanguage([...navigator.languages, navigator.language])
  let saved = parsePreferences(null, deviceLanguage())
  try { saved = parsePreferences(window.localStorage.getItem(preferenceKey), deviceLanguage()) } catch { /* Storage facoltativo. */ }
  try { await loadLanguage(saved.language) } catch { saved = { ...saved, language: 'it' } }
  updatePreferences(saved, false)
  window.addEventListener('storage', event => {
    try { if (event.storageArea !== window.localStorage) return } catch { return }
    if (event.key !== preferenceKey && event.key !== null) return
    const value = parsePreferences(event.newValue, deviceLanguage())
    const ticket = ++selection
    void loadLanguage(value.language).then(() => { if (ticket === selection) updatePreferences(value, false) }).catch(() => {})
  })
}

/** Traduce soltanto testo di presentazione; numeri, oggetti React e identificatori restano intatti. */
export function translate<T>(value: T): T {
  return translateInLanguage(value, getPreferences().language)
}
export function translateInLanguage<T>(value: T, language: Language): T {
  if (Array.isArray(value)) return value.map(item => translateInLanguage(item, language)) as T
  if (typeof value !== 'string' || language === 'it') return value
  return translateString(value, language, 0) as T
}
function translateString(value: string, language: Language, depth: number): string {
  if (depth > 6 || !/\p{L}/u.test(value)) return value
  const key = normalize(value)
  const catalogue = catalogues[language]
  if (!key || !catalogue) return value
  const prefix = value.match(/^\s*/)?.[0] ?? ''
  const suffix = value.match(/\s*$/)?.[0] ?? ''
  if (Object.hasOwn(catalogue, key)) return prefix + catalogue[key] + suffix
  for (const { pattern, target, slots } of patterns.get(language) ?? []) {
    const match = key.match(pattern)
    if (!match) continue
    const parameters = new Map(slots.map((slot, index) => [slot, translateString(match[index + 1], language, depth + 1)]))
    return prefix + target.replace(/\{(\d+)\}/g, (_, slot: string) => parameters.get(Number(slot)) ?? '') + suffix
  }
  return value
}
export function isLanguage(value: string): value is Language { return languages.includes(value as Language) }

/** Segnaposto espliciti per messaggi composti, senza interpretare i dati inseriti. */
export function message(key: string, ...parameters: (string | number)[]) {
  const language = getPreferences().language
  const template = catalogues[language]?.[normalize(key)] ?? key
  return template.replace(/\{(\d+)\}/g, (_, index: string) => String(parameters[Number(index)] ?? ''))
}
