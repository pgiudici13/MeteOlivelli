import { AnimatedHeading } from '../components/AnimatedHeading.tsx'
import { useEffect } from 'react'
import { ThemeToggle } from '../components/ThemeToggle.tsx'
import { BrandMark } from '../components/BrandMark.tsx'
import { SchoolLogo } from '../components/SchoolLogo.tsx'
import './PrivacyPage.css'

const title = 'Privacy e dati — MeteOlivelli'
const description = 'Informativa privacy di MeteOlivelli: dati tecnici, preferenze, strumenti statistici e dati meteorologici pubblici.'

function setMetadata() {
  document.title = title
  const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (descriptionTag) descriptionTag.content = description
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.append(canonical)
  }
  canonical.href = 'https://meteolivelli.vercel.app/privacy'
}

export function PrivacyPage() {
  useEffect(setMetadata, [])

  return <div className="site-shell privacy-page">
    <a className="skip-link" href="#privacy-content">Vai al contenuto</a>
    <header className="site-header">
      <a className="brand" href="/home"><BrandMark />MeteOlivelli<span className="brand-index"> / 03</span></a>
      <a className="school-logo" href="/info"><SchoolLogo /></a>
      <div className="header-actions">
        <nav aria-label="Navigazione principale"><a href="/home">Home</a><a href="/info">Informazioni</a><a href="/gioca">Gioca</a><a href="/privacy" aria-current="page">Privacy</a></nav>
        <ThemeToggle />
      </div>
    </header>
    <main id="privacy-content" tabIndex={-1}>
      <section className="privacy-hero" aria-labelledby="privacy-title">
        <p className="eyebrow"><span className="signal-mark" aria-hidden="true" /> Trasparenza · Privacy</p>
        <AnimatedHeading id="privacy-title" lines={["Privacy e dati"]} />
        <p className="info-lead">Qui spieghiamo quali dati tratta il sito, per quali finalità e come gestire le preferenze statistiche.</p>
      </section>

      <aside className="privacy-draft" role="note">
        <strong>Informazioni aggiornate al 23 ottobre 2026</strong>
        <p>Le impostazioni degli strumenti possono cambiare. Per i dati tecnici gestiti dai fornitori si applicano anche le loro informative e condizioni; per richieste o chiarimenti puoi contattare direttamente il titolare.</p>
      </aside>

      <div className="privacy-sections">
        <section className="privacy-block" aria-labelledby="controller-title">
          <p className="eyebrow section-index">01 / Titolare</p>
          <h2 id="controller-title">Chi gestisce il trattamento.</h2>
          <p>Il titolare del trattamento è <strong>Pietro Giudici</strong>. Per richieste relative alla privacy: <a href="mailto:Pietro.giudici@hotmail.com">Pietro.giudici@hotmail.com</a>.</p>
        </section>

        <section className="privacy-block" aria-labelledby="data-title">
          <p className="eyebrow section-index">02 / Dati trattati</p>
          <h2 id="data-title">Dati tecnici e preferenze.</h2>
          <ul>
            <li><strong>Connessione e hosting:</strong> per consegnare le pagine e proteggere il servizio i fornitori possono trattare indirizzo IP, data e ora, URL richiesto, stato della risposta e informazioni tecniche di browser/rete. I registri e i tempi effettivi dipendono dai servizi e dai piani attivi.</li>
            <li><strong>Preferenze locali:</strong> il browser salva la scelta sulle statistiche nella chiave <code>meteolivelli-analytics-consent</code> e, se selezionato, il tema grafico. La scelta statistica è conservata localmente per sei mesi, poi viene richiesta di nuovo; può essere cancellata dal browser prima di allora.</li>
            <li><strong>Google Analytics:</strong> il tag viene caricato solo dopo aver selezionato “Accetta” nelle preferenze statistiche. Il sito non invia identificatori di account o eventi personalizzati; i segnali Google Ads e la personalizzazione degli annunci sono disattivati. La proprietà è configurata per conservare i dati degli eventi per 2 mesi e quelli a livello utente per 14 mesi; la reimpostazione del periodo in caso di nuova attività è attiva.</li>
            <li><strong>Vercel Web Analytics e Speed Insights:</strong> vengono avviati solo dopo lo stesso consenso facoltativo. Vercel Web Analytics dichiara di non usare cookie e mostra dati di traffico aggregati. Speed Insights raccoglie misure tecniche di prestazione associate a informazioni come percorso, dispositivo, browser e sistema operativo; Vercel dichiara che i dati sono anonimi. Il progetto è nel piano Hobby: i dati Web Analytics sono consultabili per 1 mese e la finestra di reporting Speed Insights è di 7 giorni.</li>
            <li><strong>Misure meteorologiche:</strong> la pagina legge dati pubblici dal backend Supabase. La consultazione non richiede un account e il browser non invia misure alla stazione. Le misure pubblicate descrivono la stazione, non il visitatore.</li>
          </ul>
        </section>

        <section className="privacy-block" aria-labelledby="purposes-title">
          <p className="eyebrow section-index">03 / Finalità e scelta</p>
          <h2 id="purposes-title">Servire il sito e misurarne l’uso.</h2>
          <p>I dati tecnici strettamente necessari sono trattati per consegnare le pagine richieste e mantenere sicuro il servizio; per i trattamenti di dati personali connessi a questa finalità, la base giuridica è il legittimo interesse del titolare alla gestione e sicurezza del sito (art. 6, par. 1, lett. f GDPR). Google Analytics, Vercel Web Analytics e Speed Insights sono facoltativi e vengono attivati soltanto con il tuo consenso, espresso scegliendo “Accetta” (art. 6, par. 1, lett. a GDPR e, per gli strumenti di tracciamento, art. 122 del Codice Privacy). “Rifiuta” li mantiene disattivati. Puoi riaprire la scelta da “Preferenze statistiche”.</p>
          <p>La scelta è registrata nel browser. Se revochi il consenso dopo averlo dato, il sito salva il rifiuto, elimina i cookie Google Analytics accessibili alla pagina e ricarica senza riattivare gli strumenti. La revoca non rende illecito il trattamento svolto prima della revoca.</p>
        </section>

        <section className="privacy-block" aria-labelledby="recipients-title">
          <p className="eyebrow section-index">04 / Destinatari</p>
          <h2 id="recipients-title">Fornitori del servizio.</h2>
          <p>I fornitori coinvolti sono Vercel (hosting e strumenti statistici facoltativi), Google (Google Analytics dopo consenso) e Supabase (servizio backend per la lettura dei dati meteorologici). Il database Supabase è configurato nella regione AWS eu-west-1; alcuni dati dell’account, telemetria e registri operativi del fornitore possono essere trattati fuori da tale regione. I fornitori possono avvalersi di subfornitori e trasferire dati anche fuori dallo Spazio economico europeo secondo i propri accordi e garanzie, incluse le decisioni di adeguatezza o le clausole contrattuali standard quando applicabili. Consulta le informative e i documenti contrattuali linkati sotto per maggiori dettagli.</p>
          <ul className="privacy-links">
            <li><a href="https://vercel.com/legal/privacy-policy" rel="noreferrer">Informativa privacy di Vercel ↗</a></li>
            <li><a href="https://policies.google.com/privacy" rel="noreferrer">Informativa privacy di Google ↗</a></li>
            <li><a href="https://supabase.com/privacy" rel="noreferrer">Informativa privacy di Supabase ↗</a></li>
            <li><a href="https://supabase.com/legal/customer-resources/data-processing-addendum" rel="noreferrer">Accordo sul trattamento dati di Supabase ↗</a></li>
            <li><a href="https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq" rel="noreferrer">Residenza e trasferimenti dei dati Supabase ↗</a></li>
            <li><a href="https://support.google.com/analytics/answer/7667196?hl=it" rel="noreferrer">Conservazione dei dati in Google Analytics ↗</a></li>
            <li><a href="https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876" rel="noreferrer">Linee guida cookie del Garante ↗</a></li>
          </ul>
        </section>

        <section className="privacy-block" aria-labelledby="retention-title">
          <p className="eyebrow section-index">05 / Conservazione</p>
          <h2 id="retention-title">Tempi di conservazione.</h2>
          <p>La scelta sulle statistiche resta nel browser per sei mesi, poi viene richiesta di nuovo. Google Analytics conserva i dati degli eventi per 2 mesi e quelli a livello utente per 14 mesi, con il periodo utente che si reimposta in caso di nuova attività. Per Vercel Web Analytics il piano Hobby offre una finestra di reporting di 1 mese; per Speed Insights la finestra è di 7 giorni. I log Vercel disponibili per il piano Hobby hanno una finestra di 1 ora; il sito attuale è statico e non usa funzioni server. Supabase Free conserva i log API e Database per 1 giorno. La disponibilità dei singoli eventi statici e l’eventuale accesso del titolare ai registri dipendono dalle funzioni incluse nei rispettivi piani.</p>
        </section>

        <section className="privacy-block" aria-labelledby="rights-title">
          <p className="eyebrow section-index">06 / Diritti</p>
          <h2 id="rights-title">Richieste e reclami.</h2>
          <p>Puoi chiedere accesso ai dati, rettifica, cancellazione o limitazione del trattamento e opporti nei casi previsti; puoi richiedere la portabilità quando ricorrono le condizioni di legge e revocare in qualsiasi momento il consenso alle statistiche. Per esercitare i diritti, contatta il titolare all’indirizzo email indicato sopra. È possibile anche presentare un reclamo al <a href="https://www.garanteprivacy.it/">Garante per la protezione dei dati personali ↗</a>.</p>
          <p>Puoi inoltre modificare la scelta sugli strumenti statistici dal pulsante sempre disponibile <button className="privacy-inline-settings" type="button" onClick={() => document.querySelector<HTMLButtonElement>('.privacy-settings')?.click()}>Preferenze statistiche</button>.</p>
        </section>
      </div>
    </main>
    <footer className="site-footer"><a className="school-logo footer-school-logo" href="/info"><SchoolLogo footer /></a><p>MeteOlivelli · Il meteo, visto da scuola.</p><p><a href="/home">Home</a> · <a href="/info">Informazioni</a> · <a href="/gioca">Gioca</a> · <a href="/privacy" aria-current="page">Privacy</a></p></footer>
  </div>
}
