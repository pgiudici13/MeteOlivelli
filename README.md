# MeteOlivelli

Progetto meteo del liceo Teresio Olivelli a Pavia, di Pietro Giudici e Nicholas Borin.

## Stato del progetto

Il frontend implementa la dashboard italiana dal design Figma **Obsidian UI v5**:
ultime misure, grafici 24h/7g/30g, cronologia e dettagli temporali/qualità, layout
desktop/mobile e aggiornamento ogni 15 secondi a pagina visibile. Legge soltanto
l'endpoint pubblico BE-06, senza chiavi o file ambiente. Il backend al momento
restituisce un archivio vuoto; nessun dato DEMO viene mostrato al pubblico.
Le stime sono esplicitamente indisponibili e la freschezza resta sconosciuta
finché ora di misura e cadenza reali non saranno verificate.
[Implementazione, prove e limiti frontend](docs/frontend.md).
[Push del branch e collaudo CSV sul preview online](docs/frontend-online.md):
50 campioni verificati soltanto nel browser di prova; nessuna DEMO pubblica o
importazione DB. La dashboard è nel preview del branch, senza merge in produzione.
Il backend TypeScript/Deno include
il controllo dati locale v1 (contratto JSON, validazione e flag qualità per campo),
gli handler di ingestione/lettura e una migrazione SQL preparata con prove database.
Database, RPC ed endpoint sono applicati e verificati nel progetto Supabase
MeteOlivelli scelto dall’utente (BE-07). L'uploader Python è predisposto e testato
localmente sul contratto v1, con outbox SQLite e retry; campione CSV, writer e prove
sul PC Windows restano necessari. Non è collegato alla stazione. Le previsioni non sono ancora integrate.

