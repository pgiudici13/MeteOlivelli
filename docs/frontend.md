# Frontend — stato al 22 ottobre 2026

## Versione pubblicata

[MeteOlivelli](https://meteolivelli.vercel.app/) è pubblicato da `main` attraverso l’integrazione GitHub → Vercel. Rilasci verificati: `fab71cb` (grafica, motion, hover e postilla) e `bce39e2` (contratto con provenienza sintetica distinta). Il secondo deploy è stato verificato READY sul dominio principale, con HTTP 200 e nessun errore JavaScript non gestito. Queste verifiche riguardano la versione applicativa, non il collaudo della stazione reale.

Stack conservato: React, TypeScript, Vite, ESLint, npm. Nessuna dipendenza aggiunta per grafici, animazioni o riflessi. Il riferimento Figma Obsidian v5 documenta la fase precedente; il sito corrente segue la proposta Factory adattata ai commenti dell’utente, senza aggiornamento del file Figma. [Storia Figma](design-review/README.md), [specifiche grafiche correnti](../design.md).

## Struttura e contenuti

1. Intestazione con marchio `MO. | MeteOlivelli` e collegamenti alla stazione e all’archivio.
2. Postilla permanente, fuori dalle animazioni: **Work in progress · Possibili dati presenti fittizi**.
3. Titolo grande a sinistra e pannello scuro della temperatura con grafico a destra; su mobile il pannello segue il titolo. Il numero è l’ultima lettura disponibile, non una temperatura attuale garantita.
4. Tre schede per temperatura, umidità e pressione, sempre dallo stesso evento.
5. Archivio 24 ore / 7 giorni / 30 giorni con tre grafici SVG. Il grafico iniziale segue lo stesso periodo; “Cambia periodo” porta ai filtri.
6. Cronologia dal campione più recente, sei righe per pagina, dettagli temporali e qualità per campo.
7. Stime sperimentali +30 minuti / +1 ora / giornata, tutte indisponibili finché il modello non sarà validato; informazioni sul progetto e footer.

Caricamento, archivio vuoto, periodo vuoto, errore, campo nullo e valore sospetto rimangono stati distinti. Un campo nullo mostra “Dato assente”, mai uno zero inventato. I flag qualità restano consultabili; null e sospetti interrompono la curva del campo interessato. I grafici dichiarano unità, assi temporali, minimo/massimo e riepilogo accessibile; la tabella permette di consultare i valori senza il grafico.

## Origine dei dati e tempi

GET anonimo [read-measurements](https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/read-measurements?view=latest), senza SDK, credenziali, cookie o lettura di `.env`. Il browser non scrive tabelle e non chiama l’ingestione.

La migrazione `20261022194231_synthetic_measurement_kind` distingue `live`, `historical` e `synthetic`. La lettura pubblica espone `acquisition_kind`; l’adapter frontend lo valida e conserva, accettando anche il contratto precedente privo del campo durante il rilascio. Il backend non espone payload o credenziali. Un sintetico restituisce freschezza sconosciuta; l’ingestione sensori rifiuta quel tipo.

Sono stati inseriti e verificati **cinque campioni di prova** ogni 30 minuti, con provenienza nei metadati e postilla pubblica concordata. [Autorizzazione, valori, intervalli ed evidenze](data-preview.md). Le fixture del runner browser restano intercettazioni locali; il batch pubblico è un inserimento amministrativo separato e autorizzato. Non esiste un selettore DEMO né un database parallelo.

`measured_at` (misura fisica), `captured_at` (acquisizione PC o tempo di scenario per i sintetici) e `received_at` (prima ricezione server) rimangono separati. I cinque sintetici hanno `measured_at` NULL. Visualizzazione in `Europe/Rome`; uptime Arduino mai convertito in data. Per le misure reali, ora fisica e cadenza non sono ancora verificate: la UI dichiara “Freschezza non determinabile”.

## Letture e aggiornamenti

- `src/weather.ts`: verifica del contratto pubblico, formattazione, serie e freschezza.
- `src/weather-feed.ts`: letture, finestre, recupero e gestione stato.
- `src/use-weather.ts`: ciclo React, visibilità e ritorno online.

Polling latest ogni 15 secondi solo a pagina visibile, tentativo al ritorno in primo piano/online, timeout per richiesta di 10 secondi, annullamento allo smontaggio e nessun ciclo sovrapposto. Lo storico si aggiorna all’apertura, al cambio periodo, al nuovo ultimo evento e al recupero da errore. Cache pubblica server di 10 secondi. Risposte invalide/errori HTTP non diventano archivi vuoti; un errore mantiene gli ultimi dati riusciti con avviso.

Paginazione API con cursore e finestra `until` coerenti, deduplica UUID e ordinamento. Limite esplicito di 100 pagine/50.000 eventi, senza presentare serie parziali come complete. Le finestre scadute sono eliminate anche senza nuove misure usando l’ora server. Un inserimento storico che non cambia l’ultimo evento può richiedere cambio periodo o riapertura per essere riletto; non è promesso il rilevamento completo dei backfill.

## Animazioni e interazioni

Le [specifiche correnti](../design.md) sostituiscono quelle storiche da 220 ms: ingressi individuali, grafici progressivi e riflesso locale sui bordi. `useLayoutEffect` prepara gli elementi nascosti prima del paint; `IntersectionObserver` li rivela all’ingresso in vista. Focus tastiera e movimento ridotto rendono il contenuto immediatamente visibile; nessun blocco dello scroll manuale. Il fallback `noscript` spiega che senza JavaScript non vengono mostrati dati live.

## Verifiche e ripetibilità

Ultima verifica completa prima del rilascio `bce39e2`: `npm run check` superato — build/lint, **18 test Node, 41 Deno, 21 Python**. Nessun segreto necessario ai test automatici locali. Le prove SQL separate non fanno parte di questo comando.

Runner browser opzionale, Playwright esterno al progetto e server locale già avviato:

```sh
node tests/frontend-browser.mjs /percorso/playwright/index.mjs /percorso/chrome http://127.0.0.1:5179/
```

**13 scenari browser**: risposte vuote/positive intercettate, reflow 320/390/768/1280 px, tastiera e periodi, polling e due pagine, errori/recupero, null/sospetti, movimento ridotto, caricamento, noscript, motion e riflessi. [Risultati locali](factory-verification/results.json). Gli screenshot con fixture sono marcati come test e non sono osservazioni della stazione.

Collaudo pubblico senza mock: cinque righe di cronologia, quattro grafici, ultimo valore 17,3 °C, intervalli di 30 minuti, postilla visibile, reflow 390 px e nessun errore JavaScript. [Risultati pubblici](data-preview-verification/results.json), [desktop](data-preview-verification/desktop.png), [mobile](data-preview-verification/mobile.png).

Restano aperti: prova CSV/writer/Arduino/Windows, latenza reale DB → pagina aperta, clock e cadenza, revisione con il compagno e dispositivi fisici, lettore di schermo e zoom manuale, volume/quote, backup/restore e avvisi. Nessuna certificazione WCAG o attendibilità previsionale attestata. Checklist: [Fase 8](../tasks.md#8-fase-8--backup-gestione-e-rilascio), [QA](qa.md), [gestione operativa](operations.md).

## Revisione grafici successiva al rilascio bce39e2

Correzione locale del glitch al refresh segnalato dall’utente: rivelazione SVG unica con maschera e avanzamento lineare per curva/area/punti. Nessun tratteggio del tracciato e nessun replay al solo aggiornamento del limite temporale.

`src/chart.ts` definisce finestre complete e separatori ore/giorni/settimane in Europe/Rome. `windowUntil` nello stato del feed conserva il riferimento server delle letture; non si usa l’orologio del browser per inventare la finestra. Una serie breve occupa soltanto il tratto di periodo per cui esistono campioni. Test Node aggiunti per durate 24/168/720 ore e mezzanotti al cambio d’ora; test browser della maschera a metà corsa verifica avanzamento al 50%, easing lineare e assenza di dash. Nessuna modifica ai dati, al polling o al backend.

**Verifiche della revisione locale dei grafici:** `npm run check` superato (20 Node, 41 Deno, 21 Python) e 13 scenari browser, inclusa progressione lineare al 50% e separatori settimanali. Screenshot di collaudo aggiornati in `docs/factory-verification/`; nessun nuovo commit, push o deploy eseguito per questa revisione.

## Auto e aggregazione locale

La selezione iniziale è Auto. Il feed usa la lettura 30g con `until` ancorato all’ultima acquisizione disponibile, per rendere consultabili anche i campioni di una stazione ferma da mesi senza dichiararne freschezza. Il caricamento Auto legge prima latest e poi lo storico ancorato; il polling invariato non ricarica la serie. Le viste manuali mantengono la finestra server attuale e le richieste iniziali indipendenti.

In `src/chart.ts`, lo storico caricato di durata ≤7 giorni resta grezzo e l’asse ne segue l’estensione; oltre sette giorni viene derivata l’ultima settimana di calendario con tre medie aritmetiche per giorno: 00–12, 12–17, 17–24. Sono usati solo i valori validi per campo; nessuna fascia vuota viene interpolata o trasformata in zero. Campioni live e di prova non contribuiscono alla stessa media. Se sono disponibili live, Auto li privilegia. La cronologia resta quella originale dei 30 giorni letti; nessuna media diventa una misura o viene inviata al database. Tooltip con fascia e numero di contributi, titolo “Ultima media” e riepilogo accessibile dichiarano l’aggregazione.

Dati raw e medie hanno punti del grafico distinti dal tipo `Measurement`. I centri delle fasce servono al posizionamento sul grafico e non sono orari di misura. Le sette date e le fasce rispettano Europe/Rome e il cambio d’ora. Maschera lineare accelerata a 700 ms dopo 60 ms; ingressi generali a 420 ms.

**Verifica Auto locale:** `npm run check` superato (26 Node, 41 Deno, 21 Python), 14 scenari browser superati, inclusi Auto predefinito, 21 medie per fascia su serie lunga e cronologia originale. Resta una modifica locale non pubblicata.
