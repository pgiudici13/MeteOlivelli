# Restyling Factory — 22 ottobre 2026

Richiesta: applicare la proposta `DESIGN (1).md` conservando il progetto, con titolo grande in apertura e grafico temperatura a destra. La proposta orienta lo stile; gli esempi commerciali Factory non diventano requisiti del sito scolastico.

## Risultato

- Canvas uniforme `#101010`, tipografia Inter locale (sostituto previsto dalla proposta), titoli a peso 400, didascalie monospaziate di sistema, bordi sottili, raggi contenuti. Nessun vetro, sfocatura o ombra.
- Hero con titolo a sinistra e pannello scuro della temperatura a destra; su mobile titolo seguito dal pannello. La temperatura mostra l’ultima lettura API e relativi avvisi, non una misura attuale garantita. Nessun valore o tracciato inventato negli stati vuoti.
- Grafico iniziale alimentato dallo stesso storico selezionato nei filtri 24 ore/7 giorni/30 giorni. Collegamento “Cambia periodo” alla sezione archivio. Unità, minimo/massimo, qualità e descrizione accessibile conservati.
- Misure, tre grafici d’archivio, cronologia, stime indisponibili e informazioni sul progetto conservati. Navigazione interna a stazione/archivio. Nessun cambiamento a fetch, polling, contratti API o backend.

## Verifica

`npm run build`, `npm run lint`, `npm run frontend:test`: superati, 16 test frontend. Nessuna dipendenza aggiunta.

Runner esistente `tests/frontend-browser.mjs` aggiornato per il quarto grafico e per verificare posizione desktop e temperatura del pannello iniziale. Superati 11 scenari browser con Chrome headless: API pubblica vuota, fixture positive, reflow 320/390/768/1280 px, tastiera/filtri, polling e nuovo evento in due pagine, errori/recupero, null/sospetti, reflow equivalente allo zoom, movimento ridotto, caricamento, fallback senza JavaScript. Nessun errore JavaScript non gestito. Risultati: [JSON](factory-verification/results.json).

Screenshot desktop e mobile acquisiti e ispezionati. Le schermate con valori sono esclusivamente collaudi con risposte sintetiche intercettate nel browser, marcate “TEST SINTETICO”; nessun inserimento nel database e nessuna modalità dimostrativa nel prodotto.

- [Desktop con lettura pubblica vuota](factory-verification/desktop-empty.png).
- [Desktop con fixture sintetica](factory-verification/desktop-synthetic-test.png).
- [Mobile con fixture sintetica](factory-verification/mobile-synthetic-test.png).

## Limiti

Cadenza e tempo fisico della stazione ancora da verificare, UI-02 provvisoria, nessuna previsione generata. Non è una certificazione WCAG né un collaudo con stazione e dispositivi fisici. Backend e uploader non modificati: suite Deno/Python non rieseguite per questo intervento grafico. Nessun commit, push, deploy o modifica ai servizi eseguito.

**Revisione dai commenti browser — 22 ottobre 2026 (Fase 7 / UI-01):** rimosso l’avviso “Progetto in sviluppo”; pannello temperatura passato a tema scuro con testo chiaro, bordi e griglia attenuati, tracciato arancio. Etichette sintetiche del collaudo ora inserite solo dal runner browser, indipendentemente dall’avviso rimosso.

**Marchio — 22 ottobre 2026 (Fase 7 / UI-01):** sostituito il simbolo “m.” nell’intestazione con “O” maiuscola per Olivelli, su richiesta dell’utente.

**Marchio aggiornato — 22 ottobre 2026 (Fase 7 / UI-01):** il simbolo dell’intestazione diventa “MO.”, sostituendo la precedente “O” su richiesta dell’utente.

**Allineamento marchio — 22 ottobre 2026 (Fase 7 / UI-01):** “MO.” eredita dimensione e spaziatura delle lettere da “MeteOlivelli”, anche al breakpoint mobile; rimosso il padding aggiuntivo del simbolo.

**Separatore marchio — 22 ottobre 2026 (Fase 7 / UI-01):** aggiunta una linea verticale decorativa fra “MO.” e “MeteOlivelli”, con spaziatura dedicata anche su mobile, su richiesta dell’utente.

**Animazioni — 22 ottobre 2026 (Fase 7 / UI-01):** su richiesta dell’utente, ingressi con dissolvenza e traslazione di 16 px in 560 ms, ritardi fra elementi di 65 ms fino a 260 ms; header 500 ms. Grafici disegnati in 1100 ms, area e punti in dissolvenza. Attivazione una volta all’ingresso in vista, ripetuta solo se cambia la serie o viene ricreato il grafico dopo caricamento/errore. Nessun listener scroll o dipendenza aggiunta. Collegamenti interni con scroll morbido, scroll manuale nativo. Movimento ridotto disabilita gli effetti e cancella quelli in corso anche se la preferenza cambia durante la visita; cleanup degli observer e delle animazioni allo smontaggio. Valori sempre reali, contenuti leggibili anche senza animazioni. Questa richiesta supera le precedenti specifiche motion da 220 ms. Build/lint e 16 test frontend superati.

