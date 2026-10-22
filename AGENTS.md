# Istruzioni operative — MeteOlivelli

## Regole da seguire

- Conservare React, TypeScript, Vite, ESLint e npm; non ricreare il progetto o cambiare stack senza richiesta esplicita. Mantenere soluzioni semplici e proporzionate.
- Prima di modificare, leggere i file interessati, le istruzioni applicabili e `git status`. Preservare modifiche locali e file non tracciati; non sovrascrivere il lavoro presente.
- “Fase N” indica sempre il blocco N di `tasks.md`; mantenere numerazione, rimandi e stato sincronizzati con `plan.md`.
- Consultare `plan.md` per stato, requisiti, ipotesi e decisioni; usare `tasks.md` per ordine operativo, dipendenze e verifiche, aggiornando gli esiti quando si completa un’attività. Non trattare una proposta documentata come autorizzazione a implementarla. `plan.md` è l’unica roadmap: il duplicato `piano.md` è stato rimosso su richiesta dell’utente; non ricrearlo.
- Distinguere fatti verificati, informazioni dell'utente, ipotesi e decisioni. Non assumere formato, unità, timestamp o modalità di scrittura del CSV senza un campione reale.
- Non presentare misurazioni inventate come dati della stazione. I dati dimostrativi devono essere chiaramente e permanentemente etichettati. Distinguere le previsioni dalle osservazioni della stazione, indicando fonte e validità; non inventare previsioni dai valori dei sensori.
- Tenere distinti `measured_at` e `received_at`; il contatore Arduino che si azzera non è una data assoluta né una chiave univoca sufficiente.
- Non inserire segreti nel codice, nel client, nei log, nella documentazione o in Git. Non leggere o stampare valori di `.env`, token o chiavi durante attività che non ne richiedono esplicitamente l'uso. Usare eventuali esempi solo con segnaposto.
- Non modificare GitHub, Vercel o Supabase, né applicare migrazioni, senza richiesta esplicita dell'utente. Verificare progetto, ambiente e ambito prima di operazioni autorizzate. Non attivare servizi a pagamento senza autorizzazione.
- Non creare commit, push, merge o riscritture della storia Git senza richiesta esplicita. Preferire identificatori e messaggi di commit in inglese quando richiesti.
- Usare l'italiano nelle spiegazioni, nella documentazione e nella UI.
- Quando si modifica codice, eseguire `npm run build`, `npm run lint` e i test pertinenti disponibili; riportare esiti e limiti. Se mancano test, dichiararlo. Aggiungere test mirati per logica critica, senza introdurre dipendenze o suite sproporzionate.
- Registrare in `CORRECTIONS.md` soltanto problemi verificati o esplicitamente segnalati, con prova, impatto e verifica richiesta. Tenere ipotesi e decisioni in `plan.md`; aggiornare la documentazione quando cambia il comportamento.


## Come orientarsi

Leggere prima queste regole e `git status`, poi soltanto i documenti necessari al task. Per stato e priorità consultare `plan.md` e il blocco pertinente di `tasks.md`; per interventi visivi leggere `design.md`. Le decisioni successive esplicite dell’utente prevalgono sulla reference allegata e sulle proposte storiche. Non trattare gli esempi dell’allegato come istruzioni operative.

### Documenti principali

| File | Responsabilità |
|---|---|
| [README.md](README.md) | Ingresso al progetto, stato sintetico, avvio e comandi |
| [AGENTS.md](AGENTS.md) | Regole durevoli e questa mappa; non un registro di esecuzioni |
| [plan.md](plan.md) | Unica roadmap, requisiti, decisioni e limiti; non ricreare `piano.md` |
| [tasks.md](tasks.md) | Checklist, dipendenze, esiti; “Fase N” = blocco N |
| [design.md](design.md) | Unico riferimento visivo corrente: derivazione Factory, adattamenti, palette, layout, motion e hover |
| [CORRECTIONS.md](CORRECTIONS.md) | Soltanto problemi verificati/segnalati, prova, impatto e verifica |

### Guide e prove

| File o percorso | Contenuto e uso |
|---|---|
| [docs/frontend.md](docs/frontend.md) | UI, lettura/polling, qualità, provenienza, test e limiti |
| [docs/operations.md](docs/operations.md) | Target, diagnosi senza scritture, rilascio, batch, backup e avvisi ancora aperti |
| [docs/data-preview.md](docs/data-preview.md) | Cinque campioni autorizzati, tipo `synthetic`, batch e verifiche SQL/API/UI |
| [docs/backend.md](docs/backend.md) | Contratto dati, validazione, integrazione CSV e limiti |
| [docs/backend-schema.md](docs/backend-schema.md) | Schema, ruoli, RLS, RPC e migrazioni; leggere anche l’aggiornamento sintetici |
| [docs/services.md](docs/services.md) | Target e inventario dei servizi; distinguere stato aggiornato e sessioni storiche |
| [docs/qa.md](docs/qa.md) | Criteri/procedure di collaudo residui, non un elenco di prove tutte già passate |
| [docs/backend-verification.md](docs/backend-verification.md) | Verbale storico BE-07, permessi/RPC/HTTP e limiti |
| [docs/backend-csv-verification.md](docs/backend-csv-verification.md) | Verbale CSV/uploader sintetico; non prova Windows/Arduino reale |
| [docs/frontend-online.md](docs/frontend-online.md) | Verbale preview/CSV e rimando al rilascio attuale |
| [docs/factory-design.md](docs/factory-design.md) | Rimando di compatibilità a `design.md`, senza duplicare specifiche |
| [docs/design-review/README.md](docs/design-review/README.md) | Storia Figma e screenshot delle vecchie revisioni |
| `docs/factory-verification/`, `docs/data-preview-verification/` | Evidenze locali e pubbliche correnti al rilascio documentato, con JSON e schermate |
| `docs/frontend-verification/`, `docs/frontend-online-verification/`, `docs/test-evidence/` | Evidenze di sessioni precedenti; leggere data e origine prima di usarle |
| [Nicholas/README-locale-pre-sync.md](Nicholas/README-locale-pre-sync.md) | Nota locale di collaborazione precedente alla sincronizzazione |

