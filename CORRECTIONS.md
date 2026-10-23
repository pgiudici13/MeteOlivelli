# Registro delle correzioni — MeteOlivelli

Ultima verifica: 23 ottobre 2026, correzioni locali successive all’audit di `6e5f197`. COR-009, COR-011 e COR-012 risolti localmente; COR-010 non modificato su richiesta utente; COR-013 documentale risolto. [Perimetro, prove e limiti](docs/project-review/README.md). Nessuna pubblicazione o modifica remota eseguita.

Stati ammessi: `aperto`, `in analisi`, `risolto`, `non riproducibile`.
Priorità: alta (perdita dati/accesso indebito/blocco), media (funzione compromessa), bassa (problema circoscritto con alternativa praticabile).

## COR-001 — Eccezione per `.env.example` inefficace

- **Stato:** risolto (21 ottobre 2026, SET-01).
- **Area/file:** `.gitignore`, righe 31 e 33 prima del setup; ora regole finali `.env*` e `!.env.example` in quest’ordine.
- **Problema:** l'eccezione `!.env.example` è seguita dalla regola `.env*`, che ignora nuovamente il file. L'eccezione dichiarata non ha effetto.
- **Prova/riproduzione:** eseguire `git check-ignore -v --no-index .env.example`. Il risultato osservato è `.gitignore:33:.env* .env.example`, con exit code 0. Non serve creare il file o leggere variabili ambiente.
- **Impatto/priorità:** bassa. Un futuro esempio di configurazione privo di segreti non verrebbe incluso con un normale `git add`. Non è prova di esposizione di credenziali; la protezione dei file ambiente reali resta presente.
- **Correzione proposta:** ordinare le regole in modo che l'eccezione per `.env.example` venga dopo tutte le regole generali pertinenti, oppure eliminare la regola ridondante dopo revisione. Correzione eseguita nel setup: rimosse regole ridondanti, eccezione collocata dopo `.env*`; rimossa anche la regola che ignorava il nome `.gitignore`, mantenendo il file tracciato.
- **Verifica necessaria:** confermare che `.env.example` non sia ignorato e che `.env`, `.env.local` e un nome ambiente di prova restino ignorati, usando soltanto nomi di file. Verificare che ogni eventuale esempio contenga solo segnaposto.

**Esito della verifica:** `git check-ignore --no-index --quiet` restituisce 1 per `.env.example`, `supabase/functions/.env.example` e `.gitignore` (non ignorati), 0 per `.env`, `.env.local`, `.env.production`, i corrispondenti nomi server `.env.local`/`.env.production`, `.vercel/repo.json`, `node_modules/example` e `dist/example` (ignorati). Verificati soltanto nomi; gli esempi hanno valori vuoti. La verifica con `-v` può mostrare anche una regola negativa: l’exit code senza `-v` distingue il risultato effettivo.

## COR-002 — Riepiloghi e struttura documentale non coerenti

- **Stato:** risolto nella documentazione locale (22 ottobre 2026).
- **Area/file:** `README.md`, `plan.md`, `tasks.md`.
- **Problema/prova:** README descriveva Figma come ancora da preparare, mentre piano e attività registravano v5. Le 29 intestazioni task comprendevano 5 completati e 24 aperti, contro il riepilogo di 23. Una riga vuota interrompeva la tabella esecuzioni prima di frosted v4. La Definition of Done definiva “setup completo” l’MVP applicativo, mentre il setup locale risultava già completato.
- **Impatto/priorità:** bassa; stato del lavoro ambiguo e registro Markdown malformato.
- **Correzione:** allineati README e conteggi, ricomposta la tabella, distinti setup locale e MVP rilasciabile; intestazioni correnti aggiornate. Conservate evidenze storiche e modifiche locali preesistenti.
- **Verifica necessaria:** ricontare intestazioni/checkbox, verificare righe contigue della tabella, rileggere README/Definition of Done e controllare diff/collegamenti locali.
- **Esito:** 29 task, 5 completati e 24 non completati (UI-00 parziale); tabella esecuzioni contigua e riferimenti correnti coerenti. Nessun test applicativo attestato da una correzione documentale.