**QA animazioni:** superati 12 scenari browser, incluso disegno della curva all’ingresso in vista, completamento e arresto al cambio dinamico di movimento ridotto. Conservati i controlli su polling, rete, qualità dati e reflow; nessun errore JavaScript non gestito. Esiti in `docs/factory-verification/results.json`.

**Hover — 22 ottobre 2026 (Fase 7 / UI-01):** aggiunto contorno bianco al passaggio su pannelli, schede, grafici, pulsanti e bordi delle sezioni, con transizione di 180 ms e senza spostamenti del layout. Link e dettagli reagiscono con sottolineatura bianca; righe della cronologia con sfondo discreto e divisori bianchi. I periodi selezionati conservano testo scuro su fondo chiaro anche in hover. Effetti dei pannelli limitati a puntatori precisi con hover, focus tastiera bianco e movimento ridotto rispettato. Nessuna dipendenza aggiunta. Build/lint, 16 test frontend e 13 scenari browser superati, incluso controllo dei bordi bianchi e del contrasto del periodo selezionato; risultati in `docs/factory-verification/results.json`.

**Riflesso locale — 22 ottobre 2026 (Fase 7 / UI-01):** sostituito l’hover uniforme dei bordi con un gradiente bianco radiale ritagliato al contorno, centrato sul cursore e seguito con interpolazione per frame (fattore 0,18; immediato con movimento ridotto). Solo il bersaglio più vicino al puntatore è attivo; nessuna illuminazione dei divisori di sezione o dei contenitori antenati. Raggio 110 px, dissolvenza 220 ms, nessun cambio di layout o dipendenza. Animazione ferma a convergenza, listener e frame rimossi allo smontaggio, effetto escluso su touch. Build/lint, 16 test frontend e 13 scenari browser superati, incluso isolamento del pulsante 7 giorni dalla linea dell’archivio.

**Raggio hover ampliato — 22 ottobre 2026 (Fase 7 / UI-01):** raggio del riflesso aumentato da 110 a 220 px sui pannelli; pulsanti e CTA con raggio 180 px e bordo luminoso da 2 px per maggiore visibilità. Conservati inseguimento con inerzia e isolamento dal divisore di sezione.

**Coreografia allo scroll — 22 ottobre 2026 (Fase 7 / UI-01):** ogni scheda osserva il proprio ingresso in vista, con ritardi di 0/80/160 ms; le schede più in basso su mobile non consumano l’ingresso quando appare soltanto l’inizio della sezione. Il disegno dei grafici parte dall’ingresso della zona SVG, anziché dal titolo della scheda: griglia in sequenza, curva in 1400 ms, area con dissolvenza e punti a comparsa progressiva secondo la posizione temporale. L’effetto procede automaticamente dopo l’ingresso in vista, senza vincolare lo scroll manuale. Conservati dati originali, gap per misure assenti/sospette, movimento ridotto e cleanup; nessuna libreria aggiunta. Build/lint e 16 test frontend superati.

**Correzione lampeggio ingressi — 22 ottobre 2026 (Fase 7 / UI-01):** gli elementi osservati vengono preparati con opacità zero prima del primo paint (`useLayoutEffect`), mantenendo il loro spazio nel layout. Diventano visibili soltanto all’ingresso in vista, insieme all’avvio dell’animazione; stessa gestione per i grafici appena caricati. Focus tastiera rivela immediatamente il contenitore; movimento ridotto, assenza di supporto e cleanup rimuovono lo stato nascosto. Questa richiesta supera la precedente scelta di lasciare gli elementi visibili nell’attesa dell’observer. Build/lint, 16 test frontend e 13 scenari browser superati; il controllo motion verifica opacità zero fuori vista e rimozione degli stati pendenti al cambio di preferenza.

**Postilla richiesta — 22 ottobre 2026 (Fase 7 / UI-01):** aggiunta sopra il contenuto, fuori dalle animazioni, la sola dicitura “Work in progress · Possibili dati presenti fittizi”. Nessuna scrittura database eseguita in questa revisione. La postilla è locale; prima di esporre campioni di prova nel database pubblico occorre pubblicarla sul sito pubblico con autorizzazione esplicita al deploy.

**Pubblicazione autorizzata — 22 ottobre 2026 (Fase 7 / UI-01, REL-02):** l’utente ha richiesto esplicitamente di eseguire commit e push. Target verificato: `origin/main`, repository `pgiudici13/MeteOlivelli`, Vercel `meteolivelli` / team `team_WF8R8uiIvXzKOKJgGrlcCYtF`, dominio `meteolivelli.vercel.app`. `main` allineato a `origin/main` prima del rilascio. `npm run check` superato. GET pubblico latest risponde correttamente con `items: []`: l’assenza dei valori non è un guasto del collegamento. Pubblicazione della postilla prima di qualsiasi nuovo inserimento di prova; verifica del deploy successiva al push.
