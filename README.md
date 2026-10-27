# MeteOlivelli

**Una piattaforma meteorologica scolastica, aperta alla curiosità e all'apprendimento.**

MeteOlivelli è un progetto sviluppato da **Pietro Giudici e Nicholas Borin**, studenti del Liceo Teresio Olivelli di Pavia. L'obiettivo è rendere consultabili dal web le misurazioni di una stazione meteorologica Arduino della scuola e offrire uno strumento educativo per esplorare temperatura, umidità e pressione nel tempo.

**Sito:** [meteolivelli.vercel.app](https://meteolivelli.vercel.app/) · **Roadmap:** [plan.md](plan.md) · **Come contribuire:** [CONTRIBUTING.md](CONTRIBUTING.md)

> **Aggiornamento locale — 27 ottobre 2026:** la dashboard finale mostra solo campioni con provenienza `live` o `historical`; esclude quelli sintetici o senza provenienza anche dai PDF e dalle previsioni. La versione pubblicata non è stata ancora riconfermata.

> **Stato del progetto — 26 ottobre 2026 (storico):** la web app è online, ma l'acquisizione dalla stazione Arduino e dal PC scolastico non è ancora stata collaudata sul campo. Nel database sono presenti dati **sintetici di prova**, non osservazioni meteorologiche reali. La distinzione è essenziale anche quando il sito mostra grafici o simulazioni.

## Cosa offre

- Dashboard responsive con temperatura, umidità, pressione, tema chiaro/scuro e informazioni sui dati.
- Grafici e storico navigabile, con indicazioni su qualità, provenienza e orari; esportazioni PDF.
- Sezione educativa **Gioca con il meteo**, con quiz e spiegazioni.
- Motore di stime sperimentali: valutazioni su misure fisiche datate e verificabili.
- Backend Supabase con API di lettura e ingestione; uploader Python resiliente con SQLite, ancora da provare sul PC Windows della scuola.

**Flusso previsto, non ancora validato sul dispositivo reale:** sensori → Arduino → file CSV sul PC Windows → uploader Python → Supabase → dashboard web.


## Stato del progetto

Il sito è online su [meteolivelli.vercel.app](https://meteolivelli.vercel.app/), pubblicato da `main` tramite GitHub → Vercel. La dashboard è su `/home`; `/info` presenta il progetto, la stazione e la provenienza dei dati. Sono disponibili tema chiaro/scuro, logo scolastico e layout responsive. Il codice conserva lo stack React/TypeScript/Vite.

La schermata [Gioca con il meteo](https://meteolivelli.vercel.app/gioca) è disponibile su `/gioca`: presenta dieci domande casuali fra venti curiosità, mescola le risposte e spiega il risultato di ogni scelta.

La dashboard mostra temperatura, umidità e pressione, grafici e cronologia con qualità e orari. Legge l’endpoint pubblico senza chiavi client; ultimi valori e feed dei grafici si aggiornano ogni 15 secondi mentre la pagina è visibile. I 15 secondi indicano la frequenza di lettura del sito, non quella della stazione. La cronologia completa si rilegge quando cambia l’ultima lettura e al ritorno alla pagina o online; “Aggiorna cronologia” recupera anche importazioni storiche. Non viene riletta integralmente a ogni polling. I tempi fisici, PC e server restano distinti. Il modello statistico locale è sperimentale: la modalità fisica usa osservazioni reali ammesse e propone +30 minuti, +1 ora e +24 ore solo quando i dati sono sufficienti. La revisione locale esclude le simulazioni dalla dashboard.

**Dati di prova:** l’ultima verifica documentata il 26 ottobre 2026 riporta 251 campioni `synthetic` nel database finale, inclusi 10 aggiunti ai 241 precedenti. Sono dati fittizi, non osservazioni Arduino; il loro numero attuale non è stato riverificato. La revisione locale nasconde questi campioni e rimuove la postilla provvisoria. [Contratto ed evidenze](docs/data-preview.md).

Il backend Supabase (database, RPC e funzioni di ingestione/lettura) è applicato. Il contratto locale di ingestione ammette il tipo sintetico soltanto con provenienza esplicita `_provenance.kind=synthetic`; la lettura pubblica ne conserva la provenienza. L’uploader Python con outbox SQLite e retry è implementato e testato, ma campione CSV, writer e installazione Windows/Arduino restano da verificare. Le stime fisiche usano soltanto osservazioni reali ammesse; nessuna fonte meteo esterna è integrata.

I verbali documentano i rilasci e le verifiche eseguite in date diverse; il checkout locale include anche quiz, cronologia completa, PDF e previsioni basate sulle misure fisiche. La versione effettivamente distribuita e le funzioni Edge non sono state riconfermate in questa revisione. Restano aperti il collaudo della stazione reale, backup/restore, avvisi e validazione meteorologica: si veda la **Fase 8** in [tasks.md](tasks.md#8-fase-8--backup-gestione-e-rilascio).

**Revisione grafici successiva, pubblicazione richiesta il 22 ottobre:** Auto predefinito, scala adattiva e medie per fascia nell’ultima settimana disponibile; disegno lineare più rapido. Le viste manuali rimangono. [Specifiche](design.md#auto-predefinito-e-medie-per-fascia).

**Grafici e cronologia:** 24 ore mostra i campioni originali; 7/14/30 giorni mostrano medie giornaliere 09:00–18:00 Europe/Rome. La tabella legge separatamente tutta la cronologia e raggruppa le pagine per giorno in Europe/Rome. Sono presenti download PDF dei grafici e della cronologia.

**Audit locale del 23 ottobre, `6e5f197`:** build/lint, 72 test frontend, 44 Deno e 23 Python superati. Riprodotti problemi di cursore sub-millisecondo, provenienza nei PDF dei grafici, aggiornamento cronologia e margini della tabella PDF. [Prove, priorità e limiti](docs/project-review/README.md); [registro correzioni](CORRECTIONS.md#cor-009--il-cursore-della-cronologia-perde-i-microsecondi). Successivamente cursore, aggiornamento cronologia e layout PDF sono stati corretti nel codice locale (COR-009, COR-011, COR-012); la correzione della provenienza sintetica nei PDF dei grafici (COR-010), inizialmente esclusa, è stata successivamente effettuata. Il verbale descrive lo stato della pubblicazione in quella sessione, non prova il deploy corrente.

## Documentazione e collaborazione

| Documento | Uso |
|---|---|
| [plan.md](plan.md) | Unica roadmap: requisiti, decisioni e limiti |
| [tasks.md](tasks.md) | Checklist numerata; “Fase 8” indica il blocco 8 |
| [AGENTS.md](AGENTS.md) | Regole operative prima di intervenire |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Linee guida per issue, pull request e verifiche |
| [LICENSE](LICENSE) | Testo della licenza MIT proposta per il codice originale |
| [Frontend](docs/frontend.md) | Pagine, funzioni, polling, provenienza e verifiche |
| [Design](design.md) | Aspetto, motion, hover e accessibilità |
| [Campioni di prova](docs/data-preview.md) | Tipo distinto, batch pubblico e prove SQL/API/UI |
| [Operazioni](docs/operations.md) | Target, diagnosi, rilascio e attività operative aperte |
| [QA](docs/qa.md) | Verifiche residue e criteri di rilascio MVP |
| [Backend](docs/backend.md) | Contratto e integrazione dati |
| [Uploader](uploader/README.md) | Acquisizione PC, outbox e limiti Windows |

Il [file Figma Obsidian v5](https://www.figma.com/design/dMJqTphynvTgGm6yqUsVrP/MeteOlivelli?node-id=7-2) e la [storia delle revisioni](docs/design-review/README.md) documentano il design precedente. Il restyling Factory è stato implementato nel codice; Figma non è stato riallineato. Revisione con il compagno e prove su dispositivi reali restano aperte. Per collaborare preferire branch dedicati e pull request, preservando il lavoro locale.

## Licenza e collaborazione

Il codice originale e la documentazione di MeteOlivelli sono proposti con licenza **MIT** (vedi [LICENSE](LICENSE)), subordinatamente all'approvazione dei titolari dei diritti indicati nel file: Pietro Giudici, Nicholas Borin e Liceo Teresio Olivelli di Pavia. La licenza consente il riutilizzo e la modifica del materiale coperto, conservando la nota di copyright. **Marchi, stemmi e logo scolastico, immagini o altri materiali di terzi non diventano automaticamente disponibili sotto MIT:** verificare separatamente le autorizzazioni e le rispettive licenze.

Siamo due studenti e il progetto è ancora in sviluppo: contributi documentati, segnalazioni riproducibili e correzioni mirate sono benvenuti. Leggere [CONTRIBUTING.md](CONTRIBUTING.md) e aprire una issue prima di modifiche architetturali importanti. Non pubblicare dati personali, credenziali o misurazioni non verificate.

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

Aprire l'indirizzo stampato da Vite. Per avviare il frontend non servono credenziali. Per leggere i campioni serve la connessione all’endpoint pubblico. Il server di sviluppo non avvia né configura Supabase.

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
| `npm run frontend:test` | Test Node su lettura, serie, qualità, polling, previsioni e quiz; senza rete o segreti |
| `npm run backend:check` | Typecheck dei moduli backend con Deno |
| `npm run backend:lint` | Lint e formato dei file backend con Deno |
| `npm run backend:test` | Test backend senza accesso ad ambiente, rete o file dell'applicazione |
| `npm run uploader:test` | Test sintetici Python con SQLite temporaneo, senza rete; richiede `python3` |
| `npm run check` | Tutte le verifiche precedenti, fermandosi al primo errore |
| `npm run preview` | Anteprima della build frontend già generata |

I test backend usano dati sintetici per configurazione, contratto, adattatore CSV e handler HTTP con store simulati. Ordine e unità dichiarati: secondi dall’accensione, temperatura °C, umidità % e pressione hPa; il campione CSV e il writer reali restano da verificare. Le prove BE-07 hanno verificato RPC, privilegi/RLS e ingestione HTTP sintetica sul progetto autorizzato; le fixture sono state rimosse. Le prove SQL in `supabase/tests/` richiedono un target esplicitamente autorizzato e non sono incluse nei test Deno.
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
supabase/migrations/          Migrazioni versionate; stato remoto da verificare
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
