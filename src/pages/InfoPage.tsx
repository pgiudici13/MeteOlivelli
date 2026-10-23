import { useEffect } from 'react'
import { ThemeToggle } from '../components/ThemeToggle.tsx'
import './InfoPage.css'

const title = 'Informazioni su MeteOlivelli — progetto e stazione meteo'
const description = 'Scopri il progetto MeteOlivelli del Liceo Teresio Olivelli di Pavia, la stazione meteorologica scolastica, i dati e il team.'

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
  canonical.href = 'https://meteolivelli.vercel.app/info'
}

export function InfoPage() {
  useEffect(setMetadata, [])

  return <div className="site-shell info-page">
    <a className="skip-link" href="#info-content">Vai al contenuto</a>
    <header className="site-header">
      <a className="brand" href="/home"><span className="brand-symbol" aria-hidden="true">MO.</span>MeteOlivelli<span className="brand-index"> / 02</span></a>
      <a className="school-logo" href="/info"><img src="/logo-liceo-scientifico-stem-olivelli-pavia.png" alt="Liceo Olivelli — Scientifico + STEM" /></a>
      <div className="header-actions">
        <nav aria-label="Navigazione principale"><a href="/home">Home</a><a href="/info" aria-current="page">Informazioni</a><a href="/gioca">Gioca</a></nav>
        <ThemeToggle />
      </div>
    </header>
    <main id="info-content" tabIndex={-1}>
      <section className="info-hero" aria-labelledby="info-title">
        <p className="eyebrow"><span className="signal-mark" aria-hidden="true" /> Pavia · Progetto scolastico</p>
        <h1 id="info-title">La stazione,<br />vista da vicino<span className="title-stop">.</span></h1>
        <p className="info-lead">Un progetto scolastico per osservare i dati meteo, capire da dove arrivano e imparare a leggerli con attenzione.</p>
        <div className="info-highlights" aria-label="In breve">
          <p><strong>Pavia</strong><span>Il territorio osservato</span></p>
          <p><strong>3 grandezze</strong><span>Temperatura, umidità, pressione</span></p>
          <p><strong>Un progetto</strong><span>Scienza e tecnologia a scuola</span></p>
        </div>
      </section>

      <nav className="info-toc" aria-label="In questa pagina">
        <span className="eyebrow">Esplora</span>
        <a href="#project">Il progetto</a><a href="#station">La stazione</a>
        <a href="#reading">Come leggere i dati</a><a href="#team">Il team</a>
      </nav>

      <div className="info-grid">
        <section className="info-block" id="project" aria-labelledby="project-title">
          <p className="eyebrow section-index">01 / Il progetto</p>
          <h2 id="project-title">Un piccolo osservatorio, costruito a scuola.</h2>
          <p>MeteOlivelli è il progetto meteo del Liceo Teresio Olivelli di Pavia. Mette insieme una stazione scolastica e un sito pubblico per seguire tre grandezze: temperatura, umidità e pressione.</p>
          <p>L’obiettivo è rendere i dati facili da esplorare e, allo stesso tempo, spiegare con chiarezza come vengono raccolti. Un grafico è utile quando sappiamo che cosa rappresenta ogni punto e quali limiti ha la serie.</p>
        </section>

        <section className="info-block info-station" id="station" aria-labelledby="station-title">
          <p className="eyebrow section-index">02 / La stazione</p>
          <h2 id="station-title">Dalla rilevazione alla pagina.</h2>
          <p>La stazione usa una scheda Arduino GIGA R1 e sensori che forniscono temperatura, umidità e pressione. I modelli dei sensori, la loro taratura e il tipo di pressione rappresentato non sono ancora documentati: per questo il sito non dichiara una precisione strumentale.</p>
          <div className="info-flow" aria-label="Percorso previsto dei dati">
            <div><span>01</span><strong>Sensori</strong><small>Rilevano le grandezze</small></div>
            <span className="info-flow-arrow" aria-hidden="true">→</span>
            <div><span>02</span><strong>Arduino</strong><small>Raccoglie i valori</small></div>
            <span className="info-flow-arrow" aria-hidden="true">→</span>
            <div><span>03</span><strong>Archivio</strong><small>Conserva le letture</small></div>
            <span className="info-flow-arrow" aria-hidden="true">→</span>
            <div><span>04</span><strong>Sito</strong><small>Mostra serie e dettagli</small></div>
          </div>
          <p className="info-note">Questo è il percorso previsto dal progetto. Il funzionamento continuativo del writer e la cadenza effettiva dei sensori sono ancora da verificare sul sistema della stazione.</p>
          <dl className="info-time-definitions">
            <div><dt>Ora della misura</dt><dd>Quando il sensore ha effettuato la rilevazione, se l’orario fisico è disponibile e verificato.</dd></div>
            <div><dt>Acquisizione sul PC</dt><dd>Quando il computer ha osservato la riga del CSV; non prova da sola quando è avvenuta la misura.</dd></div>
            <div><dt>Ricezione</dt><dd>Quando il server ha ricevuto il record; non rende recente una misura più vecchia.</dd></div>
          </dl>
          <p>La Home rilegge l’ultimo dato ogni 15 secondi mentre la pagina è visibile. È l’intervallo di aggiornamento del sito: non indica ogni quanto il sensore effettua una misura.</p>
        </section>

        <section className="info-block" id="reading" aria-labelledby="data-title">
          <p className="eyebrow section-index">03 / Dati e trasparenza</p>
          <h2 id="data-title">Osservazioni con la loro provenienza.</h2>
          <p>I campioni disponibili possono includere dati di prova chiaramente contrassegnati. Questi servono a verificare il funzionamento del sito e non sono osservazioni reali della stazione.</p>
          <p>Quando una misura manca o la sua freschezza non è verificabile, il sito lo segnala: non sostituisce valori assenti con numeri inventati e non attribuisce una data assoluta a un contatore Arduino.</p>
          <a className="hero-link" href="/home">Vai alle misure <span aria-hidden="true">↗</span></a>
        </section>

        <section className="info-block info-team" id="team" aria-labelledby="team-title">
          <p className="eyebrow section-index">04 / Il team</p>
          <h2 id="team-title">Un progetto realizzato a scuola.</h2>
          <p>MeteOlivelli è realizzato da <strong>Pietro Giudici</strong> e <strong>Nicholas Borin</strong>, studenti del Liceo Teresio Olivelli di Pavia.</p>
          <p className="reflection">Imparare non significa soltanto trovare risposte, ma anche scoprire nuove domande e comprendere quanto ci sia ancora da conoscere.</p>
        </section>
      </div>
    </main>
    <footer className="site-footer"><a className="school-logo footer-school-logo" href="/info"><img src="/logo-liceo-scientifico-stem-olivelli-pavia.png" alt="Liceo Olivelli — Scientifico + STEM" /></a><p>MeteOlivelli · Il meteo, visto da scuola.</p><p><a href="/home">Home</a> · <a href="/info" aria-current="page">Informazioni</a> · <a href="/gioca">Gioca</a> · <a href="/privacy">Privacy</a></p></footer>
  </div>
}
