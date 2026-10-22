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

## COR-004 — Campioni DEMO assenti dalla dashboard

- **Stato:** in analisi (22 ottobre 2026); correzione proposta, collaudo non completato.
- **Area/file:** `src/App.tsx`, `src/demo.ts`, `src/weather.ts`, `supabase/functions/read-demo-measurements/index.ts`, Supabase `station_measurements`.
- **Problema:** la dashboard pubblica mostra valori vuoti nonostante la presenza di 50 righe dimostrative.
- **Prova:** query SQL conferma 50 record della sorgente `meteolivelli-demo-20261022` con `acquisition_kind=historical` e `captured_at`/`measured_at` nulli. La lettura ordinaria è vincolata alla sorgente reale e filtra per data assoluta.
- **Impatto/priorità:** media, demo non visualizzabile; nessuna prova di perdita dati.
- **Correzione preparata:** PR https://github.com/pgiudici13/MeteOlivelli/pull/3 con selettore DEMO/reale e endpoint DEMO separato. Timestamp solo di visualizzazione sintetici, senza modificare DB. Edge Function ACTIVE e preview Vercel READY.
- **Verifica necessaria:** HTTP e JSON API, 50 elementi, grafici, cronologia, cambio modalità, test automatici, sicurezza, build e lint, QA browser, conferma dei filtri temporali. Nessuna di queste prove è ancora attestata come superata.
- **Esito:** aperto in attesa di collaudo; non segnare risolto né pubblicare in produzione prima della verifica.