## COR-003 — Numerazione delle fasi divergente tra piano e checklist

- **Stato:** risolto localmente (22 ottobre 2026).
- **Area/file:** `plan.md`, `tasks.md`, `AGENTS.md`.
- **Problema/prova:** il blocco 5 di tasks.md descriveva database/ingestione mentre la Fase 5 del piano descriveva l’uploader. La richiesta “Fase 5” ammetteva due interpretazioni. L’utente ha chiarito che si riferisce sempre ai blocchi di tasks.md e ha richiesto la sincronizzazione.
- **Impatto/priorità:** bassa; possibile avvio del blocco di lavoro sbagliato.
- **Correzione:** fasi operative 3–8 identiche nei due documenti, raggruppati i sottoargomenti senza rimuovere requisiti. Rimandi correnti aggiornati; vecchia numerazione etichettata come storica. Convenzione registrata in AGENTS.md.
- **Verifica:** confronto intestazioni, riferimenti e checklist; Fase 5 = BE-02–BE-07, Fase 6 = uploader, Fase 7 = frontend/previsioni, Fase 8 = backup/rilascio.

## Come registrare nuove correzioni

1. Verificare il problema nel repository oppure citare la segnalazione esplicita dell'utente, distinguendola da una riproduzione indipendente.
2. Assegnare un ID progressivo e compilare i campi del modello. Non copiare segreti, payload sensibili o dati personali nelle prove.
3. Spostare le questioni non dimostrate e le funzionalità ancora da progettare in `plan.md`; l'assenza dell'uploader o della dashboard nel template non è, da sola, un bug.
4. Passare a `risolto` soltanto dopo una verifica documentata. Per `non riproducibile` annotare ambiente, tentativi ed eventuali limiti; non cancellare la storia della voce.

### Modello

```text
ID: COR-NNN
Stato: aperto | in analisi | risolto | non riproducibile
Area/file:
Descrizione:
Prova o riproduzione (o fonte della segnalazione):
Impatto/priorità:
Correzione proposta:
Verifica necessaria:
Esito e data della verifica:
```

Esito storico del setup: `npm run check` passa su copia senza `.env`: lint/build frontend, typecheck/lint backend e 3 test backend. Non esiste uno script npm generico `test`: i test disponibili si eseguono con `backend:test`. La revisione documentale del 22 ottobre non modifica codice e non riesegue questi controlli. Nessuna verifica funzionale dei servizi remoti viene attestata.

## COR-004 — Modalità e record dimostrativi rimossi su richiesta

- **Stato:** risolto per decisione utente (22 ottobre 2026).
- **Area/file:** `src/App.tsx`, `src/demo.ts` (rimosso), `supabase/functions/read-demo-measurements/` (rimosso), Supabase `station_measurements` e funzione Edge.
- **Problema segnalato:** l'utente non vuole più una modalità dimostrativa e richiede solo la versione finale.
- **Prova:** prima della rimozione, SQL aveva verificato 50 righe isolate `meteolivelli-demo-20261022`; l'uploader di prova aveva inoltre lasciato 6 righe storiche sintetiche sotto `meteolivelli`.
- **Correzione:** rimossi selettore/client/handler demo, cancellate esattamente le 50 righe demo e i 6 UUID esatti del test uploader, rimossa l'Edge Function remota, spostata la fixture CSV nella directory test. Endpoint e schema reali mantenuti.
- **Verifica:** `DELETE ... RETURNING` ha confermato 50 + 6 righe eliminate; la query finale non restituisce record per le sorgenti demo o `meteolivelli`. L'inventario Supabase mostra soltanto `ingest-measurement` e `read-measurements` ACTIVE v3. `npm run check` superato: build/lint, 16 test frontend, 39 Deno e 21 Python; la UI locale restituisce stati vuoti via endpoint reale.


