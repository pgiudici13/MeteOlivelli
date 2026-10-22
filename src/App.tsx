import './App.css'

function App() {
  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#contenuto" aria-label="MeteOlivelli, vai al contenuto">
          <img src="/favicon.svg" alt="" width="36" height="36" />
          <span>MeteOlivelli</span>
        </a>
        <p className="school">Liceo Teresio Olivelli <span aria-hidden="true">·</span> Pavia</p>
      </header>

      <main id="contenuto" className="intro" tabIndex={-1}>
        <p className="work-status">
          <span className="status-dot" aria-hidden="true" />
          <span lang="en">Work in progress</span>
          <span className="status-translation">Lavori in corso</span>
        </p>
        <p className="eyebrow">Il progetto meteo della nostra scuola</p>
        <h1>Il cielo cambia.<br />La curiosità resta.</h1>
        <p className="description">
          MeteOlivelli nasce al Liceo Teresio Olivelli di Pavia per osservare il meteo
          attraverso i dati della stazione scolastica. Stiamo preparando uno spazio
          per esplorare temperatura, umidità e pressione, e scoprire come cambiano nel tempo.
        </p>
        <p className="availability">Il sito è in costruzione. Le misurazioni non sono ancora disponibili.</p>
        <ul className="project-topics" aria-label="Le grandezze che osserveremo">
          <li>Temperatura</li>
          <li>Umidità</li>
          <li>Pressione</li>
        </ul>
      </main>

      <footer className="site-footer">
        <p>Un progetto di Pietro Giudici e Nicholas Borin</p>
        <p>Osservare. Comprendere. Condividere.</p>
      </footer>
    </div>
  )
}

export default App
