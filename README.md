# MeteOlivelli

Progetto meteo del liceo Teresio Olivelli a Pavia, di Pietro Giudici e Nicholas Borin.

## Stato del progetto

Il frontend è ancora il template React/Vite. Il setup locale del backend è predisposto
per TypeScript/Deno, ma non esistono ancora endpoint di ingestione, schema applicativo,
uploader o collegamento ai dati della stazione. Le previsioni non sono ancora integrate.

Chiarimento del 22 ottobre: CSV e misure devono restare conservati; 24h/7g/30g sono
filtri dei grafici. Per le nuove righe il programma Windows aggiungerà data e ora
di acquisizione sul PC, distinte dall’ora fisica della misura e dalla ricezione server.
Le stime dovranno essere calcolate dal progetto senza provider meteo esterno;
modello, fattibilità e attendibilità restano da verificare. Scelte delegate e proposta
di backup in [plan.md §18](plan.md#18-revisione-delle-criticità-e-scelte-delegate--22-ottobre-2026).

Il sito previsto è pubblico, con misure e grafici, senza account, profilazione o download.
Requisiti e decisioni sono in [plan.md](plan.md); attività, dipendenze e verifiche sono
in [tasks.md](tasks.md). Leggere [AGENTS.md](AGENTS.md) prima di intervenire.

## Collaborazione e progettazione UI

**Stato documentato al 22 ottobre 2026:** file Figma accessibile e mockup desktop/mobile arrivato alla revisione **Obsidian v5 · DEMO**. Il design resta statico, con dati sintetici etichettati; revisione con il compagno, interazioni e QA completo restano aperti. La sessione congiunta prevista a scuola per circa due ore non è dichiarata svolta. [Riferimento Figma](https://www.figma.com/design/dMJqTphynvTgGm6yqUsVrP/MeteOlivelli?node-id=7-2) e [storia delle revisioni](docs/design-review/README.md).

Divisione del lavoro proposta: **backend/dati e integrazione** all'utente, **design UI/UX e QA** al compagno. Il compagno raccoglierà riferimenti visivi e creerà un wireframe desktop con indicazioni per mobile; il design potrà poi essere trasformato con l'aiuto di Codex in componenti React, da verificare manualmente. Per lavorare in parallelo preferire branch dedicati e pull request verso `main`.

La prima dashboard può usare soltanto dati dimostrativi **sempre etichettati**. I test visuali e responsive non sostituiscono quelli della pipeline Arduino → database. Vedere [plan.md](plan.md#sessione-di-progettazione-ui-con-il-compagno--22-ottobre-2026-programmata) e il task [UI-00 in tasks.md](tasks.md#ui-00--preparare-figma-e-il-primo-design-con-il-compagno-22-ottobre-2026).

## Requisiti locali

- Node.js compatibile con Vite 8: `^20.19.0 || >=22.12.0`, secondo il pacchetto installato.
- npm e il lockfile del repository. Questo setup è verificato con Node 26.12.0 e npm 11.20.0.
- Deno 2.9.6 è una dipendenza di sviluppo locale installata da npm: non serve installarlo globalmente.

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
per il futuro client, `SUPABASE_URL` e `STATION_INGEST_TOKEN` per il futuro endpoint.
Gli esempi non attestano quali variabili siano già presenti in `.env.local`.
Il codice attuale non usa ancora queste variabili per collegarsi ai servizi.

Il prefisso `VITE_` rende una variabile adatta all'esposizione nel browser: non usarlo
per segreti. Il token uploader deve restare sul PC autorizzato e sul server; una
chiave DB privilegiata non va né nel browser né nell'uploader. La credenziale DB
server sarà scelta nel task BE-03, non in questo setup.

Non è necessario creare o copiare file `.env` per eseguire i test attuali. Non
stampare questi file o i relativi valori per diagnosticare la configurazione.

## Comandi di verifica

| Comando | Cosa verifica |
|---|---|
| `npm run lint` | ESLint su frontend e configurazioni Node; esclude esplicitamente il codice Deno |
| `npm run build` | TypeScript/Vite e bundle del frontend |
| `npm run backend:check` | Typecheck dei moduli backend con Deno |
| `npm run backend:lint` | Lint e formato dei file backend con Deno |
| `npm run backend:test` | Test backend senza accesso ad ambiente, rete o file dell'applicazione |
| `npm run check` | Tutte le verifiche precedenti, fermandosi al primo errore |
| `npm run preview` | Anteprima della build frontend già generata |

I tre test backend attuali riguardano solo la lettura esplicita di configurazione
obbligatoria con valori sintetici. Non verificano CSV, ingestione, RLS, database o
servizi remoti. Il frontend non ha ancora una suite di test dedicata.

## Struttura essenziale

```text
src/                          Frontend React/TypeScript
public/                       Asset statici
supabase/functions/           Moduli TypeScript per il backend Deno
  deno.json                   Controlli backend e formattazione
  _shared/config.ts           Lettura richiesta di configurazione, senza effetti all'import
  _shared/config_test.ts      Test isolati, senza segreti reali
docs/backend.md               Runtime, configurazione e limiti del setup
docs/services.md              Inventario servizi in sola lettura e quote consultate
plan.md                       Requisiti e decisioni
tasks.md                      Checklist operativa ed esiti
CORRECTIONS.md                Bug confermati e correzioni verificate
```

La separazione fra frontend e Deno segue il runtime delle future Edge Functions:
[ambiente di sviluppo Supabase](https://supabase.com/docs/guides/functions/development-environment).
Installare i controlli non pubblica funzioni né applica migrazioni.
