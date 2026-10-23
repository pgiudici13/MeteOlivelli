# Registro delle correzioni — MeteOlivelli

Ultima verifica documentale: 22 ottobre 2026. Il setup ha corretto COR-001; la revisione delle criticità ha corretto le incoerenze documentali COR-002. Nessuna funzionalità applicativa implementata in questa revisione.

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