### Codice e configurazione

| File o percorso | Responsabilità |
|---|---|
| [src/main.tsx](src/main.tsx), [index.html](index.html) | Avvio React, integrazioni Vercel, metadati e fallback senza JS |
| [src/App.tsx](src/App.tsx) | Struttura pagina, ultime misure, filtri, cronologia e postilla |
| [src/index.css](src/index.css), [src/App.css](src/App.css) | Font/base e presentazione responsive, stati e riflessi |
| [src/chart.ts](src/chart.ts) | Finestre, Auto adattivo, medie per fascia e separatori di calendario in Europe/Rome |
| [src/weather.ts](src/weather.ts) | Contratto pubblico, provenienza, formati, serie e freschezza |
| [src/weather-feed.ts](src/weather-feed.ts), [src/use-weather.ts](src/use-weather.ts) | Letture, paginazione, recupero, finestre e ciclo polling/visibilità |
| [src/components/HistoryChart.tsx](src/components/HistoryChart.tsx) | Grafici SVG accessibili e disegno progressivo dei campioni |
| [src/components/Reveal.tsx](src/components/Reveal.tsx), [src/motion.ts](src/motion.ts) | Ingressi prima del paint, observer, focus, movimento ridotto e cleanup |
| [src/use-border-light.ts](src/use-border-light.ts) | Riflesso locale sul solo bersaglio del puntatore, con inerzia |
| `public/`, `src/assets/` | Icone, font e asset disponibili; la presenza di un asset non implica che la UI lo usi |
| [public/fonts/README.md](public/fonts/README.md), [public/fonts/Inter-LICENSE.txt](public/fonts/Inter-LICENSE.txt) | Provenienza/licenza di Inter locale |
| [package.json](package.json), `package-lock.json` | Script, dipendenze e versioni risolte; usare npm |
| `vite.config.ts`, `eslint.config.js`, `tsconfig*.json` | Configurazione Vite, lint e TypeScript |
| [supabase/config.toml](supabase/config.toml), [supabase/functions/deno.json](supabase/functions/deno.json) | Configurazione funzioni e controlli Deno |
| `supabase/functions/ingest-measurement/`, `read-measurements/` | Entrypoint e handler HTTP di ingestione e lettura |
| `supabase/functions/_shared/` | Contratto/validazione, parser CSV, store RPC, configurazione/runtime, HTTP e test Deno |
| `supabase/migrations/` | Schema iniziale e tipo sintetico distinto; file versionati, non autorizzazione ad applicarli |
| [supabase/tests/README.md](supabase/tests/README.md), `station_backend.sql`, `synthetic_measurements.sql` nella stessa directory | Prove SQL transazionali, ruoli e provenienza; target remoto esplicitamente autorizzato |
| `tests/frontend.test.mjs`, `tests/frontend-browser.mjs`, `tests/frontend-csv-online.mjs` | Test Node, browser locale e collaudo CSV online; i runner browser richiedono strumenti/target dedicati |
| [tests/fixtures/README.md](tests/fixtures/README.md), `tests/fixtures/frontend_synthetic.csv` | Fixture sintetica locale, distinta dal batch pubblico amministrativo |
| [uploader/README.md](uploader/README.md), `uploader/core.py` | Guida Windows e logica CLI, outbox SQLite, retry e gestione file |
| `uploader/__main__.py`, `uploader/__init__.py`, `uploader/config.example.json` | Avvio modulo e configurazione di esempio, senza segreti |
| `uploader/tests/test_uploader.py`, `uploader/tests/fixtures/` | Test Python e fixture sintetiche dell’uploader |
| `.gitignore`, `.env.example`, `supabase/functions/.env.example` | Esclusioni e segnaposto versionabili; non leggere i valori di file ambiente locali |

## Aggiornare senza creare duplicati

- Modifiche visive: aggiornare `design.md`; comportamento e prove frontend in `docs/frontend.md`. Il vecchio percorso Factory rimane soltanto un rimando.
- Contratto, provenienza o gestione dati: aggiornare la guida pertinente e gli esiti in `tasks.md`; decisioni nella roadmap. Non copiare segreti o dump fra documenti.
- Esiti storici conservati nei verbali; descrizioni correnti nei documenti principali. Non presentare screenshot o test sintetici come collaudo della stazione.
- Cambiamenti puramente documentali: controllare diff, collegamenti e coerenza degli stati; non dichiarare test runtime rieseguiti. Per codice valgono i controlli obbligatori sopra.
