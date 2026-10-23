# Piano di progetto — MeteOlivelli

> **Stato più recente — 23 ottobre:** preparate localmente le pagine `/home` e `/info`, sitemap e metadati SEO distinti; tema chiaro/scuro locale con preferenza di sistema e switch persistente. Nessuna pubblicazione di queste modifiche; dati Arduino reali, CSV/Windows e validazione WX restano aperti.

> **Stato:** backend Fase 5 verificato sul contratto v1; uploader Fase 6 provvisorio; dashboard Fase 7 implementata e pubblicata e verificata sul dominio principale, aggiornata allo stile Factory su richiesta del 22 ottobre. CSV reale, collaudo della stazione e modello previsionale restano aperti.
> **Lingua del progetto:** italiano per interfaccia e documentazione; inglese per identificatori e messaggi Git.
> **Ultimo aggiornamento:** 23 ottobre 2026, dopo la separazione locale fra Home (`/home`) e Informazioni (`/info`), sitemap/metadati per route e tema chiaro/scuro. Nessuna pubblicazione delle modifiche locali.
> **Fonti:** repository locale; piano originale `piano.md` (491 righe, integrato in questa roadmap); richiesta iniziale, risposte Q1–Q35 e successivo chiarimento del 21 ottobre 2026 su scadenza, flusso dati e previsioni. La fonte duplicata è stata rimossa su richiesta Q35 dopo il trasferimento dei contenuti utili.
> **Ambito storico prima del batch autorizzato (superato dallo stato corrente sopra):** rimuovere la modalità dimostrativa dalla versione pubblica e mantenere un solo progetto/database Supabase finale. Per richiesta esplicita dell'utente, gli eventuali futuri dati sintetici d'integrazione andranno nello stesso database finale, con provenienza distinguibile e senza presentarli come osservazioni della stazione; nessun dato sintetico va caricato ora. Il deploy di produzione deve seguire il branch `main` su GitHub. CSV reale, collaudo Windows e WX restano aperti. [Verbale e stato del rilascio](docs/frontend-online.md).

> **Decisioni correnti:** le risposte e le scelte tecniche delegate sono raccolte nella sezione 18, con gli aggiornamenti successivi in fondo. Superano le proposte precedenti incompatibili; le scelte progettuali non sono funzionalità implementate. In particolare, il prodotto non offre una modalità DEMO né database separati. Per richiesta esplicita del 22 ottobre, eventuali righe sintetiche d'integrazione saranno registrate nello stesso progetto e tabella Supabase finali, marcate con provenienza dedicata prima di inserirle e mai confuse con misure reali. I test unitari locali possono continuare a usare fixture isolate. Non è prevista l'integrazione di un provider meteo esterno.

## Come leggere e mantenere il piano

- **Fatto verificato (F):** dimostrato nell'ispezione locale, con fonte nella sezione 4. Una verifica locale non dimostra lo stato dei servizi remoti.
- **Informazione dell'utente (U):** vincolo o richiesta esplicita nella conversazione attuale. Include i tre documenti richiesti, la tutela del lavoro locale e dei segreti, il divieto iniziale di implementazione nella fase documentale e quello di modifiche remote non richieste. In seguito l’utente ha autorizzato il setup locale e, il 22 ottobre, la fase dei controlli dati (oggi blocco 4).
- **Contesto ereditato (C):** affermazione contenuta in `piano.md`, senza prova indipendente disponibile in questa attività. Va confermata dall'utente o da evidenze; non viene attribuita automaticamente a una sua dichiarazione diretta.
- **Ipotesi/proposta (I):** soluzione da valutare. Tutta l'architettura candidata e i nomi dei campi da progettare appartengono a questa categoria.
- **Decisione (D):** scelta registrata con stato, esito, fonte e dipendenze; quelle aperte devono essere chiuse prima della fase dipendente. Il registro, con stato ed esiti, è nella sezione 11.

Gli obiettivi e i comportamenti delle sezioni successive sono requisiti del piano, non capacità già implementate. Nessun nome di campo concettuale implica l'esistenza di una tabella, di una colonna o di un sensore verificato.

`plan.md` è l’unica roadmap, come richiesto dall’utente in Q35. `piano.md` è stato rimosso dopo integrazione: i riferimenti al suo contenuto qui sotto sono storici e non collegamenti a un file ancora presente. `AGENTS.md` contiene le regole operative stabili; `CORRECTIONS.md` contiene esclusivamente problemi confermati o segnalati.

**Numerazione concordata (U, 22 ottobre 2026):** quando l’utente dice “Fase”, intende sempre il blocco numerato di tasks.md. Le fasi operative sotto usano gli stessi numeri 3–8; i blocchi 1–2 sono istruzioni e perimetro, non implementazione. Mantenere sincronizzati numeri, rimandi e stato. Le vecchie diciture Fase 0–2 nei resoconti storici indicano la numerazione precedente.

La checklist esecutiva è [tasks.md](tasks.md): traduce questo piano in attività ordinate, dipendenze, istruzioni e criteri di completamento. Non sostituisce requisiti e decisioni di questo documento. Il 21 ottobre 2026 l’utente ha prima richiesto la checklist e poi l’esecuzione del setup generale. SET-00–SET-04 sono ora completati, con esiti e limiti registrati; il backend locale successivo è descritto nell’aggiornamento Fase 5 sotto.

## 1. Scopo

**Pagina provvisoria, richiesta il 22 ottobre 2026 (U/F):** sostituito il template
React/Vite con una pagina italiana senza dati, avviso “Work in progress / Lavori in
corso”, breve descrizione del progetto, grandezze previste e autori già indicati nel
README. Nessuna dashboard o connessione dati implicata. Metadati italiani, favicon
del progetto e contenuto `noscript`; commit e push richiesti dall'utente. Non è
un'implementazione del mockup Figma. Questa descrizione è storica: la successiva dashboard della Fase 7 la sostituisce come descritto sotto.

Il piano precedente descrive MeteOlivelli come una piattaforma meteorologica pubblica sviluppata da due studenti del Liceo Scientifico Paritario Teresio Olivelli di Pavia (C; denominazione completa da confermare; destinazione pubblica confermata dall’utente in Q18). Il README conferma il riferimento al liceo Teresio Olivelli a Pavia e indica come autori Pietro Giudici e Nicholas Borin (F). Deve presentare in modo chiaro le misurazioni raccolte dalla stazione scolastica, conservarne lo storico e restare gestibile con risorse limitate.

Il progetto deve evolvere dall’attuale applicazione iniziale React/Vite a un servizio affidabile, documentato, sicuro e utilizzabile da computer, smartphone e tablet. Il budget obiettivo è 0 €, senza attivare servizi a pagamento senza autorizzazione. Il costo nullo è un obiettivo da verificare periodicamente, non una garanzia di disponibilità o conservazione permanente. Quest’ultima è ora un obiettivo esplicito dell’utente (Q25), da rendere sostenibile con copie e responsabilità: non una proprietà garantita dal piano gratuito.

Questo documento organizza il lavoro e rende esplicite le decisioni ancora aperte. Non autorizza da solo modifiche a GitHub, Vercel o Supabase, né l’applicazione di migrazioni o la creazione di servizi a pagamento.

## 2. Obiettivi e criteri di successo

### Obiettivi

- Mostrare l’ultima misurazione reale e lo storico disponibile, con aggiornamento automatico del sito dopo l’inserimento di nuovi eventi nel database.
- Aggiungere previsioni per i prossimi 30 minuti, l’ora successiva e la giornata, distinguendo fonte previsionale e misure della stazione (U: chiarimento successivo a Q1–Q35).
- Rendere consultabili grafici per 24 ore, 7 giorni e 30 giorni (U: Q11, Q18). Nessun download pubblico o account utente; intervalli personalizzati e altre analisi fuori dal perimetro iniziale.
- Trasferire le nuove misurazioni dal PC Windows della scuola al backend tramite sole connessioni HTTPS in uscita.
- Evitare perdita e duplicazione dei dati in caso di rete assente, riavvio del computer, righe CSV incomplete, aggiornamenti concorrenti, troncamento o rotazione del file.
- Separare chiaramente l’ora di misurazione dall’ora di ricezione lato server.
- Proteggere scrittura e credenziali, consentendo al pubblico soltanto la lettura dei dati meteorologici approvati per la consultazione pubblica.
- Conservare una copia del dato originale e predisporre backup indipendenti con una procedura di ripristino verificabile.
- Mantenere il codice leggibile, modulare, documentato e proporzionato alla scala del progetto.

### Criteri di successo del prodotto

- Nessun valore dimostrativo appare come una misurazione della stazione.
- Interfaccia e documentazione distinguono: dato reale, dato mancante, dato non aggiornato, errore di caricamento ed eventuale dato dimostrativo.
- “Online/offline” descrive la freschezza dei dati della stazione, non la raggiungibilità del sito.
- Il sito si adatta a schermi piccoli e supporta navigazione accessibile, contrasto adeguato e riduzione delle animazioni secondo le preferenze del dispositivo.
- Lo storico può essere esportato o migrato senza dipendere per sempre dal frontend o da un solo provider.

### Criteri di successo operativi

- Un evento acquisito compare al massimo una volta nel database anche dopo retry.
- Una temporanea indisponibilità di rete non fa perdere righe già salvate dal PC.
- I dati conservano la provenienza e l’incertezza temporale: non si attribuisce un orario più preciso di quello realmente disponibile.
- Il backup è considerato valido solo dopo una prova documentata di ripristino.
- Build, lint e test pertinenti passano prima di integrare ogni fase; i test devono coprire in particolare parsing, validazione e idempotenza.

### Requisiti funzionali e non funzionali da validare

| ID | Tipo | Requisito e criterio di accettazione |
|---|---|---|
| RF1 | Funzionale | Ultimi valori reali con unità, provenienza e orario qualificato; nessuno zero o valore fittizio al posto di un dato assente |
| RF2 | Funzionale | Storico negli intervalli approvati, con asse temporale dichiarato, ordinamento deterministico e stato vuoto distinto dall'errore |
| RF3 | Funzionale | Acquisizione incrementale con conferma per evento e deduplicazione verificata anche dopo risposta persa e retry concorrenti |
| RF4 | Funzionale | Recupero offline e quarantena: dopo la ripresa ogni riga persistita è confermata, ancora accodata o esplicitamente segnalata, senza scarti silenziosi |
| RF5 | Funzionale | Lettura secondo la matrice approvata, nessuna scrittura pubblica e nessuna esposizione dei metadati interni |
| RF6 | Funzionale | Esportazione operativa indipendente e ripristino verificato; download pubblico escluso dall’MVP per scelta dell’utente; esportazioni riservate alla gestione |
| RF7 | Funzionale | Stime calcolate dal progetto per +30 minuti, +1 ora e giornata, separate dalle osservazioni, con metodo/versione, dati di origine, validità e stato indisponibile; pubblicazione subordinata a verifica del modello, senza formule meteorologiche arbitrarie |
| RF8 | Funzionale | Il PC trasferisce nuove righe complete come eventi, il backend le persiste e la pagina aperta si aggiorna senza ricaricamento manuale; obiettivo proposto nell’ordine di 30 secondi dal commit DB in condizioni normali, da misurare e confermare |
| RNF1 | Non funzionale | Integrità: identità e timestamp preservati, transazioni locali/remoto coerenti, originali conservati secondo retention concordata |
| RNF2 | Non funzionale | Sicurezza e minimizzazione: HTTPS, privilegi minimi, RLS verificata e segreti fuori da client/Git/log |
| RNF3 | Non funzionale | Usabilità/accessibilità: italiano, mobile, tastiera, stati comprensibili e criteri della sezione 8 verificati |
| RNF4 | Non funzionale | Sostenibilità: stack conservato, dipendenze motivate, gestione trasferibile e nessuna attivazione a pagamento non autorizzata |
| RNF5 | Non funzionale | Prestazioni/disponibilità: concordare tempo massimo CSV → dashboard, latenza query, volume/traffico attesi, durata offline e tolleranza ai fermi prima di fissare soglie o SLA |

Le prove di accettazione devono usare fixture dichiarate e poi un campione reale controllato; i valori quantitativi ancora ignoti non sono dedotti dall'ipotesi di una riga all'ora.

## 3. Vincoli non negoziabili

1. **Non ricreare il progetto.** Conservare repository, branch `main`, React, TypeScript, Vite, ESLint e npm.
2. **Non riscrivere la storia Git** e non creare commit o push automaticamente.
3. **Non modificare configurazioni remote** di GitHub, Vercel o Supabase senza una richiesta esplicita.
4. **Non applicare migrazioni** finché lo schema e i criteri di timestamp non sono stati progettati e revisionati.
5. **Non indovinare il CSV.** Ordine e unità dichiarati dall'utente il 22 ottobre: secondi dall'accensione, temperatura °C, umidità %, pressione hPa. Delimitatore, intestazioni, formato decimale, scrittura e contenuto effettivo devono essere verificati su un file reale.
6. **Non trattare `arduino_seconds` come data assoluta.** Il contatore si azzera al riavvio e non è un timestamp Unix.
7. **Non esporre chiavi privilegiate nel client.** Segreti e credenziali di ingestione restano lato server o nel sistema locale protetto del PC uploader.
8. **Nessuna scrittura anonima.** I visitatori non devono poter modificare o cancellare le misurazioni.
9. **Nessun servizio a pagamento senza autorizzazione.** Verificare condizioni, quote, sospensione per inattività e limiti attuali prima di dipendere dal piano gratuito.
10. **Niente infrastruttura sproporzionata.** Evitare microservizi, code distribuite, Kubernetes e container se non emerge una necessità dimostrabile.
11. **Minimizzazione dei dati.** La piattaforma pubblica dati meteorologici; non raccogliere dati personali degli studenti che non siano necessari.
12. **Preservare il lavoro locale esistente.** Prima di intervenire su file già modificati, capire la modifica e non sovrascriverla.

## 4. Stato attuale, evidenze e limiti

### Baseline verificata prima del setup, il 21 ottobre 2026

| ID | Fatto | Evidenza e limite |
|---|---|---|
| F1 | Repository locale `/Users/pgiudici/Dev/MeteOlivelli`, branch `main`, HEAD `b455fbdc06d1ac82f548de7ce34d3c0c34221bff` | `git rev-parse HEAD`, `git status --short --branch` |
| F2 | All'inizio l'unico elemento segnalato da Git è `?? piano.md`; nessuna modifica ai file tracciati | Stato iniziale conservato. `main...origin/main` senza divergenza segnalata riguarda il riferimento locale: nessun fetch e nessuna conferma della sincronizzazione attuale con GitHub |
| F3 | Stack React/TypeScript/Vite/ESLint/npm; lockfile npm presente | `package.json`, `package-lock.json`, configurazioni; installati localmente React/React DOM 19.3.1, TypeScript 6.0.3, Vite 8.3.5, ESLint 10.13.0. Sono osservazioni locali, non raccomandazioni di aggiornamento |
| F4 | Script disponibili: `dev`, `build`, `lint`, `preview`; nessuno script `test` | `package.json`; nessuna suite di test nei file di progetto ispezionati |
| F5 | La UI è ancora il template Vite/React in inglese con contatore dimostrativo | `src/App.tsx`, `src/App.css`, `src/index.css`, `src/main.tsx`; `index.html` ha `lang="en"`. Non è una dashboard e non mostra misure meteorologiche |
| F6 | README breve con descrizione e autori | `README.md`; nessuna guida di installazione, acquisizione o ripristino |
| F7 | Nessun CSV reale, uploader, endpoint di ingestione, cartella `supabase/`, migrazione o SDK Supabase nei file di progetto | Inventario dei file e dipendenze. Non dimostra l'assenza di tabelle o risorse fuori dal repository |
| F8 | `.env.local` e `.vercel/` esistono e risultano ignorati; `.env.local` non è nell'indice Git attuale | Verificati esclusivamente nomi, indice Git e regole con `git check-ignore`; contenuti mai letti. Nessun audit della storia Git o di eventuali segreti incorporati altrove |
| F9 | `.gitignore` è tracciato e non modificato; contiene anche una regola che ignora il proprio nome | `git ls-files`, stato Git e lettura di `.gitignore`. L'eccezione per `.env.example` è annullata da una regola successiva: problema riproducibile COR-001 |
| F10 | Build e lint passano sulla baseline isolata | Procedura sotto. Nessuna prova del deployment, del browser o del flusso reale sensore → sito |

**Struttura rilevante:** `src/` contiene ingresso, componente e CSS del template e asset; `public/` contiene SVG statici. La root contiene configurazioni Vite, ESLint, TypeScript, HTML, package/lockfile, README e il piano originale. Non sono emerse istruzioni `AGENTS.md` preesistenti nei percorsi antenati controllati o nella root.

**Baseline riproducibile senza segreti:** copiati in una directory temporanea soltanto `src/`, `public/`, HTML, package/lockfile e configurazioni TypeScript/Vite/ESLint; nessun `.env*`, `.vercel/` o `.git/`. Riutilizzate le dipendenze locali tramite collegamento a `node_modules`, senza installazioni o rete. Eseguiti `npm run build` e `npm run lint`, entrambi con exit code 0, con Node v26.12.0 e npm 11.20.0. Gli artefatti di build sono rimasti nella directory temporanea. Il collegamento condivide la cache tecnica delle dipendenze, ma non cambia sorgenti o configurazioni. Nessun test automatico disponibile: esito test non dichiarato come superato.

### Aggiornamento verificato dopo il setup generale SET-00–SET-04

