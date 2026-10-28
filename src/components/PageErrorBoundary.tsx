import { SiteLanguageBar } from './DisplayPreferences.tsx'
import { usePreferences } from '../use-preferences.ts'
import { translate } from '../i18n.ts'
import { Component, type ReactNode } from 'react'
import { BrandMark } from './BrandMark.tsx'

export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    document.title = translate('Caricamento non riuscito — MeteOlivelli')
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <PageFailure />
  }
}

function PageFailure() {
  usePreferences()
  return <main className="route-not-found">
      <div className="route-not-found-header">
      <a className="route-not-found-brand" href="/home" aria-label={translate("MeteOlivelli, torna alla home")}><BrandMark />{translate("MeteOlivelli")}<span> / 01</span></a>
    </div>
      <section className="route-not-found-content" aria-labelledby="page-error-title">
        <p className="eyebrow">{translate("Caricamento interrotto")}</p>
        <h1 id="page-error-title" tabIndex={-1} ref={element => { element?.focus() }}>{translate("La pagina non si è caricata.")}</h1>
        <p>{translate("La connessione potrebbe essersi interrotta. Ricarica la pagina per riprovare oppure torna alla home.")}</p>
        <div className="pdf-export-controls">
          <button type="button" className="route-not-found-link" onClick={() => window.location.reload()}>{translate("Ricarica pagina ")}<span aria-hidden="true">↻</span></button>
          <a className="route-not-found-link" href="/home">{translate("Torna alla home ")}<span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <footer><span>{translate("Pavia · Stazione scolastica")}</span><a href="/info">{translate("Il progetto")}</a></footer>
      <SiteLanguageBar />
    </main>
}