Chiarimento del 22 ottobre: CSV e misure devono restare conservati; 24h/7g/30g sono
filtri dei grafici. Per le nuove righe il programma Windows aggiungerà data e ora
di acquisizione sul PC, distinte dall’ora fisica della misura e dalla ricezione server.
Le stime dovranno essere calcolate dal progetto senza provider meteo esterno;
modello, fattibilità e attendibilità restano da verificare. Scelte delegate e proposta
di backup in [plan.md §18](plan.md#18-revisione-delle-criticità-e-scelte-delegate--22-ottobre-2026).

Il sito previsto è pubblico, con misure e grafici, senza account, profilazione o download.
Requisiti e decisioni sono in [plan.md](plan.md); attività, dipendenze e verifiche sono
in [tasks.md](tasks.md). Leggere [AGENTS.md](AGENTS.md) prima di intervenire.
Le prove residue sono descritte in [docs/qa.md](docs/qa.md); il CSV dimostrativo
dell'altro lavoro è conservato in [data/simulazioni/](data/simulazioni/README.md),
distinto dalla fixture usata nella prova HTTP del backend.

## Collaborazione e progettazione UI

**Stato documentato al 22 ottobre 2026:** file Figma accessibile e mockup desktop/mobile arrivato alla revisione **Obsidian v5 · DEMO**. Il design resta statico, con dati sintetici etichettati; revisione con il compagno, interazioni e QA completo restano aperti. La sessione congiunta prevista a scuola per circa due ore non è dichiarata svolta. [Riferimento Figma](https://www.figma.com/design/dMJqTphynvTgGm6yqUsVrP/MeteOlivelli?node-id=7-2) e [storia delle revisioni](docs/design-review/README.md).

Divisione del lavoro proposta: **backend/dati e integrazione** all'utente, **design UI/UX e QA** al compagno. La dashboard React è ora realizzata sulla base Obsidian v5; resta la revisione con il compagno, oltre alle prove sui dispositivi e sulla stazione reale. Per lavorare in parallelo preferire branch dedicati e pull request verso `main`.

Le fixture dei test visuali sono **sempre etichettate DEMO** nelle evidenze e non vengono incluse nella dashboard reale. Le prove visuali e responsive non sostituiscono quelle della pipeline Arduino → database. Vedere [plan.md](plan.md#sessione-di-progettazione-ui-con-il-compagno--22-ottobre-2026-programmata) e il task [UI-00 in tasks.md](tasks.md#ui-00--preparare-figma-e-il-primo-design-con-il-compagno-22-ottobre-2026).

## Requisiti locali

- Node.js 24+ per eseguire anche i test frontend TypeScript tramite il supporto nativo di Node. Vite da solo supporta `^20.19.0 || >=22.12.0`, secondo il pacchetto installato.
- npm e il lockfile del repository. Questo setup è verificato con Node 26.12.0 e npm 11.20.0.
- Deno 2.9.6 è una dipendenza di sviluppo locale installata da npm: non serve installarlo globalmente.
- Python 3.11+ per uploader e relativi test, senza dipendenze pip; verificato localmente con Python 3.15.0. Windows ancora da provare.

Docker, Supabase CLI e Vercel CLI non servono per compilare il frontend o eseguire i
controlli backend attuali. Serviranno strumenti ulteriori per prove reali e deploy,
da configurare nei task pertinenti.

## Installazione e avvio

Dal repository eseguire:

```sh
npm ci
npm run dev
```

Aprire l'indirizzo stampato da Vite. Per vedere il template non servono credenziali
o connessioni a un database. Il server di sviluppo non avvia né configura Supabase.

## Configurazione: cosa è pubblico e cosa è segreto

| File | Destinatario | Contenuto ammesso |
|---|---|---|
| `.env.example` | Collaboratori | Nomi delle future variabili frontend, con valori vuoti |
| `.env.local` | Solo PC di sviluppo, escluso da Git | Configurazione locale; non sovrascrivere il file già presente |
| `supabase/functions/.env.example` | Collaboratori | Nomi per il futuro endpoint, senza segreti |
| Eventuale file ambiente server locale | Solo backend, escluso da Git | Valori necessari alle prove autorizzate, mai copiati nel client |

Le convenzioni introdotte sono `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
per il futuro client; `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STATION_SOURCE_ID`
e `STATION_INGEST_TOKEN` per gli endpoint server.
Gli esempi non attestano quali variabili siano già presenti in `.env.local`.
Gli entrypoint Edge richiedono le variabili server all’avvio; i test usano store
simulati; il frontend usa esclusivamente il GET pubblico documentato, senza SDK o credenziali. Configurazione server e prove remote eseguite in BE-07;
[verbale e limiti](docs/backend-verification.md).

Il prefisso `VITE_` rende una variabile adatta all'esposizione nel browser: non usarlo
per segreti. Il token uploader deve restare sul PC autorizzato e sul server; una
chiave DB privilegiata non va né nel browser né nell'uploader. La credenziale DB
server scelta è service_role, custodita esclusivamente nel runtime Edge;
[matrice accessi e limiti](docs/backend-schema.md).

Non è necessario creare o copiare file `.env` per eseguire i test attuali. Non
stampare questi file o i relativi valori per diagnosticare la configurazione.

## Comandi di verifica

| Comando | Cosa verifica |
|---|---|
| `npm run lint` | ESLint su frontend e configurazioni Node; esclude esplicitamente il codice Deno |
| `npm run build` | TypeScript/Vite e bundle del frontend |
| `npm run frontend:test` | 16 test Node su contratto di lettura, serie, qualità, polling e freschezza; senza rete o segreti |
| `npm run backend:check` | Typecheck dei moduli backend con Deno |
| `npm run backend:lint` | Lint e formato dei file backend con Deno |
| `npm run backend:test` | Test backend senza accesso ad ambiente, rete o file dell'applicazione |
| `npm run uploader:test` | Test sintetici Python con SQLite temporaneo, senza rete; richiede `python3` |
| `npm run check` | Tutte le verifiche precedenti, fermandosi al primo errore |
| `npm run preview` | Anteprima della build frontend già generata |

I 39 test backend usano solo dati sintetici: 3 sulla configurazione, 14 su contratto,
numeri, qualità, UTC, storico e confronto canonico dei retry, 10 sull'adattatore CSV
provvisorio con dialetto obbligatorio e 12 su handler HTTP, conferme, errori, query
e adapter RPC simulato. Ordine/unità dichiarati
dall'utente: secondi dall'accensione, temperatura °C, umidità %, pressione hPa.
Il campione CSV/writer reale resta da verificare. Le prove BE-07 sul progetto scelto verificano
RPC, privilegi/RLS e ingestione HTTP sintetica concorrente; fixture rimosse.
Resta da provare l’acquisizione reale da CSV/Windows. Le prove SQL in `supabase/tests/`
richiedono un target esplicitamente autorizzato e non sono incluse nei test Deno.
La suite frontend nativa non richiede nuove dipendenze. Una QA browser opzionale
con Playwright esterno è descritta in [docs/frontend.md](docs/frontend.md);
le fixture positive vengono intercettate soltanto nel browser di prova.
Contratto e limiti in [docs/backend.md](docs/backend.md).

L'uploader e la procedura Windows sono descritti in [uploader/README.md](uploader/README.md).
La catena CSV sintetico → uploader → HTTPS → Supabase è stata provata con esito
positivo, rimuovendo tutti gli eventi di test: [verbale](docs/backend-csv-verification.md).
Per impostazione iniziale conserva lo storico senza attribuirgli date di misura;
la modalità di acquisizione PC richiede verifica del writer. Su Windows senza alias
`python3` eseguire i test con `py -3 -m unittest discover -s uploader/tests -v`,
separatamente dai comandi npm frontend/backend.

## Struttura essenziale

```text
src/                          Frontend React/TypeScript
public/                       Asset statici
supabase/functions/           Moduli TypeScript per il backend Deno
  deno.json                   Controlli backend e formattazione
  _shared/config.ts           Lettura richiesta di configurazione, senza effetti all'import
  _shared/config_test.ts      Test isolati, senza segreti reali
  _shared/measurement.ts      Validazione pura e qualità del contratto locale v1
  _shared/measurement_test.ts Test sintetici sui controlli dati
  _shared/measurement_csv.ts  Adattatore CSV provvisorio con dialetto esplicito
  _shared/measurement_csv_test.ts Test sintetici del parser CSV
supabase/migrations/          Migrazione applicata in BE-07
supabase/tests/               Prove SQL con rollback e protocollo concorrenza
docs/backend-schema.md        Schema, accessi e lettura
docs/backend-verification.md  Target, prove live, recupero e limiti BE-07
docs/backend.md               Contratto dati, runtime e limiti delle verifiche
docs/services.md              Inventario servizi in sola lettura e quote consultate
uploader/                     Lettore CSV provvisorio Python, outbox/retry, CLI e test
uploader/README.md            Configurazione, installazione Windows e limiti da provare
plan.md                       Requisiti e decisioni
tasks.md                      Checklist operativa ed esiti
CORRECTIONS.md                Bug confermati e correzioni verificate
```

La separazione fra frontend e Deno segue il runtime delle future Edge Functions:
[ambiente di sviluppo Supabase](https://supabase.com/docs/guides/functions/development-environment).
Installare i controlli non pubblica funzioni né applica migrazioni.
