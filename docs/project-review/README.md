# Revisione del progetto — 23 ottobre 2026

## Perimetro ed esito

Checkout analizzato: `6e5f197`, directory di lavoro inizialmente pulita. Confronto prioritario `93ddb98..6e5f197`: 69 commit raggiungibili, 68 attribuiti a Nickybo e uno a Pietro, merge inclusi. L'attribuzione è quella dei metadati Git, non una deduzione sull'identità di chi ha scritto ogni riga. Il range comprende quiz, Informazioni, cronologia completa e PDF; la modifica di Pietro `c43f62a` è stata considerata nel confronto.

Esito dell’audit iniziale: **quattro difetti applicativi verificati**, più incoerenze documentali corrette (COR-013). Successivamente, su richiesta utente, COR-009–COR-012 sono stati corretti localmente; le prove originali restano nei paragrafi seguenti. Nessuno schema o cronologia Git è stato modificato. Non è una certificazione di assenza di altri difetti o vulnerabilità.

| ID | Priorità | Problema verificato | Introduzione / area |
|---|---|---|---|
| COR-009 | Media | Cursore senza microsecondi: lo storico può ripetere pagine e fallire | `d09f03b`: fallback `received_at` usa la normalizzazione preesistente |
| COR-010 | Media | PDF grafici con dati sintetici senza etichetta di provenienza | `b714d87`, `5dc40a1`; permane dopo `53d9e1c` |
| COR-011 | Media | Cronologia ferma al caricamento iniziale, mentre latest si aggiorna | `fe6e314`, `useCompleteHistory` |
| COR-012 | Bassa | Bordo destro della tabella PDF oltre il foglio A4 | `91343d7`, `buildHistoryDocument` |
| COR-013 | Bassa | Stato corrente, vincolo download e contratto descritti in modo superato | Documentazione; corretto in questa revisione |

La tabella elenca i problemi rilevati inizialmente; stato corrente in `CORRECTIONS.md` e nella sezione finale. Le priorità seguono la scala di `CORRECTIONS.md`: COR-009 blocca la funzione di consultazione/esportazione nei casi riprodotti, senza perdita dei record persistiti. Non è stato riscontrato un blocco generale del sito.

## COR-009 — Precisione del cursore e storico completo

In `supabase/functions/read-measurements/handler.ts`, il tempo del cursore è prodotto con `new Date(time).toISOString()`. La migrazione `20261023120000_unbounded_measurement_history.sql` confronta invece la coppia esatta `(coalesce(captured_at, received_at), ingestion_id)`. `received_at` ha default `clock_timestamp()` nello schema iniziale e può contenere sei cifre decimali: `.123456` diventa `.123` nel cursore.

La pagina successiva può includere nuovamente la riga appena restituita, indipendentemente dall'UUID, perché il timestamp originale è maggiore della soglia troncata. Con 501 fixture storiche nello stesso millisecondo, `readAllHistory` riceve due volte le stesse prime 500 righe e lo stesso cursore, quindi fallisce con `Cursore ripetuto`. Se i timestamp sono distribuiti, può invece soltanto rileggere e deduplicare alcuni record: il guasto non si verifica necessariamente per ogni archivio.

La riproduzione iniziale è stata convertita nella regressione positiva [reproduce-history-cursor.mjs](reproduce-history-cursor.mjs): usa handler e lettore reali, store simulato che replica il confronto SQL con precisione al microsecondo. Nessun database o accesso di rete:

```sh
./node_modules/.bin/deno run --no-prompt --deny-env --deny-net --deny-read --deny-write docs/project-review/reproduce-history-cursor.mjs
```

Output storico prima della correzione: `defectReproduced: true`, 2 richieste, soglia `2026-10-23T10:00:00.123Z`, originale `2026-10-23T10:00:00.123456+00:00`, errore `Cursore ripetuto`. Dopo la correzione lo script recupera tutti i 501 UUID esattamente una volta e stampa `defectFixed: true`, mantenendo `cursorTime` a sei decimali.

Correzione proposta: preservare la precisione del tempo nella coppia cursore/query e allineare il validatore; arrotondare in alto farebbe saltare righe e non è una soluzione. Verificare limiti di pagina con molti record nello stesso millisecondo, UUID non correlati all'ordine temporale, fallback senza acquisizione e normale `captured_at`.

## COR-010 — Provenienza persa nel PDF dei grafici

`buildGraphsDocument` e `buildPdfChart` non riportano `acquisition_kind` né una dichiarazione di dati sintetici. La postilla nella Home non viene inclusa nel file. Una fixture `synthetic` a 24 ore produce un PDF di tre pagine con valori e titoli, senza `SINTETICO` o avvertenze equivalenti nel testo estratto. Il PDF della cronologia, sullo stesso input, contiene correttamente `SINTETICO`.

Il difetto è nel documento, non nella validazione delle previsioni: `buildForecast` esclude i sintetici. I conteggi aggiunti da `53d9e1c` descrivono campioni e medie, non la loro provenienza. Anche la lettura 24h ammette campioni live e sintetici insieme.

