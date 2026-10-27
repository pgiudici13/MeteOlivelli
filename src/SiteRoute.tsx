import { usePageMotion } from './use-page-motion.ts'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import App from './App.tsx'
import { BrandMark } from './components/BrandMark.tsx'

const InfoPage = lazy(() => import('./pages/InfoPage.tsx').then(({ InfoPage }) => ({ default: InfoPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.tsx').then(({ PrivacyPage }) => ({ default: PrivacyPage })))
const QuizPage = lazy(() => import('./pages/QuizPage.tsx').then(({ QuizPage }) => ({ default: QuizPage })))
const DataAdminPage = lazy(() => import('./pages/DataAdminPage.tsx').then(({ DataAdminPage }) => ({ default: DataAdminPage })))

// Dentro Suspense: inizializza gli ingressi solo dopo il caricamento della pagina.
function PageMotion({ children }: { children: ReactNode }) {
  usePageMotion()
  return children
}

export function SiteRoute() {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/home' && pathname !== '/info' && pathname !== '/privacy' && pathname !== '/gioca' && pathname !== '/data') document.title = 'Pagina non trovata — MeteOlivelli'
  }, [pathname])

  if (pathname === '/' || pathname === '/home') return <PageMotion><App /></PageMotion>
  if (pathname === '/info') return <Suspense fallback={<p role="status">Caricamento pagina…</p>}><PageMotion><InfoPage /></PageMotion></Suspense>
  if (pathname === '/privacy') return <Suspense fallback={<p role="status">Caricamento pagina…</p>}><PageMotion><PrivacyPage /></PageMotion></Suspense>
  if (pathname === '/gioca') return <Suspense fallback={<p role="status">Caricamento pagina…</p>}><PageMotion><QuizPage /></PageMotion></Suspense>
  if (pathname === '/data') return <Suspense fallback={<p role="status">Caricamento pagina…</p>}><PageMotion><DataAdminPage /></PageMotion></Suspense>
  return <PageMotion><main className="route-not-found">
    <a className="route-not-found-brand" href="/home" aria-label="MeteOlivelli, torna alla home"><BrandMark />MeteOlivelli<span> / 01</span></a>
    <section className="route-not-found-content" aria-labelledby="not-found-title">
      <p className="eyebrow">404 <span aria-hidden="true">/</span> PAGINA NON TROVATA</p>
      <h1 id="not-found-title">Qui non c’è<br />nessuna misura.</h1>
      <p>Il collegamento potrebbe essere cambiato o l’indirizzo non è corretto.</p>
      <a className="route-not-found-link" href="/home">Torna alla home <span aria-hidden="true">↗</span></a>
    </section>
    <footer><span>Pavia · Stazione scolastica</span><a href="/info">Il progetto</a></footer>
  </main></PageMotion>
}
