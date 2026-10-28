import { useState } from 'react'
import { translate, selectLanguage } from '../i18n.ts'
import { getPreferences, languages, updatePreferences } from '../preferences.ts'
import { usePreferences } from '../use-preferences.ts'

const names = { it: 'Italiano', en: 'English', es: 'Español', fr: 'Français', de: 'Deutsch' }
const flags = { it: '🇮🇹', en: '🇬🇧', es: '🇪🇸', fr: '🇫🇷', de: '🇩🇪' }

export function DisplayPreferences() {
  const { language, temperatureUnit } = usePreferences()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  return <div className="display-preferences">
    <div className="language-picker" role="group" aria-label={translate('Lingua del sito')} aria-busy={loading}>
      {languages.map(code => <button type="button" key={code} aria-pressed={language === code} lang={code} aria-label={names[code]} title={names[code]} onClick={() => {
        setError(false); setLoading(true)
        void selectLanguage(code).catch(() => setError(true)).finally(() => setLoading(false))
      }}><span aria-hidden="true">{flags[code]}</span><span className="language-code" aria-hidden="true">{code.toUpperCase()}</span></button>)}
    </div>
    <div className="temperature-picker" role="group" aria-label={translate('Unità della temperatura')}>
      {(['C', 'F'] as const).map(unit => <button type="button" key={unit} aria-label={unit === 'C' ? 'Celsius' : 'Fahrenheit'} aria-pressed={temperatureUnit === unit} onClick={() => updatePreferences({ ...getPreferences(), temperatureUnit: unit })}>°{unit}</button>)}
    </div>
    {error && <p className="display-preferences-error" role="alert">{translate('Lingua non disponibile. Riprova.')}</p>}
  </div>
}

export function SiteLanguageBar() {
  usePreferences()
  return <div id="site-language" className="site-language-bar" tabIndex={-1}>
    <span>{translate('Lingua del sito')}</span>
    <DisplayPreferences />
  </div>
}
