# Attività operative — MeteOlivelli

> **Stato più recente — 23 ottobre:** struttura locale `/home` e `/info` implementata con metadati SEO, sitemap e robots. Non pubblicata; la richiesta d'indicizzazione in Google Search Console resta da eseguire dopo il rilascio.

> **Versione:** checklist aggiornata il 23 ottobre 2026 dopo la preparazione locale delle pagine `/home` e `/info`.
> **Fonte dei requisiti:** [plan.md](plan.md). Questo file è la checklist esecutiva, non una seconda roadmap.
> **Richiesta precedente:** rimuovere la modalità DEMO da codice e produzione; mantenere un solo database finale. Per decisione esplicita dell'utente, i futuri dati sintetici d'integrazione dovranno essere inseriti nella stessa tabella Supabase finale con provenienza distinta; non caricare dati sintetici finché questa distinzione non è implementata e verificata. L'utente ha autorizzato la pubblicazione della correzione su GitHub e il deploy Vercel conseguente. CSV/writer Windows reale, UI-02, WX e rilascio MVP completo restano aperti.

> **Richiesta attuale — 23 ottobre:** tenere la dashboard su `/home` e aggiungere `/info` per progetto, stazione e team; preparare le pagine perché siano consultabili da Google Search Console. Solo queste due pagine per ora.

## 1. Come usare la checklist

- `[x]` significa completato con evidenza; `[ ]` significa non completato. Gli stati aggiuntivi indicano `pronto`, `dipendenza`, `CSV necessario`, `decisione necessaria`, `richiesta remota necessaria`.
- **Convenzione dell’utente:** “Fase N” indica sempre il blocco N di questo file. plan.md usa gli stessi numeri; sincronizzare rimandi e stato in entrambi.
- Ogni attività contiene dipendenze, istruzioni, risultato, verifica e riferimento al piano. Aggiornare stato ed esito nello stesso intervento che completa il lavoro; non spuntare task solo perché esiste un file.
- Seguire `AGENTS.md`, controllare Git prima delle modifiche e preservare i file locali. Alla creazione di questa checklist risultano non tracciati `plan.md`, `AGENTS.md` e `CORRECTIONS.md`; nessuna modifica ai file tracciati.
- Le scelte tecniche indicate come **proposte** non sono risorse già configurate. I percorsi indicati come futuri sono candidati: crearli solo nel task pertinente, leggendo prima ciò che eventualmente esiste. I file realizzati nel setup sono elencati con esito nei task SET.
- Distinguere sempre fatti verificati, dichiarazioni dell'utente, ipotesi e decisioni. Se una risposta cambia un requisito, aggiornare prima `plan.md`, poi questa checklist.
- I controlli in sola lettura non richiedono una nuova autorizzazione per ogni consultazione. Modifiche a GitHub/Vercel/Supabase, applicazione di migrazioni, installazione sul PC reale e pubblicazione vanno eseguite soltanto entro una richiesta esplicita che ne copra target e ambito; non richiedere nuovamente permessi già concessi per la stessa operazione.
- Prima di una richiesta necessaria per modifiche remote, preparare il risultato revisionabile: file, schema/policy, test, progetto e ambiente interessati, impatto e recupero. Non chiedere approvazione su una proposta ancora vaga.
- Non leggere o stampare valori di `.env`, chiavi o token per compilare documentazione. Eventuali file di esempio contengono solo segnaposto; nessun segreto browser, log o Git.
- Nessun commit, push, merge o riscrittura della storia senza richiesta. Il progetto resta React, TypeScript, Vite, ESLint e npm.

### Termini usati nei task

- **Backend:** il codice server che riceve, controlla e salva i dati; non è eseguito nel browser.
- **Endpoint:** un indirizzo HTTP che riceve una richiesta e restituisce un esito; ingestione significa ricevere nuove misure.
- **Contratto/payload:** formato e significato dei campi inviati, più le regole per conferme ed errori.
- **Idempotenza:** ritentare lo stesso evento non crea una seconda misura; due eventi diversi possono avere gli stessi valori.
- **Outbox:** coda salvata sul disco del PC prima dell'invio, per ripartire dopo un guasto o l'assenza di rete.
- **RLS e privilegi:** regole DB sulle righe accessibili e sulle operazioni ammesse; una chiave pubblica non sostituisce questi controlli.
- **Migrazione:** file SQL versionato che descrive una modifica al database. Prepararlo e applicarlo sono attività diverse.
- **Fixture:** input usato nei test, dichiarato sintetico o depurato; non è una misurazione reale da mostrare al pubblico.
- **Typecheck, lint, test:** rispettivamente controllo dei tipi, qualità statica e prova di un comportamento.
- **Cache:** copia temporanea per ridurre richieste; non sostituisce il backup.
- **Restore, RPO/RTO:** prova di recupero, perdita massima accettabile e tempo massimo per ripristinare.

## 2. Perimetro e percorso critico

**Deciso dall'utente:** sito pubblico in italiano per scuola/open day; ultimi valori reali di temperatura °C, umidità % e pressione hPa; grafici 24h/7g/30g; nessun account, profilazione o download. CSV e misure permanenti: i periodi dei grafici non sono retention. Valori sospetti conservati con “probabile errato”. Calcolo delle stime nel progetto, senza provider meteo esterno; +30 minuti/+1 ora/giornata restano richiesti ma da validare. Budget 0 €.

**Tempi:** consegna richiesta per settimana prossima, interpretata nel piano come 26 ottobre–1 novembre 2026; nessun giorno preciso o promessa di completamento. Possibile chiusura a dicembre, ancora incerta e senza autorizzazione a cancellare dati.

**Flusso da realizzare:** sensori → Arduino GIGA R1 → writer Windows/CSV sul Desktop (U) → nuove righe complete con `captured_at` → uploader con outbox → endpoint Supabase autenticato → DB → endpoint di lettura → sito aggiornato senza reload. Il modello sperimentale usa dati ammessi della stazione, con stime separate dalle osservazioni.

**Tre tempi distinti:** `captured_at` è l’osservazione della nuova riga completa sul PC, registrata una sola volta con data/ora UTC; `measured_at` è l’ora fisica della misura, eventualmente nulla; `received_at` è assegnata dal backend alla prima accettazione e non cambia nei retry. La UI può mostrare HH:mm, con data disponibile e provenienza dichiarata. Il contatore Arduino non è Unix time; storico e backlog non ricevono date di misura inventate.

**Stato stazione:** ritardo oltre 20 minuti dalla prossima misura attesa. Con cadenza esatta di un'ora, esempio illustrativo: misura 10:00 → attesa 11:00 → ritardo oltre 11:20. La regola definitiva richiede cadenza e ancoraggio verificati; ricevere un batch storico non dimostra freschezza.

**Limiti ancora aperti:** ordine/unità dei quattro campi dichiarati dall'utente, campione CSV rinviato; nome/percorso completo, separatore, decimali e writer ignoti, append/cadenza probabili; firmware, clock, buffering, sentinelle e accessi Windows non verificati. Contratto JSON e validatore locale v1 pronti; schema applicativo v1 preparato localmente, applicazione DB e modello ancora da provare; `public` senza tabelle nell’inventario storico SET-04. Backup: proposta in plan.md §18, destinazione e obiettivi ancora da concordare.

Percorso critico:

```text
Setup → CSV/writer + semantica tempo → contratto → schema/accessi
      → ingestione + DB verificati → uploader reale → aggiornamento UI
      → prova completa + backup/restore → rilascio richiesto

In parallelo, dopo avvio dell'implementazione:
  UI con stati vuoti; studio modello → dati datati → verifica stime → integrazione UI
```

La mancanza del CSV non blocca setup, disegno concettuale, struttura e verifiche provvisorie; impedisce di dichiarare definitivi parser, schema dipendente dal dato e flusso reale. Nessun formato fittizio diventa quello della stazione.

## 3. Fase 3 — Mini setup generale

### SET-00 — Confermare lo stato iniziale prima di modificare

