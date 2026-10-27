# Registro delle correzioni — MeteOlivelli

Ultima verifica: 26 ottobre 2026, correzioni successive all’audit di `6e5f197`. COR-009–COR-013 risolti; COR-010 e COR-014 inclusi nel commit `775c248`, deploy Production `READY`; ricezione e revoca GA4 restano da verificare live. COR-015 aperto per LCP mobile. [Perimetro, prove e limiti](docs/project-review/README.md).

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

- **Stato:** risolto e pubblicato nel commit `775c248` il 26 ottobre 2026; deploy Production `READY`.
- **Area/file:** `src/pdf-graphs-document.ts`, `src/pdf-chart.ts`; introdotto con `b714d87` / `5dc40a1`.
- **Problema/prova:** un input `synthetic` genera tre pagine di grafici senza etichetta sintetica o avvertenza equivalente; la postilla della Home non è nel file. Verificati definizione e testo del PDF reale. Lo stesso input è correttamente etichettato nel PDF cronologia. I conteggi delle medie non esprimono provenienza.
- **Impatto/priorità:** media; il PDF condiviso può far interpretare dati di prova come osservazioni della stazione.
- **Correzione:** ogni serie PDF riporta l’origine dei soli campioni effettivamente tracciati: stazione live/storico, sintetica, mista, non specificata o nessuna serie. Le medie mantengono i conteggi per origine.
- **Verifica:** `npm run check` supera 82 test frontend, inclusi casi sintetici, storici, misti, tutte le finestre, medie e generazione PDF. Test sul documento generato; estrazione/rendering multipagina di ogni variante non eseguiti.
- **Decisione superata:** la precedente esclusione dell’intervento è superata dalla richiesta del 26 ottobre di correggere tutti i problemi. Nessun dato remoto modificato o cancellato.

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

## COR-014 — GA4 non mostra eventi del sito

