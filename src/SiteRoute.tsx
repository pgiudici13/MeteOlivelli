import { usePageMotion } from './use-page-motion.ts'
import { lazy, Suspense, useEffect } from 'react'
import App from './App.tsx'

const InfoPage = lazy(() => import('./pages/InfoPage.tsx').then(({ InfoPage }) => ({ default: InfoPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.tsx').then(({ PrivacyPage }) => ({ default: PrivacyPage })))
const QuizPage = lazy(() => import('./pages/QuizPage.tsx').then(({ QuizPage }) => ({ default: QuizPage })))

export function SiteRoute() {
  usePageMotion()
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/home' && pathname !== '/info' && pathname !== '/privacy' && pathname !== '/gioca') document.title = 'Pagina non trovata — MeteOlivelli'
  }, [pathname])

  if (pathname === '/' || pathname === '/home') return <App />
  if (pathname === '/info') return <Suspense fallback={<p role="status">Caricamento pagina…</p>}><InfoPage /></Suspense>
  if (pathname === '/privacy') return <Suspense fallback={<p role="status">Caricamento pagina…</p>}><PrivacyPage /></Suspense>
  if (pathname === '/gioca') return <Suspense fallback={<p role="status">Caricamento pagina…</p>}><QuizPage /></Suspense>
  return <main className="route-not-found"><h1>Pagina non trovata</h1><p>La pagina richiesta non è disponibile.</p><a href="/home">Torna alla Home</a></main>
}