## COR-005 — Hover dei filtri illuminava il divisore della sezione

- **Stato:** risolto localmente il 22 ottobre 2026.
- **Problema segnalato:** passando su “7 giorni” si illuminava anche la linea sopra “Archivio della stazione”.
- **Prova:** la precedente regola `.panel:hover` includeva la sezione contenitrice, che risultava in hover anche sopra i suoi discendenti.
- **Impatto:** riscontro visivo esteso a elementi diversi dal controllo puntato.
- **Correzione:** eliminata l’illuminazione dei contenitori di sezione; riflesso localizzato sul solo bersaglio più vicino al puntatore.
- **Verifica:** scenario browser conferma un solo bersaglio attivo e divisore archivio invariato (`rgb(61, 58, 57)`) durante l’hover di “7 giorni”.


## COR-006 — Contenuti visibili prima dell’animazione d’ingresso

- **Stato:** corretto localmente il 22 ottobre 2026.
- **Prova:** glitch segnalato dall’utente; gli observer venivano registrati in `useEffect` senza uno stato iniziale nascosto.
- **Impatto:** contenuti già visibili che scomparivano all’avvio della dissolvenza.
- **Correzione:** stato pendente applicato prima del paint e rimosso all’ingresso; fallback e focus tastiera espliciti.
- **Verifica:** build/lint, 16 test frontend e 13 scenari browser superati; scheda fuori vista con opacità zero, disegno attivo all’ingresso e nessuno stato nascosto residuo con movimento ridotto.


## COR-007 — Curva del grafico iniziale spezzata durante l’animazione

- **Stato:** corretto localmente, 22 ottobre 2026; pubblicazione non eseguita in questa revisione.
- **Prova:** screenshot e segnalazione dell’utente mostrano più segmenti disgiunti durante il refresh; il tracciato usava dash normalizzati e stroke non scalabile.
- **Impatto:** la progressione grafica sembrava introdurre buchi assenti nella serie.
- **Correzione:** unica maschera SVG che scopre curva, area e punti da sinistra a destra a velocità costante, senza dash; assi e testi restano separati.
- **Verifica:** test browser mette la maschera a metà durata, controlla il 50% della larghezza ed easing lineare e conferma l’assenza di tratteggio. Conservati riduzione movimento e ingressi senza lampeggio. Verifiche su scale e fuso con test Node dedicati.


## COR-008 — Auto rifiutato per formato del timestamp PostgreSQL

- **Stato:** risolto localmente il 23 ottobre 2026; frontend non ancora pubblicato.
- **Prova:** segnalazione utente e GET pubblico con `until=2026-10-22T19:43:00+00:00` (correttamente URL-encoded) restituisce HTTP 400 `invalid_query`; latest restituisce proprio quel formato. I precedenti mock non applicavano il validatore API.
- **Impatto/priorità:** media; Auto non carica storico e grafici.
- **Correzione:** normalizzazione UTC canonica, inclusione dei microsecondi con arrotondamento superiore e conservazione della finestra storica nei polling invariati.
- **Verifica:** 27 test Node, 42 Deno (incluso feed contro validatore reale), 21 Python, build/lint e 14 scenari browser superati. Browser locale con API reale mostra quattro grafici e dieci campioni sintetici senza HTTP 400; evidenze in `docs/auto-verification/`.

## COR-009 — Il cursore della cronologia perde i microsecondi