Correzione proposta: rendere persistente nel report la natura delle serie effettivamente tracciate, comprese le serie miste e le differenze di selezione fra Auto/24h e medie. Verificare PDF con soli sintetici, soli live e serie miste per tutti i periodi, estraendo testo e controllando le pagine renderizzate.

## COR-011 — Cronologia non aggiornata a pagina aperta

`useCompleteHistory` esegue l'effetto solo al mount o al cambio di `attempt`; il retry è mostrato soltanto dopo un errore. Non osserva latest, timer, visibilità o ritorno online. La precedente tabella usava il feed aggiornato: l'estrazione della cronologia in un hook separato ha perso tale aggiornamento.

Prova Chrome locale su build, API intercettata e orologio controllato: archivio iniziale con una riga, poi API con due righe e avanzamento di 16 secondi. Le chiamate latest passano da 2 a 4, `period=all` resta a 1; hero aggiornata a `22,0 °C`, cronologia ancora `1 campioni registrati.`. I due latest iniziali derivano anche dal feed previsionale, non da due caricamenti della cronologia. Nessun errore JavaScript. Il PDF cronologia rilegge invece i dati e scarica due righe: tabella e download possono divergere.

Correzione proposta: riconciliare la cronologia quando cambiano i dati o consentire un aggiornamento esplicito dopo successo, dichiarando l'istante dello snapshot. Evitare di rileggere indiscriminatamente l'intero archivio ogni 15 secondi. Verificare nuovo live, import storico che non cambia latest, ritorno online/visibilità, errore con recupero e mantenimento della pagina selezionata.

I due PDF usati nel confronto si rigenerano senza rete con `node docs/project-review/reproduce-pdf.mjs`; lo script [reproduce-pdf.mjs](reproduce-pdf.mjs) stampa i percorsi temporanei e usa esclusivamente una fixture dichiarata sintetica.

## COR-012 — Tabella PDF fuori pagina

In `src/pdf-history-document.ts`, le sette larghezze fisse sommano 776 pt; vanno aggiunti padding e bordi. Il foglio A4 orizzontale misura 841,89 pt e i margini laterali sono 28 pt. Il bordo destro effettivamente estratto dal PDF è a **867,5 pt**, oltre il foglio di **25,61 pt** e oltre il margine utile di **53,61 pt**.

Rendering Poppler e ispezione visiva confermano che la tabella arriva al taglio destro: [schermata della fixture sintetica](history-table-overflow.png). Sul campione ordinario `1015,8 hPa` il testo resta leggibile; non è corretto affermare che ogni valore di pressione venga già tagliato. Il bordo e parte dell'area della colonna sono però certamente fuori pagina.

Correzione proposta: ridimensionare le colonne considerando padding e bordi o usare larghezze flessibili. Verificare tutte le pagine contro il rettangolo utile, valori lunghi/sospetti, dati mancanti, date CET/CEST e intestazioni ripetute. Controllare che il motore produca un PDF valido non basta a garantire che la tabella entri nel foglio.

## COR-013 — Documentazione corretta

Corrette le intestazioni correnti di `plan.md` e `tasks.md`, che descrivevano ancora due pagine non pubblicate, nonostante i checkpoint successivi. RF6 e D11 ora recepiscono la richiesta PDF già registrata; le formulazioni precedenti restano storiche e sono esplicitamente superate da tale richiesta. Non è stata dedotta una nuova autorizzazione alla pubblicazione.

Nel README, eliminate le affermazioni secondo cui tutte le modifiche successive al logo sarebbero ancora locali e l'ingestione rifiuterebbe sempre i sintetici: il validatore ammette `synthetic` con provenienza esplicita e vincoli temporali. Separati il batch storico da dieci righe e il verbale successivo da undici, senza inventare un conteggio remoto corrente. Corretta anche la descrizione che confondeva la cronologia con i soli 30 giorni del feed grafici.

I verbali pubblici precedenti restano evidenze datate: non sono stati cancellati, riconfermati o trasformati in verifiche di questa sessione. I problemi applicativi rimangono aperti.

## Copertura e verifiche eseguite

| Area | Verifica svolta | Limite |
|---|---|---|
| Git e documentazione | Stato iniziale, cronologia/autori, diff recente, roadmap, task, correzioni e guide pertinenti | Nessun fetch, commit, push o verifica della produzione |
| Frontend | Route/static metadata, quiz, consenso, temi, letture/polling, grafici, forecast e PDF; 72 test Node | Nessuna certificazione di accessibilità o validità legale dell'informativa |
| Backend | Handler, validazione/CSV, store RPC, configurazione e migrazioni; check/lint e 44 test Deno | SQL letto staticamente; nessun test SQL contro PostgreSQL, migrazione o deploy |
| Uploader | Cattura, identità file, outbox, trasporto/retry e CLI; 23 test Python | Nessun writer/Arduino/PC Windows reale |
| Build e dipendenze | `npm ci` da lockfile, `npm run check` completato con exit 0 | Prima prova con dipendenze incomplete fallita su `pdfmake`, non classificata come bug del repository |
| Browser | Chrome headless sulla build locale, API sintetiche intercettate, Home/quiz senza overflow a 320/390/1280 px; entrambi i download da pulsante riusciti | Non eseguito il runner storico completo; nessuna chiamata ai servizi dell'app nel browser |
| PDF | Generazione reale, estrazione testo/geometria con pdfplumber, rendering Poppler e ispezione PNG della tabella | Fixture sintetiche; nessuna nuova prova di carico mobile o PDF pubblico |

