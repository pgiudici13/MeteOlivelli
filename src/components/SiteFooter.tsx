import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { SchoolLogo } from './SchoolLogo.tsx'
import { SchoolSiteLink } from './SchoolSiteLink.tsx'
import { SiteLanguageBar } from './DisplayPreferences.tsx'

export function SiteFooter() {
  usePreferences()
  return <><footer className="site-footer">
    <div className="footer-main">
      <section className="footer-about" aria-labelledby="footer-project-title">
        <h2 id="footer-project-title">{translate("MeteOlivelli")}</h2>
        <p>{translate("Il meteo, visto da scuola.")}</p>
        <p>{translate("Un progetto di Pietro Giudici e Nicholas Borin, studenti del Liceo Teresio Olivelli di Pavia.")}</p>
      </section>
      <nav className="footer-navigation" aria-label={translate("Navigazione a piè di pagina")}>
        <h2>{translate("Esplora")}</h2>
        <a href="/home">{translate("Home")}</a>
        <a href="/info">{translate("Il progetto e la stazione")}</a>
        <a href="/gioca">{translate("Gioca con il meteo")}</a>
        <a href="/privacy">{translate("Privacy")}</a>
      </nav>
      <section className="footer-school" aria-labelledby="footer-school-title">
        <h2 id="footer-school-title">{translate("La scuola")}</h2>
        <SchoolSiteLink className="school-logo footer-school-logo footer-school-link" ariaLabel={translate("Visita il sito ufficiale del Liceo Teresio Olivelli, si apre in una nuova scheda")}>
          <SchoolLogo footer />
          <span>{translate("Visita il sito ufficiale ")}<span aria-hidden="true" style={{ display: 'inline', margin: 0 }}>↗</span></span>
        </SchoolSiteLink>
        <p>{translate("Liceo Teresio Olivelli · Pavia")}</p>
      </section>
    </div>
    <div className="footer-bottom">
      <p>{translate("© 2026 Pietro Giudici, Nicholas Borin e Liceo Teresio Olivelli di Pavia.")}</p>
      <p>{translate("Per il codice è proposta la ")}<a href="/LICENSE">{translate("licenza MIT")}</a>{translate(", subordinata all’approvazione dei titolari; marchi e logo scolastico restano dei rispettivi titolari.")}</p>
      <p>{translate("In Home, le ultime misure vengono verificate ogni 15 secondi a pagina visibile.")}</p>
      <p>{translate("Dati previsionali: ")}<a href="https://open-meteo.com/" rel="noreferrer">Open-Meteo</a>{" · "}<a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer">CC BY 4.0</a></p>
      <a className="back-to-top" href="#page-top">{translate("Torna su")} <span aria-hidden="true">↑</span></a>
    </div>
  </footer><SiteLanguageBar /></>
}