- **Stato:** risolto localmente il 23 ottobre 2026; produzione non aggiornata in questa sessione.
- **Area/file:** `supabase/functions/read-measurements/handler.ts`, migrazione `20261023120000_unbounded_measurement_history.sql`; `src/weather.ts` / `readAllHistory`.
- **Problema/prova:** il fallback `received_at` introdotto da `d09f03b` passa per `Date.toISOString()`, che riduce `.123456` a `.123`. Il confronto SQL conserva invece i microsecondi. Con 501 record storici nello stesso millisecondo, le prime 500 righe e il cursore si ripetono; il lettore fallisce con `Cursore ripetuto`. [Riproduzione eseguibile senza rete/DB](docs/project-review/reproduce-history-cursor.mjs), handler e lettore reali con store simulato preciso al microsecondo.
- **Impatto/priorità:** media; cronologia e PDF non disponibili nei casi riprodotti, nessuna perdita dei dati persistiti dimostrata. Il troncamento era preesistente; la nuova lettura `all` lo applica anche alla ricezione generata dal database.
- **Correzione proposta:** preservare la precisione della coppia tempo/UUID in cursore, validatore e query; non arrotondare in alto, perché salterebbe righe.
- **Verifica richiesta:** recuperare tutti gli UUID di oltre 500 record, anche nello stesso millisecondo, con timestamp/UUID non correlati e fallback senza acquisizione; nessun cursore ripetuto o campione mancante. Aggiungere collaudo SQL dedicato.

- **Esito della correzione:** cursore UTC con precisione fino a sei decimali, calendario e confini confrontati senza troncamento; vecchi cursori a tre decimali ancora validi. Anche l’ordine di tabella e PDF conserva i microsecondi prima dello spareggio UUID. Test Deno: 1.201 record nello stesso microsecondo recuperati in tre richieste, nessun UUID perso o duplicato; regressione dedicata su date invalide e soglia appena successiva a `until`. Test Node sull’ordine di microsecondi distinti. Non servono migrazioni; per la produzione occorre pubblicare l’Edge Function corretta.

## COR-010 — PDF dei grafici privo della provenienza sintetica