La suite Python passa ma emette un `ResourceWarning` per una connessione SQLite non chiusa nei test. Non è stato dimostrato un leak nel processo uploader di produzione, che chiude il database nel `finally`; non viene registrato come guasto applicativo.

La prova tastiera del quiz ha permesso selezione e passaggio alla domanda successiva; il Tab successivo raggiunge la prima risposta. Non è una verifica con lettore di schermo. Le 20 domande non sono state sottoposte a validazione scientifica esterna in questo audit.

Restano i limiti già documentati: CSV/writer e timestamp reali, installazione Windows, qualità sensori, validazione meteorologica, quote/volume, latenza reale, backup/restore e avvisi. La suite verde e i download riusciti dell’audit iniziale non chiudevano questi task né i quattro difetti riprodotti; le correzioni successive hanno prove dedicate descritte sotto.


## Correzioni locali successive alla revisione

Richiesta del 23 ottobre: sistemare i difetti eccetto la provenienza sintetica nei PDF grafici; decisione poi superata il 26 ottobre dalla richiesta di correggere tutti i problemi. COR-010 è stato corretto localmente in quella data; nessun record cancellato. Le fixture delle verifiche restano soltanto dati di collaudo.

| Problema | Correzione locale | Prova |
|---|---|---|
| COR-009 | Il cursore conserva fino a sei decimali, valida calendario/confini senza arrotondare e accetta i vecchi cursori a tre decimali. Tabella e PDF ordinano i microsecondi prima degli UUID | 1.201 record nello stesso microsecondo, tre pagine, tutti gli UUID recuperati; confini sub-millisecondo e date invalide; test Node su ordine di timestamp distinti nello stesso millisecondo |
| COR-011 | Rilettura al cambio dell’ultimo UUID, ritorno visibile e online; pulsante manuale per importazioni storiche e data dello snapshot. Dati e pagina mantenuti in aggiornamento/errore, richieste superate annullate | 10 controlli Chrome su build locale, API intercettata: novità, polling invariato senza riletture integrali, import manuale, errore/recupero, online, visibilità e reflow 320/390/1280 px |
| COR-012 | Colonne dei valori flessibili, orari ridimensionati entro A4 | Test sul layout PDF reale multipagina; 300 fixture su 16 pagine con null, pressione lunga e CET/CEST. Bordo massimo 813,39 pt entro il limite utile 813,89 pt; testo nei margini, intestazioni e ultima riga presenti |
| COR-010 | Ogni grafico PDF dichiara provenienza effettiva, con conteggi aggregati per origine | Test dei casi sintetico/storico/misto e delle modalità; generazione PDF. Nessuna estrazione/rendering di tutte le varianti |
| COR-014 | Tracker attivi per default, opt-out persistente, GA4 con ads storage negato e `page_view` esplicito singolo | Test unitari di stato/coda/URL. Ricezione live e stop end-to-end non verificati |

`npm run check` finale: build/lint, **74 test frontend, 46 Deno e 23 Python** superati. Rimane il warning SQLite nei test già annotato; nessun guasto runtime attribuito a tale avviso. Non è stato eseguito un test SQL su PostgreSQL: la regressione del cursore usa handler/lettore reali e confronto SQL simulato con precisione esatta. Non cambiano query o schema: nessuna migrazione necessaria.

Prove conservate: [browser](fixes-browser-results.json), [geometria e testo PDF](fixes-pdf-results.json), [schermata tabella corretta](history-table-fixed.png). Lo screenshot originario resta conservato come prova del difetto iniziale. Il runner aggiunto è `tests/complete-history-browser.mjs`, eseguibile con Playwright esterno come gli altri runner browser:

```sh
node tests/complete-history-browser.mjs /percorso/playwright/index.mjs /percorso/chrome http://127.0.0.1:5189/home/
```

La cronologia non viene riscaricata interamente a ogni polling invariato. Importazioni che non cambiano latest sono riconciliate dal comando manuale e al ritorno visibile/online. La data di rilettura usa l’orologio del browser, non certifica il tempo della misura né la freschezza della stazione.

Al momento della verifica descritta qui, le correzioni erano locali e non avevano comportato commit, push, nuove righe o cancellazioni. Il successivo batch di dieci campioni sintetici è documentato in [data-preview](../data-preview.md) ed è stato aggiunto senza sovrascrivere record. Le correzioni frontend di questo verbale richiedono pubblicazione per raggiungere la produzione; i collaudi reali, UI-02, backup/restore e validazione WX restano aperti.