La tabella precedente resta la baseline storica: questi fatti la aggiornano dove il repository è cambiato.

- `.gitignore` corretto: esempi ambiente versionabili, file reali ancora esclusi; COR-001 risolto con 11 controlli sui soli nomi. Nessun `.env.local` letto o modificato.
- README ampliato; esempi vuoti frontend/server e guide `docs/backend.md` e `docs/services.md` creati. Le nuove variabili sono convenzioni documentate, non un inventario delle configurazioni segrete preesistenti.
- Deno 2.9.6 aggiunto come devDependency npm esatta, senza installazioni globali. `supabase/functions/` contiene configurazione e un modulo condiviso per richiedere esplicitamente una variabile; nessun handler HTTP, schema, migrazione o uploader creato.
- ESLint browser esclude il codice Deno, controllato separatamente con `backend:check`, `backend:lint`, `backend:test`; `npm run check` orchestra lint/build frontend e i tre controlli backend.
- `npm run check` superato con exit code 0 su copia isolata senza `.env`, usando Node 26.12.0/npm 11.20.0/Deno 2.9.6. I 3 test backend usano valori sintetici e non hanno permessi su ambiente, rete o file applicativi. Nessuna prova di ingestione/RLS/CSV viene implicata dai test di configurazione.
- GitHub confermato pubblico su `main`; Supabase attivo, senza tabelle restituite in `public`, funzioni o migrazioni; progetto Vercel confermato con framework Vite e Node 24.x. Dettagli, fonti e limiti in [docs/services.md](docs/services.md). Nessun billing effettivo o deploy attuale certificato.
- Tutti i task di setup sono specificati con scopo, file/input, procedura, verifiche ed esito. Al 22 ottobre le attività successive sono 24, inclusa UI-00 aggiunta e parzialmente eseguita. Il codice frontend e le configurazioni remote sono invariati.

### Aggiornamento controllo dati — 22 ottobre 2026