- [x] **Stato: completato e ricontrollato il 21 ottobre 2026.**
- **Scopo:** sapere quali file esistono e quali modifiche appartengono già all'utente, per non sovrascriverle.
- **Input/file:** Git, `AGENTS.md`, `plan.md`, `tasks.md`, `CORRECTIONS.md`, package/lockfile e configurazioni TypeScript/Vite/ESLint.
- **Passaggi eseguiti:** controllato `git status --short --branch`; riletti i file pertinenti; registrate impronte dei file iniziali; verificati strumenti e struttura tramite nomi, senza aprire `.env` o credenziali.
- **Risultato:** prima del setup nessun file tracciato modificato; quattro documenti locali non tracciati preservati. React/TypeScript/Vite/ESLint/npm conservati; `src/` rimane il template. Node 26.12.0 e npm 11.20.0 disponibili; Deno inizialmente assente.
- **Verifica:** le modifiche finali devono limitarsi ai file del setup e documenti aggiornati. La build precedente isolata non era un test del backend: i nuovi esiti vanno distinti nel registro esecuzioni.
- **Riferimento:** [plan.md §4](plan.md#4-stato-attuale-evidenze-e-limiti).

### SET-01 — Rendere versionabili gli esempi, mantenendo esclusi i segreti

- [x] **Stato: completato il 21 ottobre 2026.** Dipende da SET-00.
- **Scopo:** permettere ai collaboratori di ricevere nomi e istruzioni delle variabili senza inserire segreti in Git.
- **File modificato:** `.gitignore`; prova e risoluzione registrate in COR-001 di `CORRECTIONS.md`.
- **Passaggi eseguiti:** rimossa la regola che ignorava il nome `.gitignore`; semplificate le regole generali in `.env*`; collocata l'eccezione `!.env.example` dopo la regola generale; preservata l'esclusione di `.vercel/`, dipendenze e build. L'eccezione vale anche per l'esempio dentro `supabase/functions/`.
- **Risultato:** gli esempi sono versionabili e contengono soltanto commenti/valori vuoti. `.env.local` esistente non è stato letto o modificato.
- **Verifica ripetibile:** `git check-ignore --no-index --quiet .env.example` deve terminare con 1 (non ignorato); lo stesso comando per `.env.local` con 0 (ignorato). Ripetere per l'esempio server e un nome server di prova `.env.local`; non serve creare file con segreti. Con `-v` si può vedere anche una regola negativa: non interpretarla come conferma che il file sia ignorato.
- **Completamento:** esempi non ignorati, tutti i nomi ambiente reali provati ignorati; COR-001 risolto solo dopo questa verifica. Nessun `git add` necessario.
- **Riferimento:** `CORRECTIONS.md`, COR-001; [plan.md §9](plan.md#9-sicurezza-e-privacy).

### SET-02 — Spiegare avvio locale e configurazione pubblica/server

- [x] **Stato: completato il 21 ottobre 2026.** Dipende da SET-01; usa il modulo base di SET-03.
- **Scopo:** consentire di avviare il progetto e sapere quali informazioni potranno finire nel browser, senza chiedere credenziali per vedere il template.
- **File:** `README.md`, `.env.example`, `supabase/functions/.env.example`, `docs/backend.md`.
- **Passaggi eseguiti:** documentati requisiti e `npm ci`/`npm run dev`; definiti esempi vuoti per il futuro client (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) e server (`SUPABASE_URL`, `STATION_INGEST_TOKEN`). Separati i segreti dalla configurazione esponibile e spiegato che la scelta della credenziale DB è ancora BE-03.
- **Risultato:** il template funziona senza queste variabili; gli esempi definiscono nuove convenzioni, non certificano cosa sia già configurato. Nessun file locale esistente viene copiato o sovrascritto. Il modulo base segnala una configurazione richiesta ma vuota senza mostrare valori.
- **Verifica:** controllare che tutti i valori degli esempi siano vuoti e che i link README esistano; testare il modulo con input sintetici. Non servono connessioni ai servizi, login visitatore o lettura di `.env.local`.
- **Completamento:** istruzioni e comandi corrispondono ai file reali; avvio frontend e controlli sono distinti da DB/endpoint non ancora implementati.
- **Riferimento:** [plan.md §3](plan.md#3-vincoli-non-negoziabili), §9 e §14; [README.md](README.md).

### SET-03 — Installare il runtime e separare i controlli del backend

- [x] **Stato: completato il 21 ottobre 2026.** Dipende da SET-00.
- **Scopo:** poter iniziare il backend TypeScript con controlli ripetibili, evitando che il lint browser ignori errori server o che Deno venga incluso nel bundle React.
- **File:** `package.json`, `package-lock.json`, `eslint.config.js`, `supabase/functions/deno.json`, `_shared/config.ts` e `_shared/config_test.ts` sotto la cartella delle funzioni, `docs/backend.md`.
- **Passaggi eseguiti:** consultata documentazione ufficiale; installato `deno@2.9.6` come devDependency esatta tramite npm, senza installazione globale; esclusi i moduli Deno dal lint browser; aggiunti `backend:check`, `backend:lint`, `backend:test` e comando aggregato `check`. Introdotto un lettore esplicito di configurazione obbligatoria con tre test sintetici.
- **Risultato:** `npm run backend:check` controlla i tipi; `npm run backend:lint` controlla lint/formato; `npm run backend:test` prova assenza/vuoto, conservazione esatta del valore e lettura della sola variabile richiesta. I test non leggono ambiente, rete o file applicativi. Nessun parser CSV, endpoint, tabella, Docker o servizio locale avviato.
- **Verifica ripetibile:** eseguire i tre comandi backend dalla root; tutti devono finire con exit code 0, con 3 test superati. `npm run check` aggiunge lint e build frontend; in questa attività viene eseguito su copia senza `.env`, così Vite non carica configurazioni locali.
- **Completamento:** controlli realmente eseguibili e dipendenza fissata nel lockfile. All'aggiunta di endpoint/sottocartelle aggiornare i percorsi dei controlli Deno: oggi coprono i moduli direttamente in `_shared/`, non un handler ancora assente.
- **Riferimento:** [plan.md §5](plan.md#5-architettura-candidata), §7 fase 3 e §13; [docs/backend.md](docs/backend.md).

### SET-04 — Registrare cosa esiste sui servizi, senza modificarli

- [x] **Stato: inventario iniziale completato il 21 ottobre 2026, nei limiti espliciti sotto.**
- **Scopo:** partire dal progetto corretto e non progettare backend e deploy presumendo tabelle, policy, quote o collegamenti inesistenti.
- **Input/output:** metadati GitHub/Supabase, mapping Vercel locale e CLI; risultato in [docs/services.md](docs/services.md). Nessun valore di credenziali o risposta integrale del progetto Vercel pubblicato.
- **Passaggi eseguiti:** GitHub verificato via connettore; Supabase interrogato con `list_projects`, `list_tables` limitato a `public`, `list_edge_functions`, `list_migrations`; Vercel ispezionato con progetto/scope espliciti dopo fallimento della risoluzione implicita. Consultati pricing/condizioni ufficiali Supabase, Vercel e Open-Meteo.
- **Risultato verificato:** GitHub pubblico su `main`; Supabase `MeteOlivelli` attivo, nessuna tabella restituita in `public`, nessuna funzione o migrazione registrata; Vercel `meteolivelli`, framework Vite e Node 24.x. Il Node locale è 26.12.0: nessuna impostazione remota cambiata per uniformarli.
- **Verifica e limiti:** nessuna modifica remota, migrazione o secret recuperato. Non verificati piano billing effettivo degli account, tutti gli schemi DB, integrazione Git effettiva Vercel, deploy corrente o funzionamento RLS applicativo. Offerta gratuita consultata distinta dal piano dell'account. Questi limiti restano elencati e saranno verificati nei task pertinenti.
- **Ambiente di prova scelto ora:** test locali isolati. Un ambiente DB separato andrà scelto prima di BE-07; il progetto vuoto non è automaticamente sacrificabile. Nessun costo attivato.
- **Riferimento:** [plan.md §4](plan.md#4-stato-attuale-evidenze-e-limiti), §9, D4/D9/D23; [docs/services.md](docs/services.md).

**Uscita del blocco setup:** configurazione spiegata, COR-001 verificato, struttura locale proporzionata e comandi di verifica chiari; nessuna modifica ai servizi necessaria per dichiarare il solo setup locale pronto.

## 4. Fase 4 — Contratto dati e prima logica backend

### DATA-01 — Acquisire il campione reale e osservare il writer

- [ ] **Stato: parziale, ordine e unità dichiarati dall'utente il 22 ottobre; campione/writer ancora necessari.**
- **Scopo in pratica:** Conoscere il file realmente scritto dal PC prima di decidere come leggerlo.
- **Input e file coinvolti:** CSV depurato fornito dall’utente quando disponibile; `docs/backend.md`; eventuali fixture depurate in `uploader/tests/fixtures/` (percorsi futuri).
- **Come:** esaminare intestazione e righe originali depurate, scrittura parziale, append, encoding, separatori e decimali. Osservare cosa succede a riavvio, file sostituito/troncato e reset Arduino. Identificare programma, percorso effettivo e accessibilità senza salvare dati sensibili nel repository.
- **Risultato:** contratto CSV in `docs/backend.md`, con campione verificato o fixture depurate e provenienza; dimensioni/cadenza osservate, sentinelle conosciute e aspetti ancora ignoti.
- **Esito locale:** documentata la dichiarazione dell'utente (secondi dall'accensione, °C, %, hPa). Nessun separatore, decimale o comportamento del writer dedotto; nessun parser CSV definitivo realizzato.
- **Secondo intervento locale:** l'utente non conosce ancora separatore, decimali, intestazione e writer. Preparato `measurement_csv.ts` con dialetto obbligatorio e 10 test sintetici; restituisce originale e problemi senza scarti silenziosi. Checklist della verifica reale e limiti in `docs/backend.md`, sezione “Adattatore CSV provvisorio”. Questo non sostituisce il campione di DATA-01.
- **Verifica:** nessuna assunzione derivata da un esempio inventato; controllare che due righe identiche possano comunque essere due eventi validi. Nessuna richiesta ripetuta del file finché l'utente non lo ha disponibile.
- **Riferimento:** [plan.md §6](plan.md#6-dati-e-semantica-temporale), §7 fase 4, D1 e D5.

### DATA-02 — Fissare timestamp, sessioni e trattamento dello storico

- [ ] **Stato: regole locali v1 documentate e testate; verifica operativa dipendente da DATA-01.**
- **Scopo in pratica:** Stabilire che ora mostriamo e quali dati restano senza data, senza trasformare il contatore Arduino in un calendario.
- **Input e file coinvolti:** Writer/seriale e clock del PC da osservare; regole temporali in `docs/backend.md` e decisioni D2/D12/D13 del piano.
- **Come:** scegliere dove registrare l'ora sul PC il più vicino possibile al seriale/writer; verificare sincronizzazione, ritardi e buffering. Definire semantica/nullabilità di `measured_at`, `captured_at`, `received_at` e qualità temporale; UTC per gli istanti, UI Europe/Rome.
- **Scelta delegata del 22 ottobre:** il monitor aggiunge `captured_at` all’evento quando osserva la nuova riga completa; data/ora completa, non solo HH:mm. Payload e orario persistiti prima dell’invio, mai aggiornati nei retry. Serie per ora PC dichiarata e separata dalle misure con orario affidabile; primo import storico e backlog non diventano nuove acquisizioni originali.
- **Risultato:** regola temporale documentata. Storico privo di data conservato con `measured_at` nullo e fuori dai grafici per data; contatore grezzo conservato. Reset/overflow/riordino distinti quando dimostrabili; nessun `boot_id` affidabile inventato da un semplice calo del contatore.
- **Esito locale:** UTC rigoroso, distinzione `live`/`historical` e nullabilità provati nel validatore. Uptime non convertito in data/sessione; date impossibili e ore locali ambigue rifiutate. Clock, buffering, reset hardware e conservazione degli istanti in outbox/DB non ancora provati.
- **Verifica:** casi di reset Arduino, solo restart uploader, invio tardivo, record senza ora e DST. Un retry non cambia l'istante originario di ricezione backend; nessun Unix time ricavato dall'uptime.
- **Riferimento:** [plan.md §6](plan.md#6-dati-e-semantica-temporale), D2, D12 e D13.

### DATA-03 — Definire payload, identità degli eventi e risposte API

- [ ] **Stato: contratto locale v1 specificato e implementato; conferma sul writer dopo DATA-01/DATA-02.**
- **Scopo in pratica:** Dire esattamente cosa invia il PC e quando il server può confermare che la misura è salvata una volta sola.
- **Input e file coinvolti:** Specifica JSON e risposte in `docs/backend.md`; campi concettuali del piano, da chiudere su DATA-01/DATA-02.
- **Come:** definire versione del payload, sorgente, ID stabile assegnato una sola volta, valori/unità e metadati temporali. Proposta minima: singolo evento per richiesta, proporzionato alla cadenza; batch solo se motivato dall'importazione. Documentare autenticazione, limiti, codici errore e conferma dopo commit.
- **Risultato:** contratto in `docs/backend.md`; stesso ID/stesso contenuto → conferma del risultato precedente, stesso ID/contenuto diverso → conflitto senza sovrascrittura. Versioni/campi sconosciuti hanno comportamento esplicito.
- **Esito locale:** specificati campi/unità, UUID v4, sorgente, UTC, campi sconosciuti e risposte future con limite 16 KiB/un evento. Confronto canonico testato indipendente da ordine JSON e flag qualità; unicità atomica, autenticazione e conferma dopo commit restano BE-05/BE-07.
- **Verifica:** nessuna chiave basata solo sui tre valori o sull'uptime; se si usano batch, scegliere atomicità o esito per riga. Separare mancata risposta da mancato inserimento e definire la riconciliazione dopo perdita dello stato locale.
- **Riferimento:** [plan.md §8](plan.md#8-contratti-e-comportamenti-da-definire), RF3–RF4, D3 e D14.

### BE-01 — Implementare validazione pura e test del contratto

- [x] **Stato: completato il 22 ottobre sul contratto locale v1; da riallineare se il campione modifica il contratto.**
- **Scopo in pratica:** Rifiutare richieste strutturalmente errate e classificare i dati sospetti prima di tentare una scrittura.
- **File realizzati:** `supabase/functions/_shared/measurement.ts` e `measurement_test.ts`; controlli ricorsivi check/lint/test in `deno.json`; contratto e limiti in `docs/backend.md`.
- **Estensione locale:** `measurement_csv.ts` e `measurement_csv_test.ts` adattano una riga completa dei quattro campi con dialetto esplicito alla stessa validazione, senza I/O, generazione di ID o date. 10 nuovi test sintetici, 27 complessivi; controlli frontend/backend superati su copia senza `.env`.
- **Come:** scrivere piccole funzioni senza rete per parsing del payload JSON, controlli strutturali, normalizzazione esplicita e classificazione degli errori. Usare fixture sintetiche etichettate, senza attribuirle alla stazione. Non implementare un parser CSV definitivo prima di DATA-01.
- **Risultato:** validazione separata dall'handler HTTP, con errori stabili e campi non finiti/null/stringhe gestiti. Le soglie fisiche non note restano configurabili o da chiudere, senza scarti arbitrari.
- **Verifica:** payload valido/incompleto, valori non numerici e non finiti, timestamp non valido, ora mancante ammessa, versione sconosciuta e anomalie conservate/segnalate. Adeguare i test al contratto reale prima di dichiarare il task definitivo.
- **Esito:** 14 test dedicati superati, più 3 di configurazione; build/lint e check/lint/test backend superati in copia senza `.env`. Copertura ricorsiva verificata con errori deliberati in una sottocartella della sola copia temporanea. Nessun accesso dei test a rete/ambiente/file applicativi. Valori sospetti mantenuti con “probabile errato” e motivo; range sensore opzionali, nessuna taratura presunta.
- **Riferimento:** [plan.md §6](plan.md#6-dati-e-semantica-temporale), §13, RNF1 e D16.

## 5. Fase 5 — Database, sicurezza e ingestione

### BE-02 — Disegnare lo schema minimo e gli indici

- [x] **Stato: schema v1 applicato e verificato in BE-07; conferma sul CSV reale ancora aperta.**
- **Esito del 22 ottobre 2026:** `docs/backend-schema.md` descrive tabella, tipi, null, immutabilità, unicità e indici; migrazione preparata. Nessun DB applicato.
- **Scopo in pratica:** Progettare come ogni evento e la sua provenienza vengono conservati e interrogati nel database.
- **Input e file coinvolti:** Disegno schema e query in `docs/backend.md`; inventario reale in `docs/services.md`. Nomi e tipi locali v1 definiti in `docs/backend-schema.md`; da confermare sul dato reale.
- **Come:** progettare archivio misure, provenienza, qualità e chiave di unicità; aggiungere strutture sorgenti/sessioni solo se servono. Definire tipi, precisione, nullabilità e vincoli senza presumere tabelle esistenti. Ordinamento deterministico per ultima misura e storico.
- **Scelte delegate:** stesso ultimo evento ammesso per le tre schede; campi mancanti non sostituiti da altri orari, sospetti conservati con “probabile errato”. Schema predisposto a originale immutato e reinterpretazioni versionate; leggere plan.md §18 per identità e qualità. Non definire range sensore senza evidenze.
- **Risultato:** schema revisionabile in `docs/backend.md`, indici motivati dalle query e comportamento per record senza data/anomali. Nessun SQL applicato o nome di tabella dichiarato come già presente.
- **Verifica:** dati ripetuti legittimi ammessi; eventi ripetuti non duplicati; `received_at` server-side immutato nei retry; coerenza di unità e trattamento dei null. Riesaminare capacità per retention permanente sul volume osservato.
- **Riferimento:** [plan.md §6](plan.md#6-dati-e-semantica-temporale), §7 fase 5, RF1–RF4 e D10.

### BE-03 — Progettare ruoli, RLS, lettura pubblica e credenziali

- [x] **Stato: accessi applicati e verificati in BE-07; nessuna scrittura pubblica.**
- **Esito del 22 ottobre 2026:** Matrice accessi e credenziali in `docs/backend-schema.md`; tabella con RLS e grant SELECT/INSERT al solo server, RPC invoker revocate a pubblico. Token associato a STATION_SOURCE_ID; nessuna chiave DB sul PC/browser.
- **Scopo in pratica:** Consentire ai visitatori soltanto le letture approvate, tenendo la scrittura al server autenticato.
- **Input e file coinvolti:** Matrice ruoli/policy e modalità custodia in `docs/backend.md`; esempi ambiente aggiornati solo quando necessari, sempre vuoti.
- **Come:** fissare superficie pubblica e contratto dell’endpoint di lettura scelto su delega. Progettare privilegi SQL e RLS separatamente, verificando anche viste/funzioni; pubblico solo letture necessarie, nessuna scrittura. Uploader autenticato verso endpoint, senza chiave DB privilegiata sul PC.
- **Scelta tecnica su delega:** endpoint di lettura a parametri ammessi e limiti server. Definire ruoli minimi e autenticazione Edge coerente con il token della stazione; non lasciare la verifica dell’accesso soltanto alla configurazione del browser.
- **Risultato:** matrice accessi e policy revisionabili; credenziale d'ingestione separata dalla configurazione browser, custodia e revoca documentate per il responsabile. Nessun account visitatore introdotto.
- **Verifica:** individuare come provare rifiuto di insert/update/delete e letture interne non autorizzate, anche tramite funzioni/viste. Nessun uso di privilegi elevati per aggirare errori di permesso senza motivazione.
- **Riferimento:** [plan.md §9](plan.md#9-sicurezza-e-privacy), RF5, RNF2, D4 e D7.

### BE-04 — Preparare migrazione e prove database revisionabili

- [x] **Stato: preparazione completata; applicazione e prove SQL eseguite nel successivo BE-07.**
- **Esito del 22 ottobre 2026:** CLI 2.121.0: `supabase migration new station_backend_v1`; SQL in `supabase/migrations/20261022125448_station_backend_v1.sql`, prove transazionali e protocollo concorrenza in `supabase/tests/`. Nessuna migrazione applicata, neppure localmente.
- **Scopo in pratica:** Trasformare lo schema revisionato in modifiche SQL verificabili prima di eseguirle.
- **Input e file coinvolti:** Futuri file in `supabase/migrations/` e prove accessi/vincoli; percorso e comandi definiti dalla CLI supportata dopo revisione, non file SQL applicati a sorpresa.
- **Come:** dopo revisione dello schema creare i file versionati con gli strumenti supportati, verificando prima i comandi disponibili. Preparare prove per vincoli, idempotenza concorrente e accessi; indicare effetto, prerequisiti e recupero. Non applicare la migrazione come effetto collaterale della sua preparazione.
- **Risultato:** diff SQL, test e note di applicazione comprensibili a un collaboratore, senza segreti o risorse remote create.
- **Verifica:** distinguere controllo statico del file da esecuzione SQL reale. Per applicarla anche in ambiente locale chiedere/eseguire solo nell'ambito di una richiesta esplicita; provare prima in ambiente separato autorizzato, senza reset del database operativo.
- **Riferimento:** [plan.md §3](plan.md#3-vincoli-non-negoziabili), §7 fase 5 e §13.

### BE-05 — Implementare l'endpoint di ingestione

- [x] **Stato: codice pubblicato; persistenza e concorrenza HTTP verificate in BE-07.**
- **Esito del 22 ottobre 2026:** Handler, entrypoint e RPC adapter implementati: auth, sorgente, corpo 16 KiB, validazione, commit prima della conferma, duplicato/conflitto, timeout e errori minimizzati. Test simulati inclusi nei 39 totali; rate limit distribuito e runtime da verificare.
- **Scopo in pratica:** Costruire l’indirizzo HTTP a cui l’uploader invierà ogni nuova misura e riceverà una conferma affidabile.
- **Input e file coinvolti:** `supabase/functions/ingest-measurement/index.ts`, test dell’handler e moduli condivisi; configurazione funzione e controlli Deno da estendere.
- **Come:** proposta percorso `supabase/functions/ingest-measurement/`, se confermata la scelta Edge Function. Handler minimale: autenticazione, limite corpo/metodo, validazione, inserimento idempotente atomico e risposta dopo commit. Assegnare `received_at` sul server; prevenire concorrenza con vincolo DB, non soltanto con un controllo preliminare.
- **Risultato:** endpoint e configurazione locale non segreta; timeout, errori e log minimizzati. Controlli browser/CORS, se pertinenti, non vengono trattati come autenticazione dell'uploader.
- **Verifica:** credenziale assente/errata, payload eccessivo o invalido, duplicato identico, conflitto diverso, due richieste simultanee, perdita della risposta e DB indisponibile. Non registrare token o header sensibili. I test simulati non sostituiscono quelli con DB reale.
- **Riferimento:** [plan.md §7 fase 5](plan.md#fase-5--database-sicurezza-e-ingestione), §8, RF3 e RNF2.

### BE-06 — Definire lettura ultima misura e storico

- [x] **Stato: endpoint pubblicato; query SQL e lettura HTTP vuota verificate in BE-07.**
- **Esito del 22 ottobre 2026:** Endpoint read e RPC preparati: latest coerente, 24h/7g/30g, basi temporali distinte, limite 500, cursore tempo/UUID a finestra fissa, proiezione pubblica e CORS. Test su vuoto, parametri, cursore e campi interni; snapshot concorrente e polling spiegati in docs/backend-schema.md.
- **Scopo in pratica:** Offrire al sito un modo limitato e prevedibile per leggere ultimi valori e serie temporali.
- **Input e file coinvolti:** Contratto query in `docs/backend.md`; query/endpoint o adapter browser da introdurre nel percorso coerente con D4, senza aggiungere entrambi i livelli per default.
- **Come:** definire query pubbliche limitate per ultimi valori e intervalli 24h/7g/30g, con ordinamento e limiti deterministici. Esporre solo campi approvati; nessun endpoint di download pubblico. Separare storico per data e record senza data.
- **Risultato:** contratto di lettura utilizzabile dal frontend, con stati vuoti/errori e unità/provenienza; nessuna necessità di leggere tabelle interne dal browser.
- **Verifica:** periodo vuoto, record con `measured_at` nullo, tempi uguali, anomalie, passaggi giorno/DST, dati arretrati appena importati e limiti query. Verificare indici e comportamento con un volume realistico dichiarato.
- **Riferimento:** [plan.md §8](plan.md#8-contratti-e-comportamenti-da-definire), RF1–RF2, RF5 e D4.

### BE-07 — Applicare e verificare il backend nell'ambiente autorizzato

- [x] **Stato: completato tecnicamente sul contratto v1 nel progetto esistente MeteOlivelli, autorizzato il 22 ottobre 2026.**
- **Esito:** migrazione `20261022125448`, tabella/RPC e due Edge Function ACTIVE v3; sorgente finale meteolivelli e token custodito in file locale ignorato, senza valori nei log. SQL con rollback e prove HTTPS superate, incluso invio concorrente (una 201/cinque 200) e rifiuto accessi diretti. Tre fixture HTTP rimosse per sorgente/UUID; conteggio finale zero. Verbale e limiti in [docs/backend-verification.md](docs/backend-verification.md). CSV/PC reali, guasti remoti forzati e rate limit non attestati.
- **Scopo in pratica:** Provare il backend completo sul target reale autorizzato, oltre ai test locali.
- **Input e file coinvolti:** Migrazione e funzione già revisionabili, target da `docs/services.md`, configurazione protetta e risultati in questo registro; nessun valore segreto nei documenti.
- **Come:** presentare target/ambiente, migrazione, policy, funzione, configurazione e prove. Solo con richiesta esplicita applicare le modifiche richieste al target verificato, predisporre segreti con modalità protette e usare dati di prova chiaramente separati dalle misure scolastiche.
- **Risultato:** database/endpoint effettivamente collegati e verificati; annotare cosa è stato applicato e come recuperare in caso di errore. Prima di una modifica a dati esistenti, preservarne una copia verificabile.
- **Verifica:** schema e policy reali corrispondono ai file; test anonimo/autenticazione/ingestione/read-only e deduplicazione concorrente passano. Nessuna chiave privilegiata nel client. Non segnare il backend pronto sulla sola base di un deploy riuscito.
- **Riferimento:** [plan.md §9](plan.md#9-sicurezza-e-privacy), §13 e Definition of Done §15.

**Uscita del blocco backend:** una misura conforme al contratto reale viene accettata una volta, il retry è sicuro, le scritture pubbliche sono respinte e le letture approvate funzionano. Senza BE-07 verificato si può dichiarare completato solo il codice locale pertinente.

## 6. Fase 6 — Uploader Windows e acquisizione reale

### UP-01 — Integrare la sorgente e l'orario delle nuove righe

- [ ] **Stato: implementazione provvisoria locale; CSV/writer necessari per la chiusura. Dipende da DATA-01–DATA-03.**
- **Scopo in pratica:** Trasformare soltanto le nuove righe complete del CSV reale in eventi pronti per l’invio.
- **Input e file coinvolti:** Futuro codice Python in `uploader/`, fixture e test in `uploader/tests/`, contratto DATA-03 e integrazione con writer autorizzata.
- **Come:** implementare lettura incrementale e rilevamento della riga completa/stabile usando le evidenze del writer. Modificare il punto di acquisizione temporale concordato, senza attribuire a vecchie righe l'ora di importazione. Leggere nuove righe senza ricaricare tutto l'archivio.
- **Risultato:** parser per il CSV reale e metadati di provenienza coerenti. Originale preservato; EOF senza newline e scrittura parziale trattati esplicitamente.
- **Esito locale Fase 6:** `uploader/core.py` legge incrementalmente LF/CRLF, con dialetto/encoding/intestazione espliciti e ordine/unità v1. EOF parziale atteso; originale conservato. Default storico senza date inventate. Modalità live abilitabile solo dopo verifica del writer, limitata a singola riga nuova in osservazione continua; batch, startup e pause restano storico. Nessun parser definitivo dichiarato. Limiti di formato e osservazione in `uploader/README.md`.
- **Verifica:** separatori/decimali reali, riga incompleta o malformata, valori ripetuti, reset e righe vecchie iniziali. Fixture sintetiche aggiuntive sempre dichiarate.
- **Riferimento:** [plan.md §7 fase 6](plan.md#fase-6--uploader-windows-e-acquisizione-reale), §8 e D1–D2.

### UP-02 — Implementare stato durevole e outbox

- [ ] **Stato: implementato e testato localmente su v1; chiusura operativa dipendente da UP-01 e DATA-03.**
- **Scopo in pratica:** Non perdere gli eventi già acquisiti e non cambiare identità quando il PC o la rete si interrompono.
- **Input e file coinvolti:** Futura outbox SQLite e registro cursore/identità gestiti da `uploader/`; percorsi di stato sul PC fuori da Git, test di crash/ripresa in `uploader/tests/`.
- **Come:** scelta tecnica su delega, SQLite: salvare atomicamente evento, ID, identità/generazione file e cursore prima dell'invio. Impedire doppia esecuzione. Segnare l'evento confermato solo dopo risposta affidabile, mantenendo ID e sorgente per eventuale replay.
- **Risultato:** crash/restart non perdono righe già persistite; retry usa lo stesso ID. Rotazione, troncamento e sostituzione riconosciuti senza deduplicare unicamente per hash della riga.
- **Esito locale Fase 6:** SQLite con transazione evento/cursore, payload immutabile, UUID per posizione/generazione, lock OS, marcatore di inizializzazione e apertura senza ricreazione automatica. Test di restart, rollback SQLite indotto, conferma persa e replay dopo restore con stessi ID. Rotazione/troncamento provocano fermo conservativo: riconciliazione e cambio generazione non automatizzati prima di conoscere il writer. Hash incrementali testa/coda non attestano ogni possibile riscrittura interna; guasto elettrico e restore operativo non provati.
- **Verifica:** crash prima/dopo invio o conferma locale, file cambiato, stato corrotto/perso e restore del database precedente alle conferme uploader. Se l'identità non è ricostruibile, fermare il replay automatico e segnalare anziché creare nuovi UUID per tutto.
- **Riferimento:** [plan.md §8](plan.md#8-contratti-e-comportamenti-da-definire), RF3–RF4 e D14.

### UP-03 — Implementare retry, quarantena e diagnostica

- [ ] **Stato: testato localmente e via HTTPS/Supabase con CSV sintetico; prova della sorgente reale dipendente da UP-01–UP-02.**
- **Scopo in pratica:** Riprovare quando il problema è temporaneo e conservare le righe invalide senza nasconderle.
- **Input e file coinvolti:** Invio HTTPS, stato retry, quarantena e log nel futuro `uploader/`; guida di diagnosi in `uploader/README.md`; spazio e canale avvisi da concordare.
- **Come:** inviare via HTTPS, backoff con jitter per errori temporanei e rispetto di `Retry-After` quando presente. Credenziale rifiutata → sospensione e avviso; invalidi permanenti → quarantena con originale e motivo, senza bloccare tutte le altre righe. Limitare/ruotare log e osservare spazio/coda, senza segreti.
- **Risultato:** ripresa dopo offline senza scarti silenziosi, ritardi distinguibili dalle anomalie e dal fermo sensore; nessuna eliminazione automatica dei non confermati per liberare spazio.
- **Esito locale Fase 6:** HTTPS senza redirect, timeout 15 s, backoff/jitter e Retry-After (secondi/data), verifica ricevute con identità, sospensione persistente auth/protocollo, quarantena SQLite con originale e motivo. CLI `--status`, `--resume`, `--replay-confirmed`; log ruotati e soli messaggi controllati; fermo sotto 64 MiB liberi. Test HTTP simulati e rollback indotto, nessun disco fisicamente pieno o collegamento remoto provato. Autonomia offline da dimensionare; email/monitor indipendente restano OPS-02.
- **Prova successiva richiesta:** uploader/HTTPS/Supabase con CSV sintetico superati; retry dopo ricevuta ignorata e replay degli stessi ID verificati nel DB reale. Sette fixture eliminate, zero residui. L'esito locale precedente non includeva questa prova; restano esclusi Windows, guasti di rete/DB provocati e rate limit reale. [Verbale](docs/backend-csv-verification.md).
- **Verifica:** timeout, risposta persa dopo commit, 429/5xx, 4xx di validazione/auth, disco pieno e stato locale non scrivibile. Definire la durata offline sostenibile sulla capacità reale, non assumere spazio infinito.
- **Riferimento:** [plan.md §8](plan.md#8-contratti-e-comportamenti-da-definire), §13, D16–D17 e D21.

### UP-04 — Installare, avviare automaticamente e provare sul PC reale

- [ ] **Stato: guida predisposta; installazione e prove Windows non eseguite. Dipende da UP-01–UP-03 e disponibilità/accesso al PC.**
- **Scopo in pratica:** Far partire e mantenere l’uploader sul PC Windows senza doverlo lanciare a mano a ogni accensione.
- **Input e file coinvolti:** PC reale accessibile con permessi concordati; pacchetto `uploader/` e `uploader/README.md`; credenziale fuori dai file versionati.
- **Come:** verificare Python/permessi, clock, rete, proxy, sospensione e file accessibile all'account tecnico; configurare avvio automatico e singola istanza con strumento Windows adatto. Custodire credenziale fuori dal sorgente; solo HTTPS in uscita. Non confondere un PC dedicato con disponibilità continua verificata.
- **Risultato:** procedura breve `uploader/README.md` per installazione, configurazione senza valori, stop/start, log e aggiornamento; nuova misura realmente inviata anche dopo riavvio secondo modalità concordata.
- **Esito locale Fase 6:** guida per Python senza dipendenze pip, configurazione con soli segnaposto, account tecnico, Utilità di pianificazione, custodia del token, diagnosi e recupero. Nessuna attività pianificata creata o credenziale letta. Runtime Windows, lock `msvcrt`, avvio senza login, writer/clock/rete e flusso fino al DB ancora da verificare sul PC.
- **Verifica:** reboot, avvio senza intervento manuale nel caso richiesto, rete scollegata/ripresa, file occupato e nuova riga fino al DB. Nessuna porta in ingresso. Segnalare eventuale necessità di login rimasta, senza nasconderla.
- **Riferimento:** [plan.md §7 fase 6](plan.md#fase-6--uploader-windows-e-acquisizione-reale), D7, D15 e D24.

## 7. Fase 7 — Previsioni e collegamento al frontend

### WX-01 — Progettare e valutare il modello locale

- [ ] **Stato: motore locale v1 e backtest implementati il 23 ottobre; verifica meteorologica reale dipendente da DATA-01–DATA-02 e storico datato idoneo.**
- **Scopo:** verificare quali stime il progetto possa calcolare usando i dati della stazione, senza servizio meteo esterno, come richiesto il 22 ottobre.
- **Input/file:** specifica del modello e valutazione riproducibile in `docs/backend.md`, serie con provenienza temporale e qualità ammesse; nessun numero minimo di giorni inventato come prova sufficiente.
- **Come:** partire dal confronto con la persistenza e valutare modelli semplici sui dati successivi a quelli usati per stimare. Distinguere risultati per grandezza e orizzonte, errore, numero di casi e limiti. Non introdurre un LLM o API AI per deduzione dalla parola “previsioni”.
- **Risultato:** decisione motivata per +30m/+1h/giornata, anche “non supportato con i dati attuali”. Nessuna conversione arbitraria di pressione/umidità in sole o pioggia; cadenza oraria non fornisce una verità di confronto reale a mezz’ora.
- **Verifica:** assenza di uso di dati futuri nella valutazione, dati mancanti/sospetti, timestamp acquisizione non idonei, confronto con base semplice e limiti dell’orizzonte giornaliero. Nessuna attendibilità meteorologica dichiarata senza prove.
- **Riferimento:** plan.md §6, D23 e §18. La vecchia proposta provider è superata.

### WX-02 — Implementare stime sperimentali e stato indisponibile

- [ ] **Stato: worker, feed fisico indipendente e UI implementati localmente il 23 ottobre; restano validazione reale WX-01 e calcolo/cache/archivio condivisi.**
- **Scopo:** calcolare e servire le sole stime supportate dalla verifica, separandole dalle misure.
- **Input/file:** futuro modulo del modello nel runtime scelto per il backend, test e contratto in `docs/backend.md`; schema dei risultati deciso dopo WX-01.
- **Come:** registrare metodo/versione, dati di origine, generazione, validità e unità. Calcolare una volta per nuovi dati e condividere il risultato fra visitatori; conservare i run necessari alla verifica successiva senza presumere retention permanente delle stime.
- **Risultato:** “Stime sperimentali MeteOlivelli”, limiti espliciti e “Stima non disponibile” se dati o verifica non bastano. Nessuna condizione atmosferica o percentuale di affidabilità inventata.
- **Verifica:** dati insufficienti/vecchi/sospetti, orizzonti non validati, cambio giorno/DST, separazione osservazioni/stime e confronto successivo con le osservazioni reali. Un errore nel modello non blocca le misure.
- **Riferimento:** plan.md §6, §18 e RF7.

### UI-00 — Preparare Figma e il primo design con il compagno (22 ottobre 2026)

- **Strumento scelto:** Figma per la progettazione della UI, confermato dall'utente il 22 ottobre 2026; il design guiderà l'implementazione React/TypeScript con Vite di UI-01.
- [ ] **Stato: parzialmente eseguito il 22 ottobre 2026.** File Figma accessibile e prima base desktop/mobile creata e verificata visivamente; restano revisione con il compagno e QA completo. Può procedere in parallelo a DATA-02/BE-01; non richiede database operativo.
- **Prima base realizzata:** [MeteOlivelli · Base UI v1](https://www.figma.com/design/dMJqTphynvTgGm6yqUsVrP/MeteOlivelli?node-id=7-2), viste desktop 1280 px/mobile 390 px, tre componenti riutilizzabili, variabili e stili tipografici. Rettangolo preesistente preservato. Solo stati senza dati, chiaramente etichettati; nessuna UI React implementata. Controllati livelli modificabili, font Inter e composizioni desktop/mobile; interazioni, accessibilità completa e dati reali restano da verificare.
- **Revisione dark realizzata su richiesta dell'utente:** stessa tavola rinominata `MeteOlivelli · Dark UI v2 · DEMO`; tema scuro, tre grafici vettoriali con assi/unità e cronologia degli ultimi sei campioni (tabella desktop, schede mobile). Dieci campioni orari fittizi coerenti con le schede; scenari previsionali fittizi separati. Avviso generale e marcature DEMO nelle sezioni/campioni. Verifica visiva desktop/mobile eseguita; mockup statico, senza dati reali o interazioni implementate. Revisione con il compagno e QA completo restano aperti.
- **Revisione Product Design v3:** gerarchia delle informazioni migliorata, componente misure compatto mobile, cronologia semplificata, assi allineati e periodo selezionato più evidente. Screenshot prima/dopo acquisiti e ispezionati; [report con evidenze](docs/design-review/README.md). Mockup statico, dati sempre DEMO; nessuna verifica di accessibilità completa o codice React implicata.
- **Revisione frosted v4:** applicati vetro satinato sobrio, blur di sfondo 20 px, bordi sfumati e ombre morbide. Grafici con fondo più schermato; viste desktop/mobile ispezionate, contenuti e marcature DEMO preservati. Solo design Figma e documentazione.
- **Revisione Obsidian v5:** sfondo uniforme `#05080E`, nessun gradiente di sfondo; pannelli più neutri, riflessi/bordi e ombre attenuati. Riempimenti SOLID verificati e composizioni desktop/mobile ispezionate. Design statico, dati DEMO invariati.
- **Note motion:** aggiunte in Figma (area componenti) e nelle descrizioni dei componenti: ingresso 220 ms ease-out, fade + 8 px, stagger 40 ms fino a 120 ms; una sola volta, scroll naturale e rispetto del movimento ridotto. Sono indicazioni per UI-01, non animazioni già implementate.
- **Prima della sessione:** accesso al file Figma ora verificato; il compagno verifica la propria configurazione/accesso. Non affermare che l'app locale sia già installata o che la sessione congiunta sia stata svolta.
- **Durante le due ore a scuola:** 0–15 min requisiti UI condivisi; 15–60 min ricerca riferimenti e wireframe Figma (mentre l'utente segue backend/CSV); 60–90 min passaggio di screenshot/riferimento e specifiche a Codex per una prima implementazione, se il design è pronto; 90–120 min QA e correzioni.
- **Responsabilità compagno:** selezionare 2–3 riferimenti, progettare disposizione card temperature/umidità/pressione, grafici, stato e sezioni, proporre colori/font, creare vista desktop e indicazioni mobile. Curare QA funzionale e visivo; non limitarsi a inviare il riferimento all'AI.
- **Responsabilità utente:** concordare il contratto dati UI e sviluppare in parallelo il backend, senza bloccare il compagno in attesa di Supabase.
- **Output:** file Figma o screenshot/wireframe condiviso con specifiche, note per mobile e checklist QA; se implementato, codice frontend su branch dedicato con PR revisionabile, senza merge/push/deploy automatici non richiesti.
- **QA minimo:** dati demo permanentemente etichettati; °C/%/hPa; grafici e assi leggibili; responsività; loading/vuoto/errori; stato stazione veritiero; tastiera/contrasto; console priva di errori; build/lint. Non equivale ancora al collaudo su CSV e database reali.
- **Riferimento:** [plan.md §7, sessione UI 22 ottobre](plan.md#sessione-di-progettazione-ui-con-il-compagno--22-ottobre-2026-programmata) e [Fase 7](plan.md#fase-7--previsioni-e-collegamento-al-frontend).

### UI-01 — Costruire la dashboard italiana essenziale

- [x] **Stato: dashboard implementata, pubblicata e verificata il 22 ottobre 2026; collaudo della stazione reale separato.**
- **Esito corrente:** UI Factory con titolo grande e pannello temperatura a destra su desktop, tema scuro, Inter locale, marchio `MO. | MeteOlivelli`, postilla, schede, quattro grafici SVG, filtri 24h/7g/30g e cronologia paginata con dettagli qualità/tempi. Solo GET BE-06, nessuna chiave client o dipendenza nuova per grafici/motion.
- **Interazioni:** ingressi nascosti prima del paint e attivati individualmente in vista; curva/area/punti progressivi, riflesso locale sul bordo con inerzia, nessuna illuminazione del divisore quando si puntano i filtri. Focus tastiera e movimento ridotto rivelano i contenuti immediatamente. [Specifiche](design.md).
- **Dati:** `live`, `historical`, `synthetic` distinti nell’applicazione. Cinque campioni di prova amministrativi sono pubblici con la postilla concordata; nessun selettore DEMO. Loading/vuoti/errori/null/sospetti restano distinti; nessuno zero sostitutivo. Le stime restano indisponibili senza WX-02.
- **Verifica:** rilascio `bce39e2`, `npm run check` superato con 18 test Node, 41 Deno e 21 Python; 13 scenari browser locali e collaudo API → pagina pubblica con cinque campioni, quattro grafici, cronologia e postilla. Screenshot desktop/mobile e risultati in [docs/frontend.md](docs/frontend.md) e [docs/data-preview.md](docs/data-preview.md). Nessuna certificazione WCAG o prova Arduino/telefono reale attestata.
- **File principali:** `src/App.tsx`, CSS, `src/components/HistoryChart.tsx`, `Reveal.tsx`, `src/motion.ts`, `src/use-border-light.ts`, adapter e hook dati.
- **Limiti:** revisione con il compagno e dispositivi reali ancora aperti; Figma Obsidian v5 non è stato riallineato al restyling Factory. Freschezza reale e UI-02/WX non sono chiusi dalla pubblicazione.
- **Riferimento:** [plan.md Fase 7](plan.md#fase-7--previsioni-e-collegamento-al-frontend), [Fase 8](#8-fase-8--backup-gestione-e-rilascio).

### UI-02 — Aggiornare automaticamente la pagina e calcolare il ritardo

- [ ] **Stato: implementazione locale provvisoria verificata; cadenza/ancoraggio e prova con inserimento reale ancora necessari.**
- **Esito corrente:** polling latest ogni 15 secondi solo a pagina visibile, ripresa al ritorno/online, timeout, annullamento e assenza di richieste sovrapposte. Storico riletto all'apertura, cambio periodo, variazione dell'ultimo campione o recupero da errore dello storico; finestre scadute eliminate usando l'ora server. Paginazione fino a 50.000 eventi senza troncamenti silenziosi. Dati precedenti conservati e segnalati dopo errore. Due pagine aggiornate tramite fixture intercettata, senza reload. La funzione atteso +20 minuti è testata ai limiti; nel sito la cadenza resta non configurata e la freschezza dichiarata sconosciuta, anche dopo una ricezione recente.
- **Limiti residui:** non misurati latenza dal commit DB, quote/costi con pubblico reale e cadenza della stazione. Il contratto latest non segnala inserimenti storici che non cambiano l'ultimo evento: questi richiedono riapertura/cambio periodo per rileggere lo storico. Nessuna modifica al backend per deduzione. Dettagli in [docs/frontend.md](docs/frontend.md).
- **Scopo in pratica:** Mostrare una misura nuova nella pagina già aperta e indicare correttamente se la stazione è in ritardo.
- **Input e file coinvolti:** Adapter letture e componenti di UI-01 in `src/`; eventuale canale backend scelto, timer e prove riconnessione. Soglia fissata nel piano: atteso +20 minuti.
- **Come:** partire dalla scelta delegata, polling novità ogni 15 secondi a pagina visibile e cache condivisa fino a 10 secondi; verificarne quote e comportamento effettivo prima del rilascio. Ricaricare serie soltanto a nuove misure/cambio periodo e riprendere al ritorno in primo piano. Riconnettere dopo errore senza duplicati; calcolare ritardo sull’atteso +20 minuti distinguendo acquisizione PC, misura e ricezione.
- **Risultato:** niente reload manuale e niente attesa fino al prossimo ciclo orario della stazione. Target proposto nell'ordine di 30 secondi dal commit DB in condizioni normali, da misurare; non è uno SLA approvato né latenza nulla.
- **Verifica:** due browser aperti, inserimento nuovo, retry, offline e riconnessione; soglia appena prima/al/dopo il limite; arrivo di storico vecchio che non fa risultare la stazione aggiornata. Se l'ora misura è ignota, freschezza dichiarata sconosciuta.
- **Riferimento:** [plan.md §8](plan.md#8-contratti-e-comportamenti-da-definire), RF8, D8 e D24.

### UI-03 — Separare Home e informazioni del progetto

- [x] **Stato: implementato localmente il 23 ottobre 2026; pubblicazione non eseguita.**
- **Esito:** la dashboard attuale è disponibile su `/home`; `/info` presenta progetto, stazione, dati e team. La radice reindirizza a `/home`. Navigazione condivisa, metadati e canonical distinti, pagine statiche generate nella build, `robots.txt` e sitemap limitata alle due pagine.
- **Contenuti:** descrizione basata sulle informazioni già presenti nel README e nella UI. Chiarito che i dati di prova eventualmente mostrati non sono osservazioni reali, e che il polling del sito non definisce la cadenza di misura della stazione.
- **Verifica:** `npm run build`, `npm run lint`, 41 test frontend e `git diff --check` superati; dist controllato: entrambe le route hanno title, description e canonical distinti, sitemap include solo le due pagine. Preview browser non avviabile nell'ambiente: bind locale negato (`EPERM`). Nessuna modifica a GitHub, Vercel remoto o Search Console.
- **File principali:** `src/main.tsx`, `src/SiteRoute.tsx`, `src/App.tsx`, `src/pages/InfoPage.tsx`, `scripts/create-static-routes.mjs`, `public/robots.txt`, `public/sitemap.xml`, `vercel.json`.
- **Riferimento:** [plan.md Fase 7](plan.md#fase-7--previsioni-e-collegamento-al-frontend).

## 8. Fase 8 — Backup, gestione e rilascio

**Punto di partenza verificato:** versione WIP già pubblicata su `main`, UI Factory con motion/hover, postilla e cinque campioni `synthetic`; rilasci `fab71cb` e `bce39e2` verificati READY. La Fase 8 complessiva resta aperta: pubblicazione e prova API → UI non chiudono backup, allarmi o collaudo della stazione reale. [Guida operativa](docs/operations.md), [frontend](docs/frontend.md), [evidenze dati](docs/data-preview.md).

### OPS-01 — Scegliere e provare il backup indipendente

- [ ] **Stato: destinazione indicata (Google Drive scolastico per backup DB); dispositivo/processo export-upload, custode e target RPO/RTO da definire; esportazione e restore non eseguiti.**
- [x] Documentare perimetro e criteri in `docs/operations.md`, includendo tipo `synthetic`, metadati, migrazioni, CSV e identità/outbox.
- [x] L’utente sceglie Google Drive scolastico per i backup del database e la gestione manuale dei file del programma; non dal PC scolastico.
- [ ] Definire un dispositivo amministrativo autorizzato per esportare il database Supabase, cifrare il pacchetto e caricarlo nella cartella Drive; verificare spazio, permessi, custode e versionamento. Non inserire credenziali Google nell’Arduino o nel repository.
- [ ] Approvare o correggere i target proposti: RPO massimo 24 ore e RTO massimo un giorno lavorativo. Sono ipotesi operative, non decisioni già assunte.
- [ ] Esportare fuori da Git e ripristinare in ambiente separato autorizzato, senza sovrascrivere produzione.
- [ ] Confrontare conteggi, UUID, tipo/provenienza, valori, null temporali, schema/RLS e replay sicuro degli eventi già confermati dall’uploader; registrare durata ed esito.
- **Criterio di completamento:** copia separata e restore provato. Git, screenshot, database operativo e CSV sul medesimo PC non sono automaticamente backup.
- **Riferimento:** [plan.md Fase 8](plan.md#fase-8--backup-gestione-e-rilascio), RF6, D6, D10 e D17; [QA §8](docs/qa.md#8-backup-e-ripristino).

### OPS-02 — Completare gestione segreti, avvisi e diagnosi minima

- [ ] **Stato: runbook iniziale pronto; avvisi, rotazione e verifiche operative ancora aperti.**
- [x] Registrare target, diagnosi API vuota/errore, dati vecchi, uploader e stime indisponibili in `docs/operations.md`; nessun valore segreto documentato.
- [ ] Confermare custodia/revoca delle credenziali del PC e provare il comportamento con credenziale revocata nell’ambito autorizzato.
- [ ] Definire recapito email e meccanismo gratuito; attivare e verificare l’avviso soltanto su richiesta specifica, senza dedurre l’autorizzazione all’invio da questa checklist.
- [ ] Provare diagnosi di stazione/uploader fermo, rete, DB, spazio/quote; fissare soglie dopo la verifica di clock e cadenza. Controllare anche console e accessibilità di motion/focus su dispositivi reali.
- **Criterio di completamento:** responsabile e procedure trasferibili, segreti esclusi da client/log/Git, avviso realmente osservato. Nessun allarme o backup dichiarato attivo per la sola presenza del documento.
- **Riferimento:** [plan.md §9](plan.md#9-sicurezza-e-privacy), D7, D19 e D21; [guida](docs/operations.md).

### OPS-03 — Gestire i campioni di prova e il passaggio alla stazione reale

- [ ] **Stato: provenienza applicativa implementata e verificata; decisione attuale dell’utente (22 ottobre): mantenere per ora i cinque campioni e la postilla. Il passaggio reale resta in attesa del PC/CSV.**
- [x] Tipo distinto `synthetic`, vincoli SQL, campo API/client, ingestione sensori che rifiuta il tipo, data fisica NULL e postilla pubblica verificati.
- [x] Registrare batch `ui-preview-20261022-five-half-hour`, cinque record a distanza di 1800 secondi ed evidenze pubbliche in `docs/data-preview.md`.
- [x] Mantenere per ora invariati i cinque record e la postilla; nessuna cancellazione o modifica richiesta.
- [ ] Alla disponibilità della prima misura vera verificare priorità di `live` in `latest`, provenienza dello storico e chiarezza delle curve; non confondere lo scenario di prova con il trend della stazione.
- [ ] Dopo il primo collaudo reale, concordare se mantenere identificato o rimuovere il batch; per eventuale cancellazione verificare UUID e copia necessaria e ottenere una richiesta esplicita. Nessuna cancellazione per sola sorgente.
- [ ] Dopo l’eventuale rimozione verificare API/UI e aggiornare documenti; rimuovere/modificare la postilla soltanto con decisione esplicita e dopo aver verificato che i campioni di prova non siano più esposti.
- **Criterio di completamento:** passaggio alla stazione reale documentato, senza rietichettare dati inventati come `live`, perdere misure o lasciare provenienza ambigua. Questo task non autorizza altre scritture.
- **Riferimento:** [plan.md Fase 8](plan.md#fase-8--backup-gestione-e-rilascio), [contratto](docs/data-preview.md), [guida](docs/operations.md#cinque-campioni-e-passaggio-ai-dati-reali).

### REL-01 — Verificare il flusso completo e chiudere la checklist MVP

- [ ] **Stato: collegamento pubblico e casi sintetici verificati; collaudo reale ancora bloccato da DATA/UP, WX e OPS-01–OPS-02.**
- [x] Controlli locali del rilascio: `npm run check` (18 Node, 41 Deno, 21 Python), 13 scenari browser; SQL transazionale e API → pagina pubblica con cinque campioni, quattro grafici e cronologia.
- [ ] Chiudere DATA-01–DATA-03 e UP-01–UP-04 con CSV, writer e PC Windows reali. Seguire una misura Arduino fino alla pagina aperta senza reload.
- [ ] Misurare latenza DB → UI, verificare clock/cadenza e ritardo, rete assente/ripresa, restart, retry, reset Arduino e volume per 24h/7g/30g.
- [ ] Completare QA su dispositivi/browser reali, zoom e lettore schermo, inclusi ingressi nascosti prima della vista, focus, movimento ridotto e assenza di illuminazione dei divisori durante l’hover dei filtri.
- [ ] Completare backup/restore e avvisi; valutare WX-01/WX-02 o mantenere esplicitamente le stime indisponibili finché non validate. Non dichiarare raggiunto l’MVP previsionale se il modello manca.
- **Criterio di completamento:** evidenze reali datate per RF1–RF8 e RNF pertinenti, limiti accettati e nessun blocco critico aperto. Aggiornare solo problemi verificati in `CORRECTIONS.md`.
- **Riferimento:** [plan.md §13](plan.md#13-test-e-verifiche-previste), §15, [QA](docs/qa.md).

### REL-02 — Pubblicare solo la versione verificata e richiesta

- [ ] **Stato: pubblicazione WIP corrente completata e verificata; rilascio MVP definitivo ancora dipendente da REL-01.**
- [x] Pubblicati su `main` `fab71cb` e `bce39e2`; deploy Git Vercel READY, target `meteolivelli` / team `team_WF8R8uiIvXzKOKJgGrlcCYtF`, dominio `meteolivelli.vercel.app`.
- [x] Applicata migrazione `20261022194231_synthetic_measurement_kind` e ripubblicata lettura Supabase nel progetto `pvtzncseisbxaaseqfvo`, dopo autorizzazione. Postilla pubblicata prima dei cinque inserimenti di prova.
- [x] Verificati HTTP 200, postilla, dati/provenienza, quattro grafici, cinque righe di cronologia, reflow mobile e nessun errore JavaScript. [Verbale](docs/data-preview.md).
- [ ] Per il prossimo rilascio applicativo eseguire i controlli proporzionati al diff, verificare target e richiesta, controllare file stagiati e segreti, poi commit/push solo se richiesti. Preferire il deploy Git già configurato.
- [ ] Prima di dichiarare l’MVP finale chiudere REL-01, verificare backup, quote, dati reali e decisione sul batch/postilla di OPS-03; consegnare limiti e procedura di recupero.
- **Criterio di completamento complessivo:** produzione corrispondente alla versione verificata e criteri MVP soddisfatti. La release pubblica WIP resta un esito già acquisito, senza essere confusa con l’MVP completo.
- **Riferimento:** [plan.md Fase 8](plan.md#fase-8--backup-gestione-e-rilascio), §15 e D18; [procedura](docs/operations.md#rilasciare-una-modifica-autorizzata).

### END-01 — Gestire la possibile chiusura a dicembre

- [ ] **Stato: rinviato; chiusura non confermata né autorizzata.**
- **Come:** confermare data e perimetro solo quando concreti; ottenere copia indipendente ripristinabile e modalità di consultazione permanente dello storico prima di fermare acquisizione, sito o servizi. Distinguere misure reali e campioni di prova anche nelle copie.
- **Verifica:** copie leggibili e ripristinate, accessi e credenziali gestiti secondo la decisione. Nessun arresto, cancellazione o automazione creati dalla sola presenza di questo task.
- **Riferimento:** [plan.md §11](plan.md#11-registro-decisioni-ed-esiti), D19; [guida](docs/operations.md).

## 9. Da dove ripartire dopo la revisione insieme

1. **Setup locale completato:** SET-01–SET-03; inventario iniziale SET-04 completato in sola lettura. Non ripetere installazione o verifiche già superate senza nuove modifiche o problemi.
2. **Controlli locali pronti:** BE-01 completo sul contratto v1; DATA-02/DATA-03 documentati e testati come regole pure. Per i servizi usare l'inventario SET-04 e ricontrollare soltanto quanto cambia o resta pertinente da chiarire.
3. **Appena disponibile il PC/campione:** chiudere DATA-01–DATA-03, verificare/adattare l'uploader locale v1 e completare UP-01–UP-04 sul PC. Riallineare backend solo se cambia il contratto e ripetere i controlli interessati. WX-01 e struttura UI possono progredire separatamente.
4. **Prima del rilascio:** previsioni, aggiornamento live, backup e prova completa, poi pubblicazione richiesta. Nessun task remoto viene anticipato dalla sola approvazione di questa checklist.

La Fase 5 è completata tecnicamente sul contratto v1 nel progetto Supabase scelto; verificare DATA-01–DATA-03 sul CSV/writer quando disponibili e aggiornare eventuali differenze. Ordine/unità dichiarati non provano separatore, decimali o tempi reali. Backup e canale avvisi restano da concretizzare; WX-01 attende dati idonei, senza provider esterno.

## 10. Registro esecuzioni

| Data | Task | Esito ed evidenza | Limiti / passo successivo |
|---|---|---|---|
| 22 ottobre 2026 | Documentazione design e istruzioni | `design.md` consolidato nella root, principi dell’allegato e adattamenti distinti; `AGENTS.md` con mappa dei file e regole di aggiornamento | Nessun codice o dato modificato; il vecchio percorso Factory resta un rimando |
| 22 ottobre 2026 | Fase 8 · revisione documentale | README, frontend/design, QA, servizi e guida operativa consolidati sul rilascio `bce39e2`; OPS-03 aggiunto e roadmap sincronizzata | Documentazione soltanto: backup, avvisi, transizione alla stazione e MVP reale restano aperti; commit/push richiesti |
| 22 ottobre 2026 | Fase 8 · decisioni e proposta backup | CSV/PC Windows non disponibili; batch `synthetic` e postilla da mantenere per ora; Drive scolastico scelto per backup DB e gestione manuale del programma, senza collegarlo al PC scolastico | Dispositivo per export/upload, cartella/capienza e RPO/RTO ancora da definire; nessun backup esportato o dato remoto modificato |
| 21 ottobre 2026 | SET-00 | Baseline iniziale e successivo setup: stato Git, configurazioni e strumenti ricontrollati | Documenti locali preesistenti preservati; niente commit/push |
| 21 ottobre 2026 | SET-01 | Regole ambiente corrette; esempi versionabili, nomi ambiente reali ancora ignorati | COR-001 risolto dopo controlli basati sui soli nomi |
| 21 ottobre 2026 | SET-02 | README, esempi vuoti e guida backend creati; nessun `.env.local` letto o sovrascritto | Il template non usa ancora un client Supabase |
| 21 ottobre 2026 | SET-03 | Deno 2.9.6 locale; typecheck/lint backend superati; 3 test superati, senza permessi ambiente/rete/file | Modulo base di configurazione soltanto; nessuna ingestione o migrazione |
| 21 ottobre 2026 | SET-04 | GitHub/Supabase verificati con connettori; Vercel con target esplicito; quote/condizioni ufficiali consultate | Limiti e controlli successivi in `docs/services.md`; nessuna modifica remota |
| 22 ottobre 2026 | UI-00 (parziale) | Accesso al file Figma e creazione base UI desktop/mobile con componenti, variabili e stili; verifica visiva dopo correzione altezza testi | Revisione con il compagno e QA completo ancora da fare; nessuna implementazione React o integrazione dati |
| 22 ottobre 2026 | UI-00 (revisione dark) | Tema scuro, tre grafici vettoriali, cronologia e dati DEMO su desktop/mobile; composizioni verificate visivamente | Mockup statico; revisione con il compagno e QA completo ancora aperti |
| 22 ottobre 2026 | UI-00 (Product Design v3) | Revisione visiva documentata prima/dopo; gerarchia, misure mobile, cronologia, assi e periodo selezionato migliorati | Verifica del mockup; tastiera, semantica e interazioni da provare nell'implementazione |
| 22 ottobre 2026 | UI-00 (frosted v4) | Superfici traslucide, bordi sottili e profondità discreta; verifica visiva desktop/mobile | Mockup statico; nessuna verifica runtime o implementazione React |
| 22 ottobre 2026 | UI-00 (Obsidian v5) | Sfondo uniforme quasi nero e superfici satinate rifinite; verifica strutturale e visiva desktop/mobile | Solo Figma e documentazione; nessuna verifica runtime necessaria |
| 22 ottobre 2026 | Revisione criticità | Recepite risposte 1–20, scelte delegate e proposte 21–36; aggiornati timestamp, retention, modello locale e dipendenze UI; corrette incoerenze documentali | Solo documentazione; nessun task applicativo spuntato, nessuna implementazione o modifica remota |
| 22 ottobre 2026 | Approvazione soluzioni | L’utente approva il riepilogo abbreviato problema/soluzione; registrati orientamenti concordati in plan.md §18 | Input e dettagli tecnici residui aperti; nessun task applicativo completato da questa conferma |
| 22 ottobre 2026 | Controlli dati (precedente Fase 2, oggi 4): DATA-01–DATA-03 parziali, BE-01 locale | Ordine/unità dichiarati dall'utente; contratto v1, validazione/qualità/confronto canonico e 14 test dedicati; `npm run check` superato in copia senza `.env`, 17 test totali. Rilevamento ricorsivo check/lint/test provato con errori deliberati solo nella copia | CSV/writer/clock non osservati; nessun parser definitivo, endpoint, persistenza, migrazione o servizio remoto modificato |
| 22 ottobre 2026 | Sezione 4: adattatore CSV e completamento locale contratto | Confermato ambito DATA-01–DATA-03/BE-01; formato “standard” resta ipotesi dell'utente. Parser provvisorio a dialetto obbligatorio con originale, errori strutturati e 10 test aggiunti; `npm run check` superato su copia senza `.env`, 27 test totali | Dialetto effettivo, writer, encoding, righe parziali e clock ancora da osservare. Nessun endpoint o modifica remota; stati DATA non chiusi senza prova reale |
| 22 ottobre 2026 | Verifica prima di commit/push richiesti | Rieseguito `npm run check` in copia senza `.env`: lint/build frontend, typecheck/lint/formato backend e 27 test superati; `git diff --check` senza errori. Remoto verificato: `pgiudici13/MeteOlivelli`, branch corrente `main` | Dati di test sintetici; nessuna prova con CSV/PC reali, endpoint o DB. Commit e push autorizzati esplicitamente; nessuna migrazione o modifica Supabase/Vercel richiesta |
| 22 ottobre 2026 | UI-01 parziale: pagina provvisoria | Pagina italiana “Work in progress” senza dati; descrizione breve, metadati, favicon e `noscript`. `npm run check` superato in copia senza `.env`: build/lint frontend e controlli backend con 27 test. Anteprima della build verificata visivamente a 580 px | Nessuna suite frontend dedicata; verifica completa di breakpoint/zoom e dashboard ancora da fare. Commit/push richiesti; nessun deploy manuale o modifica alla configurazione dei servizi |
| 22 ottobre 2026 | Fase 5: BE-02–BE-06 locali | Schema/accessi revisionati, migrazione creata tramite CLI e prove SQL preparate; handler ingest/read e adapter RPC senza nuove dipendenze. `npm run check` superato in copia senza .env: build/lint frontend, check/lint/formato backend e 39 test sintetici. Numerazione plan/tasks sincronizzata, convenzione in AGENTS.md, COR-003 risolto | BE-07 aperto: nessun SQL eseguito, DB o runtime remoto verificato. Concorrenza e privilegi reali da provare nel target separato autorizzato. Nessun commit/push/deploy o segreto reale letto |
| 22 ottobre 2026 | BE-07: applicazione al progetto esistente autorizzato | Target verificato pvtzncseisbxaaseqfvo; migrazione 20261022125448 applicata; ingest/read ACTIVE v3. SQL/permessi con rollback e prove HTTP reali superati, sei invii concorrenti senza duplicati, accessi diretti negati. Volume sintetico 8.760 righe annullato; fixture HTTP rimosse, zero eventi finali. Verbale in docs/backend-verification.md | Contratto v1, CSV/clock/Windows reali ancora da convalidare; endpoint read provato vuoto, letture positive via RPC. Rate limit e guasti remoti forzati non attestati. Nessun commit/push o modifica frontend/Vercel |
| 22 ottobre 2026 | Commit/push completo richiesto | Rieseguito npm run check in copia senza .env: build/lint frontend, check/lint/formato backend e 39 test superati. git diff --check senza errori; remoto pgiudici13/MeteOlivelli, branch main verificati | File credenziali ignorati; nessun segreto incluso. Commit/push autorizzati esplicitamente dall’utente |
| 22 ottobre 2026 | UI-00 (Obsidian v5 · revisione umidità e leggibilità) | Aggiornate le percentuali di umidità a un decimale in scheda mobile/desktop, grafico e sei righe di cronologia; testi di nota dello storico ingranditi e resi più leggibili; screenshot comparativo ispezionato | Limite Starter Figma raggiunto durante la fase di composizione: la sezione informativa desktop è stata creata, ma il riordino finale con cronologia/footer e la verifica screenshot successiva non sono riusciti. Frase mobile originale preservata; desktop ancora da completare e verificare. Nessuna modifica a codice o servizi remoti |
| 22 ottobre 2026 | Fase 6: UP-01–UP-04 parziali | Uploader Python/SQLite, CLI e guida Windows predisposti. `npm run check` superato in copia senza `.env`: build/lint frontend, check/lint/formato backend, 39 test Deno e 21 test Python. Prova aggiuntiva Python → parser/handler Deno → ricevuta Python: 16 casi sintetici nei quattro dialetti, storico/live e valori sospetti/null. Smoke CLI initialize/status/resume/replay, rifiuto reinizializzazione e status senza CSV superati; `git diff --check` senza errori | Nessun CSV/writer/Windows reale, invio HTTP remoto, installazione o servizio modificato. Rollback e crash simulati tramite errori indotti, non interruzione elettrica o disco fisicamente pieno. Rotazione richiede riconciliazione; parser e acquisizione temporale restano provvisori. Nessun commit/push o segreto reale letto |

Verifica storica del setup: `npm run check` superato su copia senza `.env` con exit code 0 (lint/build frontend, check/lint backend, 3 test backend). Per i controlli attuali, inclusi uploader e 39 test backend, vedere la riga Fase 6. Nessuna prova contro CSV reale.

**Sincronizzazione e pubblicazione richieste — 22 ottobre 2026:** integrati senza conflitti tramite fast-forward i commit remoti `b0c602b` (CSV dimostrativo) e `5ebeeaa` (QA e copia storica README). Preservati i file dell'altro lavoro; allineati stato QA e riferimenti README alla Fase 6 e alla prova sintetica remota. Verifica integrata `npm run check` superata su copia senza `.env`: build/lint frontend, check/lint/formato backend, 39 test Deno e 21 Python. Controlli preventivi sui file pubblicabili senza segnalazioni; segreti, stato operativo e cache esclusi da Git. Commit e push su `origin/main` autorizzati esplicitamente dall'utente; esito Git verificato separatamente dopo la pubblicazione.

**Prova successiva richiesta dall'utente — CSV sintetico e Supabase:** target MeteOlivelli verificato, funzioni v3 attive; sei eventi CSV più un evento concorrente salvati via uploader/HTTPS. Retry/ricezione immutata, replay senza duplicati, conflitti, auth, quarantena, flag qualità e sei richieste concorrenti superati. Suite SQL con rollback superata. Rimosse soltanto le sette fixture identificate dal manifesto; zero eventi finali e RLS attiva. [Verbale](docs/backend-csv-verification.md). Nessun codice applicativo modificato, deploy, commit o push; DATA e UP restano aperti per CSV/Windows reali. Prova sintetica remota non equivale a chiusura della Fase 6 sul PC scolastico.

**Frontend Fase 7 — 22 ottobre 2026:** realizzata la dashboard sulla base Figma Obsidian v5, con letture pubbliche senza credenziali, stati espliciti, grafici e cronologia. Verifiche locali e browser in [docs/frontend.md](docs/frontend.md). UI-01 completata localmente; UI-02 provvisoria, WX e collaudo reale ancora aperti. Nessuna scrittura remota o pubblicazione Git/Vercel.

**Pubblicazione e collaudo successivi richiesti — 22 ottobre 2026:** commit `0af54b8` e push completo sul branch `codex/frontend-phase-7`, riferimento remoto verificato. Deploy Git Vercel preview READY sul commit previsto; HTML/JS/CSS/font online autenticati, API reale vuota e 50 campioni CSV intercettati solo nel browser. Otto scenari superati: valori/cronologia esatti, grafici, filtri, reflow, polling e riconnessione; nessun errore JavaScript o asset fallito. Lint e 16 test frontend ripetuti. [Evidenze](docs/frontend-online.md). Nessuna misura simulata salvata in DB o visibile al pubblico, nessun merge/main o promozione; UI-02 resta provvisoria. Runner, verbale ed evidenze aggiunti al lavoro da pubblicare nello stesso branch.

Completati SET-00–SET-04, BE-01–BE-07 sul contratto v1 e UI-01 locale: 13 attività su 29; 16 restano non completate, incluse DATA-01–DATA-03, UP-01–UP-04, UI-00 e UI-02 parziali. La Fase 6 resta aperta per campione/writer e prova Windows. La Fase 7 ha frontend verificato localmente, ma non modello validato o collaudo della catena fisica. Il rilascio complessivo resta aperto. Inserire qui gli esiti futuri senza segreti; lasciare requisiti e decisioni nel piano e bug nel registro correzioni.


## Fase 7 — Rimozione versione dimostrativa e pulizia — 22 ottobre 2026

- [x] Rimossi il selettore e il client DEMO dalla dashboard; eliminati `src/demo.ts` e la funzione Edge locale `read-demo-measurements`.
- [x] Rimosse da Supabase le 50 righe della sorgente isolata `meteolivelli-demo-20261022` e le 6 righe esatte del test uploader nella sorgente `meteolivelli`.
- [x] Eliminata la funzione Edge remota `read-demo-measurements` dal progetto MeteOlivelli; endpoint reale e schema conservati.
- [x] Spostato il CSV browser sintetico sotto `tests/fixtures/`; nessun dato sintetico è caricato dalla UI di produzione.
- [x] `npm run check` superato: lint/build, 16 test frontend, check/lint backend, 39 test Deno e 21 test uploader. La UI locale legge la API reale e mostra archivio vuoto; SQL finale restituisce zero righe per entrambe le sorgenti e l'inventario elenca solo le due funzioni reali.
- [ ] Pubblicare la versione finale su `main`/Vercel dopo verifica dei controlli e diff.

**Esito atteso:** la dashboard legge solo misure reali. Le fixture sintetiche rimangono confinate alle prove e sono etichettate solo nelle evidenze di test.

**Decisione utente del 22 ottobre 2026:** non mantenere un database o una modalità separati per i dati fittizi. Gli eventuali futuri test d'integrazione dovranno scrivere nello stesso database/tabella finali, usando una provenienza sintetica distinguibile e un percorso di lettura che non li presenti come osservazioni della stazione. La protezione di provenienza va implementata e verificata prima di caricare tali righe; le fixture locali restano ammesse per i test unitari.

**Prova uploader precedente:** il programma CLI Python è stato eseguito su macOS contro il fixture sintetico: 6 righe storiche confermate nel database e 1 riga malformata in quarantena. L'esito ha verificato il percorso uploader → endpoint → DB; la prova Windows con Arduino e writer reali resta aperta. Le 6 righe del test sono state poi rimosse nella pulizia qui sopra.

**Restyling Factory — 22 ottobre 2026, Fase 7 / UI-01:** implementazione locale e QA completati. Titolo a sinistra e grafico temperatura a destra su desktop, impilati su mobile. Ultima lettura, qualità e tempi restano espliciti; API vuota e fixture solo browser. Build/lint, 16 test Node e 11 scenari browser superati. Nessun commit, push o deploy. Riferimenti: [piano](plan.md), [verbale](design.md).

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

**Verifiche della revisione locale dei grafici:** `npm run check` superato (20 Node, 41 Deno, 21 Python) e 13 scenari browser, inclusa progressione lineare al 50% e separatori settimanali. Screenshot di collaudo aggiornati in `docs/factory-verification/`; nessun nuovo commit, push o deploy eseguito per questa revisione.

**Fase 7 / UI-01 — Auto e fluidità (revisione locale):** Auto è ora predefinito; legge fino a 30 giorni ancorati all’ultima misura, adatta lo storico breve e oltre sette giorni mostra le ultime sette date disponibili con medie 00–12 / 12–17 / 17–24, notte inclusa nella mattina su indicazione esplicita. Null/sospetti esclusi per campo, fasce vuote interrompono la linea, cronologia originale conservata. Curve lineari in 700 ms dopo 60 ms e ingressi in 420 ms. Nessuna scrittura DB, commit/push o nuova pubblicazione eseguiti in questa revisione.

**Verifica Auto locale:** `npm run check` superato (26 Node, 41 Deno, 21 Python), 14 scenari browser superati, inclusi Auto predefinito, 21 medie per fascia su serie lunga e cronologia originale. Resta una modifica locale non pubblicata.

**Pubblicazione revisione grafici/Auto — 22 ottobre 2026:** l’utente richiede commit e push su `main` delle modifiche locali già verificate: maschera lineare, scala temporale, Auto predefinito e medie per fascia. Ultimi controlli: `npm run check` (26 Node, 41 Deno, 21 Python), 14 scenari browser e diff senza errori. Target Git confermato, branch allineato prima del commit; deploy automatico Vercel da verificare dopo il push. Le precedenti note “locale/non pubblicata” descrivono lo stato prima di questa richiesta.


**23 ottobre 2026 — Fase 7 / UI-01 e batch sintetico:** su richiesta utente corretta localmente la richiesta Auto: normalizzazione UTC di `until` da timestamp PostgreSQL, arrotondamento in alto dei microsecondi per includere l’ultimo campione e conservazione della finestra fra polling invariati. Umidità e pressione compatte accanto alla temperatura iniziale. Nel database autorizzato aggiornati i cinque sintetici e aggiunti altri cinque: batch `ui-preview-20261023-ten-six-hour`, 10 record ogni 21600 secondi dal 21 ottobre 00:00 al 23 ottobre 06:00 Europe/Rome. Questa decisione supera il precedente vincolo di mantenere invariati i cinque campioni. Tutti restano `synthetic`, senza data fisica; postilla conservata. `npm run check` superato (27 Node, 42 Deno, 21 Python); 14 scenari browser di regressione superati. Nessun commit, push o deploy frontend eseguito. Dettagli in `docs/data-preview.md` e `docs/frontend.md`.


**23 ottobre 2026 — Fase 7 / WX-01–WX-02, prima implementazione:** motore statistico v1 con persistenza, trend smorzato e ciclo 24h; selezione temporale separata dalla verifica, ammissione solo di date fisiche reali e stati indisponibili per singolo campo/orizzonte. Orizzonti +30m, +1h, giornata definita esplicitamente come punto a +24h. Worker browser, storico fisico 30g indipendente dai filtri, cache per input, scadenza/errori/cleanup e metodo/MAE/provenienza in UI. Specifica e parametri in `docs/backend.md`. Nessun modello meteorologicamente validato: i dieci sintetici rimangono esclusi. Nessuna spunta completa per WX-01/WX-02; server condiviso, archivio e valutazione su osservazioni reali restano aperti. Nessuna operazione remota.


**Verifica WX locale — 23 ottobre:** `npm run check` (41 Node, 42 Deno, 21 Python), sette scenari browser del modello/worker e 14 regressioni frontend superati. API reale `measured_at` senza campioni; nove stime indisponibili e quattro grafici osservativi verificati. Esiti e schermate in `docs/forecast-verification/`. Attendibilità reale e pubblicazione restano non completate.


**23 ottobre 2026 — Google Analytics:** su richiesta esplicita aggiunto localmente il tag `G-F2LRCD93NW`, bloccato fino al consenso facoltativo; rifiuto e revoca disponibili, segnali pubblicitari disattivati. Le integrazioni Vercel Analytics/Speed Insights già attive restano indipendenti. Build/lint/test frontend superati; interazioni browser e Tag Assistant da verificare dopo una distribuzione autorizzata. Aggiornare l’informativa privacy prima del rilascio. Nessuna modifica remota o pubblicazione eseguita.


**Pubblicazione richiesta — 23 ottobre 2026:** l’utente autorizza commit e push di tutte le modifiche locali: correzione Auto, misure secondarie nella hero, motore previsionale sperimentale, test/evidenze e documentazione. Target verificato `main` → `origin/main`, repository `pgiudici13/MeteOlivelli`, allineato dopo fetch. Le note precedenti “locale/non pubblicato” descrivono lo stato prima di questa autorizzazione. Il push avvia il deploy Git Vercel; la validazione meteorologica reale resta aperta e i sintetici restano esclusi dalle previsioni.

**23 ottobre 2026 — Fase 6 / prova uploader sintetica:** aggiunta modalità esplicita `acquisition_kind: synthetic`, con `captured_at` assegnato sul PC, `measured_at: null` e provenienza `_provenance.kind: synthetic` congelata nell’outbox. Parser/endpoint verificano il marcatore; il vincolo DB remoto già applicato supporta questa forma. `npm run check` superato (41 test frontend, 43 Deno, 23 Python). Il target remoto verificato contiene 10 righe sintetiche prima della prova. Deploy aggiornato di `ingest-measurement` respinto da auto-review perché sostituisce una funzione pubblica; il token locale `STATION_INGEST_TOKEN` inoltre non è presente nell’ambiente controllato. Nessuna riga aggiunta e nessun deploy eseguito. Restano da autorizzare esplicitamente il deploy e da predisporre il token nell’ambiente protetto; nessun dato reale o CSV/writer Windows verificato.
