# Frontend — stato al 22 ottobre 2026

## Preferenze statistiche e privacy — verifica locale del 23 ottobre 2026

La proprietà Google usa l’ID `G-F2LRCD93NW`. Google Analytics, Vercel Analytics (`inject()`) e Speed Insights sono avviati solo con scelta salvata `granted`. “Rifiuta” memorizza `denied` e impedisce l’avvio di tutti e tre; la scelta può essere riaperta da “Preferenze statistiche”. La revoca dopo l’accettazione salva il rifiuto, rimuove i cookie `_ga*` accessibili alla pagina e ricarica il sito. Segnali Google Ads e personalizzazione annunci sono disattivati. La scelta è salvata in `localStorage` con istante della decisione e scade dopo sei mesi di calendario; se il browser non consente di conservarla, gli strumenti restano spenti. Vercel Analytics è senza cookie secondo la documentazione del fornitore; Speed Insights viene montato solo dopo il consenso.

La pagina `/privacy` descrive il comportamento del client, il titolare e il recapito forniti dall’utente, i periodi Analytics osservati e le finestre dei due strumenti Vercel per il piano Hobby verificato in dashboard. I log tecnici hosting/backend dipendono dalle impostazioni e dai termini dei fornitori, non sono configurati dal frontend. Il record Google Analytics mostrava conservazione eventi di 2 mesi, livello utente di 14 mesi e reset del periodo dopo nuova attività abilitato. La pagina resta da approvare dal titolare prima della pubblicazione e i contratti/configurazioni di fornitore vanno verificati per il trattamento effettivo.

Prima di pubblicare: verificare accettazione/rifiuto/revoca su una distribuzione di prova e controllare con Google Tag Assistant; verificare log hosting/backend, ruoli e trasferimenti rispetto agli accordi dei fornitori; far approvare l’informativa al titolare. La schermata Google può segnalare l’assenza di dati fino a 48 ore. Nessuna configurazione della proprietà Analytics o pubblicazione Vercel è stata eseguita da questa modifica locale.

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
7. Stime sperimentali +30 minuti / +1 ora / +24 ore, con verifica temporale per campo, metodo, errore storico e scadenza; indisponibili quando dati o verifica non bastano. Informazioni sul progetto e footer.

Caricamento, archivio vuoto, periodo vuoto, errore, campo nullo e valore sospetto rimangono stati distinti. Un campo nullo mostra “Dato assente”, mai uno zero inventato. I flag qualità restano consultabili; null e sospetti interrompono la curva del campo interessato. I grafici dichiarano unità, assi temporali, minimo/massimo e riepilogo accessibile; la tabella permette di consultare i valori senza il grafico.

## Origine dei dati e tempi

GET anonimo [read-measurements](https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/read-measurements?view=latest), senza SDK, credenziali, cookie o lettura di `.env`. Il browser non scrive tabelle e non chiama l’ingestione.

La migrazione `20261022194231_synthetic_measurement_kind` distingue `live`, `historical` e `synthetic`. La lettura pubblica espone `acquisition_kind`; l’adapter frontend lo valida e conserva, accettando anche il contratto precedente privo del campo durante il rilascio. Il backend non espone payload o credenziali. Un sintetico restituisce freschezza sconosciuta; l’ingestione sensori rifiuta quel tipo.

Il batch corrente contiene **dieci campioni di prova** ogni sei ore (aggiornamento autorizzato del 23 ottobre; il verbale seguente conserva la storia del primo inserimento), con provenienza nei metadati e postilla pubblica concordata. [Autorizzazione, valori, intervalli ed evidenze](data-preview.md). Le fixture del runner browser restano intercettazioni locali; il batch pubblico è un inserimento amministrativo separato e autorizzato. Non esiste un selettore DEMO né un database parallelo.

`measured_at` (misura fisica), `captured_at` (acquisizione PC o tempo di scenario per i sintetici) e `received_at` (prima ricezione server) rimangono separati. I dieci sintetici hanno `measured_at` NULL. Visualizzazione in `Europe/Rome`; uptime Arduino mai convertito in data. Per le misure reali, ora fisica e cadenza non sono ancora verificate: la UI dichiara “Freschezza non determinabile”.

## Letture e aggiornamenti

