import { usePageMotion } from './use-page-motion.ts'
import { useEffect } from 'react'
import App from './App.tsx'
import { InfoPage } from './pages/InfoPage.tsx'
import { PrivacyPage } from './pages/PrivacyPage.tsx'
import { QuizPage } from './pages/QuizPage.tsx'

export function SiteRoute() {
  usePageMotion()
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/home' && pathname !== '/info' && pathname !== '/privacy' && pathname !== '/gioca') document.title = 'Pagina non trovata — MeteOlivelli'
  }, [pathname])

  if (pathname === '/' || pathname === '/home') return <App />
  if (pathname === '/info') return <InfoPage />
  if (pathname === '/privacy') return <PrivacyPage />
  if (pathname === '/gioca') return <QuizPage />
  return <main className="route-not-found"><h1>Pagina non trovata</h1><p>La pagina richiesta non è disponibile.</p><a href="/home">Torna alla Home</a></main>
}
