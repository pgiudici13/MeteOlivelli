import { SiteLanguageBar } from './components/DisplayPreferences.tsx'
import { translate } from './i18n.ts'
import { usePreferences } from './use-preferences.ts'
import { usePageMotion } from './use-page-motion.ts'
import { lazy, Suspense, useEffect, type ReactNode } from 'react'
import App from './App.tsx'
import { BrandMark } from './components/BrandMark.tsx'
import { ScrollProgress } from './components/ScrollProgress.tsx'
import { CursorRing } from './components/CursorRing.tsx'

const InfoPage = lazy(() => import('./pages/InfoPage.tsx').then(({ InfoPage }) => ({ default: InfoPage })))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage.tsx').then(({ PrivacyPage }) => ({ default: PrivacyPage })))
const QuizPage = lazy(() => import('./pages/QuizPage.tsx').then(({ QuizPage }) => ({ default: QuizPage })))
const DataAdminPage = lazy(() => import('./pages/DataAdminPage.tsx').then(({ DataAdminPage }) => ({ default: DataAdminPage })))

// Dentro Suspense: inizializza gli ingressi solo dopo il caricamento della pagina.
function PageMotion({ children }: { children: ReactNode }) {
  usePageMotion()
  return <><span id="page-top" tabIndex={-1} className="page-top-anchor" /><ScrollProgress /><CursorRing />{children}</>
}

export function SiteRoute() {
  const preferences = usePreferences()
  const pathname = window.location.pathname.replace(/\/$/, '') || '/'

  useEffect(() => {
    if (pathname !== '/' && pathname !== '/home' && pathname !== '/info' && pathname !== '/privacy' && pathname !== '/gioca' && pathname !== '/data') document.title = translate('Pagina non trovata — MeteOlivelli')
  }, [pathname, preferences])

  if (pathname === '/' || pathname === '/home') return <PageMotion><App /></PageMotion>
  if (pathname === '/info') return <Suspense fallback={<p role="status">{translate("Caricamento pagina…")}</p>}><PageMotion><InfoPage /></PageMotion></Suspense>
  if (pathname === '/privacy') return <Suspense fallback={<p role="status">{translate("Caricamento pagina…")}</p>}><PageMotion><PrivacyPage /></PageMotion></Suspense>
  if (pathname === '/gioca') return <Suspense fallback={<p role="status">{translate("Caricamento pagina…")}</p>}><PageMotion><QuizPage /></PageMotion></Suspense>
  if (pathname === '/data') return <Suspense fallback={<p role="status">{translate("Caricamento pagina…")}</p>}><PageMotion><DataAdminPage /></PageMotion></Suspense>
  return <PageMotion><main className="route-not-found">
    <div className="route-not-found-header">
      <a className="route-not-found-brand" href="/home" aria-label={translate("MeteOlivelli, torna alla home")}><BrandMark />{translate("MeteOlivelli")}<span> / 01</span></a>
    </div>
    <section className="route-not-found-content" aria-labelledby="not-found-title">
      <p className="eyebrow">404 <span aria-hidden="true">/</span>{translate(" PAGINA NON TROVATA")}</p>
      <h1 id="not-found-title">{translate("Qui non c’è")}<br />{translate("nessuna misura.")}</h1>
      <p>{translate("Il collegamento potrebbe essere cambiato o l’indirizzo non è corretto.")}</p>
      <a className="route-not-found-link" href="/home">{translate("Torna alla home ")}<span aria-hidden="true">↗</span></a>
    </section>
    <footer><span>{translate("Pavia · Stazione scolastica")}</span><a href="/info">{translate("Il progetto")}</a></footer>
      <SiteLanguageBar />
  </main></PageMotion>
}