- `src/weather.ts`: verifica del contratto pubblico, formattazione, serie e freschezza.
- `src/weather-feed.ts`: letture, finestre, recupero e gestione stato.
- `src/use-weather.ts`: ciclo React, visibilità e ritorno online.

Polling latest ogni 15 secondi solo a pagina visibile, tentativo al ritorno in primo piano/online, timeout per richiesta di 10 secondi, annullamento allo smontaggio e nessun ciclo sovrapposto. Lo storico si aggiorna all’apertura, al cambio periodo, al nuovo ultimo evento e al recupero da errore. Cache pubblica server di 10 secondi. Risposte invalide/errori HTTP non diventano archivi vuoti; un errore mantiene gli ultimi dati riusciti con avviso.

Il feed dei grafici e delle previsioni usa paginazione API con cursore e finestra `until` coerenti, deduplica UUID e limite conservativo di 100 pagine/50.000 eventi; non presenta serie parziali come complete. La tabella Cronologia usa una lettura separata `period=all`, continua fino all’ultimo cursore senza limite temporale o numero massimo di pagine e include record senza `captured_at`; questi ultimi sono ordinati per `received_at`, mostrato separatamente e mai come ora di misura. Le finestre dei grafici scadute sono eliminate anche senza nuove misure usando l’ora server.

## Animazioni e interazioni

Le [specifiche correnti](../design.md) sostituiscono quelle storiche da 220 ms: ingressi individuali, grafici progressivi e riflesso locale sui bordi. `useLayoutEffect` prepara gli elementi nascosti prima del paint; `IntersectionObserver` li rivela all’ingresso in vista. Focus tastiera e movimento ridotto rendono il contenuto immediatamente visibile; nessun blocco dello scroll manuale. Il fallback `noscript` spiega che senza JavaScript non vengono mostrati dati live.

Nella cronologia, il cambio pagina anima le righe a cascata in uscita e poi in ingresso, con direzione legata a “Più recenti”/“Precedenti”; i pulsanti restano disabilitati durante l’animazione e lo stato dichiara intervallo e totale. Con movimento ridotto il cambio avviene subito. Sotto 760 px ogni riga è impaginata come scheda con etichette dei valori e dettagli separati.

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

La selezione iniziale è Auto. Il feed grafici usa la lettura 30g con `until` ancorato all’ultima acquisizione disponibile, per rendere consultabili anche i campioni di una stazione ferma da mesi senza dichiararne freschezza. La cronologia completa è caricata da `useCompleteHistory`, indipendente dai filtri e dal polling dei grafici. Il caricamento Auto legge prima latest e poi lo storico ancorato; il polling invariato non ricarica la serie. Le viste manuali mantengono la finestra server attuale e le richieste iniziali indipendenti.

In `src/chart.ts`, lo storico caricato di durata ≤7 giorni resta grezzo e l’asse ne segue l’estensione; oltre sette giorni viene derivata l’ultima settimana di calendario con tre medie aritmetiche per giorno: 00–12, 12–17, 17–24. Sono usati solo i valori validi per campo; nessuna fascia vuota viene interpolata o trasformata in zero. Campioni live e di prova non contribuiscono alla stessa media. Se sono disponibili live, Auto li privilegia. La cronologia resta quella originale dei 30 giorni letti; nessuna media diventa una misura o viene inviata al database. Tooltip con fascia e numero di contributi, titolo “Ultima media” e riepilogo accessibile dichiarano l’aggregazione.

Nelle viste manuali, 24 ore mantiene tutti i campioni originali. 7, 14 e 30 giorni mostrano una media giornaliera dei campioni validi acquisiti dalle 09:00 incluse alle 18:00 escluse in Europe/Rome. Una giornata senza valori validi interrompe la linea; la cronologia conserva sempre i campioni originali. L’API non espone una finestra 14g: la UI legge 30g e limita localmente la serie agli ultimi 14 giorni ancorati all’orario server.

Dati raw e medie hanno punti del grafico distinti dal tipo `Measurement`. I centri delle fasce servono al posizionamento sul grafico e non sono orari di misura. Le sette date e le fasce rispettano Europe/Rome e il cambio d’ora. Maschera lineare accelerata a 700 ms dopo 60 ms; ingressi generali a 420 ms.