- **U:** richiesta di eseguire la fase dei controlli dati (oggi blocco 4); ordine dei quattro campi dichiarato: secondi dall'accensione Arduino, temperatura °C, umidità %, pressione hPa. Nessun timestamp assoluto dichiarato nel CSV.
- **F:** `_shared/measurement.ts` implementa parsing JSON, validazione del contratto locale v1, qualità per campo e contenuto canonico. `_shared/measurement_csv.ts` aggiunge un adattatore provvisorio con dialetto obbligatorio e riga originale restituita anche negli errori. Check/lint/test Deno ricorsivi; 27 test sintetici superati (3 configurazione, 14 dati, 10 CSV). Build/lint e controlli backend superati su copia senza `.env`.
- **U, successivo chiarimento:** richiesta di completare la sezione 4 di `tasks.md`, non l'endpoint della precedente Fase 4 del piano (oggi blocco 5). Separatore, decimali, intestazione e writer non conosciuti; l'utente ipotizza un formato “standard”. Questa ipotesi non fissa un dialetto: nessun valore predefinito di produzione o rilevamento automatico del separatore.
- **D tecnica locale:** campi JSON con unità nel nome, ID UUID v4 e sorgente, null espliciti, istanti UTC normalizzati; storico senza ora PC inventata, valori sospetti conservati e segnalati. Contratto e risposte future documentati in [docs/backend.md](docs/backend.md#contratto-json-locale-v1--data-02data-03be-01).
- **Limite:** DATA-01 e verifica operativa DATA-02/DATA-03 restano aperti: nessun CSV reale/writer/clock osservato, nessuna prova di endpoint, persistenza, reset hardware o deduplicazione nel DB. Le regole sui retry sono testate solo come trasformazioni pure.

### Preparazione locale Fase 5 — 22 ottobre 2026 (prima di BE-07)

- **U:** “Fase 5” indica il blocco Database, sicurezza e ingestione di tasks.md; richiesta di sincronizzare i due documenti e ricordare questa convenzione.
- **F locale:** tabella/RPC, grant/RLS e indici progettati; migrazione creata con CLI, non applicata. Handler ingest/read e adapter PostgREST senza nuove dipendenze. 39 test sintetici superati, inclusi 12 HTTP/adapter; SQL e concorrenza reale non eseguiti.
- **D:** payload immutabile; chiave (sorgente, UUID); service_role solo server con SELECT/INSERT sulla tabella, RPC invoker e accesso diretto visitatori revocato. Serie captured_at/measured_at distinte, paginazione a finestra fissa; limiti di concorrenza documentati in docs/backend-schema.md.
- **Aperto:** BE-07, CSV/writer reale, rate limit/runtime e prova DB separata. Nessuna risorsa remota, migrazione applicata o credenziale reale letta.

### Aggiornamento applicazione BE-07 — 22 ottobre 2026

- **U:** alla scelta dell’ambiente l’utente risponde “Progetto Supabase MeteOlivelli esistente”, autorizzando l’applicazione e le prove del backend preparato sul target verificato.
- **F:** progetto pvtzncseisbxaaseqfvo inizialmente privo di oggetti applicativi; migrazione 20261022125448 applicata, tabella e RPC con RLS/grant verificati, ingest/read ACTIVE v3. Sorgente definitiva meteolivelli e token configurati senza pubblicare segreti.
- **F:** test SQL con rollback e HTTPS reali passano; sei invii concorrenti producono un solo inserimento. Fixture sintetiche separate dalle misure e rimosse; conteggio finale zero. Nessun avviso performance; solo INFO RLS senza policy, previsto dalla negazione dell’accesso diretto. Verbale in docs/backend-verification.md.
- **Limite:** contratto v1 ancora da confermare sul CSV/PC reale. Letture HTTP nello stato vuoto, letture positive via RPC; rate limit distribuito e guasti remoti forzati non provati. Nessuna modifica frontend, Git o Vercel.

### Implementazione locale provvisoria Fase 6 — 22 ottobre 2026

- **U:** richiesta di eseguire la Fase 6 di tasks.md e spiegare risultato e attività residue.
- **F locale:** pacchetto Python `uploader/`, solo libreria standard; lettura incrementale LF/CRLF con dialetto esplicito, parser v1, SQLite atomico per riga originale/identità/payload/cursore, lock OS, retry con conferme verificate e quarantena durevole. CLI di stato, riabilitazione e replay degli stessi ID; guida installazione Windows e configurazione con segnaposto. Nessun segreto letto, servizio remoto modificato o invio alla stazione eseguito.
- **D tecnica provvisoria:** default storico con `captured_at` e `measured_at` null. Solo dopo verifica del writer si può abilitare acquisizione PC per una singola riga nuova osservata durante esecuzione continua; backlog, batch e pause restano storico. Un file cambiato richiede riconciliazione prima di procedere, senza reimport con nuovi ID; nessun cambio generazione automatizzato. Controlli hash incrementali limitati a testa/coda, non garanzia contro ogni riscrittura interna.
- **Verifica:** test sintetici Python e compatibilità del payload con validatore/handler Deno v1; esiti finali nel registro di tasks.md. I test di errore SQLite e risposta persa non sostituiscono power loss, disco pieno reale o prove Windows.
- **Aperto:** DATA-01–DATA-03 e chiusura UP-01–UP-04 sul CSV/PC reale, custodia token nel processo pianificato, clock/buffering, rotazioni del writer e autonomia offline. Guida e limiti in [uploader/README.md](uploader/README.md). Monitor indipendente/email e backup operativo restano Fase 8.

### Modalità sintetica esplicita per l’uploader — 23 ottobre 2026

- **U:** richiesta di provare dal programma locale il caricamento di una misurazione fittizia al database; dopo il blocco iniziale, richiesta di adattare il flusso perché funzioni correttamente.
- **F locale:** aggiunta configurazione opzionale `acquisition_kind: synthetic` compatibile con configurazioni/stati esistenti. L’uploader assegna `captured_at` locale, lascia `measured_at` null e congela `_provenance.kind: synthetic` nell’outbox. Validatore e handler locale accettano solo tale forma e il vincolo DB esistente la supporta.
- **Verifica:** `npm run check` superato (41 frontend, 43 Deno, 23 Python). Dopo l’autorizzazione dell’utente, Edge Function `ingest-measurement` distribuita nel progetto `pvtzncseisbxaaseqfvo` come v4. Uploader Python inizializzato con una riga sintetica `1;21.5;50;1012.8`; dopo un primo tentativo senza egress di rete, retry dello stesso UUID `2c0a00cc-0e6b-452a-b6ee-655646b9fed4` completato con ricevuta `accepted` e stato locale `confirmed`. UUID verificato in DB: tipo `synthetic`, `_provenance.kind` corretto, `measured_at` null, valori 21.5 °C / 50% / 1012.8 hPa. Conteggio sintetici da 10 a 11. Il token di `supabase/functions/.env.station.local` è stato usato solo in memoria e mai mostrato.
- **Stato Git:** commit `c8c3b02` pushato su `main`; il verbale registra questa verifica completata.
- **Limite:** il percorso CSV/writer/Windows reale resta non verificato; la modalità sintetica non chiude DATA-01–DATA-03 né UP-01–UP-04.

### Verifica backend con CSV sintetico — 22 ottobre 2026

- **U:** richiesta esplicita di testare backend Supabase con un CSV fittizio.
- **F:** target MeteOlivelli verificato, funzioni v3 attive; sei eventi CSV e un evento concorrente inviati via uploader/HTTPS come storico senza date. Persistenza, flag qualità, retry con ricevuta ignorata, replay, conflitti, auth e concorrenza verificati; suite SQL con rollback superata. Sette fixture HTTP rimosse con filtro su UUID/sorgente/payload/provenienza; zero eventi finali, RLS attiva.
- **Limiti:** nessun cambio schema/configurazione o deploy; CSV/writer e Windows reali restano aperti. Letture positive/paginazione via RPC in rollback, HTTP read con storico senza date correttamente escluso. Nessuna garanzia su 429, carico, guasti DB o catena fisica. [Verbale ed evidenze](docs/backend-csv-verification.md).

### Informazioni dell’utente dopo la revisione Q1–Q35 (U)

Queste sono dichiarazioni e scelte dell’utente, non verifiche indipendenti di hardware o servizi. Il riepilogo di tutte le risposte è nella sezione 17.

- Scheda dichiarata: **Arduino GIGA R1**. Nel CSV non c’è una data/ora assoluta, soltanto secondi dall’accensione (Q5–Q6). Firmware, rollover e buffering da verificare.
- Grandezze confermate: temperatura in °C, umidità in %, pressione in hPa (Q9). Modelli dei sensori, calibrazione e pressione assoluta/corretta non comunicati.
- CSV reale non disponibile al momento (Q1); scrittura in append ritenuta probabile (Q2); file mai cancellato secondo l’utente (Q3). Quattro campi e cadenza circa oraria sono confermati con riserva (“sì penso”), senza altre colonne/sorgenti dichiarate (Q4). Non fissare delimitatore, ordine definitivo o parser.
- PC Windows dedicato al progetto, modificabile e adattabile; consentita l’installazione del necessario e la registrazione dell’ora di acquisizione (Q7, Q15). Il funzionamento continuo è ritenuto probabile, non verificato (Q14). Proxy assenti soltanto secondo una valutazione preliminare (Q16).
- Pubblico: scuola e open day; solo sito meteo consultabile con **grafici**, nessun download, account o profilazione (Q12, Q18–Q19, Q34). MVP confermato: ultimi valori, stato di aggiornamento, storico 24h/7g/30g (Q11).
- Fuso di visualizzazione `Europe/Rome` approvato (Q8). Anomalie da conservare e segnalare (Q10). Ritardo dopo **20 minuti oltre l’istante in cui era attesa la misura** (Q13).
- Budget 0 € confermato (Q27). Conservazione permanente richiesta per lo storico (Q25); dettagli delle copie e retention dei log ancora da definire.
- L’utente dichiara di detenere i progetti remoti indicati e le credenziali ed è il responsabile del progetto (Q20–Q21, Q29); nessun ambiente separato già predisposto. Canale di notifica, rotazione e recupero non ancora decisi.
- **Consegna richiesta per settimana prossima**: in base alla data della conversazione, finestra 26 ottobre–1 novembre 2026; giorno preciso non indicato. Questo chiarimento sostituisce “prima di Natale” come scadenza di consegna. **Possibile chiusura complessiva a dicembre 2026**, ancora ipotetica (“si pensa”): nessun arresto, cancellazione o deprovisioning già autorizzato.
- Flusso desiderato: PC usato soprattutto come tramite; CSV salvato/aggiornato automaticamente; ogni nuova misura va nel database e deve apparire automaticamente sul sito, senza inviare ripetutamente tutto il file. L’utente aggiunge previsioni per mezz’ora successiva, ora seguente e giornata.
- Sullo storico senza date l’utente delega la scelta tecnica: adottata come decisione progettuale conservazione dei record senza orario e nessuna collocazione inventata nei grafici temporali; progettare timestamp di acquisizione per le nuove righe, dichiarandone origine e limiti. Non è un’autorizzazione a modificare ora il PC o i servizi.
- Nessun percorso strutturato di passaggio consegne richiesto (Q31); conservare soltanto le istruzioni essenziali per avvio, diagnosi, segreti e ripristino. Design affidato alla progettazione, purché curato (Q32); nessuna esigenza di accessibilità specifica comunicata (Q33), senza rinunciare alle buone pratiche di base.

### Contesto precedente ancora non verificato (C)

Il vecchio piano colloca il CSV sul Desktop del PC scolastico e descrive Arduino collegato via cavo. Percorso effettivo, collegamento, writer e formato restano da osservare. L’esempio CSV richiamato dal piano era dichiarato inventato e non può definire il parser. Il tema blu notte era una preferenza della bozza, ora non vincolante dopo Q32.

### Servizi: contesto storico e verifica successiva

Il vecchio piano riporta: repository pubblico `pgiudici13/MeteOlivelli`, progetto Vercel `meteolivelli` con indirizzo `https://meteolivelli.vercel.app`, progetto Supabase `MeteOlivelli` allora `ACTIVE_HEALTHY`. Riporta anche una difficoltà iniziale della CLI a risolvere il collegamento Vercel, seguita dall'individuazione del progetto nell'account.

La corrispondenza dei progetti e la titolarità sono dichiarate dall’utente in Q20 (U). Il setup ha poi riconfermato visibilità GitHub, stato Supabase e metadati Vercel; deploy aggiornato, integrazioni effettive, RLS applicativa, credenziali, billing e backup non sono certificati da questi controlli. Nella prima revisione documentale non erano stati interrogati i servizi. Nel setup successivo sono stati letti i metadati necessari tramite connettori e CLI, estraendo dal mapping Vercel solo campi non segreti; esiti aggiornati sopra e in `docs/services.md`. Non sono stati recuperati valori di credenziali. La sola presenza di `.vercel/` non prova il target corretto. Prima di future operazioni autorizzate verificare esplicitamente progetto, ambiente e scope con strumenti in sola lettura.

### Differenze rispetto a `piano.md`

- La precedente modifica locale a `.gitignore` non compare più nello stato iniziale di questa attività; non si presume come sia stata risolta.
- La precedente dichiarazione di sincronizzazione con `origin/main` non è una verifica remota attuale.
- Hardware e unità sono ora dichiarazioni esplicite dell’utente; struttura CSV e cadenza restano dichiarazioni con riserva. Mancano comunque campione e firmware per una verifica tecnica.
- La ricezione della riga sul PC è un evento distinto dalla misura; `received_at` è ricezione lato backend, non ora di invio.
- La dashboard pubblica e l'intera catena di acquisizione sono obiettivi futuri coerenti con il template iniziale; la loro assenza non è automaticamente un bug.
- Il riferimento operativo è soltanto `plan.md`; dopo Q35 la fonte duplicata è rimossa con autorizzazione dell’utente, conservando qui contenuti utili, provenienza e differenze.

## 5. Architettura candidata

Questa è un’ipotesi di partenza da confermare nelle fasi di progettazione, non una decisione già applicata.

```text
Sensori → Arduino → PC Windows / CSV
                         │
                         ├── copia originale locale
                         └── uploader Python con outbox e stato persistente
                                      │ HTTPS in uscita
                                      ▼
                           endpoint di ingestione server-side
                                      │
                                      ▼
                              PostgreSQL / Supabase
                                      │ lettura controllata
                                      ▼
                         React + TypeScript su Vercel

Misure datate ammesse ── modello locale validato ── stime/cache ── frontend
                        (metodo, limiti e tempi espliciti)

Database online ── esportazioni indipendenti ── storage autorizzato dalla scuola
```

### Responsabilità per componente

| Componente | Responsabilità principale | Confini e cautele |
|---|---|---|
| Arduino e sensori | Rilevare i valori e fornire il contatore di uptime | L’uptime non identifica una data; in questa prima fase non è necessario cambiare il firmware |
| PC Windows | Conservare il CSV originale e avviare l’uploader | Nessuna porta in ingresso, nessun accesso pubblico diretto al PC |
| Uploader Python | Leggere incrementi, accodare righe complete, inviare e ritentare | Stato durevole; non inviare l’intero archivio a ogni controllo; log senza segreti |
| Endpoint server-side | Autenticare uploader, validare payload, applicare limiti e deduplicare | Segreto solo server-side; risposte e log non devono rivelare credenziali |
| PostgreSQL | Archivio canonico interrogabile e migrabile | Vincoli, indici, RLS e privilegi minimi definiti prima della migrazione |
| Frontend | Presentare misure, grafici, freschezza e previsioni distinte; aggiornare automaticamente i dati | Nessun segreto; stati vuoti/errore espliciti; valori di esempio sempre etichettati |
| Modello previsionale del progetto | Calcolare stime dai dati della stazione ammessi dalla verifica | Richiesta U del 22 ottobre: nessun provider esterno; metodo e attendibilità da validare prima della pubblicazione |
| Backup indipendente | Consentire recupero fuori dal database operativo | Destinazione autorizzata, retention e restore testato |

### Punto da valutare: endpoint di lettura

Valutare due alternative senza aggiungere livelli inutili:

1. **Lettura diretta controllata dal browser tramite SDK Supabase**, usando esclusivamente una chiave pubblica e policy RLS read-only sulle sole viste/tabelle meteorologiche approvate.
2. **Endpoint dedicato di lettura**, se servono aggregazioni, filtraggio, caching, limiti o un contratto API stabile che giustifichi la funzione intermedia.

La scelta deve tenere conto di esposizione minima dei dati, semplicità, quote, performance e facilità di migrazione. In entrambi i casi il client non deve poter scrivere.

## 6. Dati e semantica temporale

### Campi concettuali da valutare

| Concetto | Significato | Stato della decisione |
|---|---|---|
| Identificativo record | Identità del record nel database, preferibilmente UUID | Da progettare |
| `source_id` | Identità stabile della stazione/sorgente | Da definire; utile anche se oggi c’è una sola stazione |
| Temperatura | Valore numerico in °C | U: Q9; range e rappresentazione CSV da verificare |
| Umidità | Valore numerico in % | U: Q9; tipo di misura, range e sentinelle da verificare |
| Pressione | Valore numerico in hPa | U: Q9; pressione assoluta/corretta, range e rappresentazione da verificare |
| `arduino_seconds` | Secondi trascorsi dall’ultimo avvio Arduino | Non nullo se disponibile; non è data assoluta; azzeramenti vanno gestiti |
| `measured_at` | Istante effettivo della misurazione, se noto in modo affidabile | Nullable finché non c’è una sorgente attendibile |
| `received_at` | Istante assegnato dal backend alla ricezione | Generato server-side, distinto da `measured_at` |
| `ingestion_id` | Identità stabile usata per retry idempotenti | Da progettare; mai basarla solo sui valori meteorologici |

### Strategia per l’ora di misurazione

Opzioni da confrontare prima di implementare:

1. **Ipotesi per le nuove righe:** il programma Windows che riceve dal seriale registra nello stesso record il timestamp di acquisizione sul PC, se modificabile e autorizzato. Questa è ora di ricezione locale, non prova automatica dell’ora della misura: verificare ritardi, buffering e sincronizzazione dell’orologio prima di usarla come stima di `measured_at`. Conservare provenienza e incertezza.
2. **Se il CSV contiene già un timestamp reale:** conservarne formato, fuso e provenienza, con validazione esplicita.
3. **Se l’uploader osserva soltanto un CSV già scritto:** `received_at` rappresenta l’ora di ricezione assegnata dal backend; può essere successiva alla misurazione. Non presentarlo come `measured_at`.
4. **Storico pregresso senza timestamp — scelta tecnica delegata dall’utente:** mantenere `measured_at` nullo, conservarlo con provenienza e ordine originale senza inserirlo nei grafici per data. Nessuna ricostruzione automatica dall’uptime. Un’eventuale ricostruzione futura richiederà evidenze indipendenti, metodo e incertezza espliciti.

La UI deve mostrare “misurata alle” solo quando esiste un orario affidabile. Se è disponibile soltanto la ricezione, mostrare “ricevuta alle” o una formulazione equivalente.

### Identità e deduplicazione

- Generare un ID stabile per ogni riga/evento una sola volta e salvarlo nell’outbox locale prima dell’invio.
- Usare un vincolo univoco lato database su `ingestion_id` o su una chiave composta progettata dopo aver capito come identificare le righe CSV.
- I retry devono riutilizzare lo stesso ID.
- Non deduplicare soltanto confrontando temperatura, umidità, pressione o uptime: due misurazioni valide possono avere valori uguali.
- Definire il comportamento per reset Arduino, righe identiche in file diversi, file troncato/ruotato e migrazione dell’uploader.

### Schema concettuale aggiuntivo (I, nessuna tabella esistente implicata)

Progettare un archivio minimo delle misurazioni e, solo se necessario, metadati separati per sorgenti, sessioni e lotti di importazione. Non fissare SQL, tipi definitivi, nomi di tabelle o precisioni prima del campione reale.

| Campo/concetto candidato | Semantica e vincolo da progettare |
|---|---|
| `boot_id` / sessione Arduino | Identità della sessione hardware, affidabile solo se fornita o ricostruita con evidenze; può essere sconosciuta. Un riavvio dell'uploader non è un riavvio Arduino |
| `file_generation_id` e posizione riga | Identità locale persistente di una generazione del CSV e della riga acquisita; non basta il percorso se il file viene sostituito |
| `captured_at` | Eventuale ricezione sul PC, distinta da misura e backend; aggiungerla solo se realmente osservabile |
| `time_source`, `time_quality`, incertezza | Origine e affidabilità: misura diretta, acquisizione PC, ricostruzione o sconosciuta; etichette e unità dell'incertezza da concordare |
| `quality_flags` | Anomalie di misura o di tempo senza alterazione silenziosa del dato originale |
| Versione del parser/payload | Consente di capire come un dato originale è stato interpretato e di gestire evoluzioni compatibili |
| Riferimento sorgente originale/importazione | Collega il record a file/riga o archivio controllato, senza pubblicare percorsi Windows o dati interni |

Definire: null contro zero, valori sentinella contro valori reali, numeri non finiti e stringhe numeriche, precisione utile del sensore, vincoli di range fisico contro soglie di qualità. Policy U (Q10): conservare e segnalare le anomalie, senza correzioni o scarti silenziosi. Misure numeriche sospette restano con flag di qualità; righe non interpretabili vanno in quarantena con originale e motivo, senza inventare valori. Non arrotondare il dato canonico alla precisione della UI. Conservare il CSV originale secondo retention; la sua eventuale copia remota dipende dallo storage autorizzato.

### Tempo, ordinamento e reset Arduino

- Proposta: memorizzare istanti assoluti in UTC con tipo timezone-aware, visualizzarli nel fuso approvato `Europe/Rome` (U: Q8). Definire conversione di date locali senza offset, ora legale ambigua/inesistente e orologio PC fuori sincronia; niente conversioni implicite.
- `measured_at` può restare nullo. Se ricostruito, conservare metodo e incertezza; se il modello non distingue adeguatamente una stima da una misura affidabile, progettare un campo separato anziché falsare il significato.
- `received_at` è assegnato dal backend all'accettazione iniziale persistita. Nei retry conservare lo stesso valore; eventuali tentativi di ricezione sono diagnostica separata. Non usarlo per correggere un timestamp mancante.
- Per lo storico per ora di misura usare solo istanti ammessi dalla policy di qualità. Dopo il chiarimento del 22 ottobre è ammessa anche una serie distinta per ora di acquisizione PC, dichiarata e qualificata come nella §18; nessuna sostituzione silenziosa di `measured_at`. Record senza alcun orario originale restano separati. Un’eventuale vista per ricezione server deve dichiarare questa ulteriore semantica.
- Un calo dell'uptime è un indizio di reset, overflow, riordino o file riscritto, non una prova sufficiente. Conservare valore grezzo e contesto; non cancellare record precedenti e non riusare identità di eventi.
- Se il firmware fornisce un'identità di avvio verificabile, usarla per delimitare le sessioni. In alternativa progettare sessioni locali con evidenze e stato di incertezza; una semplice crescita del contatore dopo una pausa non esclude un riavvio non osservato.
- Ricostruire tempi da uptime solo con ancoraggio attendibile nella stessa sessione e ipotesi documentate su clock, drift e overflow. Non trasformare l'uptime in Unix time, non sommarlo a `received_at`, non inferire ore storiche dal solo ordine delle righe o dall'ultima modifica del file.
- Testare riavvio Arduino, solo riavvio PC/uploader, reset durante offline, ripetizione degli stessi valori/uptime e possibile overflow. Firmware, frequenza reale e rappresentazione del contatore restano da verificare.

### Previsioni: requisito aggiunto e proposta tecnica

**U, chiarimento del 22 ottobre:** le previsioni devono essere calcolate dal progetto, senza dipendere da un servizio meteo esterno. La precedente proposta Open-Meteo è superata, non implementata. Interpretazione tecnica: usare lo storico della stazione; il modello non può produrre informazione senza dati di ingresso. Non è stato richiesto un servizio AI o un modello linguistico.

**Proposta da valutare:** confrontare una base di persistenza (ultimo valore ammesso mantenuto nel futuro) con modelli semplici di andamento delle serie di temperatura, umidità e pressione. Non scegliere una formula prima dei dati. Valutare su istanti successivi usando soltanto dati antecedenti, riportando errore, numerosità e orizzonte; un risultato migliore sul passato non garantisce accuratezza futura. Riferimento metodologico: [Hyndman e Athanasopoulos, metodi di confronto e validazione temporale](https://otexts.com/fpp3/toolbox.html), consultato il 22 ottobre 2026. Il riferimento non valida un modello meteorologico per la stazione.

| Area UI | Contratto proposto e criterio di accettazione |
|---|---|
| Prossimi 30 minuti | Stima sperimentale solo se supportata da dati e valutazione dichiarata. Con sole osservazioni orarie non esiste automaticamente un valore reale a +30 minuti su cui misurare l’errore; non creare una verità di confronto interpolata |
| Ora successiva | Stima delle grandezze osservate, metodo e errore verificati a questo orizzonte; niente precisione o intervalli di confidenza inventati |
| Giornata | Richiesta mantenuta, fattibilità aperta. Serve una valutazione dedicata; non estendere automaticamente un andamento di un’ora all’intero giorno, né sostituire l’intera giornata con le sole ore residue |
| Modello non pronto o dati insufficienti/vecchi | “Stima non disponibile”; misure e grafici continuano a funzionare. Nessuna previsione fittizia |

Campi candidati separati dalle misure: metodo/versione, ID e qualità dei dati utilizzati, `generated_at`, `valid_at` o intervallo, grandezza/unità e risultati di valutazione. Conservare i run necessari a valutarli dopo l’arrivo delle osservazioni; retention delle stime da definire, distinta da quella permanente delle misure. Non confondere i tempi del modello con `measured_at`/`received_at`.

UI proposta: “Misure della stazione” e “Stime sperimentali MeteOlivelli”. Non generare etichette sole/pioggia/temporale, quantità di precipitazione o vento dai tre sensori senza un metodo specifico e prove adeguate. Prima di WX-01/WX-02 tutte le stime restano indisponibili; nessuna attendibilità meteorologica già dimostrata.

## 7. Fasi di lavoro

Le fasi sono ordinate per dipendenza. Ogni fase deve lasciare il repository in uno stato comprensibile e verificabile. Le fasi con decisioni esterne sono punti di revisione: non proseguire assumendo le risposte mancanti.

### Fase 3 — Mini setup generale

Corrisponde a SET-00–SET-04 di tasks.md. Include baseline e decisioni iniziali.

#### Revisione iniziale e baseline

**Attività**

- Registrare stato Git e modifiche locali preesistenti.
- Esaminare package, lint, TypeScript, HTML, README, `.gitignore` e configurazioni Vercel senza stampare segreti.
- Verificare che `.env.local` e credenziali non siano tracciati.
- Stabilire i comandi di baseline (`npm run build`, `npm run lint`) e salvare gli esiti.
- Inventariare dipendenze inutilizzate e struttura attuale senza aggiungere librerie non motivate.

**Completamento**

- Stato iniziale documentato, modifiche preesistenti conservate, nessun segreto divulgato.
- Problemi preesistenti separati dai problemi introdotti successivamente.

#### Specifica funzionale e decisioni minime

**Attività**

- Convertire questo documento in decisioni approvate/respinte/da chiarire.
- Definire metriche, range fisici accettati, frequenza attesa, soglia di stazione non aggiornata e semantica del fuso orario.
- Applicare la scelta U: consultazione pubblica dei dati meteo, nessun account/profilazione né download; selezionare le sole colonne da esporre e mantenere privati i metadati interni.
- Concordare cosa significa “online/offline” quando non esistono ancora dati o la frequenza non è rispettata.
- Identificare responsabili e accesso consentito all’eventuale storage backup scolastico.

**Completamento**

- Decisioni minime registrate in questo piano o in una specifica collegata.
- Nessuna migrazione o chiave creata in questa fase.

### Fase 4 — Contratto dati e prima logica backend

**Avanzamento al 22 ottobre 2026:** ordine e unità dichiarati dall'utente;
contratto JSON locale v1 e controlli BE-01 implementati con 14 test dedicati;
adattatore CSV provvisorio configurabile con altri 10 test sintetici.
Specifiche temporali e risposte dell'handler in [docs/backend.md](docs/backend.md).
Campione reale e verifica del writer ancora necessari per la chiusura operativa;
nessun parser CSV definitivo; gli endpoint locali successivi sono nella Fase 5.

**Input richiesti**

- Copia anonimizzata di un CSV reale, inclusi intestazione e alcune righe; se necessario rimuovere percorsi o identificativi del PC.
- Descrizione del processo che scrive il file: append, riscrittura, flush, uso di file temporaneo, rotazione e nome effettivo.
- Se disponibile, campione del dato seriale originale o del programma Windows.

**Attività**

- Specificare encoding, delimitatore, separatore decimale, intestazione, unità, campi opzionali e righe malformate.
- Decidere dove aggiungere l’orario attendibile per le nuove misurazioni.
- Definire formato di scambio/versione del payload tra uploader ed endpoint.
- Decidere come trattare storico senza timestamp.

**Completamento**

- Contratto CSV/payload con esempi verificati e casi limite.
- Nessun parser dichiarato definitivo prima di questa verifica.

### Fase 5 — Database, sicurezza e ingestione

BE-02–BE-07 completati tecnicamente sul contratto v1; specifica e matrice accessi in
[docs/backend-schema.md](docs/backend-schema.md), migrazione e prove SQL preparate.
BE-07 applicato e verificato nel progetto esistente scelto: [verbale](docs/backend-verification.md). CSV/PC reali restano aperti nella Fase 4/6.

#### Progettazione schema, accessi e retention

**Attività**

- Definire tabella o tabelle, tipi SQL, precisione numerica e campi nullabili.
- Definire `source_id`, `ingestion_id`, gestione del reset Arduino e provenienza/qualità del timestamp.
- Definire `CHECK`, `NOT NULL`, chiavi e vincoli di unicità.
- Progettare indici per intervalli temporali e ultima misurazione.
- Definire ruoli e RLS: lettura pubblica solo se necessaria e soltanto per i dati approvati; inserimento server-side; nessun update/delete anonimo.
- Valutare viste read-only per evitare di esporre colonne interne.
- Progettare conservazione permanente dello storico e del CSV richiesta dall’utente; esportazioni amministrative e copie di recupero separate. Eventuali cancellazioni richiedono una nuova decisione esplicita, non la scadenza scolastica.
- Verificare limiti, quote, sospensione e condizioni attuali di Supabase Free e confrontarli con frequenza e volume stimati.

**Completamento**

- Schema e modello di accesso revisionati prima di scrivere o applicare migrazioni.
- Impatto sui costi e limiti operativi documentati con fonti aggiornate nella fase decisionale.

#### Endpoint di ingestione e lettura

**Tecnologia candidata:** Supabase Edge Function, coerente con la proposta iniziale; confrontarla con Vercel Function soltanto se emergono ragioni operative concrete.

**Responsabilità**

- Autenticare l’uploader con credenziale server-side separata dalla chiave pubblica del browser.
- Validare schema, tipi, unità, range, dimensione del batch e campi obbligatori.
- Verificare una richiesta duplicata e restituire una risposta idempotente.
- Assegnare `received_at` server-side.
- Non sostituire `measured_at` con l’ora di ricezione.
- Usare il minimo privilegio compatibile con inserimento e deduplicazione.
- Limitare abusi e payload eccessivi; definire rotazione/revoca della credenziale.
- Restituire codici HTTP documentati e messaggi che non includono segreti, query interne o dettagli sensibili.
- Registrare log operativi minimizzati, privi di chiavi e dati personali non necessari.

**Verifiche richieste**

- Payload valido, invalido, incompleto, fuori range, troppo grande e con timestamp non valido.
- Primo inserimento e retry con identico `ingestion_id`.
- Due richieste concorrenti con lo stesso ID.
- Credenziale errata/assente e comportamento di rate limit.
- Nessuna chiave privilegiata nel bundle frontend o nel repository.

### Fase 6 — Uploader Windows e acquisizione reale

**Stato:** implementazione locale provvisoria e guida predisposte (`uploader/`);
UP-01–UP-04 restano parziali fino a verifica di CSV/writer e installazione/prove sul
PC Windows. La successiva prova remota con CSV sintetico è superata e documentata
in §4 e nel registro esecuzioni di tasks.md; non sostituisce la prova della stazione.

**Design da privilegiare**

- Implementazione lineare, adatta a circa una riga all’ora.
- Lettura incrementale del file; non ricaricare o inviare tutto lo storico a ogni ciclo.
- Attendere la riga completa e stabile prima del parsing/invio; non consumare una scrittura parziale.
- Salvare in modo atomico stato locale e coda/outbox, includendo offset/identità file e gli ID assegnati.
- Persistenza prima dell’invio, così un crash non perda il lavoro da ritentare.
- Retry con backoff e gestione di timeout, errori temporanei e risposte permanenti.
- Stato per restart, CSV troncato, sostituito o ruotato; protezione da doppia esecuzione dell’uploader.
- Log leggibili per la scuola, con rotazione e senza segreti.
- Configurazione fuori dal codice; credenziale conservata nel modo più sicuro praticabile sul PC autorizzato.
- Solo connessioni HTTPS in uscita; nessuna apertura porte/firewall in ingresso.

**Completamento**

- Test automatizzati per parser e state machine usando esempi realistici e casi limite.
- Prova di ripresa dopo riavvio e di recupero dopo rete assente.
- Istruzioni di installazione, aggiornamento, avvio automatico, stop e diagnosi su Windows.

### Fase 7 — Previsioni e collegamento al frontend

**Esito attuale UI-01:** versione Factory pubblicata e verificata con `bce39e2`; contratto con provenienza distinta, cinque campioni di prova e postilla. Le funzionalità elencate sotto restano i requisiti: stime e collaudo reale UI-02 non sono completati dal solo frontend. [Specifiche correnti](docs/frontend.md).

**Struttura pagine aggiornata localmente (U, 23 ottobre 2026):** la dashboard esistente diventa `/home`; `/info` raccoglie progetto, stazione, provenienza/limiti dei dati e team. `/` reindirizza a `/home`. Sitemap e metadati canonical descrivono solo le due pagine. La preparazione per Google Search Console è locale; la richiesta di indicizzazione e lo stato dell'indice richiedono accesso alla Search Console dopo una pubblicazione autorizzata.

**Esito frontend verificato (F, 22 ottobre 2026):** UI-01 implementata sul branch locale `codex/frontend-phase-7`, usando il contesto e gli screenshot delle viste Figma Obsidian v5 desktop 7:3/mobile 7:4. Schede, grafici SVG dinamici 24h/7g/30g, cronologia paginata, dettagli qualità e tre tempi distinti, font Inter locale, pannelli satinati e motion con movimento ridotto. GET pubblico BE-06 collegato senza credenziali; l'API reale risponde vuota e la UI non inserisce numeri dimostrativi. Fixture positive solo nei test browser e confinate alla directory test. `npm run check` superato senza file ambiente: 16 test frontend, 39 Deno, 21 Python oltre build/lint. QA browser: 11 scenari e viste 320/390/768/1280 px; nessun errore JavaScript non gestito. [Specifiche, prove e limiti](docs/frontend.md).

**Pubblicazione e QA online successive (U/F, 22 ottobre 2026):** autorizzati commit/push e test sul sito online; chiarimento “solo collaudo con dati simulati”. Commit `0af54b8` sul branch UI e deploy Git automatico preview READY verificati. Test su codice/asset del deploy autenticato, con GET reale vuoto e risposte positive intercettate nel solo browser dalla fixture ora archiviata in `tests/fixtures/frontend_synthetic.csv`: tutte le 50 righe e gli ultimi valori corrispondono, grafici/periodi/reflow/polling/riconnessione superati in otto scenari. Nessun errore JavaScript/asset fallito; verbale ed evidenze in [docs/frontend-online.md](docs/frontend-online.md). Nessun dato di prova nel DB o modalità DEMO pubblica. Produzione/main non aggiornati; UI-02 e modello restano da verificare con dati reali.

**UI-02 provvisoria:** latest ogni 15 secondi a pagina visibile; serie all'apertura/cambio periodo/nuovo ultimo campione/recupero da errore dello storico, con paginazione e scadenza della finestra usando l'ora server. Provate due pagine browser tramite fixture locale e recupero dopo rete interrotta. Non misurati latenza dal commit e sostenibilità delle quote. I soli inserimenti storici che non cambiano latest richiedono una nuova apertura/cambio periodo. Cadenza e ancoraggio reali non verificati: la funzione di ritardo è testata, ma la dashboard dichiara freschezza sconosciuta. WX-01–WX-02 restano aperti: UI “Stima non disponibile” per i tre orizzonti, nessun modello o scenario fittizio pubblico. Nessuna modifica a Figma, Supabase o Vercel e nessun commit/push.

**Contenuto MVP**

- Ultima temperatura, umidità e pressione disponibili.
- Ultimo aggiornamento con distinzione tra misura e ricezione.
- Indicatore di freschezza: segnalare ritardo oltre 20 minuti dalla misura successiva attesa (U: Q13), secondo le regole e i limiti temporali della sezione 8.
- Storico iniziale 24 ore / 7 giorni / 30 giorni; con pochi dati mostrare soltanto quelli realmente disponibili.
- Tre orizzonti previsionali: +30 minuti, +1 ora e giornata, separati dalle osservazioni con fonte/tempi e stati errore propri.
- Pagina aperta aggiornata automaticamente dopo un nuovo inserimento, senza attendere il prossimo aggiornamento orario o un reload manuale.
- Grafici obbligatori per il sito (U: Q18), con interazioni semplici motivate dall’uso, leggibili senza dipendere dal colore e utilizzabili da tastiera.
- Stato senza misurazioni, errore di rete, dati obsoleti e caricamento.
- Breve sezione sul progetto scolastico con provenienza e descrizione dei sensori disponibili.
- Nessun download o esportazione pubblica (U: Q18). Le esportazioni tecniche riservate per backup/ripristino restano necessarie.

**Qualità UI**

- Italiano, responsive, aspetto curato per scuola e open day; palette libera da progettare, tipografia leggibile e animazioni leggere. Il tema blu notte del vecchio piano non è un vincolo approvato.
- Rispetto di `prefers-reduced-motion`, focus visibile, etichette semantiche e contrasto adeguato.
- Nessuna data o misura inventata; dati dimostrativi marcati in modo persistente.
- Gestione degli errori comprensibile senza esporre dettagli interni.
- Evitare componenti e dipendenze aggiunte solo per moda; valutare Tailwind ed ECharts in base alla necessità reale.

### Sessione di progettazione UI con il compagno — 22 ottobre 2026 (programmata)

**Decisione confermata dall'utente il 22 ottobre 2026:** useremo **Figma per progettare la UI**, definendo layout desktop/mobile, colori, tipografia e componenti. Il design Figma sarà il riferimento per l'implementazione in React/TypeScript con Vite.

**Avanzamento verificato il 22 ottobre 2026:** accessibile il file [MeteOlivelli in Figma](https://www.figma.com/design/dMJqTphynvTgGm6yqUsVrP/MeteOlivelli?node-id=7-2). Creata accanto al rettangolo preesistente, preservato, la tavola `MeteOlivelli · Base UI v1`: vista desktop 1280 px, mobile 390 px e area componenti/note. La base usa livelli modificabili, auto-layout, variabili colore/spaziatura, stili Inter e tre componenti riutilizzabili (misura, previsione, periodo). Include misure assenti, storico vuoto e previsioni indisponibili, con avviso di bozza senza dati reali. Verificata visivamente la composizione desktop/mobile dopo correzione dell'altezza dei testi. È una prima proposta da rivedere con il compagno: nessuna implementazione React, integrazione dati o sessione congiunta dichiarata completata.

**Revisione dark richiesta e verificata il 22 ottobre 2026:** la stessa tavola è ora `MeteOlivelli · Dark UI v2 · DEMO`. Tema scuro applicato tramite variabili, tre grafici vettoriali con assi e unità (temperatura, umidità, pressione), cronologia dei sei campioni più recenti in tabella desktop/schede mobile. Dieci campioni orari sintetici del 22 ottobre, 00:00–09:00 Europe/Rome, alimentano coerentemente schede, grafici e cronologia. L'utente ha autorizzato dati fittizi per questa bozza Figma: avviso generale e marcature DEMO nelle sezioni e nei campioni; gli scenari previsionali sono fittizi, separati e senza validità meteorologica. Verificate visivamente entrambe le composizioni. Si tratta di un mockup statico: nessun dato reale, collegamento al backend o controllo interattivo implementato. La cronologia entra nella proposta UI da rivedere prima dell'implementazione.

**Organizzazione confermata dall'utente (programma iniziale):** il 22 ottobre 2026 i due studenti resteranno a scuola per una sessione congiunta di circa **due ore**. Il programma prevedeva apertura/configurazione di Figma e creazione di un file, nome proposto **MeteOlivelli — Dashboard**. L'accesso al file e la prima base sono ora verificati come sopra; installazione locale e svolgimento della sessione congiunta non sono stati verificati.

**Revisione Product Design eseguita su richiesta il 22 ottobre 2026:** stessa tavola aggiornata a `MeteOlivelli · Dark UI v3 · Product Design`. Catturate e ispezionate le viste prima/dopo; ridotta l'introduzione, aggiunto componente misura compatta per mobile, allineati gli assi e chiarito il periodo selezionato. Cronologia mobile compattata mantenendo sei campioni e unità. Altezza mobile da 4179 a 3553 px; misura di layout, non validazione di usabilità. [Evidenze e limiti](docs/design-review/README.md). Restano un mockup statico e la revisione con il compagno; nessun codice applicativo modificato.

**Revisione frosted v4 richiesta e verificata il 22 ottobre 2026:** tavola `MeteOlivelli · Frosted UI v4 · DEMO`. Direzione premium sobria: fondo blu notte sfumato, superfici traslucide, blur di sfondo 20 px, bordi luminosi sottili e ombre morbide. Nessuna rifrazione o distorsione; grafici su superfici interne più schermate. Ridotti i contorni colorati delle schede e gli arrotondamenti delle righe della cronologia. Stili di effetto e riempimento riutilizzabili; composizioni desktop/mobile ispezionate. Dati e marcature DEMO conservati; nessun codice applicativo modificato.

**Revisione Obsidian v5 richiesta e verificata il 22 ottobre 2026:** sfondo uniforme `#05080E` (quasi nero bluastro), senza gradienti su desktop, mobile e area componenti. Superfici satinate rese più neutre, riflessi e ombre attenuati, fondi dei grafici più schermati; stili riutilizzabili aggiornati. Ispezionate le due composizioni e verificati i riempimenti SOLID dello sfondo. Tutti i dati restano DEMO; nessun codice applicativo modificato.

**Indicazioni motion aggiunte il 22 ottobre 2026:** note visibili in Figma, area componenti, e descrizioni dei componenti. Ingresso dei pannelli sotto la piega al primo ingresso in viewport: opacità 0→1, translateY 8→0 px, durata 220 ms ease-out; ritardo fra schede 40 ms, massimo 120 ms. Trigger indicativo al 10% visibile. Scroll nativo senza ritardi o blocchi; titolo e valori iniziali subito visibili. Con `prefers-reduced-motion` nessuna traslazione o attesa; le note originarie chiedono contenuti visibili anche senza JavaScript. Chiarimento documentale della revisione criticità: nella SPA si propone un fallback statico `noscript`, senza promettere una dashboard live senza JS; con JS attivo un errore dell’animazione non nasconde i contenuti. Note Figma non modificate da questa revisione; specifica da implementare in UI-01.

**Divisione iniziale dei ruoli (proposta operativa):**
- **Compagno — UI/UX e QA:** raccogliere 2–3 riferimenti visivi (da usare come ispirazione, non da copiare); imparare le funzioni essenziali di Figma; produrre un primo layout desktop e una variante mobile; definire disposizione delle card temperatura/umidità/pressione, grafici, stato stazione, spaziatura, colori e tipografia; verificare il risultato implementato.
- **Utente — dati/backend e integrazione:** proseguire specifica dati, schema/API e, se accessibile a scuola, osservare il CSV reale e il processo Windows; concordare con il compagno i campi necessari alla UI. Nessuna modifica al PC o ai servizi implicata dal solo piano.
- **Insieme:** riesaminare il design, consegnare all'AI/Codex uno screenshot o un riferimento Figma con specifiche, tradurre il design in componenti React/TypeScript mantenendo Vite, e fare revisione manuale prima del merge.

**Programma indicativo delle due ore (adattabile):**
1. 0–15 min: obiettivi, contenuto della dashboard e responsabilità;
2. 15–60 min: progettazione Figma in parallelo al lavoro backend/CSV;
3. 60–90 min: passaggio del progetto visuale a Codex e prima implementazione **solo se il design è abbastanza definito**;
4. 90–120 min: QA, correzioni prioritarie e verifica di build/lint; deployment soltanto dopo verifica e autorizzazione.

**Consegne minime della sessione:** file Figma condivisibile o screenshot/wireframe, almeno una vista desktop e indicazioni per mobile, palette e gerarchia dati, lista di osservazioni QA e, se pronto, una prima UI revisionabile su branch dedicato. Se la progettazione richiede più tempo, non forzare codice incompleto: conservare il design per l'implementazione successiva.

**Regole:** Figma è uno strumento di design, non sostituisce i test né garantisce codice pronto; mantenere la proprietà delle scelte agli studenti. Verificare licenze dei template/asset. Dati dimostrativi sempre segnalati, mai esposti come dati reali. Non inserire nel file Figma segreti o dati riservati del PC; non dare a tool AI accessi superflui. Branch distinti per backend e UI, revisione tramite pull request; nessun merge/deploy implicito.

**Checklist QA iniziale:** responsive desktop/mobile, unità corrette (°C, %, hPa), grafici leggibili, dati demo etichettati, caricamento/vuoto/errore rete, orario misura vs ricezione, stato stazione non falsamente online, navigazione da tastiera/contrasto, assenza errori console, `npm run build` e `npm run lint`. Test con dati reali e dell'intera pipeline in una fase successiva.

### Fase 8 — Backup, gestione e rilascio

**Stato verificato:** il sito WIP è già pubblicato con UI Factory, animazioni e riflessi, postilla e cinque campioni `synthetic`. I commit applicativi `fab71cb` e `bce39e2` sono stati verificati READY sul dominio principale; la catena API → UI e la provenienza dei cinque campioni sono documentate in [docs/data-preview.md](docs/data-preview.md). Questo esito non chiude il collaudo della stazione né il rilascio MVP complessivo.

| Task in `tasks.md` | Stato acquisito | Cosa resta per completarlo |
|---|---|---|
| OPS-01 — Backup | Perimetro e criteri nella guida operativa | Drive scolastico scelto come archivio DB; dispositivo/processo di export-upload, frequenza, custode, RPO/RTO e restore separato ancora da definire/verificare |
| OPS-02 — Gestione e avvisi | Target e runbook iniziale, diagnosi di API/UI/PC e segreti per scopo | Custodia PC, revoca/rotazione provate, canale email e consegna, diagnosi/quote reali |
| OPS-03 — Campioni e transizione | Tipo distinto, batch identificato, API/client e postilla verificati | Prima misura reale, convivenza/curve, decisione di conservazione o rimozione esatta e gestione della postilla |
| REL-01 — Collaudo MVP | Suite locali, 13 scenari browser e flusso pubblico sintetico | CSV/writer/Windows, Arduino → pagina, clock/cadenza/latenza, volume, dispositivi reali, backup/avvisi e WX |
| REL-02 — Rilascio | Pubblicazione WIP autorizzata completata via Git/Vercel; migrazione e lettura Supabase applicate | Verifiche dei prossimi rilasci e chiusura criteri MVP dopo REL-01; nessuna autorizzazione remota implicita |
| END-01 — Chiusura | Nessuna chiusura pianificata | Decisione esplicita su data/perimetro e conservazione recuperabile dello storico |

#### Backup, migrazione e ripristino

I tre livelli restano database operativo, sorgente CSV locale e copia indipendente autorizzata. Versionamento Git e screenshot non sostituiscono il backup dei dati. La copia deve preservare tipo/provenienza (`live`, `historical`, `synthetic`), metadati e tempi separati, schema/migrazioni, CSV e identità/outbox necessarie al replay sicuro. Google Drive scolastico è indicato dall’utente come archivio dei backup DB; dispositivo/processo di export-upload, responsabile del restore, frequenza/retention/cifratura e RPO/RTO restano aperti.

Il restore va provato in ambiente separato senza sovrascrivere produzione; confrontare conteggi, UUID, valori, null temporali, provenienza, schema e permessi. File presente o job riuscito non bastano. Nessuna esportazione, pulizia o attivazione di servizio deriva dalla sola revisione documentale.

#### Esercizio e passaggio ai dati reali

[docs/operations.md](docs/operations.md) contiene target e procedura di diagnosi/rilascio; è una guida iniziale, non prova di backup o allarmi operativi. Il batch dei cinque campioni rimane `synthetic`; la postilla resta visibile finché è esposto. Alla prima misura reale verificare priorità di `live` in `latest` e chiarezza dello storico, poi decidere il destino dei campioni di prova. Eventuale rimozione solo su richiesta e per batch/UUID verificati, mai per tutta la sorgente condivisa. Cambiare la postilla è una decisione separata.

Per la scuola/open day la versione corrente è WIP, senza freschezza reale attestata o stime disponibili. Il rilascio definitivo richiede le prove di REL-01 e i criteri di §15. Nessuna relazione, slide o presentazione separata richiesta. La checklist operativa è il [blocco 8 di tasks.md](tasks.md#8-fase-8--backup-gestione-e-rilascio).

### Dipendenze, risultati attesi e criteri di uscita

Il setup generale locale SET-00–SET-04 è stato eseguito su richiesta dell’utente. La Fase 5 è ora applicata e verificata nel target scelto; il piano non autorizza automaticamente operazioni remote o migrazioni.

| Fase | Dipende da | Risultato concreto | Criterio di completamento |
|---|---|---|---|
| 3 — Mini setup | Repository e decisioni minime | SET-00–SET-04, inventario e baseline | Completato nei limiti registrati |
| 4 — Contratto dati | 3 e campione/writer reale | DATA-01–DATA-03 e BE-01 | BE-01 locale pronto; verifica CSV/tempo aperta |
| 5 — Database e backend | 4 locale; conferma reale prima del rilascio | BE-02–BE-07, schema/accessi, migrazione, ingest/read | BE-02–BE-07 applicati e verificati sul contratto v1; catena fisica ancora da convalidare |
| 6 — Uploader | 4, contratto 5 e PC Windows | UP-01–UP-04, outbox e guida | Crash/offline/rotazione e catena reale verificati |
| 7 — Previsioni e frontend | 3; dati reali: 4–6; stime: serie idonee | WX-01–WX-02 e UI-00–UI-02 | UI accessibile, aggiornamento automatico e modello valutato |
| 8 — Backup e rilascio | 5–7, storage e richiesta di pubblicazione | OPS-01–OPS-03, REL-01–REL-02, END-01 | Restore e flusso completo provati; rilascio e chiusura solo se richiesti |

La UI con stati vuoti può essere progettata dopo la fase 3, senza presumere schema
o usare misure dimostrative non dichiarate. Il disegno dei backup parte insieme
alla fase 5; la prova di restore della fase 8 precede la pubblicazione.

### Sequenza accelerata per la consegna della prossima settimana (proposta)

Finestra richiesta: **26 ottobre–1 novembre 2026**, interpretata rispetto al 21 ottobre; non è una promessa di completamento o una data già concordata per la pubblicazione. Ridurre il lavoro al flusso essenziale, senza saltare autenticazione, unicità, timestamp e prova di recupero. La revisione originaria era documentale; le successive implementazioni richiedono una richiesta, ora presente per il blocco 5.

1. **Prima del parser/schema definitivo:** acquisire un campione reale e osservare writer/seriale sul PC; verificare permessi, clock e riavvio automatico. Se il campione manca, il flusso reale non è dichiarabile pronto.
2. **In parallelo come attività indipendenti, dopo richiesta di implementazione:** UI italiana con stati vuoti e grafici; studio del modello locale, con valutazione dei tre orizzonti appena esiste una serie datata idonea. Nessun dato simulato non marcato.
3. **Catena minima reale:** endpoint autenticato, vincolo idempotente e outbox persistente; una misura nuova attraversa PC → DB → pagina aperta. Preferire lettura incrementale delle righe al caricamento ricorrente dell’intero CSV.
4. **Accettazione prima del rilascio:** CSV reale confrontato con DB/UI, retry senza duplicati, rete assente e ripresa, UI senza reload, previsioni mancanti/vecchie, separazione fonti, copia indipendente con restore minimo, build/lint e test critici.
5. **Rifinitura e rilascio autorizzato:** layout mobile/open day, testi, limiti del modello e breve guida per l’utente. Rimandare confronti avanzati, account/download già esclusi e automazioni non necessarie; modello nostro valutato separatamente secondo §6 e WX-01/WX-02.

La chiusura a dicembre è una previsione organizzativa, non una scadenza di consegna e non una richiesta operativa. Quando sarà confermata, concordare se fermare solo l’acquisizione o anche sito/servizi; esportare e verificare la conservazione dello storico prima di revocare accessi. Nessuna cancellazione o arresto programmato automaticamente da questo piano.

## 8. Contratti e comportamenti da definire

### Ingestione

Prima dell’implementazione fissare:

- versione del payload;
- ID sorgente/stazione;
- formato numerico e unità;
- campi temporali e loro provenienza;
- dimensione massima del batch;
- semantica di risposta per nuovi record, duplicati e righe rifiutate;
- politica batch: tutto o niente oppure risultati per riga;
- codici HTTP, retryable/non-retryable e limiti di frequenza;
- rotazione della credenziale e procedura di reinstallazione sul PC.

### Protocollo di ingestione e recupero (proposta da revisionare)

1. Leggere soltanto righe complete secondo il contratto reale; EOF senza newline non basta a dimostrare stabilità. Se necessario usare evidenze del writer o letture successive stabili.
2. Assegnare una sola volta l'identità dell'evento e salvare nella stessa transazione locale riga, payload, generazione/posizione del file, ID e avanzamento del cursore. Valutare SQLite come outbox semplice; non è una scelta già approvata. Non anticipare il cursore a dati non persistiti.
3. Inviare la coda via HTTPS; tenere un'unica istanza attiva. Lo stato locale deve sopravvivere a riavvio e crash. Il CSV originale non viene cancellato dopo l'invio.
4. L'endpoint autentica la sorgente, valida e applica un vincolo unico nell'ambito concordato, per esempio sorgente + `ingestion_id`. Stesso ID e stesso contenuto canonico restituiscono il successo già ottenuto; stesso ID con contenuto diverso produce conflitto esplicito e non sovrascrive il record.
5. La perdita della risposta dopo il commit remoto è normale: riprovare con lo stesso ID. Segnare completata la riga solo dopo conferma persistita localmente. Per batch, definire atomicità oppure risposte per elemento: mai confermare in blocco righe rifiutate o dall'esito ignoto.
6. Per timeout/errori di rete/5xx usare backoff esponenziale con jitter e limiti concordati; per 429 rispettare l'eventuale `Retry-After`. Per credenziale rifiutata sospendere gli invii e segnalare al responsabile. Errori permanenti di parsing/validazione vanno in quarantena durevole e non devono bloccare tutte le righe successive o essere scartati in silenzio.
7. In assenza di rete conservare coda e sorgente fino al limite di spazio concordato. Definire avvisi di disco pieno, coda massima e durata offline supportata; non promettere conservazione illimitata né eliminare automaticamente dati non confermati.
8. Per troncamento/sostituzione/rotazione distinguere le generazioni del file; riconciliare con il registro locale. Un hash della sola riga non identifica l'evento: due righe uguali possono essere entrambe valide.
9. Salvare e ripristinare il registro delle identità insieme all'outbox. Generare nuovi UUID a ogni reimportazione impedisce la deduplicazione dello storico: serve una mappa persistente o una procedura esplicita di riconciliazione. Se lo stato è perso, fermare la reimportazione automatica e richiedere revisione, senza fingere garanzie di unicità.

Garanzia cercata: consegna ritentabile con effetto unico per l'identità persistita, non una promessa generica di trasporto “exactly once”. La protezione non recupera misure mai salvate dal writer né dati già cancellati prima dell'acquisizione.

### Lettura

Fissare:

- dati pubblici e colonne escluse;
- query per ultima misurazione e intervallo;
- fuso orario di visualizzazione `Europe/Rome` approvato, con istanti assoluti memorizzati in UTC;
- ordinamento, limiti e paginazione;
- trattamento esplicito di `measured_at` nullo, senza sostituzione silenziosa con `received_at`;
- comportamento con dataset vuoto o non aggiornato;
- eventuale caching e freschezza massima.

### Aggiornamento automatico dalla nuova riga alla pagina aperta

**U:** il PC è un tramite dedicato: il writer salva il CSV, l’uploader inserisce nuove misurazioni nel DB, il sito le mostra subito. Il trigger è la nuova riga completa, non l’obbligo di aspettare un’altra ora. Se la stazione produce una misura ogni ora, il sito non può mostrare misure reali più frequenti.

**I, da validare sul PC:** osservare periodicamente il file o il writer con intervallo breve, accodare e inviare soltanto nuove righe complete; nessuna nuova misura → nessun reinvio del CSV. Dopo commit, aggiornare ultima misura e grafici senza reload: confrontare notifiche DB mirate con polling breve e contenuto, scegliendo l’opzione più semplice compatibile con quote e traffico. Target iniziale proposto: visibilità nell’ordine di 30 secondi dal commit in condizioni normali, da testare; nessuna garanzia di ritardo nullo o durante offline.

Il timestamp delle nuove righe si acquisisce il più vicino possibile al writer/seriale, con clock sincronizzato e provenienza; il semplice rilevamento della modifica CSV non dimostra l’istante di misura quando esiste buffering. Conservare CSV e outbox per ripresa: “tramite” non significa eliminare la sola copia locale prima della conferma remota.

### Stato stazione

La regola deve essere documentata e testabile. Con `measured_at` affidabile confrontare l'ultima misura valida con una soglia derivata dalla cadenza reale; la cadenza di circa un’ora è confermata con riserva dall’utente e va verificata sul campione. Con solo `received_at` mostrare “ultima ricezione” e “freschezza della misura sconosciuta”: un invio di storico vecchio non dimostra attività attuale della stazione. Un eventuale heartbeat dell'uploader indica attività del software, non funzionamento dei sensori. Stati candidati: “aggiornata”, “in ritardo”, “nessun dato”, “orario misura sconosciuto”. Soglia U approvata: **20 minuti oltre la misura attesa**; non 20 minuti dall’ultima misura. Formalizzazione proposta: `late = now > next_expected_at + 20 minuti`, dove cadenza e ancoraggio di `next_expected_at` vanno prima verificati. Con cadenza esatta di un’ora e misura alle 10:00, esempio puramente illustrativo: successiva attesa alle 11:00, ritardo oltre le 11:20. Non usare un’ora fissa di calendario se il writer campiona con un altro ancoraggio.

Con timestamp affidabile mancante, non dichiarare la freschezza della misura: si può indicare separatamente il ritardo di ricezione solo dopo aver validato il comportamento live, escludendo batch storici e buffering. Una ricezione arretrata non riporta la stazione allo stato “aggiornata”. Canale degli avvisi al responsabile ancora aperto; nessuna notifica inviata da questa attività.

### Stati della UI e accessibilità

| Condizione | Comportamento richiesto |
|---|---|
| Caricamento iniziale | Indicazione testuale accessibile, senza misure fittizie |
| Nessuna misura o intervallo vuoto | Messaggi distinti: archivio vuoto oppure assenza nel periodo scelto |
| Campo nullo/anomalo | “Dato non disponibile” o segnale qualità, mai zero sostitutivo; indicare unità e limiti noti |
| Dati obsoleti | Conservare gli ultimi valori con data e avviso; non farli sembrare attuali |
| Errore rete/API | Messaggio italiano e possibilità di ritentare; eventuale ultimo risultato identificato con data |
| Ora misura assente/stimata | Etichetta esplicita; grafici separati o esclusione motivata, nessun fallback temporale silenzioso |
| Lettura ripresa dopo errore | Rimuovere l'avviso solo dopo una risposta valida, preservando la corretta selezione dell'intervallo |

Criteri proposti: layout fruibile da mobile e con zoom, HTML semantico e lingua italiana, focus visibile e tastiera per tutti i controlli, grafici con riepilogo/tabella accessibile, informazioni non affidate al solo colore, unità e date comprensibili, contrasto verificato e rispetto di `prefers-reduced-motion`. Obiettivo candidato WCAG 2.2 AA, da concordare e verificare con controlli automatici e manuali; non è una conformità già dimostrata. Nessun bisogno specifico di accessibilità dichiarato in Q33; l’obiettivo formale WCAG non è stato approvato esplicitamente, mentre restano richiesti i criteri pratici di base. Palette libera; Tailwind ed ECharts solo opzioni da giustificare.

## 9. Sicurezza e privacy

- HTTPS per tutti i trasferimenti remoti.
- Segreti in ambiente server o archivio credenziali del PC, mai in repository, frontend, screenshot o log.
- `.env*` esclusi da Git, con un eventuale `.env.example` contenente solo nomi e valori segnaposto.
- Non stampare né copiare `.env.local` in report e tool output.
- Key pubblica Supabase: utilizzabile nel browser solo se policy e permessi sono coerenti; non è una credenziale server.
- Nessuna chiave `service_role` o altra chiave privilegiata nel client.
- RLS attiva sulle tabelle esposte e testata con il ruolo anonimo.
- Funzioni e viste valutate per privilegi effettivi; niente bypass RLS introdotti per comodità.
- Validazione server-side, limiti di payload/richieste, errori minimizzati.
- Evitare IP, nomi, account o percorsi del PC nei log se non necessari. Nessun account visitatore o profilazione. Google Analytics è stato aggiunto il 23 ottobre 2026 su richiesta esplicita dell’utente, con caricamento solo dopo consenso facoltativo, rifiuto disponibile e revoca dalle preferenze; non viene caricato dopo rifiuto. Le integrazioni Vercel Analytics e Speed Insights già presenti non sono regolate da questa scelta e restano da valutare nell’informativa. Verifica e informativa privacy completa sul sito restano da completare prima del rilascio.
- Definire chi può accedere al PC e allo storage scuola e come revocare l’accesso quando cambia il team.

### Matrice di accesso da approvare prima delle policy

| Attore | Lettura candidata | Scrittura candidata |
|---|---|---|
| Visitatore | Solo misure/campi approvati e query limitate; nessun dato interno | Nessuna |
| Account visitatore | Esclusi dal perimetro (U: Q19), nessun login o profilazione | Nessuna |
| Uploader Windows | Solo conferme necessarie al proprio invio | Solo endpoint autenticato per la propria sorgente, nessun accesso DB privilegiato sul PC |
| Endpoint server | Minimo necessario a inserimento e deduplicazione | Ruolo ristretto se praticabile; ogni eventuale privilegio elevato richiede motivazione e verifica |
| Responsabile/operatore backup | Dati necessari a manutenzione ed esportazione | Operazioni autorizzate e tracciate, separate dall'accesso pubblico |

La matrice è una proposta, non una descrizione delle policy attuali. RLS e privilegi SQL sono controlli distinti: progettare entrambi. Una vista non è automaticamente sicura o read-only per il solo fatto di essere una vista; verificarne privilegi effettivi e comportamento rispetto a RLS. Nessuna chiave server privilegiata nel PC o nel browser. [Riferimento: sicurezza Data API Supabase](https://supabase.com/docs/guides/api/securing-your-api).

Per le tabelle esposte progettare RLS e provarla con i ruoli effettivi, includendo rifiuto di insert/update/delete non autorizzati e assenza di bypass tramite viste/funzioni. Privilegi e RLS remoti ora verificati in BE-07, con accesso diretto pubblico negato; verbale in docs/backend-verification.md. [Riferimento: RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

L’utente è il responsabile dichiarato delle credenziali (U: Q21), nessun sostituto indicato. Mantenere una procedura essenziale senza introdurre ruoli applicativi: inventario dei soli nomi/scopi/ambienti, luogo di custodia approvato, revoca e rotazione, prova con credenziale nuova prima di revocare quella vecchia quando possibile, procedura urgente in caso di esposizione. Non chiedere o conservare i valori nelle risposte al piano. Nel frontend Vite qualsiasi variabile resa pubblica al bundle va trattata come pubblica: non usare prefissi client per segreti.

Consultati i riferimenti ufficiali su accessi/RLS e, nel setup, changelog HTML e condizioni pubbliche aggiornate. La transizione dei default Data API richiede attenzione a privilegi espliciti e RLS; le offerte gratuite consultate non attestano il piano effettivo degli account. Fonti e limiti in `docs/services.md`; ricontrollare prima dell’applicazione e del rilascio.

### Backup, retention e continuità (decisioni operative mancanti)

Il database online e il CSV sono rispettivamente archivio operativo e sorgente: non sostituiscono una copia indipendente. La retention va definita separatamente per CSV grezzo, registro/outbox, misure canoniche, quarantena, log e backup, con durata, responsabile, spazio massimo, condizioni di cancellazione e prova di recuperabilità. Conservazione **permanente** richiesta per CSV e storico (U: Q3, Q25). Non estendere automaticamente tale richiesta a ogni log o copia intermedia: retention dei log, quarantena e versioni backup ancora da definire. Nessuna cancellazione viene autorizzata dal piano.

- Esportare dati e metadati di provenienza/tempo, versione dello schema, policy/ruoli e configurazione necessaria al ripristino priva di segreti. Non assumere che un dump includa credenziali o risorse esterne.
- Usare storage approvato dalla scuola con accessi separati, cifratura e custodia della chiave definite; una copia sullo stesso disco o account non copre tutti i rischi.
- Concordare RPO (perdita massima accettabile) e RTO (tempo massimo di ripristino); derivare frequenza delle copie e prove da questi obiettivi, dalla cadenza reale e dai periodi di chiusura scolastica.
- Rendere osservabili backup mancati o falliti e spazio esaurito; definire chi interviene, senza pubblicare log sensibili.
- Nel restore separato verificare checksum, conteggi, valori, min/max temporali, record con `measured_at` nullo, unicità, provenienza e permessi/RLS prima di ricollegare il frontend. Nessuna sovrascrittura di produzione come prova.
- Ripristinare/riconciliare anche l'outbox e il suo registro: un DB restaurato a un punto precedente può perdere eventi che l'uploader ritiene confermati. Conservare sorgente e mappa delle identità per un replay controllato e idempotente.
- Registrare data, versione, durata, esito, scostamento da RPO/RTO e responsabile del test. L’utente non richiede un programma di passaggio consegne; basta una procedura essenziale eseguibile dal responsabile. Ripetere dopo cambiamenti significativi e con cadenza da definire, senza imporre un secondo manutentore.

### Candidati backup e gestione proporzionata all’orizzonte scolastico

L’utente indica il PC o uno tra GitHub, Vercel e Supabase come candidati (Q23); nessuna destinazione indipendente o autorizzazione scolastica specifica è già stata verificata. Il CSV originale sullo stesso PC non è una copia indipendente. Una copia del database sul PC può coprire un guasto del solo database, ma resta vulnerabile alla perdita del PC insieme alla sorgente. Il database operativo Supabase e il deployment Vercel non vengono considerati automaticamente backup. Non caricare dump, segreti o copie dei dati su GitHub per deduzione da questa risposta: destinazione, esposizione, capacità e procedura vanno prima progettate.

Con budget 0 € e conservazione permanente, verificare capacità/copie sul volume reale; non promettere durata illimitata garantita da alcun servizio gratuito. RPO/RTO restano aperti: “non so” non è consenso a perdere un giorno di dati o ad aspettare una settimana.

La gestione ordinaria deve essere automatica ogni ora, nei limiti da verificare di writer e cadenza; gli interventi essenziali per guasti, quote e credenziali restano necessari anche senza manutenzione programmata. Destinatario degli avvisi: l’utente; canale non scelto. Conservare una guida breve per avvio/stop, riconoscimento dei problemi e ripristino, senza espandere il progetto in una piattaforma gestionale.

## 10. Strategia Git e collaborazione

- `main` è il branch stabile.
- Per lavoro parallelo o funzionalità isolate, usare branch dedicati `codex/...` o nomi chiari concordati.
- Aprire pull request per revisionare modifiche sostanziali, soprattutto schema, policy, uploader e segreti.
- Preferire commit piccoli e descrittivi in inglese.
- Non creare commit, push, merge o riscritture della storia senza richiesta esplicita.
- Non includere `.env.local`, credenziali, CSV con eventuali informazioni sensibili o backup nel repository.
- Prima di ogni modifica, rilevare `git status`; separare e preservare le modifiche dell’utente.
- Non aggiungere test o dipendenze senza motivazione; i componenti critici di parsing, validazione e idempotenza richiedono test specifici quando implementati.

## 11. Registro decisioni ed esiti

Esiti iniziali al 21 ottobre 2026, fonte risposte Q1–Q35; aggiornati il 22 ottobre con le risposte alle criticità e le scelte tecniche delegate (§18). “Deciso (U)” indica una scelta dichiarata, non una configurazione implementata o un’autorizzazione a intervenire sui servizi.

| ID | Tema | Stato / esito | Verifica o dipendenza residua |
|---|---|---|---|
| D1 | CSV e writer | U, 22 ottobre: ordine secondi dall'accensione, temperatura °C, umidità %, pressione hPa; CSV sul Desktop Windows, campione rinviato e percorso completo ignoto. L'utente non conosce dialetto/writer; “standard” resta ipotesi | Adattatore locale con dialetto esplicito, senza default. Campione/writer necessari per separatore, decimali, intestazioni, risoluzione, append e righe parziali; nessun parser definitivo |
| D2 | Tempo misura/acquisizione | U: aggiungere l’ora all’invio quando cambia il file. Scelta tecnica: data/ora completa UTC in `captured_at`, asse di acquisizione dichiarato; `measured_at` resta nullo se ignoto | Prima osservazione di nuove righe complete, non ogni retry; righe pregresse senza data e buffering da distinguere; dettagli §18 |
| D3 | Identità eventi | Scelta tecnica delegata: UUID per evento persistito in SQLite insieme a generazione file e posizione | Vincolo DB sorgente + ID; nessuna nuova identità nei retry; riconciliazione dopo perdita stato |
| D4 | Lettura dati | Scelta tecnica delegata: endpoint di lettura a parametri fissi e risultati limitati; pubblico read-only | Query parametrizzate, privilegi/RLS e cache da implementare/provare; niente tabelle interne esposte per comodità |
| D5 | Sensori e validità | Parziale: °C, %, hPa confermati (U) | Modelli, collocazione/schermatura, taratura, precisione, sentinelle e pressione assoluta/corretta mancanti |
| D6 | Backup | Approvato il 22 ottobre: backup automatico cifrato indipendente e prova di ripristino. L’utente indica Drive scolastico per i backup del database e gestione manuale dei file del programma; non dal PC scolastico | Definire un processo di export Supabase e upload cifrato verso Drive da un dispositivo amministrativo autorizzato; frequenza e target RPO/RTO da approvare; nessun job o upload eseguito |
| D7 | Responsabile credenziali/PC | Deciso (U): utente responsabile e custode | Custodia concreta, procedura revoca e diritti tecnici Windows da verificare |
| D8 | Ritardo | U: oltre atteso +20 minuti; delegata la tecnica. Configurazione iniziale proposta: 60 minuti, ancora non verificati | Stato dell’acquisizione PC con `captured_at` quando ammesso; freschezza fisica sconosciuta senza ora misura; backlog escluso e cadenza da verificare |
| D9 | Budget/quote | Deciso (U): 0 € | Quote attuali, volumi, tolleranza ai fermi e comportamento a limite esaurito ancora aperti |
| D10 | Retention | Deciso (U): CSV/storico permanenti | Capacità e copie sostenibili; retention log/quarantena/versioni backup aperta |
| D11 | Download pubblico | Deciso (U): escluso | Esportazioni amministrative per backup ammesse come requisito tecnico, non download per visitatori |
| D12 | Fuso UI | Deciso (U): Europe/Rome; scelta tecnica UTC per gli istanti assoluti | Test DST, clock e provenienza del timestamp |
| D13 | Sessioni Arduino | Parziale: GIGA R1 dichiarato (U) | Firmware, rollover, reset e riordino da verificare |
| D14 | Replay/perdita stato | Aperto | Registro identità e procedura di riconciliazione, prima dell’import storico |
| D15 | Vincoli Windows | Parziale: PC dedicato/adattabile, installazione consentita (U) | Append, attività continua, avvio senza login, proxy, spazio e permessi effettivi da provare |
| D16 | Anomalie | U: conservare e mostrare “probabile errato”; F: validatore locale v1 preserva numeri sospetti con motivo per campo, distingue null da zero | Limiti fisici minimi e range opzionali implementati; soglie sensore/sentinelle da verificare. Quarantena durevole ancora UP-03 |
| D17 | Recupero/offline | Aperto | RPO/RTO e durata offline non indicati; nessun valore assunto come approvato |
| D18 | MVP/scadenza | Deciso (U): pronto settimana prossima; misure/grafici/stato, aggiornamento automatico e previsioni +30m/+1h/giornata | Finestra interpretata 26 ottobre–1 novembre 2026; giorno preciso non indicato; dati reali e nuovo requisito previsioni condizionano la consegna |
| D19 | Gestione/continuità | Utente responsabile; chiusura complessiva ipotizzata a dicembre (U), non confermata | Data e perimetro della chiusura da decidere allora; nessuna cancellazione o spegnimento implicito, storico da preservare |
| D20 | Roadmap unica | Deciso (U: Q35): tenere solo plan.md | Fonte piano.md rimossa dopo integrazione dei contenuti utili |
| D21 | Avvisi al responsabile | Approvato il 22 ottobre: controllo indipendente e avvisi email all’utente | Destinazione email e meccanismo gratuito da configurare/provare; nessun messaggio inviato |
| D22 | Design/presentazione | Deciso (U): sito curato per scuola/open day, niente slide o relazione | Proposta visiva da valutare; blu notte non obbligatorio; buone pratiche accessibilità di base |
| D23 | Previsioni | U, 22 ottobre: calcolate dal progetto senza servizio meteo esterno; precedente proposta Open-Meteo superata | Modello locale sperimentale, qualità temporale e valutazione per orizzonte da progettare; nessuna previsione attendibile già disponibile; §6 e WX-01/WX-02 |
| D24 | Aggiornamento live | Richiesto (U): inserire nuova misura e aggiornare il sito automaticamente | Progettare rilevamento CSV e aggiornamento UI; target ~30s dal commit proposto, non SLA approvato |

## 12. Rischi e mitigazioni

| Rischio | Effetto | Mitigazione proposta |
|---|---|---|
| Timestamp assente o ricostruito | Grafici storici temporalmente ingannevoli | Null esplicito, timestamp di ricezione separato e provenienza visibile |
| CSV differente dall’esempio | Parsing errato o perdita righe | Campione reale, parser configurato/testato e quarantena delle righe invalide |
| Rete scolastica intermittente | Dati non inviati in tempo | Outbox durevole e retry con backoff |
| Reset Arduino | Uptime non monotono | Trattare uptime solo come metadato; non usarlo da solo come chiave o data |
| Retry/concorrenti | Duplicati | ID stabile e vincolo univoco DB |
| File riscritto o ruotato | Salti o doppioni nella lettura | Identità file + stato persistente + riconciliazione e test |
| Segreto nel bundle o Git | Ingestione abusata/accesso privilegiato | Separazione server/client, scansione prima del commit, rotazione in caso di esposizione |
| RLS errata | Modifica o lettura non autorizzata | Test anonimo/authenticated e permessi minimi prima del rilascio |
| Free tier cambia o progetto viene sospeso | Sito/DB indisponibile | Backup indipendente, restore testato e verifica periodica dei termini |
| Backup non ripristinabile | Perdita dello storico | Restore di prova con checklist e confronto di integrità |
| Indicatore online fuorviante | Perdita di fiducia | Stato basato sulla freschezza dei dati, con soglia documentata |
| Eccesso di dipendenze | Manutenzione difficile | Aggiungere librerie soltanto quando migliorano una funzione necessaria |
| Scadenza ravvicinata e CSV ancora assente | Impossibile validare il flusso reale in tempo | Campione/writer come prima dipendenza; UI e studio del modello possono procedere separatamente senza spacciare simulazioni per funzionamento |
| Previsioni confuse con misure | Attribuzione falsa alla stazione | Sezioni e tempi distinti, fonte e interpolazione dichiarate, nessuna previsione inventata |
| Modello locale non valutato o serie insufficiente | Stime senza attendibilità dimostrata | Verifica temporale per orizzonte e stato indisponibile indipendente dalle misure; nessuna condizione meteorologica inventata |
| Chiusura a dicembre interpretata come cancellazione | Perdita dello storico permanente | Conferma esplicita di data/perimetro, copia e restore verificati prima di arresti o revoche |

## 13. Test e verifiche previste

### Verifiche frontend

- Build TypeScript/Vite e lint.
- Layout mobile/desktop, focus, tastiera, contrasto e riduzione animazioni.
- Dataset vuoto, reale, obsoleto, errore HTTP e recupero dopo errore.
- Nessuna misura segnaposto presentata come reale.
- Query e fusi orari ai limiti di giorno/settimana e ora legale.
- Nuovo evento nel DB visibile sulla pagina già aperta senza reload; misurare ritardo, ripresa dopo disconnessione e assenza di falsi record.
- Stime +30m/+1h/giornata: dati ammessi e provenienza temporale, valutazione senza dati futuri per ciascun orizzonte, errore e numerosità dichiarati, modello/versione e validità. Dati insufficienti, sospetti o vecchi e stime scadute producono stato indisponibile senza nascondere le misure; nessun valore di confronto interpolato spacciato per osservazione.
- Storico senza timestamp conservato ma escluso dai grafici cronologici; nessun orario ottenuto dalla data di importazione.

### Verifiche backend/database

- Vincoli su null, range, precisione e unità.
- Accesso anonimo read-only secondo policy approvate.
- Tentativi anonimi di insert/update/delete rifiutati.
- Inserimento endpoint e deduplicazione concorrente.
- Privilegi server minimi e assenza di chiavi private nel client.
- Query storiche e indici sotto un volume realistico.

### Verifiche uploader

- Riga parziale e scrittura in corso.
- EOF senza newline, riga invalida, decimali localizzati.
- Rete assente, timeout, 429, 5xx, 4xx e recupero.
- Riavvio del PC e ripresa dell’outbox.
- Reset Arduino, duplicati, CSV troncato, sostituito e ruotato.
- Doppia esecuzione accidentale.
- Stato locale corrotto o backup/restore dello stato uploader.

### Verifiche backup

- Esportazione completa e checksum/controlli di integrità.
- Restore in ambiente separato.
- Confronto conteggio, intervalli temporali, record senza timestamp e duplicati.
- Procedura ripetibile dal responsabile, senza dipendere da passaggi non documentati o richiedere un secondo manutentore.
- Annotazione della data, durata, versione schema e risultato del restore.

## 14. Documentazione da produrre

- `README.md`: panoramica, requisiti, avvio locale, comandi, configurazione non segreta e link all’architettura.
- `plan.md`: unica roadmap operativa, evidenze, requisiti, decisioni e risposte (questo documento); il duplicato `piano.md` è stato rimosso su richiesta Q35.
- `AGENTS.md`: istruzioni operative stabili per i futuri agenti.
- `tasks.md`: checklist operativa con scopo e istruzioni specifiche per ogni attività; setup SET-00–SET-04 completato, successivi task ancora da eseguire.
- `docs/backend.md` e `docs/services.md`: runtime/configurazione locale e inventario servizi predisposti nel setup; non sostituiscono la specifica dati ancora da completare.
- `CORRECTIONS.md`: problemi verificati/segnalati, prove, proposte ed esito delle correzioni.
- Guida architetturale: componenti, flussi, confini di fiducia e timestamp.
- Guida variabili ambiente: nomi, destinatario, modalità di configurazione; mai valori reali.
- Specifica del CSV e del payload di ingestione, con esempi fittizi dichiarati.
- Guida installazione/manutenzione uploader su Windows.
- Runbook di backup e ripristino testato.
- Procedura di rotazione/revoca delle credenziali.
- Informativa del sito sul significato e i limiti delle misurazioni, se necessaria alla pubblicazione.

## 15. Definition of Done complessiva

Il prodotto è pronto per essere considerato un MVP rilasciabile solo quando (il setup locale SET è un risultato distinto, già completato):

- l’applicazione è una dashboard italiana responsive, accessibile e priva di dati inventati non marcati;
- il modello dati e le policy sono stati revisionati e applicati tramite migrazioni versionate;
- ingestione e lettura funzionano con ruoli separati e privilegi minimi;
- l’uploader sopravvive a interruzioni, riavvii, duplicati e rotazioni, usando il formato CSV reale;
- timestamp e incertezza sono rappresentati correttamente, incluso lo storico senza data;
- nuove misure aggiornano la pagina senza reload e gli orizzonti previsionali richiesti hanno fonte/tempi corretti oppure uno stato indisponibile esplicito, senza confusione con i sensori;
- backup indipendente e restore di prova sono documentati;
- build, lint, test critici e verifiche manuali pertinenti passano;
- istruzioni essenziali di avvio, diagnosi e ripristino permettono al responsabile di gestire il sistema senza un programma strutturato di passaggio consegne;
- ogni costo/limite remoto è stato verificato e nessun servizio a pagamento è stato attivato senza autorizzazione;
- modifiche remote, produzione e Git sono state eseguite soltanto con autorizzazione esplicita.

## 16. Prossimo passo consigliato

Il setup SET-00–SET-04 e BE-01–BE-07 sul contratto v1 sono completati tecnicamente.
BE-07 è stato applicato al progetto Supabase MeteOlivelli esistente scelto dall’utente;
prove e limiti in [docs/backend-verification.md](docs/backend-verification.md).
La Fase 6 dispone ora di uploader locale provvisorio e guida: restano vincoli
CSV/tempo da verificare in DATA-01–DATA-03 e prove sul PC Windows. Nella Fase 7
UI-01 è implementata e verificata localmente; UI-02 resta provvisoria e il modello
sperimentale richiede serie datate idonee. Prossime prove: nuova misura reale nella
pagina aperta, cadenza/ancoraggio e validazione separata degli orizzonti.
Nessuna promessa di catena fisica pronta prima del campione e delle prove sul PC.

La baseline locale della fase 3 è completata nei limiti della sezione 4. L’MVP definito nella fase 3 prevede: sito pubblico per scuola/open day, ultimi valori, grafici 24h/7g/30g, aggiornamento automatico, previsioni +30 minuti/+1 ora/giornata, stato con tolleranza di 20 minuti oltre l’atteso, niente account/profilazione/download. Consegna richiesta settimana prossima, finestra interpretata 26 ottobre–1 novembre 2026; eventuale chiusura a dicembre ancora incerta. Non riproporre come aperte queste scelte.

Prima di parser e schema definitivi serve il campione reale, oggi non disponibile, e una breve osservazione del writer/seriale. La disponibilità a modificare il PC permette di progettare un timestamp locale per le nuove righe, ma non rende automaticamente noto l’orario delle misure storiche. La UI con stati vuoti può procedere indipendentemente, senza inventare misure.

Dipendenze residue prioritarie: campione CSV/writer, qualità temporale e serie idonee per il modello locale, procedura per esportare il DB in copia indipendente e provarne il restore; canale delle notifiche. Google Drive scolastico è la destinazione indicata, ma dispositivo/processo e dettagli operativi restano da decidere. Le scelte del 22 ottobre e le proposte correnti sono nella sezione 18. Trattamento storico senza date scelto tecnicamente su delega; chiusura a dicembre da confermare solo quando concreta. Se non noti, diventano attività esplicite, non default approvati. Migrazioni, installazioni, pubblicazione e altre modifiche remote richiedono comunque richiesta esplicita.

## 17. Risposte dell’utente e chiarimenti residui

Fonte: risposte numerate Q1–Q35 dell’utente del 21 ottobre 2026. Mantenere espressioni di incertezza e non trasformare una risposta parziale in conferma delle altre parti della domanda. Nessuna risposta contiene segreti o autorizza automaticamente implementazione, messaggi o operazioni remote.

### A. CSV (Q1–Q4)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q1 | Campione non disponibile qui | Da raccogliere quando possibile, senza bloccare questa revisione documentale |
| Q2 | “Mi sembra che le aggiunga” | Append probabile, da osservare; nome e sorgente del writer non comunicati |
| Q3 | “Non si cancella mai” | Conservazione dichiarata; volume/file effettivi non noti |
| Q4 | “Sì penso, no” | Quattro campi/cadenza circa oraria confermati con riserva; non dichiarati altri campi/sorgenti, parser ancora da verificare |

### B. Tempo e hardware (Q5–Q8)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q5 | Nessuna data assoluta, solo secondi dall’accensione | Non usare l’uptime come timestamp; nessuna data storica inventata |
| Q6 | Arduino GIGA R1 | Modello dichiarato; firmware, overflow e buffering non risposti |
| Q7 | Consentite modifiche al PC, dedicato al progetto | Si può progettare l’acquisizione temporale sul PC; sincronizzazione da verificare. Trattamento storico poi delegato e deciso nel chiarimento successivo |
| Q8 | “Ok” | Europe/Rome e distinzione misura/ricezione accettati; nessun ancoraggio storico fornito |

### C. Misure e anomalie (Q9–Q10)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q9 | Temperatura Celsius, umidità %, pressione hPa | Unità dichiarate; non sono modelli di sensore, taratura, collocazione o tipo di pressione |
| Q10 | Conservate e segnalate | Scelta acquisita; codici errore e range non ancora disponibili |

### D. MVP (Q11–Q13)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q11 | Conferma del perimetro proposto | Ultimi valori, stato, grafici/storico 24h/7g/30g; priorità scuola/open day |
| Q12 | Scuola e open day | Nessuna richiesta aggiuntiva di statistiche/confronti |
| Q13 | Avviso dopo 20 minuti da quando avrebbe dovuto aggiornarsi | Tolleranza di 20 minuti oltre l’atteso, non dal precedente record; altre funzioni rinviabili non selezionate |

### E. Windows e notifiche (Q14–Q17)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q14 | PC sempre acceso “penso” | Da verificare: alimentazione, sospensione e restart; esecuzione senza login non chiarita |
| Q15 | Installazione consentita, PC adattabile | Diritti amministrativi e modalità di avvio da provare |
| Q16 | Non ritiene ci siano restrizioni, PC dedicato | Proxy, HTTPS, spazio e durata offline da verificare; nessuna capacità assunta |
| Q17 | Avvisi all’utente, canale ignoto | Destinatario definito, canale da scegliere |

### F. Pubblico e servizi (Q18–Q20)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q18 | Pubblico, sola visione, niente download, grafico | Grafici obbligatori; niente funzione di download. Un dato reso pubblico al browser non diventa tecnicamente impossibile da copiare: non promettere un controllo che la UI non può garantire |
| Q19 | Solo meteo, niente account o profilazioni | Nessun login o ruolo applicativo per i visitatori; restano separati gli accessi tecnici ai provider |
| Q20 | Progetti corretti e detenuti dall’utente; nessun ambiente separato ancora | Conferma U, non prova della salute o configurazione remota |

### G. Credenziali (Q21–Q22)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q21 | Custodia dell’utente | Responsabile definito; luogo di custodia e sostituto non indicati |
| Q22 | Non sa | Rotazione/revoca da proporre con procedura minima, nessuna cadenza approvata |

### H. Backup (Q23–Q26)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q23 | PC oppure GitHub/Vercel/Supabase | Candidati, non scelta di un backup indipendente né autorizzazione a caricare copie |
| Q24 | Non sa | RPO/RTO aperti, nessun default trasformato in requisito |
| Q25 | Permanente | Obiettivo per storico e sorgente; dimensionamento/copie e retention tecnica da progettare |
| Q26 | “Non so, io?” | Utente possibile esecutore del restore, da confermare; frequenza/ambiente ignoti |

### I. Budget (Q27–Q28)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q27 | Conferma 0 € | Nessuna spesa approvata; strategia al superamento quote ancora aperta |
| Q28 | “Io?” | Utente probabile referente quote; disponibilità accettabile e traffico non indicati |

### J. Gestione e orizzonte (Q29–Q31)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q29 | Utente responsabile | Nessun referente aggiuntivo dichiarato |
| Q30 | PC automatizzato ogni ora; primo riferimento a Natale | Superato dal chiarimento successivo: consegna settimana prossima, possibile chiusura a dicembre ancora non certa |
| Q31 | “Non serve” | Nessun piano strutturato di manutenzione/passaggio consegne richiesto; conservare il minimo indispensabile per guasti e dati permanenti |

### K. Design e contenuto (Q32–Q34)

| Riferimento | Risposta acquisita | Esito |
|---|---|---|
| Q32 | Non ha una scelta, deve essere bello | Proposta visiva libera e curata; palette/asset/permessi non forniti |
| Q33 | Nessuna esigenza specifica | Non equivale a richiedere una UI inaccessibile; niente promessa di conformità formale non verificata |
| Q34 | Solo sito | Escluse slide, relazione e presentazione separata |

### L. Documento unico (Q35)

L’utente chiede “solo quello nuovo”: mantenuto `plan.md` come unica roadmap e rimosso il duplicato `piano.md` dopo il trasferimento dei contenuti utili. `AGENTS.md` aggiornato per non richiedere un file ormai rimosso; `CORRECTIONS.md` invariato perché le risposte non costituiscono nuovi bug verificati.

### M. Chiarimento successivo: consegna, ruolo PC e previsioni

- **Consegna U:** sito pronto per settimana prossima. Dal contesto del 21 ottobre 2026 si interpreta 26 ottobre–1 novembre 2026, senza scegliere un giorno preciso.
- **Fine esercizio U con riserva:** si pensa di chiudere tutto a dicembre; non è certo e non autorizza arresti o eliminazioni. La conservazione dello storico resta distinta dalla durata dell’acquisizione.
- **Flusso U:** il PC è soprattutto un tramite; CSV scritto e aggiornato automaticamente, nuove misure inserite nel database e mostrate subito dal sito. Implementare in futuro eventi incrementali, non caricamenti ripetitivi dell’intero archivio.
- **Tempo storico, delega U e scelta tecnica:** conservare i record privi di data con `measured_at` nullo e non inventare un asse cronologico. Per il futuro progettare acquisizione temporale sul PC verificando writer, clock e latenza; l’ora di arrivo al database resta separata.
- **Nuovo requisito U del 21 ottobre:** previsioni per mezz’ora successiva, ora dopo e giornata. Inizialmente proposta una fonte esterna; proposta superata il 22 ottobre dalla richiesta di calcolo nel progetto (§6 e §18). Nessun modello locale validato o previsione reale già ottenuta.

### Questioni residue e attività di verifica

1. **Campione CSV e writer:** da ottenere appena disponibile per completare contratto, tempo e parser; non ripetere ora la richiesta di un file che l’utente non ha con sé.
2. **Qualità sensori e modello:** confermare collocazione, sensori e qualità della serie temporale. La richiesta del 22 ottobre supera la proposta del provider; posizione utile a descrivere la stazione, non prerequisito per collegare Open-Meteo.
3. **Backup minimo e avvisi:** restano aperti destinazione indipendente, recupero e canale verso l’utente; proporre una soluzione essenziale compatibile con 0 € e permessi reali.
4. **Fine esercizio:** non chiedere nuovamente se Natale sia la consegna; è già chiarito che la consegna è settimana prossima. Confermare data/perimetro della chiusura solo prima di eseguirla, senza cancellare dati per deduzione.

La scadenza è un obiettivo, non prova di fattibilità della catena reale senza campione e verifiche. Questa raccolta di requisiti era documentale. Il setup successivo ha predisposto runtime/configurazione locale e test; quel setup non includeva ingestione, collegamento applicativo, migrazioni, previsioni o deploy. Il successivo backend locale della Fase 5 è registrato nella sezione 4; DB e deploy restano aperti.

## 18. Revisione delle criticità e scelte delegate — 22 ottobre 2026

Fonte: risposte dell’utente ai punti 1–20 dell’analisi. U indica dichiarazione esplicita; T indica scelta progettuale effettuata su delega; P indica proposta ancora da discutere. Nessuna voce attesta codice, installazione o risorsa remota già realizzati. La richiesta di quella revisione riguardava decisioni e possibili soluzioni; non esegue deploy, migrazioni, configurazione di backup o invio di avvisi.

**Approvazione successiva del 22 ottobre 2026:** dopo il riepilogo abbreviato problema/soluzione, l’utente conferma “Ok, questi vanno bene”. Gli orientamenti del riepilogo sono quindi concordati, inclusi backup indipendente, modello nostro sperimentale e avvisi email. Restano da definire gli input mancanti e i dettagli non fissati dal riepilogo: campione CSV, sensori, destinazione delle copie, recapito email, frequenze e obiettivi numerici di recupero. Le quantità proposte sotto non diventano automaticamente valori approvati. L’approvazione delle soluzioni non segna completati i task applicativi né avvia operazioni remote.

### Risposte e regole operative

| Punti analisi | Stato | Esito |
|---|---|---|
| 1, 11 | U | Campione in futuro. CSV sul Desktop Windows; nome, percorso completo, eventuale reindirizzamento del Desktop e writer sconosciuti. Non cercare percorsi inventati |
| 2 | U + T | Osservare nuove righe complete dopo modifica del file. Aggiungere una sola volta `captured_at` con data, ora, secondi e fuso, conservato in UTC. Il sito può mostrare “13:59”, con data disponibile. Non modificare il CSV originale né usare solo HH:mm come timestamp |
| 3 | U + T | CSV e misure conservati permanentemente. 24h/7g/30g sono filtri del grafico, non scadenze di cancellazione. All’avvio poche misure producono grafici parziali. Storico senza data resta conservato, separato dalla serie datata |
| 4 | T | Configurazione provvisoria di cadenza 60 minuti, da verificare; tolleranza U +20 minuti. Con sola acquisizione PC, etichettare “acquisita dal PC alle” e stato dell’acquisizione, senza attestare l’ora o la freschezza fisica della misura. Mai riattivare lo stato per import storico |
| 5 | T | Verificare writer, sospensione, riavvio, clock e buffering; prevedere avvio automatico e singola istanza. Nessuna modifica firmware prima di verificare capacità esistenti; misure mai salvate non sono recuperabili tramite outbox |
| 6 | U | Calcolo delle previsioni nel progetto, senza provider meteo esterno; proposta scientifica e limiti nella §6. Le stime dipendono dai dati disponibili, non sono informazioni generate senza una sorgente |
| 7 | U + P | Approvato il principio del backup automatico cifrato indipendente con restore di prova; dettagli proposti sotto, destinazione effettiva e obiettivi ancora da definire |
| 8 | U | L’utente non richiede approfondimento delle stime di lavoro. Mantenere un ordine pratico senza Gantt o promesse di consegna; la finestra precedente non è stata esplicitamente cancellata |
| 9 | T | Procedere per risultati: contratto locale e UI con stati vuoti, poi CSV/tempo reale, pipeline, recupero e rilascio. Se manca il CSV la consegna tecnica resta una bozza; non trasformare una demo in produzione |
| 10, 12 | T | SQLite conserva atomicamente riga originale, ID UUID, generazione/posizione, payload congelato e cursore. Unicità server su sorgente + ID. Confrontare campi canonici versionati in unità fissate; escludere timestamp server/tentativi e ordine delle proprietà JSON. ID uguale e contenuto diverso → conflitto senza sovrascrittura |
| 13 | T | Le tre schede mostrano lo stesso ultimo evento acquisito con provenienza temporale ammessa; campi assenti restano assenti, sospetti visibili con avviso. Un import storico non sostituisce la scheda corrente. Per un eventuale ultimo valore valido precedente mostrare il suo orario distinto |
| 14 | T | Serie principale dei grafici con dati ammessi e buchi espliciti; campioni sospetti consultabili con marcatura e opzione di visualizzazione dedicata. Niente interpolazione silenziosa e nessun uso predefinito dei sospetti per statistiche o modello |
| 15 | U + T | Valori sospetti mantenuti, etichetta esatta “probabile errato” e motivo per campo. Non riscrivere l’originale; eventuali reinterpretazioni/correzioni future hanno versione e motivazione. Riga non leggibile conservata in quarantena, senza inventare numeri |
| 16 | Aperto | Sensori, collocazione, precisione, taratura e tipo di pressione da osservare a scuola. Nel frattempo dichiarare limiti noti, senza certificare qualità meteo o soglie fisiche mai verificate |
| 17 | U + T | Supabase confermato come backend; Edge Function con token dedicato alla sola sorgente, autenticazione piattaforma coerente e autorizzazione nell’handler. Nessuna chiave DB privilegiata nel browser o sul PC uploader; test di rifiuto prima del rilascio |
| 18 | T | Letture tramite endpoint con periodi ammessi 24h/7g/30g, colonne esplicite, paginazione/cursore stabile e limiti server. Nessuna scrittura visitatore. Indici, privilegi SQL e RLS provati separatamente |
| 19 | T | Partenza con polling delle sole novità ogni 15 secondi a pagina visibile e cache condivisa fino a 10 secondi, da provare nel runtime reale. Ricaricare la serie solo se cambia il periodo o arrivano nuovi eventi; sospendere in background e aggiornare al ritorno. Il target ~30s resta da misurare, non garantito dalla sola somma dei timer |
| 20 | U + T | Approvati controllo indipendente e avvisi email. Stato e conteggi operativi per ultima acquisizione, coda/errori e ultimo backup; rilevare anche uploader/PC fermi. Avvisi solo su guasto, recupero o azione necessaria, senza ripetizioni continue; destinazione e meccanismo gratuito da verificare, senza inviare messaggi ora |

`captured_at` indica l’osservazione della riga completa sul PC: non è automaticamente una misura temporale precisa. Per batch già presenti o rilasciati in ritardo non distribuire artificiosamente orari fra le righe. Nei grafici si può usare una serie dichiarata “ora di acquisizione sul PC” per nuove acquisizioni ammesse, mantenendo separata un’eventuale serie per `measured_at`. La data di caricamento storico non diventa data di acquisizione originale. Verificare l’idoneità temporale prima di usare queste serie per il modello.

### Proposta minima di backup a costo zero

1. Mantenere sul PC CSV originali e registro SQLite; proteggere lo stato con backup consistente, non copia arbitraria del database mentre è scritto.
2. Esportare ogni notte database applicativo e metadati necessari al recupero; copiare CSV e stato locale. Conservare un pacchetto cifrato su storage già disponibile fuori dal PC scolastico e fuori dall’account del DB, per esempio spazio istituzionale autorizzato. Non è stata scelta né collegata una destinazione.
3. Proposta iniziale per le versioni di recupero: 30 copie giornaliere e 12 mensili, da dimensionare e concordare. Ogni copia completa contiene lo storico disponibile: la rotazione delle copie non elimina misure dall’archivio permanente. Nessuna cancellazione o rotazione eseguita da questa proposta.
4. Obiettivi proposti da discutere: backup entro 24 ore, recupero operativo entro un giorno lavorativo con accessi disponibili. Non sono garanzie né un RPO/RTO approvato. Le righe ancora nel CSV/registro possono consentire recuperi più recenti, da verificare con replay.
5. Provare un restore separato prima del rilascio, riconciliando eventi già confermati dall’uploader; registrare esito e rilevare backup mancati. Verificare periodicamente capacità e possibilità di migrare per sostenere la conservazione permanente.

Supabase raccomanda ai progetti Free esportazioni regolari e copie fuori sede; non assumere backup giornalieri gestiti inclusi nel piano gratuito. [Documentazione ufficiale backup](https://supabase.com/docs/guides/platform/backups), consultata il 22 ottobre 2026. Nessun billing effettivo dell’account verificato in questa revisione.

**Aggiornamento decisionale — 22 ottobre 2026:** l’utente indica Google Drive scolastico per archiviare backup del database e conferma che gestirà manualmente i file del programma. Drive non va collegato dal PC scolastico. Il flusso proposto è export Supabase cifrato e upload da un dispositivo amministrativo autorizzato; restano da definire cartella, permessi, custode e periodicità. Nessun collegamento o upload è stato effettuato. La documentazione Supabase per il piano Free raccomanda esportazioni regolari via CLI e copie fuori sede; non assumere backup automatici giornalieri gestiti. [Documentazione backup Supabase](https://supabase.com/docs/guides/platform/backups).

Restano **proposte da approvare**, non obiettivi concordati: esportazione cifrata giornaliera, 30 copie giornaliere e 12 mensili, RPO massimo 24 ore e RTO massimo un giorno lavorativo. In particolare il RPO non promette assenza di perdita: una copia giornaliera può perdere fino a un giorno di scritture se CSV/outbox non sono disponibili o non recuperabili. Il ripristino va misurato in una destinazione separata prima di presentare questi target come raggiunti.

**Aggiornamento operativo — 22 ottobre 2026:** l’utente segnala che CSV reale e accesso al PC Windows non sono disponibili; quindi DATA-01/UP-01–UP-04, il ripristino delle copie CSV/outbox e REL-01 sul flusso fisico restano bloccati in attesa della macchina. L’utente chiede di mantenere per ora il batch pubblico `ui-preview-20261022-five-half-hour` e la postilla: non cancellare né modificare i cinque record; rivalutare il destino solo dopo la prima misura reale. Questo aggiorna lo stato provvisorio di OPS-03 senza chiudere la verifica di provenienza e delle curve con dati reali.

**Aggiornamento privacy — 23 ottobre 2026:** su richiesta esplicita dell’utente, aggiunto il tag Google Analytics `G-F2LRCD93NW`. La precedente decisione di non aggiungere analytics è superata. Il tag è caricato solo dopo scelta esplicita “Accetta”; “Rifiuta” mantiene la raccolta disattivata. Le preferenze sono persistite nel browser e riapribili dal footer; la revoca salva il rifiuto, cancella i cookie `_ga*` accessibili e ricarica la pagina. I segnali Google Ads e la personalizzazione annunci sono disattivati. Prima del rilascio restano da verificare il flusso reale con Tag Assistant e l’informativa privacy con il titolare del trattamento; questo aggiornamento tecnico non certifica da solo la conformità legale.

**Aggiornamento del ruolo Drive — 22 ottobre 2026:** l’utente chiarisce che Drive serve per archiviare i backup del database e che i file del programma saranno gestiti manualmente; non deve essere collegato dal PC scolastico. Il flusso di backup non è ancora verificato e richiederà un dispositivo amministrativo autorizzato diverso da quel PC, export cifrato, upload alla cartella scolastica e prova di restore separata.

### Soluzioni concordate per le criticità 21–36

| Punti | Soluzione e verifica proposta |
|---|---|
| 21 | UI-01 sostituisce template, lingua HTML, titolo/metadati e asset con la dashboard italiana; nessuna modifica di stack |
| 22–23 | Prima dei nuovi moduli estendere i controlli Deno a endpoint e sottocartelle; provare che un errore introdotto apposta in una copia venga rilevato. Test mirati a tempo, identità, parsing, retry e stati UI; non una suite sproporzionata |
| 24–25 | Preparare CI locale versionata e allineamento a Node 24 già riportato nell’inventario Vercel, dopo verifica sul runtime. Vincolo versione ed esecuzione frontend/backend e futuro uploader; attivazione remota solo se richiesta |
| 26 | Riservare cartelle operative ignorate per outbox, backup e quarantena; fixture depurate esplicitamente versionabili. Controllare esclusioni mediante soli nomi di file |
| 27 | Nella SPA proporre un messaggio statico `noscript`; con JS attivo i contenuti restano visibili se l’animazione non parte. Non introdurre SSR o promettere una dashboard live senza JavaScript |
| 28–33, 36 | Allineare documenti correnti a decisioni, conteggi e dipendenze; conservare le evidenze storiche come tali. Separare integrazione misure e stime. Ulteriore riduzione delle duplicazioni da fare senza perdere requisiti |
| 34–35 | Fissare una consegna Figma con versione/screenshot e stati vuoto, caricamento, errore, ritardo e valore sospetto. Provare app a 320/390/768/1280 px, zoom, tastiera e movimento ridotto; misurare blur ed effetti su un dispositivo reale e semplificarli se costosi |

## Aggiornamento 22 ottobre 2026 — Visibilità dati simulati (Fase 7)

**Fatto storico verificato il 22 ottobre:** Supabase aveva 50 righe con source_id `meteolivelli-demo-20261022`, acquisition_kind `historical`, captured_at/measured_at NULL. La lettura ordinaria filtrava per sorgente della stazione e timestamp; i campioni non comparivano. La PR #3 aveva aggiunto un selettore e un endpoint separato. In aggiornamento successivo su richiesta dell'utente, le 50 righe e 6 righe del collaudo uploader sono state eliminate e l'Edge Function `read-demo-measurements` è stata rimossa. L'app usa solo la lettura reale BE-06.

**Decisione successiva dell'utente (22 ottobre):** non esporre una modalità DEMO né dati sintetici nel prodotto. Le fixture possono rimanere esclusivamente nei test, sotto `tests/fixtures/`, con etichetta di collaudo. Nessun timestamp fittizio deve essere creato o presentato come osservazione della stazione.

**Stato finale della rimozione (22 ottobre):** codice frontend del selettore, helper `src/demo.ts` e funzione locale/remota `read-demo-measurements` rimossi; eliminate 50 righe DEMO e le 6 righe sintetiche del test uploader dalla tabella `public.station_measurements`. La build e le suite automatiche saranno rieseguite dopo questa modifica. L'endpoint reale, schema, RPC, ingestione e lettura sono mantenuti.


## Aggiornamento 22 ottobre 2026 — Restyling Factory (Fase 7, UI-01)

**Richiesta dell’utente:** analizzare `DESIGN (1).md` e applicarne la direzione grafica al progetto esistente, con titolo grande a sinistra e grafico della temperatura subito a destra. Il documento allegato è una proposta visiva: gli esempi Factory non richiedono di introdurre login, marchi partner o funzionalità commerciali.

**Decisione applicata:** sfondo caldo `#101010`, superfici piatte, bordi sottili, titoli regolari con tracking stretto, accenti arancio/verde per i dati, pannello temperatura scuro `#171615`. Conservato Inter locale, sostituto ammesso dalla proposta, senza nuovi download o dipendenze. Su mobile il pannello segue il titolo; misure, archivio, cronologia, stime e progetto mantengono ordine e funzioni. La scheda iniziale segue il periodo selezionato nell’archivio e riusa il grafico SVG accessibile.

**Fatti verificati:** build, lint, 16 test frontend e 11 scenari browser superati; screenshot desktop/mobile ispezionati. API pubblica vuota nel collaudo; casi con misure esclusivamente sintetici intercettati nel browser e dichiarati nelle schermate. Evidenze: [verbale Factory](design.md).

**Limiti:** la nuova veste non prova la freschezza della stazione: il valore principale dice “ultima lettura”, senza promettere una temperatura attuale non verificabile. UI-02, WX, CSV/writer e collaudo reale restano aperti. Questa richiesta riguarda modifiche locali del frontend; nessuna pubblicazione o modifica ai servizi eseguita.

**Revisione dai commenti browser — 22 ottobre 2026 (Fase 7 / UI-01):** rimosso l’avviso “Progetto in sviluppo”; pannello temperatura passato a tema scuro con testo chiaro, bordi e griglia attenuati, tracciato arancio. Etichette sintetiche del collaudo ora inserite solo dal runner browser, indipendentemente dall’avviso rimosso.

**Marchio — 22 ottobre 2026 (Fase 7 / UI-01):** sostituito il simbolo “m.” nell’intestazione con “O” maiuscola per Olivelli, su richiesta dell’utente.

**Marchio aggiornato — 22 ottobre 2026 (Fase 7 / UI-01):** il simbolo dell’intestazione diventa “MO.”, sostituendo la precedente “O” su richiesta dell’utente.

**Allineamento marchio — 22 ottobre 2026 (Fase 7 / UI-01):** “MO.” eredita dimensione e spaziatura delle lettere da “MeteOlivelli”, anche al breakpoint mobile; rimosso il padding aggiuntivo del simbolo.

**Separatore marchio — 22 ottobre 2026 (Fase 7 / UI-01):** aggiunta una linea verticale decorativa fra “MO.” e “MeteOlivelli”, con spaziatura dedicata anche su mobile, su richiesta dell’utente.

**Animazioni — 22 ottobre 2026 (Fase 7 / UI-01):** su richiesta dell’utente, ingressi con dissolvenza e traslazione di 16 px in 560 ms, ritardi fra elementi di 65 ms fino a 260 ms; header 500 ms. Grafici disegnati in 1100 ms, area e punti in dissolvenza. Attivazione una volta all’ingresso in vista, ripetuta solo se cambia la serie o viene ricreato il grafico dopo caricamento/errore. Nessun listener scroll o dipendenza aggiunta. Collegamenti interni con scroll morbido, scroll manuale nativo. Movimento ridotto disabilita gli effetti e cancella quelli in corso anche se la preferenza cambia durante la visita; cleanup degli observer e delle animazioni allo smontaggio. Valori sempre reali, contenuti leggibili anche senza animazioni. Questa richiesta supera le precedenti specifiche motion da 220 ms. Build/lint e 16 test frontend superati.

**QA animazioni:** superati 12 scenari browser, incluso disegno della curva all’ingresso in vista, completamento e arresto al cambio dinamico di movimento ridotto. Conservati i controlli su polling, rete, qualità dati e reflow; nessun errore JavaScript non gestito. Esiti in `docs/factory-verification/results.json`.

**Hover — 22 ottobre 2026 (Fase 7 / UI-01):** aggiunto contorno bianco al passaggio su pannelli, schede, grafici, pulsanti e bordi delle sezioni, con transizione di 180 ms e senza spostamenti del layout. Link e dettagli reagiscono con sottolineatura bianca; righe della cronologia con sfondo discreto e divisori bianchi. I periodi selezionati conservano testo scuro su fondo chiaro anche in hover. Effetti dei pannelli limitati a puntatori precisi con hover, focus tastiera bianco e movimento ridotto rispettato. Nessuna dipendenza aggiunta. Build/lint, 16 test frontend e 13 scenari browser superati, incluso controllo dei bordi bianchi e del contrasto del periodo selezionato; risultati in `docs/factory-verification/results.json`.

**Riflesso locale — 22 ottobre 2026 (Fase 7 / UI-01):** sostituito l’hover uniforme dei bordi con un gradiente bianco radiale ritagliato al contorno, centrato sul cursore e seguito con interpolazione per frame (fattore 0,18; immediato con movimento ridotto). Solo il bersaglio più vicino al puntatore è attivo; nessuna illuminazione dei divisori di sezione o dei contenitori antenati. Raggio 110 px, dissolvenza 220 ms, nessun cambio di layout o dipendenza. Animazione ferma a convergenza, listener e frame rimossi allo smontaggio, effetto escluso su touch. Build/lint, 16 test frontend e 13 scenari browser superati, incluso isolamento del pulsante 7 giorni dalla linea dell’archivio.

**Raggio hover ampliato — 22 ottobre 2026 (Fase 7 / UI-01):** raggio del riflesso aumentato da 110 a 220 px sui pannelli; pulsanti e CTA con raggio 180 px e bordo luminoso da 2 px per maggiore visibilità. Conservati inseguimento con inerzia e isolamento dal divisore di sezione.

**Coreografia allo scroll — 22 ottobre 2026 (Fase 7 / UI-01):** ogni scheda osserva il proprio ingresso in vista, con ritardi di 0/80/160 ms; le schede più in basso su mobile non consumano l’ingresso quando appare soltanto l’inizio della sezione. Il disegno dei grafici parte dall’ingresso della zona SVG, anziché dal titolo della scheda: griglia in sequenza, curva in 1400 ms, area con dissolvenza e punti a comparsa progressiva secondo la posizione temporale. L’effetto procede automaticamente dopo l’ingresso in vista, senza vincolare lo scroll manuale. Conservati dati originali, gap per misure assenti/sospette, movimento ridotto e cleanup; nessuna libreria aggiunta. Build/lint e 16 test frontend superati.

**Correzione lampeggio ingressi — 22 ottobre 2026 (Fase 7 / UI-01):** gli elementi osservati vengono preparati con opacità zero prima del primo paint (`useLayoutEffect`), mantenendo il loro spazio nel layout. Diventano visibili soltanto all’ingresso in vista, insieme all’avvio dell’animazione; stessa gestione per i grafici appena caricati. Focus tastiera rivela immediatamente il contenitore; movimento ridotto, assenza di supporto e cleanup rimuovono lo stato nascosto. Questa richiesta supera la precedente scelta di lasciare gli elementi visibili nell’attesa dell’observer. Build/lint, 16 test frontend e 13 scenari browser superati; il controllo motion verifica opacità zero fuori vista e rimozione degli stati pendenti al cambio di preferenza.

**Postilla richiesta — 22 ottobre 2026 (Fase 7 / UI-01):** aggiunta sopra il contenuto, fuori dalle animazioni, la sola dicitura “Work in progress · Possibili dati presenti fittizi”. Nessuna scrittura database eseguita in questa revisione. La postilla è locale; prima di esporre campioni di prova nel database pubblico occorre pubblicarla sul sito pubblico con autorizzazione esplicita al deploy.

**Pubblicazione autorizzata — 22 ottobre 2026 (Fase 7 / UI-01, REL-02):** l’utente ha richiesto esplicitamente di eseguire commit e push. Target verificato: `origin/main`, repository `pgiudici13/MeteOlivelli`, Vercel `meteolivelli` / team `team_WF8R8uiIvXzKOKJgGrlcCYtF`, dominio `meteolivelli.vercel.app`. `main` allineato a `origin/main` prima del rilascio. `npm run check` superato. GET pubblico latest risponde correttamente con `items: []`: l’assenza dei valori non è un guasto del collegamento. Pubblicazione della postilla prima di qualsiasi nuovo inserimento di prova; verifica del deploy successiva al push.

**Fase 7 / UI-01 e BE-06 — Campioni di prova distinti:** applicata migrazione `20261022194231_synthetic_measurement_kind`, ripubblicata lettura pubblica, inserito batch di cinque record `synthetic` con metadati e data fisica NULL dopo pubblicazione della postilla. Intervalli SQL verificati: 1800 secondi. `npm run check` e 13 scenari browser superati; collaudo pubblico senza mock conferma dati e grafici. [Verbale](docs/data-preview.md).

**Fase 7 / UI-01 — Revisione grafici dopo il rilascio:** corretta localmente l’animazione del grafico iniziale con maschera lineare unica; scale complete 24h/7g/30g dal riferimento server e separatori di calendario Europe/Rome, senza riempire intervalli vuoti. Specifiche in `design.md`, implementazione in `src/chart.ts` e `HistoryChart.tsx`. Nessuna scrittura remota o nuova pubblicazione eseguita in questa revisione.

**Fase 7 / UI-01 — Auto e fluidità (revisione locale):** Auto è ora predefinito; legge fino a 30 giorni ancorati all’ultima misura, adatta lo storico breve e oltre sette giorni mostra le ultime sette date disponibili con medie 00–12 / 12–17 / 17–24, notte inclusa nella mattina su indicazione esplicita. Null/sospetti esclusi per campo, fasce vuote interrompono la linea, cronologia originale conservata. Curve lineari in 700 ms dopo 60 ms e ingressi in 420 ms. Nessuna scrittura DB, commit/push o nuova pubblicazione eseguiti in questa revisione.

**Pubblicazione revisione grafici/Auto — 22 ottobre 2026:** l’utente richiede commit e push su `main` delle modifiche locali già verificate: maschera lineare, scala temporale, Auto predefinito e medie per fascia. Ultimi controlli: `npm run check` (26 Node, 41 Deno, 21 Python), 14 scenari browser e diff senza errori. Target Git confermato, branch allineato prima del commit; deploy automatico Vercel da verificare dopo il push. Le precedenti note “locale/non pubblicata” descrivono lo stato prima di questa richiesta.


**23 ottobre 2026 — Fase 7 / UI-01 e batch sintetico:** su richiesta utente corretta localmente la richiesta Auto: normalizzazione UTC di `until` da timestamp PostgreSQL, arrotondamento in alto dei microsecondi per includere l’ultimo campione e conservazione della finestra fra polling invariati. Umidità e pressione compatte accanto alla temperatura iniziale. Nel database autorizzato aggiornati i cinque sintetici e aggiunti altri cinque: batch `ui-preview-20261023-ten-six-hour`, 10 record ogni 21600 secondi dal 21 ottobre 00:00 al 23 ottobre 06:00 Europe/Rome. Questa decisione supera il precedente vincolo di mantenere invariati i cinque campioni. Tutti restano `synthetic`, senza data fisica; postilla conservata. `npm run check` superato (27 Node, 42 Deno, 21 Python); 14 scenari browser di regressione superati. Nessun commit, push o deploy frontend eseguito. Dettagli in `docs/data-preview.md` e `docs/frontend.md`.


**23 ottobre 2026 — Fase 7 / WX, implementazione richiesta:** implementato modello statistico locale sperimentale, senza provider o LLM: confronto per grandezza/orizzonte fra persistenza, trend recente smorzato e ciclo 24h. Selezione e verifica in periodi separati, errore e numerosità espliciti, niente interpolazione delle verità di confronto. “Giornata” nella v1 significa punto a +24 ore, non estremi/media del giorno. Scelta tecnica proporzionata: worker browser con cache per input e lettura pubblica dedicata `measured_at`; calcolo/cache condivisi e archivio dei run rimangono evoluzioni WX-02 non implementate. Dati reali datati, sensori/clock e attendibilità non ancora convalidati; i sintetici e gli orari solo PC non alimentano il modello. Specifica unica in `docs/backend.md`, risultati in `docs/frontend.md`. Nessun commit, push, deploy o modifica remota autorizzati/eseguiti in questa implementazione.


**Pubblicazione richiesta — 23 ottobre 2026:** l’utente autorizza commit e push di tutte le modifiche locali: correzione Auto, misure secondarie nella hero, motore previsionale sperimentale, test/evidenze e documentazione. Target verificato `main` → `origin/main`, repository `pgiudici13/MeteOlivelli`, allineato dopo fetch. Le note precedenti “locale/non pubblicato” descrivono lo stato prima di questa autorizzazione. Il push avvia il deploy Git Vercel; la validazione meteorologica reale resta aperta e i sintetici restano esclusi dalle previsioni.

**23 ottobre 2026 — Fase 7 / UI-01, tema:** aggiunti tema chiaro e switch in Home e Informazioni. Senza scelta manuale segue e osserva `prefers-color-scheme`; la scelta esplicita è persistita in `localStorage`. Il tema viene impostato prima del primo render e aggiorna `color-scheme` e `theme-color`. Specifica in `design.md`; revisione locale non pubblicata.
