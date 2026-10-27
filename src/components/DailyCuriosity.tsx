import { useEffect, useState } from 'react'
import { dailyCuriosity } from '../daily-curiosity.ts'

export function DailyCuriosity() {
  const [curiosity, setCuriosity] = useState(() => dailyCuriosity(new Date()))
  useEffect(() => {
    const refresh = () => setCuriosity(dailyCuriosity(new Date()))
    const interval = window.setInterval(refresh, 60000)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  return <section className="daily-curiosity panel" aria-labelledby="daily-curiosity-title">
    <p className="eyebrow section-index">05 / Una curiosità al giorno</p>
    <h2 id="daily-curiosity-title">Lo sapevi?</h2>
    <h3>{curiosity.question}</h3>
    <p className="daily-curiosity-answer">{curiosity.answer}</p>
    <p className="small">{curiosity.explanation}</p>
    <a href="/gioca">Scopri altre curiosità con il quiz <span aria-hidden="true">↗</span></a>
  </section>
}
