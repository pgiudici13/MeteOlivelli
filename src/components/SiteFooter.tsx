import { SchoolLogo } from './SchoolLogo.tsx'
import { SchoolSiteLink } from './SchoolSiteLink.tsx'

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="footer-main">
      <section className="footer-about" aria-labelledby="footer-project-title">
        <h2 id="footer-project-title">MeteOlivelli</h2>
        <p>Il meteo, visto da scuola.</p>
        <p>Un progetto di Pietro Giudici e Nicholas Borin, studenti del Liceo Teresio Olivelli di Pavia.</p>
      </section>
      <nav className="footer-navigation" aria-label="Navigazione a piè di pagina">
        <h2>Esplora</h2>
        <a href="/home">Home</a>
        <a href="/info">Il progetto e la stazione</a>
        <a href="/gioca">Gioca con il meteo</a>
        <a href="/privacy">Privacy</a>
      </nav>
      <section className="footer-school" aria-labelledby="footer-school-title">
        <h2 id="footer-school-title">La scuola</h2>
        <SchoolSiteLink className="school-logo footer-school-logo footer-school-link">
          <SchoolLogo footer />
          <span>Visita il sito ufficiale ↗</span>
        </SchoolSiteLink>
        <p>Liceo Teresio Olivelli · Pavia</p>
      </section>
    </div>
    <div className="footer-bottom">
      <p>© 2026 Pietro Giudici, Nicholas Borin e Liceo Teresio Olivelli di Pavia.</p>
      <p>Per il codice è proposta la <a href="/LICENSE">licenza MIT</a>, subordinata all’approvazione dei titolari; marchi e logo scolastico restano dei rispettivi titolari.</p>
      <p>In Home, le ultime misure vengono verificate ogni 15 secondi a pagina visibile.</p>
    </div>
  </footer>
}