- **Stato:** aperto, verificato il 23 ottobre 2026 a `6e5f197`.
- **Area/file:** `src/pdf-graphs-document.ts`, `src/pdf-chart.ts`; introdotto con `b714d87` / `5dc40a1`.
- **Problema/prova:** un input `synthetic` genera tre pagine di grafici senza etichetta sintetica o avvertenza equivalente; la postilla della Home non è nel file. Verificati definizione e testo del PDF reale. Lo stesso input è correttamente etichettato nel PDF cronologia. I conteggi delle medie non esprimono provenienza.
- **Impatto/priorità:** media; il PDF condiviso può far interpretare dati di prova come osservazioni della stazione.
- **Correzione proposta:** dichiarare permanentemente la provenienza delle serie effettivamente disegnate, distinguendo sintetici/live e casi misti.
- **Verifica richiesta:** PDF solo sintetici, solo live e misti in Auto/24h/7g/14g/30g; estrazione testo e controllo visivo di ogni pagina pertinente. [Analisi](docs/project-review/README.md#cor-010--provenienza-persa-nel-pdf-dei-grafici).

- **Decisione successiva dell’utente:** escludere questa correzione perché i sintetici non saranno più usati e verranno eliminati in seguito. Difetto non corretto e non dichiarato risolto; nessuna rimozione dati eseguita o automatizzata.

## COR-011 — Cronologia ferma al caricamento iniziale

- **Stato:** risolto localmente il 23 ottobre 2026; produzione non aggiornata in questa sessione.
- **Area/file:** `src/use-weather.ts` / `useCompleteHistory`, `src/App.tsx`; introdotto da `fe6e314`.
- **Problema/prova:** l’effetto dipende solo da `attempt`; dopo successo non esiste aggiornamento o comando di refresh della tabella. Chrome locale con API intercettata: passando da una a due righe e avanzando 16 secondi, latest si aggiorna a 22,0 °C ma `period=all` resta a una richiesta e la tabella a un campione. Il PDF rilegge invece due righe.
- **Impatto/priorità:** media; tabella obsoleta a pagina aperta e possibile divergenza dal PDF appena scaricato. Il footer dichiara genericamente aggiornamento ogni 15 secondi.
- **Correzione proposta:** riconciliare le novità o consentire un refresh esplicito con data dello snapshot, evitando riletture integrali incontrollate ogni 15 secondi.
- **Verifica richiesta:** nuovo live e import storico, visibilità/rete, recupero da errore, mantenimento paginazione e coerenza tabella/PDF. [Prova dettagliata](docs/project-review/README.md#cor-011--cronologia-non-aggiornata-a-pagina-aperta).

- **Esito della correzione:** rilettura al cambio dell’ultimo UUID e al ritorno visibile/online; comando “Aggiorna cronologia” disponibile anche dopo successo e istante di rilettura esplicito. Nessuna rilettura integrale al polling invariato. Dati e pagina selezionata conservati durante aggiornamento/errore; richieste superate annullate. Dieci controlli browser locali superati, inclusi import manuale, recupero e reflow. [Risultati](docs/project-review/fixes-browser-results.json).

## COR-012 — Bordo della tabella PDF oltre il foglio

- **Stato:** risolto localmente il 23 ottobre 2026; produzione non aggiornata in questa sessione.
- **Area/file:** `src/pdf-history-document.ts` / larghezze tabella, introdotto da `91343d7`.
- **Problema/prova:** larghezze fisse 776 pt più padding/bordi: bordo destro a 867,5 pt su pagina larga 841,89 pt, oltre il margine utile destro di 53,61 pt. PDF reale misurato con pdfplumber e renderizzato con Poppler; [schermata sintetica](docs/project-review/history-table-overflow.png).
- **Impatto/priorità:** bassa; bordo e parte dell’area della colonna pressione tagliati. Sul valore ordinario testato il testo resta leggibile: nessuna perdita generalizzata dei valori attestata.
- **Correzione proposta:** dimensionare colonne includendo padding e bordi o usare larghezze flessibili.
- **Verifica richiesta:** tutte le tabelle entro i margini utili su ogni pagina; valori lunghi/sospetti, null, CET/CEST e intestazioni multipagina.

- **Esito della correzione:** colonne temporali ridimensionate e colonne dei valori flessibili. Prova PDF da 300 fixture/16 pagine con null, valore lungo e CET/CEST: bordo destro massimo 813,39 pt, interamente entro il margine utile a 813,89 pt; testo entro i margini, intestazioni ripetute e ultima riga presenti. Test Node sul layout effettivo multipagina e rendering Poppler ispezionato. [Risultati](docs/project-review/fixes-pdf-results.json), [schermata corretta](docs/project-review/history-table-fixed.png).

## COR-013 — Riepiloghi e vincoli correnti superati

- **Stato:** risolto nella documentazione locale, 23 ottobre 2026.
- **Area/file:** `README.md`, `plan.md`, `tasks.md`, `docs/frontend.md`.
- **Problema/prova:** riepiloghi ancora su due pagine non pubblicate e modifiche successive al logo solo locali; RF6/D11 escludevano download pur essendo presente la richiesta PDF; README dichiarava ingestione sintetica rifiutata, contrariamente al validatore e all’uploader esplicito; guida frontend descriveva ancora la cronologia come i 30 giorni del feed.
- **Impatto/priorità:** bassa; comportamento, autorizzazioni documentate e stato del lavoro descritti in modo contraddittorio.
- **Correzione:** aggiornati riepiloghi al checkout, RF6/D11 e prevalenza della richiesta PDF; distinti archivio completo e feed, batch storici e conteggi remoti non riverificati. Conservati i verbali storici, dichiarando che questo audit non riconferma i servizi.
- **Verifica:** confronto con Git, codice e checkpoint PDF; diff e collegamenti locali controllati. Le correzioni ai testi non risolvono COR-009–COR-012 e non chiudono task remoti o collaudi reali.
