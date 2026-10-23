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
        <nav aria-label="Navigazione principale"><a href="/home">Home</a><a href="/info" aria-current="page">Informazioni</a></nav>
        <ThemeToggle />
      </div>
    </header>
    <main id="info-content" tabIndex={-1}>
      <section className="info-hero" aria-labelledby="info-title">
        <p className="eyebrow"><span className="signal-mark" aria-hidden="true" /> Pavia · Progetto scolastico</p>
        <h1 id="info-title">Il meteo,<br />osservato insieme<span className="title-stop">.</span></h1>
        <p className="info-lead">MeteOlivelli racconta il lavoro sulla stazione meteorologica della scuola e rende consultabili le sue osservazioni quando sono disponibili.</p>
      </section>

      <div className="info-grid">
        <section className="info-block" aria-labelledby="project-title">
          <p className="eyebrow section-index">01 / Il progetto</p>
          <h2 id="project-title">Imparare guardando i dati.</h2>
          <p>MeteOlivelli è il progetto meteo del Liceo Teresio Olivelli di Pavia. Unisce una stazione scolastica e un sito per esplorare come cambiano temperatura, umidità e pressione nel tempo.</p>
          <p>Il sito presenta le osservazioni e il loro storico, con gli orari e le informazioni di qualità disponibili. Una misura viene mostrata come dato della stazione solo quando la sua provenienza è nota.</p>
        </section>

        <section className="info-block info-station" aria-labelledby="station-title">
          <p className="eyebrow section-index">02 / La stazione</p>
          <h2 id="station-title">Una stazione a scuola.</h2>
          <p>La stazione si basa su Arduino GIGA R1 e sensori per temperatura, umidità e pressione. Il sito distingue l’ora della misura, l’acquisizione sul PC e la ricezione sul backend quando questi orari sono presenti.</p>
          <p>La pagina Home si aggiorna automaticamente ogni 15 secondi mentre è visibile. Questo intervallo descrive la lettura del sito, non la frequenza con cui la stazione effettua una misura.</p>
        </section>

        <section className="info-block" aria-labelledby="data-title">
          <p className="eyebrow section-index">03 / Dati e trasparenza</p>
          <h2 id="data-title">Osservazioni con la loro provenienza.</h2>
          <p>I campioni disponibili possono includere dati di prova chiaramente contrassegnati. Questi servono a verificare il funzionamento del sito e non sono osservazioni reali della stazione.</p>
          <p>Quando una misura manca o la sua freschezza non è verificabile, il sito lo segnala: non sostituisce valori assenti con numeri inventati e non attribuisce una data assoluta a un contatore Arduino.</p>
          <a className="hero-link" href="/home">Vai alle misure <span aria-hidden="true">↗</span></a>
        </section>

        <section className="info-block info-team" aria-labelledby="team-title">
          <p className="eyebrow section-index">04 / Il team</p>
          <h2 id="team-title">Un progetto realizzato a scuola.</h2>
          <p>MeteOlivelli è realizzato da <strong>Pietro Giudici</strong> e <strong>Nicholas Borin</strong>, studenti del Liceo Teresio Olivelli di Pavia.</p>
          <p className="reflection">Imparare non significa soltanto trovare risposte, ma anche scoprire nuove domande e comprendere quanto ci sia ancora da conoscere.</p>
        </section>
      </div>
    </main>
    <footer className="site-footer"><a className="school-logo footer-school-logo" href="/info"><img src="/logo-liceo-scientifico-stem-olivelli-pavia.png" alt="Liceo Olivelli — Scientifico + STEM" /></a><p>MeteOlivelli · Il meteo, visto da scuola.</p><p><a href="/home">Home</a> · <a href="/info" aria-current="page">Informazioni</a> · <a href="/privacy">Privacy</a></p></footer>
  </div>
}
