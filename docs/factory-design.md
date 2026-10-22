# Restyling Factory — 22 ottobre 2026

Richiesta: applicare la proposta `DESIGN (1).md` conservando il progetto, con titolo grande in apertura e grafico temperatura a destra. La proposta orienta lo stile; gli esempi commerciali Factory non diventano requisiti del sito scolastico.

## Risultato

- Canvas uniforme `#101010`, tipografia Inter locale (sostituto previsto dalla proposta), titoli a peso 400, didascalie monospaziate di sistema, bordi sottili, raggi contenuti. Nessun vetro, sfocatura o ombra.
- Hero con titolo a sinistra e pannello chiaro della temperatura a destra; su mobile titolo seguito dal pannello. La temperatura mostra l’ultima lettura API e relativi avvisi, non una misura attuale garantita. Nessun valore o tracciato inventato negli stati vuoti.
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
