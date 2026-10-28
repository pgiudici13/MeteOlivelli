import { getPreferences } from './preferences.ts'
import { translateInLanguage } from './i18n.ts'

/** Localizza solo i campi testuali di pdfmake; stile, SVG e dati restano invariati. */
export function localizePdf<T>(document: T): T {
  const { language } = getPreferences()
  const translate = (value: string) => translateInLanguage(value, language)
  function visit(value: unknown, key = ''): unknown {
    if (typeof value === 'string') return ['text', 'title', 'subject', 'note', 'provenance'].includes(key) ? translate(value) : value
    if (typeof value === 'function') return (...args: unknown[]) => visit(value(...args))
    if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? translate(item) : visit(item))
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, visit(item, name)]))
    return value
  }
  return visit(document) as T
}
