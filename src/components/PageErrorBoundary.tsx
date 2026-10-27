import { Component, type ReactNode } from 'react'
import { BrandMark } from './BrandMark.tsx'

export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    document.title = 'Caricamento non riuscito — MeteOlivelli'
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="route-not-found">
      <a className="route-not-found-brand" href="/home" aria-label="MeteOlivelli, torna alla home"><BrandMark />MeteOlivelli<span> / 01</span></a>
      <section className="route-not-found-content" aria-labelledby="page-error-title">
        <p className="eyebrow">Caricamento interrotto</p>
        <h1 id="page-error-title" tabIndex={-1} ref={element => { element?.focus() }}>La pagina non si è caricata.</h1>
        <p>La connessione potrebbe essersi interrotta. Ricarica la pagina per riprovare oppure torna alla home.</p>
        <div className="pdf-export-controls">
          <button type="button" className="route-not-found-link" onClick={() => window.location.reload()}>Ricarica pagina <span aria-hidden="true">↻</span></button>
          <a className="route-not-found-link" href="/home">Torna alla home <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <footer><span>Pavia · Stazione scolastica</span><a href="/info">Il progetto</a></footer>
    </main>
  }
}
