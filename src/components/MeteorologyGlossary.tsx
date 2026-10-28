import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { meteorologyGlossary } from '../meteorology-glossary.ts'

export function MeteorologyGlossary() {
  usePreferences()
  return <section className="panel meteorology-glossary" aria-labelledby="glossary-title" id="glossario">
    <p className="eyebrow section-index">{translate("Per orientarsi tra i dati")}</p>
    <h2 id="glossary-title">{translate("Piccolo glossario meteo")}</h2>
    <p className="secondary">{translate("Otto spiegazioni rapide per interpretare ciò che mostra la stazione.")}</p>
    <div className="glossary-grid">
      {translate(meteorologyGlossary.map(item => <details key={item.term}>
        <summary>{translate(item.term)}</summary>
        <p>{translate(item.definition)}</p>
      </details>))}
    </div>
  </section>
}
