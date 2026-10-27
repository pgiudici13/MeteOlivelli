import { meteorologyGlossary } from '../meteorology-glossary.ts'

export function MeteorologyGlossary() {
  return <section className="panel meteorology-glossary" aria-labelledby="glossary-title" id="glossario">
    <p className="eyebrow section-index">Per orientarsi tra i dati</p>
    <h2 id="glossary-title">Piccolo glossario meteo</h2>
    <p className="secondary">Otto spiegazioni rapide per interpretare ciò che mostra la stazione.</p>
    <div className="glossary-grid">
      {meteorologyGlossary.map(item => <details key={item.term}>
        <summary>{item.term}</summary>
        <p>{item.definition}</p>
      </details>)}
    </div>
  </section>
}