- **Stato:** raccolta verificata il 26 ottobre 2026: `page_view` inviato con HTTP 204 e 9 eventi `page_view` nel report Tempo reale. La completezza dei report ordinari e la revoca sulla nuova versione locale restano da verificare dopo un eventuale rilascio.
- **Area/file:** raccolta GA4 della proprietà `G-F2LRCD93NW`; consenso in `src/analytics.ts` e `src/components/AnalyticsConsent.tsx`.
- **Problema/prova:** schermata Analytics fornita dall’utente indica zero utenti/eventi e nessun dato ricevuto. Tag Assistant, collegato alla pagina Home pubblica in Chrome, trova `G-F2LRCD93NW` e la destinazione corretta ma riporta “Nessun hit è stato inviato da questo tag” e “Consenso non configurato”. Lo stream GA4 mostra il dominio esatto `https://meteolivelli.vercel.app`, l’ID `G-F2LRCD93NW` e nessun dato nelle ultime 48 ore.
- **Diagnosi:** `loadGoogleAnalytics()` accodava i comandi con `dataLayer.push(args)`, cioè come array, mentre il formato gtag documentato è `dataLayer.push(arguments)`. Dopo la correzione Tag Assistant vede `analytics_storage=Concesso`, i tre consensi pubblicitari negati e la configurazione del tag. Nella stessa sessione non mostra ancora hit `page_view`; il mancato invio può dipendere da rete o protezione del browser e non è stato attribuito con certezza.
- **Impatto/priorità:** media; Analytics non consente ancora di valutare visite o comportamento. La presenza dello script non dimostra che la richiesta di misurazione sia partita o sia stata accettata.
- **Correzione locale del 26 ottobre:** su decisione esplicita dell’utente e sua verifica dichiarata delle condizioni applicabili, GA4, Vercel Analytics e Speed Insights si avviano senza scelta salvata; `Preferenze statistiche` consente opt-out persistente e riattivazione. GA4 mantiene `analytics_storage=granted`, gli storage pubblicitari restano negati e invia un solo `page_view` esplicito (`send_page_view:false`); i comandi ora vengono accodati come oggetti `arguments`. L’opt-out aggiorna GA4, rimuove i cookie `_ga*` accessibili e ricarica.
- **Verifica:** `npm run check` supera lint, build, 82 test frontend, 46 test Deno e 25 test Python. Dopo il deploy `6059b1d`, Tag Assistant conferma il consenso previsto ma non un hit. **Resta da verificare:** `page_view` in Tag Assistant e Tempo reale, idealmente dopo aver consentito il tracciamento per questo sito nell’antitracker visibile nello screenshot o in un browser senza blocchi. Nessuna impostazione remota o protezione browser è stata cambiata. [Guida ufficiale gtag.js](https://developers.google.com/tag-platform/gtagjs).


## COR-015 — Prestazioni mobile da migliorare

- **Stato:** ottimizzazioni pubblicate il 26 ottobre 2026 (`eeb677f`), deploy Production `READY`; LCP 4,1 s ancora da migliorare.
- **Area/file:** bundle iniziale, logo e presentazione responsive del sito MeteOlivelli.
- **Problema/prova:** PageSpeed Insights mobile (Lighthouse 13.5, 26 ottobre 2026 alle 12:00) mostra 86/100, LCP 4,1 s, FCP 1,4 s, TBT 0 ms e CLS 0. Il report segnala immagine del logo scolastico sovradimensionata (originale 1041×359 per uno spazio di circa 200 px), assenza di dimensioni dichiarate sulle immagini, circa 310 ms di CSS render-blocking e 68,5 KiB di risparmio potenziale sulle immagini. Nel dettaglio LCP visto nel report precedente, il testo del consenso client-rendered è l’elemento LCP. Search Console non dispone di campioni CrUX sufficienti per classificare i Core Web Vitals di utenti reali; il punteggio è un laboratorio simulato.
- **Impatto/priorità:** media; LCP oltre 4 s è lento nella simulazione mobile. Accessibilità, best practice e SEO risultano 100 nel medesimo report; CLS è 0, TBT 0 ms.
- **Correzione applicata:** logo responsive 220/420 px con dimensioni intrinseche e lazy loading footer; marchio da 128 a 80 px con un solo asset tematico; importazioni dinamiche delle pagine secondarie per ridurre il JavaScript iniziale non usato. La correzione non cambia il consenso.
- **Verifica:** build, lint e 77 test frontend superati. PSI mobile post-rilascio (12:32) sullo stesso URL/form factor: 85/100, LCP 4,1 s, FCP 1,4 s, TBT 40 ms, CLS 0; stima immagini 40 KiB (da 68,5), CSS bloccante 150 ms (da 310), JS inutilizzato 44 KiB (da 52). LCP resta il problema principale e richiede ulteriore intervento; i punteggi singoli oscillano tra run. La preview browser locale era bloccata da `listen EPERM`.

## COR-016 — La persistenza veniva mostrata come previsione

- **Stato:** corretto localmente il 26 ottobre 2026; non ancora pubblicato.
- **Area/file:** `src/forecast.ts`, `src/components/ForecastSection.tsx`; modello locale `station-statistical-v2`.
- **Problema/prova:** nello screenshot della Home, +3, +6 e +24 ore ripetono esattamente 17,3 °C, 50,4% e 1014,4 hPa. Il backtest permetteva di selezionare la persistenza quando nessun candidato superava il riferimento; la persistenza copia l’ultima misura per ogni orizzonte.
- **Impatto/priorità:** alta; la ripetizione della misura sotto una sezione di previsioni può sembrare un valore calcolato per il futuro.
- **Correzione locale:** versione v3 ritira il risultato quando l’unico metodo selezionato è la persistenza; la UI spiega che l’ultimo valore è un riferimento e non viene ri-etichettato come previsione. La simulazione sintetica rimane separata, e i dati esistenti non diventano prove di meteo reale.
- **Verifica:** test mirati controllano che serie sintetiche variabili producano risultati diversi agli orizzonti +3/+6 ore, che il +24 ore senza miglioramento e le grandezze stabili restino senza valore, e che un trend verificato resti disponibile. Suite completa in esecuzione; nessuna accuratezza meteorologica o prova su dati fisici attestata.

## COR-017 — Diagnostica Google Tag: host di deploy e stato consenso Ads

- **Stato:** invio limitato al dominio pubblico con correzione locale del 26 ottobre; deploy da verificare.
- **Area/file:** `src/analytics.ts`; stream GA4 `G-F2LRCD93NW` e Tag Google `GT-MJMHDXK6`.
- **Problema/prova:** nello screenshot della diagnostica, GA4 segnala zero dati recenti e “domini aggiuntivi”; la configurazione cross-domain contiene già `meteolivelli.vercel.app` e suggerisce tre host specifici di deployment Vercel. La diagnosi del tasso consenso 0% indica tutti i segnali negati.
- **Correzione locale:** GA4 ora si carica solo sul dominio canonico, così gli URL di deployment non continuano a inviare eventi nello stream di produzione. Non si aggiungono gli host temporanei alle regole cross-domain. Il codice mantiene `ad_user_data` e i segnali pubblicitari negati: il sito non usa personalizzazione Ads e la guida Google specifica che con Consent Mode già attivo non serve un intervento in questo caso.
- **Verifica:** test locale del gate hostname e della configurazione Consent Mode; `npm run check` e prova `page_view` da browser senza blocchi ancora da completare. I suggerimenti per host che hanno già inviato hit possono restare nella diagnostica finché Google non aggiorna i domini rilevati. Non modificati impostazioni Google Ads, consenso Ads o protezioni browser.


## COR-018 — Dati di prova presentati come letture della stazione

- **Stato:** corretto localmente, 27 ottobre 2026.
- **Prova e impatto:** la Home pubblicata presentava campioni `synthetic` come ultima lettura della stazione, con sola postilla generale; una serie mista poteva combinare sintetici e reali nel grafico 24h.
- **Correzione:** dashboard, previsioni e PDF ammettono solo `live` e `historical`; escluse anche provenienze assenti. Avviso provvisorio e simulazione rimossi dalla UI su richiesta. Database e API restano invariati.
- **Verifica:** test mirati su feed, grafici e PDF con provenienze miste; browser locale con API reale e fixture intercettata. Nessun dato fisico o collaudo stazione attestato.

## COR-019 — Acquisizione futura impedisce il caricamento Auto

- **Stato:** corretto localmente, 27 ottobre 2026.
- **Prova e impatto:** fixture con ora PC futura accettata dal validatore; latest HTTP 200 e richiesta Auto HTTP 400. Grafici indisponibili finché l’ancora resta futura.
- **Correzione e verifica:** confronto con il tempo API anche a precisione microsecondo; il valore futuro è nascosto con avviso e l’archivio viene letto senza ancora futura. Test di recupero quando il tempo server raggiunge il campione e prove esistenti su microsecondi. Nessuna modifica remota.

## COR-020 — Revoca statistiche con storage indisponibile

- **Stato:** corretto localmente, 27 ottobre 2026; comportamento di rete su produzione dopo deploy non verificato.
- **Prova e impatto:** con `localStorage` non scrivibile la riattivazione lasciava GA4 negato e gli script Vercel già caricati non ricevevano un filtro di arresto.
- **Correzione e verifica:** flag di disattivazione GA4, aggiornamento consenso e filtro `beforeSend` condiviso per Web Analytics e Speed Insights. Test delle transizioni con storage che genera errore; in browser locale provate disattivazione persistente e riattivazione. Se lo storage è indisponibile, la scelta vale fino al successivo caricamento.

## COR-021 — Cronologia perde il giorno selezionato

- **Stato:** corretto localmente, 27 ottobre 2026.
- **Prova e impatto:** aggiungendo un giorno più recente, la stessa posizione numerica individuava una data diversa.
- **Correzione e verifica:** selezione per data civile con ritorno automatico al più recente quando richiesto; browser con fixture intercettata, data del 23 ottobre mantenuta dopo inserimento di un nuovo giorno.

## COR-022 — Checklist privacy e footer MIT incoerenti

- **Stato:** corretto localmente, 27 ottobre 2026.
- **Prova e impatto:** la checklist descriveva scadenza a sei mesi e consenso preventivo, mentre il client usa default attivo e opt-out persistente; il footer presentava la licenza come definitiva mentre README e CONTRIBUTING la indicano da approvare.
- **Correzione e verifica:** checklist allineata al comportamento; footer allineato allo stato della proposta. Nessuna approvazione dei titolari dedotta.

## COR-023 — Asset non referenziati

- **Stato:** corretti localmente, 27 ottobre 2026.
- **Prova e impatto:** `src/assets/hero.png`, `react.svg`, `vite.svg` e `public/icons.svg` senza riferimenti rilevati nel progetto; file superflui.
- **Correzione e verifica:** rimossi i quattro asset; build e verifiche frontend richieste.

## COR-024 — TypeScript strict disabilitato nel frontend (AUD-05)

- **Stato:** risolto (27 ottobre 2026, locale; non pubblicato).
- **Area/file:** `tsconfig.app.json`, `tsconfig.node.json`.
- **Problema/prova:** nessuna opzione `strict` dichiarata; `npx tsc --showConfig` non ne restituiva alcuna, quindi `tsc -b` non intercettava null-unsafe o `any` impliciti nel client, divergendo dal backend Deno (`"strict": true`).
- **Impatto/priorità:** media; regressioni di tipizzazione non segnalate in build.
- **Correzione:** `strict: true` in entrambi i tsconfig; il codice esistente risultava già compatibile (zero errori).
- **Verifica/Esito:** `npm run check` superato (build con `tsc -b`, lint, 95 test frontend, 47 Deno, 27 Python).

## COR-025 — Cronologia riletta integralmente ad ogni focus della finestra (AUD-04)

- **Stato:** risolto (27 ottobre 2026, locale; non pubblicato).
- **Area/file:** `src/use-weather.ts`, `src/weather.ts` (`shouldAutoRefreshHistory`).
- **Problema/prova:** `useCompleteHistory` rileggeva tutte le pagine dello storico ad ogni `visibilitychange`/`online`; con archivi pluriennali ogni focus scaricava l'intero database.
- **Impatto/priorità:** media; banda e latenza crescenti con lo storico.
- **Correzione:** stimoli automatici limitati a una rilettura integrale al minuto; cambio dell'ultima lettura e “Aggiorna cronologia” invariati. Alternativa strutturale (delta su `received_at`) documentata in `plan.md`.
- **Verifica/Esito:** test di regressione su `shouldAutoRefreshHistory`; test UI aggiornata; `npm run check` superato.

## COR-026 — Dashboard indistinguibile con sole importazioni storiche (AUD-12)

- **Stato:** risolto (27 ottobre 2026, locale; non pubblicato).
- **Area/file:** `src/App.tsx`, `src/weather.ts` (`stationStatusText`).
- **Problema/prova:** con sole righe `historical` la dashboard mostrava “Nessuna misura disponibile” mentre la cronologia era popolata.
- **Impatto/priorità:** bassa; confusione dell'utente.
- **Correzione:** stato distinto “Solo dati storici disponibili”, nota dedicata e schede “Nessuna lettura recente”.
- **Verifica/Esito:** `stationStatusText` estratto con test di regressione; `npm run check` superato.

## COR-027 — File di verifica Google e pagina 404 non serviti dal deploy (AUD-16)

- **Stato:** risolto (27 ottobre 2026, locale; non pubblicato).
- **Area/file:** `public/googlead8bb9c28d0d4e51.html` (spostato dalla root), `scripts/create-static-routes.mjs`.
- **Problema/prova:** il file di verifica stava alla root e non entrava in `dist/`; le route inesistenti ricevevano il 404 generico della piattaforma, senza la pagina brandizzata.
- **Impatto/priorità:** bassa; possibile verifica Search Console inefficace, errore 404 non brandizzato.
- **Correzione:** file servito da `public/`; il build genera `dist/404.html` con `noindex`, titolo/descrizione dedicati e SPA che rende “Pagina non trovata”; route esistenti invariate.
- **Verifica richiesta:** dopo il deploy, GET del file di verifica sul dominio e di una route inesistente (atteso status 404 con pagina brandizzata).
- **Esito locale:** output `dist/` verificato dopo build; effetto sul dominio non verificato in questa sessione.

## COR-028 — Nessun controllo di salute della pipeline (AUD-10)

- **Stato:** in analisi (strumento risolto il 27 ottobre 2026; pianificazione e notifiche aperte).
- **Area/file:** `scripts/check-station-health.mjs`, `src/station-health.ts`, `tests/station-health.test.mjs`.
- **Problema/prova:** assenza di un modo automatico di accorgersi di stazione/uploader fermi (OPS-02): un mese di dati mancanti sarebbe passato inosservato.
- **Impatto/priorità:** media; perdita di dati non rilevata.
- **Correzione:** controllo in sola lettura sull'endpoint pubblico (contratto, provenienza, età campioni sul tempo server, sincronizzazione orologio) con esiti 0/1/2.
- **Verifica richiesta:** pianificazione su dispositivo autorizzato e prova di notifica con esito ≠ 0.
- **Esito:** 6 test di regressione; smoke test reale sull'endpoint pubblico riuscito (avviso corretto: solo campioni sintetici).

## COR-029 — `measured_at` mai valorizzabile dalla pipeline (AUD-03)

- **Stato:** risolto per il supporto (27 ottobre 2026); efficacia dipendente dal writer reale (DATA-01).
- **Area/file:** `uploader/core.py` (`measured_timestamp_column`), `supabase/functions/_shared/measurement_csv.ts` (`context.measured_at`), `uploader/config.example.json`.
- **Problema/prova:** nessun componente scriveva `measured_at` (uploader e adapter lo fissavano a `null`): freschezza e previsioni fisiche sarebbero restate permanentemente indisponibili.
- **Impatto/priorità:** media; requisiti di aggiornamento e stime non verificabili.
- **Correzione:** colonna opzionale con l'ora di misura **attestata dal writer** (formato UTC rigoroso, esclusa per `synthetic`, incompatibile con la colonna scenario); pass-through esplicito nell'adapter TS. Nessuna data dedotta dall'uptime o inventata.
- **Verifica richiesta:** al campione CSV reale, verificare che il writer possa produrre l'ora di misura e che la UI la mostri come “Misura”.
- **Esito:** test Python (live+measured distinte da cattura) e Deno (attestata vs dedotta) superati; decisioni e alternative in `plan.md`.

## COR-030 — Letture `latest`/`all` con ordinamento non indicizzato (AUD-11)

- **Stato:** in analisi — migrazione e test predisposti, **non applicati**.
- **Area/file:** `supabase/migrations/20261027120000_read_query_indexes.sql`, `supabase/tests/read_query_indexes.sql`.
- **Problema/prova:** gli ORDER BY di `latest` (priorità live) e `all` (`coalesce(captured_at, received_at)`) non avevano indici corrispondenti: sort lineare per richiesta al crescere dello storico.
- **Impatto/priorità:** media (scalabilità); la verifica EXPLAIN su volume reale era già tra le verifiche aperte di `docs/backend-schema.md`.
- **Correzione proposta:** due indici (uno parziale per `latest`, uno su espressione per `all`) e `read_station_measurements` riscritta con rami separati per view/base temporale, stessa semantica.
- **Verifica richiesta:** eseguire `supabase/tests/` (incluso `read_query_indexes.sql` e `station_backend.sql`) sul target autorizzato, confrontare i risultati con la versione precedente, verificare `EXPLAIN` su volume dichiarato; applicare solo con autorizzazione esplicita.

## COR-031 — Duplicati possibili dopo perdita dello stato uploader (AUD-09)

- **Stato:** in analisi — mitigazioni documentate; alternative di contratto aperte.
- **Area/file:** `uploader/core.py` (stato/outbox), `docs/operations.md` (regole e query), `plan.md` (alternative).
- **Problema/prova:** la ricreazione dello stato uploader rilegge righe già inviate assegnando UUID nuovi; il database non deduplica sul contenuto (scelta attestata: valori uguali possono essere misure distinte — test `test_repeated_rows_and_reset_are_different_events`).
- **Impatto/priorità:** media; possibili righe duplicate con valori identici.
- **Correzione proposta:** regole operative anti-duplicati, query di rilevamento e backup dell'outbox nel runbook; alternative strutturali (unicità su contenuto+offset, ID deterministici) documentate in `plan.md` con i rischi per il riconoscimento dei riavvii e il vincolo UUID v4 del contratto.
- **Verifica richiesta:** decisione esplicita insieme a DATA-03; se si implementa un'alternativa, test dedicati su righe ripetute, reset Arduino e replay dopo perdita dello stato.

## COR-032 — Runbook backup non includeva i dati e non autenticava la cifratura

- **Stato:** corretto nella documentazione locale il 27 ottobre 2026; backup e restore non eseguiti.
- **Area/file:** `docs/operations.md`, runbook AUD-01.
- **Problema/prova:** il comando `supabase db dump` senza `--data-only` o `--role-only` produce lo schema ma non dati né ruoli, secondo la [documentazione CLI Supabase](https://supabase.com/docs/reference/cli/supabase-db-dump); la bozza archiviava quel solo file. Usava inoltre `openssl enc -aes-256-cbc`, che non fornisce autenticazione dell'artefatto. Il progetto verificato è sul piano Free e i backup gestiti giornalieri documentati da Supabase sono per piani Pro/Team/Enterprise.
- **Impatto/priorità:** alta; il file risultante non avrebbe conservato i record meteorologici e non avrebbe rilevato alterazioni del ciphertext.
- **Correzione:** runbook aggiornato con dump separati di ruoli, schema e dati; archivio proposto con cifratura autenticata `age`, checksum, snapshot SQLite coerente dell'outbox e restore isolato. CLI, `psql` e `age` non sono installati qui; Docker è disponibile.
- **Verifica:** comandi e perimetro confrontati con le guide ufficiali; controllo documentale e `git diff --check`. Resta necessario eseguire export e restore di prova su target autorizzati prima di dichiarare OPS-01 completato.
