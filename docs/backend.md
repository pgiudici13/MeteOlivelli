# Backend: setup locale e prossimi passi

## Cosa è pronto

Il backend previsto è una Supabase Edge Function TypeScript per ricevere eventi
dall'uploader Windows. Questo setup prepara soltanto runtime, configurazione e
controlli; non avvia un endpoint HTTP e non modifica il database.

Sono presenti:

- Deno 2.9.6, fissato nelle dipendenze di sviluppo npm e nel lockfile;
- `supabase/functions/deno.json`, con controlli separati da TypeScript/ESLint del frontend;
- `_shared/config.ts`, che richiede esplicitamente una variabile e segnala un valore
  mancante senza includere valori nell'errore;
- tre test con valori sintetici, eseguiti senza permessi su ambiente, rete o file applicativi;
- esempi di configurazione vuoti, distinti per browser e server.

Importare `config.ts` non legge variabili ambiente o file: il chiamante deve passare
esplicitamente un lettore. Non viene enumerato l'ambiente. Una stringa composta solo
da spazi viene rifiutata; una stringa valida viene preservata senza modificarla.

La funzione è una base per il futuro controllo della configurazione, non verifica
connessione al database, forza del token o correttezza di un payload meteorologico.

## Perché Deno è separato da React

Il codice React resta in `src/`, compilato con TypeScript/Vite e controllato da ESLint.
Il codice Edge resta in `supabase/functions/`, controllato da Deno. Il lint browser
esclude questa cartella: `npm run lint` da solo non prova il backend.

La CLI Deno è adatta ai controlli locali. Il runtime Edge di Supabase usato per
servire le funzioni è un ambiente distinto: i test qui non sostituiscono la prova
della funzione nell'ambiente effettivo. [Fonte ufficiale Supabase](https://supabase.com/docs/guides/functions/development-environment).

Non sono stati installati Docker, un database locale o servizi aggiuntivi.
Non esistono ancora `supabase/config.toml`, migrazioni o cartella dell'endpoint:
verranno creati quando servono, dopo progettazione e verifica dei comandi supportati.

## Comandi, dalla root del repository

```sh
npm ci
npm run backend:check
npm run backend:lint
npm run backend:test
```

- `backend:check` controlla i tipi di tutti i moduli `.ts` direttamente in `_shared/`.
- `backend:lint` controlla lint e formato di `_shared/` e formato di `deno.json`.
- `backend:test` cerca i test in `_shared/`, fallisce se non ci sono test e non carica `.env`.

Quando verranno aggiunti endpoint o sottocartelle, estendere gli entry point del
typecheck e i percorsi lint/test a quei file. Un file escluso dai comandi non è
automaticamente verificato: è un controllo richiesto nel task che lo introduce.
Le opzioni `--no-remote` e `--no-npm` impediscono ai controlli attuali di scaricare
moduli; non ci sono dipendenze server esterne. Aggiungerne richiederà una scelta e
un lockfile coerenti, senza rimuovere questi vincoli per nascondere un errore.

Nell'ambiente ristretto dell'agente è stato usato `DENO_DIR` su una directory
temporanea scrivibile per la cache. Non è una variabile del prodotto e non va
aggiunta a `.env.local`.

## Convenzioni per la configurazione

| Nome introdotto nel setup | Destinatario | Stato |
|---|---|---|
| `VITE_SUPABASE_URL` | Futuro browser | Pubblico; nessun client collegato oggi |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Futuro browser | Solo chiave pubblicabile; non fornisce da sola protezione dei dati |
| `SUPABASE_URL` | Futuro backend | URL server; fornito dal runtime in produzione |
| `STATION_INGEST_TOKEN` | Futuro endpoint e uploader | Segreto applicativo da generare/configurare nel task pertinente, oggi assente negli esempi |

Questi sono nomi definiti per il progetto; non descrivono il contenuto dei file
locali o delle configurazioni remote, che non è stato letto. `SUPABASE_URL` è una
variabile predefinita del runtime: [documentazione ufficiale](https://supabase.com/docs/guides/functions/secrets).

Non viene scelta ora una chiave DB privilegiata: ruoli e permessi saranno progettati
in BE-03. Eventuali segreti server non vanno nel file frontend, nel browser, nei
messaggi di errore o nell'uploader come credenziali di accesso diretto al DB.
La generazione e la rotazione del token sono attività successive, non già eseguite.

## Cosa serve prima dell'ingestione

1. **DATA-01:** campione CSV e osservazione del writer; nessun delimitatore definitivo presunto.
2. **DATA-02:** punto di timestamp sul PC, clock e buffering; storico senza date conservato senza inventarle.
3. **DATA-03:** contratto JSON, identità dell'evento e risposte di conferma/conflitto.
4. **BE-01:** validazione del contratto con test; i test di configurazione non la sostituiscono.
5. **BE-02–BE-04:** schema/accessi revisionabili prima delle migrazioni.
6. **BE-05–BE-07:** handler, lettura e applicazione richiesta nel target verificato, con prove reali.

Il contatore Arduino non è una data o un'identità evento sufficiente. Un evento
ritentato deve conservare ID e primo `received_at`. Queste regole sono requisiti
da implementare, non funzionalità già presenti nel modulo di configurazione.

Le scelte delegate del 22 ottobre sono in [plan.md §18](../plan.md#18-revisione-delle-criticità-e-scelte-delegate--22-ottobre-2026):
`captured_at` completo nell’evento quando viene osservata una nuova riga completa,
SQLite per identità/coda/cursore, endpoint di lettura limitato, valori sospetti
conservati con “probabile errato” e modello sperimentale nostro senza provider meteo.
Non equiparare il timestamp di osservazione del CSV all’ora fisica della misura.
Il contratto definitivo e il parser restano dipendenti dal campione futuro.

Vedere [tasks.md](../tasks.md) per i singoli passaggi e [plan.md](../plan.md) per
semantica, requisiti e decisioni. L'inventario corrente dei servizi è in
[services.md](services.md).