**Verifica Auto locale:** `npm run check` superato (26 Node, 41 Deno, 21 Python), 14 scenari browser superati, inclusi Auto predefinito, 21 medie per fascia su serie lunga e cronologia originale. Resta una modifica locale non pubblicata.


## Correzione Auto e riepilogo hero — 23 ottobre 2026

Riprodotto HTTP 400 `invalid_query` usando in `until` il `captured_at` PostgreSQL `2026-10-22T19:43:00+00:00`. Il validatore richiede UTC canonico con millisecondi e Z. Il feed normalizza la richiesta, arrotonda verso l’alto eventuali microsecondi e mantiene il limite della lettura storica nei polling invariati. Nessun endpoint remoto modificato. Test Node per offset, microsecondi, paginazione e polling; test Deno del feed contro `parseReadQuery` reale.

La hero mostra umidità e pressione compatte accanto alla temperatura, dallo stesso campione, mantenendo null, unità e qualità. Layout con reflow; nessuna dipendenza aggiunta.

Verifiche: `npm run check` superato (27 Node, 42 Deno, 21 Python); 14 scenari browser sintetici di regressione superati. Prova frontend locale → API pubblica reale: quattro grafici, dieci campioni, richieste HTTP 200, polling invariato, nessun errore JavaScript o overflow a 1440/390/320 px. [Evidenze](auto-verification/results.json). I campioni del database sono sintetici, non una prova della stazione. Modifiche frontend locali, senza commit/push/deploy.


## Previsioni statistiche locali — 23 ottobre 2026

