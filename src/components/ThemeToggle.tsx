import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const storageKey = 'meteolivelli-theme'

function getSavedTheme(): Theme | null {
  try {
    const value = window.localStorage.getItem(storageKey)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeToggle() {
  usePreferences()
  const [savedTheme, setSavedTheme] = useState<Theme | null>(getSavedTheme)
  const [systemTheme, setSystemTheme] = useState<Theme>(getSystemTheme)
  const theme = savedTheme ?? systemTheme

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const updateSystemTheme = () => setSystemTheme(media.matches ? 'light' : 'dark')
    media.addEventListener('change', updateSystemTheme)
    return () => media.removeEventListener('change', updateSystemTheme)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (themeColor) themeColor.content = theme === 'light' ? '#f7f5f2' : '#101010'
    const favicon = document.querySelector<HTMLLinkElement>('link[data-site-favicon]')
    if (favicon) favicon.href = theme === 'light' ? '/favicon-light.svg?v=4' : '/favicon-dark.svg?v=4'
    const brandMark = document.querySelector<HTMLImageElement>('.brand-mark')
    if (brandMark) brandMark.src = theme === 'light' ? '/brand-mark-light.png' : '/brand-mark-dark.png'
  }, [theme])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setSavedTheme(nextTheme)
    try {
      window.localStorage.setItem(storageKey, nextTheme)
    } catch {
      // La scelta vale comunque per la pagina corrente se lo storage non è disponibile.
    }
  }

  return <button
    className="theme-toggle"
    type="button"
    role="switch"
    aria-label={translate("Tema chiaro")}
    aria-checked={theme === 'light'}
    title={translate(theme === 'light' ? 'Passa al tema scuro' : 'Passa al tema chiaro')}
    onClick={toggleTheme}
  >
    <span aria-hidden="true">{translate(theme === 'light' ? '☼' : '☾')}</span>
  </button>
}
