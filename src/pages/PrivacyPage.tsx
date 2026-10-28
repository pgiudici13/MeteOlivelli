import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { AnimatedHeading } from '../components/AnimatedHeading.tsx'
import { useEffect } from 'react'
import { ThemeToggle } from '../components/ThemeToggle.tsx'
import { BrandMark } from '../components/BrandMark.tsx'
import { SchoolLogo } from '../components/SchoolLogo.tsx'
import { SchoolSiteLink } from '../components/SchoolSiteLink.tsx'
import { SiteFooter } from '../components/SiteFooter.tsx'
import './PrivacyPage.css'

const title = 'Privacy e dati — MeteOlivelli'
const description = 'Informativa privacy di MeteOlivelli: dati tecnici, preferenze, strumenti statistici e dati meteorologici pubblici.'

function setMetadata() {
  document.title = translate(title)
  const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (descriptionTag) descriptionTag.content = translate(description)
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = 'https://meteolivelli.vercel.app/privacy'
}

export function PrivacyPage() {
  const preferences = usePreferences()
  useEffect(setMetadata, [preferences])

  return <div className="site-shell privacy-page">
    <a className="skip-link" href="#privacy-content">{translate("Vai al contenuto")}</a>
    <header className="site-header">
      <a className="brand" href="/home"><BrandMark />{translate("MeteOlivelli")}<span className="brand-index"> / 03</span></a>
      <SchoolSiteLink className="school-logo"><SchoolLogo /></SchoolSiteLink>
      <div className="header-actions">
        <nav aria-label={translate("Navigazione principale")}><a href="/home">{translate("Home")}</a><a href="/info">{translate("Informazioni")}</a><a href="/gioca">{translate("Gioca")}</a><a href="/privacy" aria-current="page">{translate("Privacy")}</a></nav>
        <ThemeToggle />
      </div>
    </header>
    <main id="privacy-content" tabIndex={-1}>
      <section className="privacy-hero" aria-labelledby="privacy-title">
        <p className="eyebrow"><span className="signal-mark" aria-hidden="true" />{translate(" Trasparenza · Privacy")}</p>
        <AnimatedHeading id="privacy-title" lines={translate(["Privacy e dati"])} />
        <p className="info-lead">{translate("Qui spieghiamo quali dati tratta il sito, per quali finalità e come gestire le preferenze statistiche.")}</p>
      </section>

      <aside className="privacy-draft" role="note">
        <strong>{translate("Informazioni aggiornate al 27 ottobre 2026")}</strong>
        <p>{translate("Le impostazioni degli strumenti possono cambiare. Per i dati tecnici gestiti dai fornitori si applicano anche le loro informative e condizioni; per richieste o chiarimenti puoi contattare direttamente il titolare.")}</p>
      </aside>

      <div className="privacy-sections">
        <section className="privacy-block" aria-labelledby="controller-title">
          <p className="eyebrow section-index">{translate("01 / Titolare")}</p>
          <h2 id="controller-title">{translate("Chi gestisce il trattamento.")}</h2>
          <p>{translate("Il titolare del trattamento è ")}<strong>{translate("Pietro Giudici")}</strong>{translate(". Per richieste relative alla privacy: ")}<a href="mailto:Pietro.giudici@hotmail.com">{translate("Pietro.giudici@hotmail.com")}</a>.</p>
        </section>

        <section className="privacy-block" aria-labelledby="data-title">
          <p className="eyebrow section-index">{translate("02 / Dati trattati")}</p>
          <h2 id="data-title">{translate("Dati tecnici e preferenze.")}</h2>
          <ul>
            <li><strong>{translate("Connessione e hosting:")}</strong>{translate(" per consegnare le pagine e proteggere il servizio i fornitori possono trattare indirizzo IP, data e ora, URL richiesto, stato della risposta e informazioni tecniche di browser/rete. I registri e i tempi effettivi dipendono dai servizi e dai piani attivi.")}</li>
            <li><strong>{translate("Preferenze locali:")}</strong>{translate(" il browser salva l’eventuale scelta di disattivare o riattivare le statistiche nella chiave ")}<code>{translate("meteolivelli-analytics-consent")}</code>{translate(" e, se selezionato, il tema grafico. La preferenza resta fino a una modifica da “Preferenze statistiche” o alla cancellazione dei dati del sito.")} {translate("Lingua e unità vengono salvate solo su questo dispositivo.")}</li>
            <li><strong>{translate("Google Analytics:")}</strong>{translate(" il tag si avvia per impostazione predefinita; puoi disattivarlo da “Preferenze statistiche”. Per il quiz inviamo l’avvio e il completamento, con il nome del quiz e il punteggio numerico totale; non inviamo risposte, nome, email o identificatori di account. Google Analytics può associare gli eventi ai propri identificatori pseudonimi per produrre statistiche sul numero di utenti e sui risultati aggregati. I segnali Google Ads e la personalizzazione degli annunci sono disattivati. La proprietà è configurata per conservare i dati degli eventi per 2 mesi e quelli a livello utente per 14 mesi; la reimpostazione del periodo in caso di nuova attività è attiva.")}</li>
            <li><strong>{translate("Vercel Web Analytics e Speed Insights:")}</strong>{translate(" si avviano per impostazione predefinita e puoi disattivarli dalle preferenze. Vercel Web Analytics dichiara di non usare cookie e mostra dati di traffico aggregati. Speed Insights raccoglie misure tecniche di prestazione associate a informazioni come percorso, dispositivo, browser e sistema operativo; Vercel dichiara che i dati sono anonimi. Il progetto è nel piano Hobby: i dati Web Analytics sono consultabili per 1 mese e la finestra di reporting Speed Insights è di 7 giorni.")}</li>
            <li><strong>{translate("Misure meteorologiche:")}</strong>{translate(" la pagina legge dati pubblici dal backend Supabase. La consultazione non richiede un account e il browser non invia misure alla stazione. Le misure pubblicate descrivono la stazione, non il visitatore.")}</li>
          </ul>
        </section>

        <section className="privacy-block" aria-labelledby="purposes-title">
          <p className="eyebrow section-index">{translate("03 / Finalità e scelta")}</p>
          <h2 id="purposes-title">{translate("Servire il sito e misurarne l’uso.")}</h2>
          <p>{translate("I dati tecnici strettamente necessari sono trattati per consegnare le pagine richieste e mantenere sicuro il servizio; per i trattamenti di dati personali connessi a questa finalità, la base giuridica è il legittimo interesse del titolare alla gestione e sicurezza del sito (art. 6, par. 1, lett. f GDPR). Google Analytics, Vercel Web Analytics e Speed Insights si avviano automaticamente secondo la verifica del titolare sulle condizioni applicabili agli strumenti statistici. Puoi disattivarli o riattivarli in qualsiasi momento da “Preferenze statistiche”; la scelta viene registrata nel browser.")}</p>
          <p>{translate("Se disattivi le statistiche, il sito arresta gli invii, elimina i cookie Google accessibili alla pagina e, quando la preferenza è salvata, ricarica senza riattivare gli strumenti. La scelta salvata resta finché non la modifichi o cancelli i dati del sito. Se il browser impedisce il salvataggio, la scelta vale fino al prossimo caricamento della pagina.")}</p>
        </section>

        <section className="privacy-block" aria-labelledby="recipients-title">
          <p className="eyebrow section-index">{translate("04 / Destinatari")}</p>
          <h2 id="recipients-title">{translate("Fornitori del servizio.")}</h2>
          <p>{translate("I fornitori coinvolti sono Vercel (hosting e strumenti statistici), Google (Google Analytics) e Supabase (servizio backend per la lettura dei dati meteorologici). Il database Supabase è configurato nella regione AWS eu-west-1; alcuni dati dell’account, telemetria e registri operativi del fornitore possono essere trattati fuori da tale regione. I fornitori possono avvalersi di subfornitori e trasferire dati anche fuori dallo Spazio economico europeo secondo i propri accordi e garanzie, incluse le decisioni di adeguatezza o le clausole contrattuali standard quando applicabili. Consulta le informative e i documenti contrattuali linkati sotto per maggiori dettagli.")}</p>
          <ul className="privacy-links">
            <li><a href="https://vercel.com/legal/privacy-policy" rel="noreferrer">{translate("Informativa privacy di Vercel ↗")}</a></li>
            <li><a href="https://policies.google.com/privacy" rel="noreferrer">{translate("Informativa privacy di Google ↗")}</a></li>
            <li><a href="https://supabase.com/privacy" rel="noreferrer">{translate("Informativa privacy di Supabase ↗")}</a></li>
            <li><a href="https://supabase.com/legal/customer-resources/data-processing-addendum" rel="noreferrer">{translate("Accordo sul trattamento dati di Supabase ↗")}</a></li>
            <li><a href="https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq" rel="noreferrer">{translate("Residenza e trasferimenti dei dati Supabase ↗")}</a></li>
            <li><a href="https://support.google.com/analytics/answer/7667196?hl=it" rel="noreferrer">{translate("Conservazione dei dati in Google Analytics ↗")}</a></li>
            <li><a href="https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876" rel="noreferrer">{translate("Linee guida cookie del Garante ↗")}</a></li>
          </ul>
        </section>

        <section className="privacy-block" aria-labelledby="retention-title">
          <p className="eyebrow section-index">{translate("05 / Conservazione")}</p>
          <h2 id="retention-title">{translate("Tempi di conservazione.")}</h2>
          <p>{translate("La preferenza sulle statistiche resta nel browser finché non viene modificata o cancellata. Google Analytics conserva i dati degli eventi per 2 mesi e quelli a livello utente per 14 mesi, con il periodo utente che si reimposta in caso di nuova attività. Per Vercel Web Analytics il piano Hobby offre una finestra di reporting di 1 mese; per Speed Insights la finestra è di 7 giorni. I log Vercel disponibili per il piano Hobby hanno una finestra di 1 ora; il sito attuale è statico e non usa funzioni server. Supabase Free conserva i log API e Database per 1 giorno. La disponibilità dei singoli eventi statici e l’eventuale accesso del titolare ai registri dipendono dalle funzioni incluse nei rispettivi piani.")}</p>
        </section>

        <section className="privacy-block" aria-labelledby="rights-title">
          <p className="eyebrow section-index">{translate("06 / Diritti")}</p>
          <h2 id="rights-title">{translate("Richieste e reclami.")}</h2>
          <p>{translate("Puoi chiedere accesso ai dati, rettifica, cancellazione o limitazione del trattamento e opporti nei casi previsti; puoi richiedere la portabilità quando ricorrono le condizioni di legge e disattivare in qualsiasi momento gli strumenti statistici. Per esercitare i diritti, contatta il titolare all’indirizzo email indicato sopra. È possibile anche presentare un reclamo al ")}<a href="https://www.garanteprivacy.it/">{translate("Garante per la protezione dei dati personali ↗")}</a>.</p>
          <p>{translate("Puoi inoltre modificare la scelta sugli strumenti statistici dal pulsante sempre disponibile ")}<button className="privacy-inline-settings" type="button" onClick={() => document.querySelector<HTMLButtonElement>('.privacy-settings')?.click()}>{translate("Preferenze statistiche")}</button>.</p>
        </section>
      </div>
    </main>
    <SiteFooter />
  </div>
}
