import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { useEffect, useState } from 'react'
import { dailyCuriosity } from '../daily-curiosity.ts'

export function DailyCuriosity() {
  usePreferences()
  const [curiosity, setCuriosity] = useState(() => dailyCuriosity(new Date()))
  useEffect(() => {
    const refresh = () => setCuriosity(dailyCuriosity(new Date()))
    const interval = window.setInterval(refresh, 60000)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  return <section className="daily-curiosity panel" aria-labelledby="daily-curiosity-title">
    <p className="eyebrow section-index">{translate("05 / Una curiosità al giorno")}</p>
    <h2 id="daily-curiosity-title">{translate("Lo sapevi?")}</h2>
    <h3>{translate(curiosity.question)}</h3>
    <p className="daily-curiosity-answer">{translate(curiosity.answer)}</p>
    <p className="small">{translate(curiosity.explanation)}</p>
    <a href="/gioca">{translate("Scopri altre curiosità con il quiz ")}<span aria-hidden="true">↗</span></a>
  </section>
}