`ForecastSection` usa un feed indipendente (`forecast-feed.ts`, `use-forecast.ts`) e il worker `forecast.worker.ts`; il motore puro è `forecast.ts`. La serie fisica 30g non dipende dai filtri dei grafici. Interfaccia italiana: tre orizzonti, tre grandezze, istante previsto e dettagli su metodo, MAE, riferimento, numero dei casi, origine e scadenza. Null/sospetti, campioni vecchi, dati fittizi e date mancanti producono motivi specifici senza numeri sostitutivi. Errori di lettura/calcolo ritirano le stime; misure e grafici continuano a funzionare. La giornata indica +24 ore e non massime/minime; nessuna condizione sole/pioggia generata. [Specifica del modello e limiti](backend.md#modello-previsionale-locale-v1--23-ottobre-2026).

`npm run check` include ora anche `tests/forecast.test.mjs`; verifica modelli, mancati confronti, selezione/verifica, ricezioni tardive, scadenza, cadenza, DST, cache, recupero e stop. `tests/forecast-browser.mjs` usa fixture locali simulate e il worker reale per valori/metodi, paginazione, reflow, filtri indipendenti, errore rete, null/sospetti, scadenza e sintetici esclusi. Prove in [forecast-verification/results.json](forecast-verification/results.json). Gli screenshot con stime numeriche sono marcati come simulazioni di collaudo.

Prova frontend locale → API pubblica reale: lettura `measured_at` vuota, nove risultati indisponibili con ragione esplicita, quattro grafici delle osservazioni ancora presenti, nessun errore JavaScript. [Evidenza reale](forecast-verification/live-results.json). È una verifica funzionale dello stato indisponibile, non una previsione meteorologica reale riuscita. Modifiche locali non pubblicate.


**Esito finale del 23 ottobre:** `npm run check` superato: build, lint, 41 test Node (27 frontend + 14 modello/feed), 42 Deno e 21 Python. Sette scenari browser previsionali e 14 scenari di regressione frontend superati. API fisica reale vuota e nove stime indisponibili verificati separatamente. Nessuna validazione meteorologica o pubblicazione attestata.

**Revisione Cronologia del 23 ottobre:** `npm run build`, `npm run lint`, `npm run frontend:test` (41 test) e `git diff --check` superati. La preview browser locale non si è avviata: il sandbox ha negato il bind Vite su 127.0.0.1:4173 (`EPERM`); quindi questa revisione non ha verifica visiva interattiva. Nessuna pubblicazione.


## Pagine e indicizzazione — 23 ottobre 2026

La dashboard è servita su `/home`; `/info` contiene introduzione al progetto scolastico, descrizione documentata della stazione, semantica/provenienza dei dati e team. La radice reindirizza a `/home` nella configurazione Vercel; il router locale applica lo stesso comportamento. La navigazione collega entrambe le pagine.

La build produce `dist/home/index.html` e `dist/info/index.html` con title, description e canonical specifici. `public/robots.txt` consente la scansione e indica `https://meteolivelli.vercel.app/sitemap.xml`; la sitemap elenca solo `/home` e `/info`. Verifica e invio in Google Search Console non sono stati eseguiti: richiedono che la modifica sia pubblicata sul dominio e poi verificata nel pannello.

La pagina Informazioni (`src/pages/InfoPage.tsx`) presenta progetto, stazione e percorso dati, guida alla lettura di periodi/medie, limiti e provenienza, stime sperimentali e team. L’indice interno conduce a tutte le cinque sezioni. È dichiarato che i campioni sintetici non sono osservazioni e che il polling a 15 secondi descrive la lettura del sito, non la cadenza della stazione. Il diagramma diventa una griglia mobile 2×2. Il test frontend verifica che ogni ancora dell’indice abbia una destinazione reale.

## Quiz “Gioca con il meteo”

La route `/gioca` contiene 20 curiosità fornite dall’utente e ne estrae 10 diverse a ogni partita con Fisher–Yates. Le tre risposte vengono mescolate per ciascuna domanda e la chiave corretta segue il testo della risposta. Quando si sceglie un’opzione, un ripple circolare scalato parte dal punto di contatto e colora soltanto il pulsante selezionato; la forma usa trasformazioni per mantenere compatibilità con i browser touch. Verde e rosso hanno contrasto rinforzato nei temi scuro e chiaro, con un segno ✓/× oltre al testo. Il feedback indica se la risposta è giusta e spiega il fatto meteorologico, includendo la risposta esatta se la scelta è errata. Con `prefers-reduced-motion` il ripple si ferma e resta il colore di esito ben visibile. L’ingresso è limitato a domanda, risposte e feedback; la barra di avanzamento usa una transizione lineare di 500 ms. Al termine il quiz mostra il punteggio corrette/10. È autonomo e non legge né modifica dati meteorologici. Navigazione, metadati statici e sitemap includono la route.

Verifiche locali: `npm run build`, `npm run lint`, 41 test frontend e `git diff --check` superati; controllati i due HTML compilati, i canonical/title/description, robots e sitemap. La preview browser non è stata possibile: il container ha negato l'apertura del server locale (`EPERM`). Nessuna pubblicazione o invio alla Search Console eseguiti.

## Esportazione PDF

La sezione Archivio offre “Scarica PDF dei grafici” per il periodo selezionato. Al clic il browser rilegge lo storico aggiornato; Auto legge prima l’ultimo campione e ancora i dati al suo `captured_at`. Il documento usa `prepareChart`, come la UI: tre grafici vettoriali con unità e finestre coerenti, medie 09:00–18:00 per 7/14/30 giorni e interruzioni sui dati null/sospetti. Il PDF annota istante di generazione, periodo e regole di lettura.

La sezione Cronologia offre “Scarica PDF della cronologia completa”. Al clic ripete `readAllHistory`, completa tutte le pagine `period=all` e rifiuta errori o cursori incoerenti prima di creare il file. La tabella A4 orizzontale contiene una riga per campione, intestazione ripetuta, acquisizione sul PC, misura fisica, ricezione server e temperatura/umidità/pressione. Null, probabili errori e campioni `SINTETICO` sono indicati; i campioni senza acquisizione usano la ricezione solo per l’ordinamento e non la presentano come ora di misura. La generazione avviene nel browser sul contenuto appena letto; nessun file è salvato sul server.

`pdfmake` e i font sono caricati dinamicamente solo all’avvio dell’esportazione. `src/pdf-download.ts` verifica il MIME PDF, imposta il nome datato e revoca l’URL temporaneo. Un errore di lettura o generazione mostra lo stato e non avvia un download parziale.

Verifiche: `npm run check` superato con 68 test frontend, 44 Deno e 23 Python, oltre build/lint; generati e riaperti con PDFKit PDF effettivi per grafici e cronologia. Prova multipagina con 300 righe sintetiche: 11 pagine, intestazione presente su tutte, ultima acquisizione e ultimo valore leggibili. GET pubblico del 23 ottobre con `period=all`: 11 record, base `captured_at`, nessun cursore successivo. La prova multipagina usa dati sintetici e non è un collaudo visivo della stazione.
