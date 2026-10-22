# Piano di progetto — MeteOlivelli

> **Stato:** bozza di pianificazione, da rivedere prima delle decisioni architetturali definitive.
> **Lingua del progetto:** italiano per interfaccia e documentazione; inglese per identificatori e messaggi Git.
> **Ultimo aggiornamento:** 21 ottobre 2026.
> **Fonti:** repository locale; piano originale `piano.md` (491 righe, integrato in questa roadmap); richiesta iniziale, risposte Q1–Q35 e successivo chiarimento del 21 ottobre 2026 su scadenza, flusso dati e previsioni. La fonte duplicata è stata rimossa su richiesta Q35 dopo il trasferimento dei contenuti utili.
> **Ambito corrente:** setup generale locale SET-00–SET-04 eseguito su richiesta dell’utente. Configurazione, runtime e controlli backend predisposti; nessuna ingestione applicativa, migrazione, modifica remota, commit o push.

## Come leggere e mantenere il piano

- **Fatto verificato (F):** dimostrato nell'ispezione locale, con fonte nella sezione 4. Una verifica locale non dimostra lo stato dei servizi remoti.
- **Informazione dell'utente (U):** vincolo o richiesta esplicita nella conversazione attuale. Include i tre documenti richiesti, la tutela del lavoro locale e dei segreti, il divieto iniziale di implementazione nella fase documentale e quello di modifiche remote non richieste. In seguito l’utente ha autorizzato il setup generale locale, mantenendo separati gli interventi successivi.
- **Contesto ereditato (C):** affermazione contenuta in `piano.md`, senza prova indipendente disponibile in questa attività. Va confermata dall'utente o da evidenze; non viene attribuita automaticamente a una sua dichiarazione diretta.
- **Ipotesi/proposta (I):** soluzione da valutare. Tutta l'architettura candidata e i nomi dei campi da progettare appartengono a questa categoria.
- **Decisione (D):** scelta registrata con stato, esito, fonte e dipendenze; quelle aperte devono essere chiuse prima della fase dipendente. Il registro, con stato ed esiti, è nella sezione 11.

Gli obiettivi e i comportamenti delle sezioni successive sono requisiti del piano, non capacità già implementate. Nessun nome di campo concettuale implica l'esistenza di una tabella, di una colonna o di un sensore verificato.

`plan.md` è l’unica roadmap, come richiesto dall’utente in Q35. `piano.md` è stato rimosso dopo integrazione: i riferimenti al suo contenuto qui sotto sono storici e non collegamenti a un file ancora presente. `AGENTS.md` contiene le regole operative stabili; `CORRECTIONS.md` contiene esclusivamente problemi confermati o segnalati.

La checklist esecutiva è [tasks.md](tasks.md): traduce questo piano in attività ordinate, dipendenze, istruzioni e criteri di completamento. Non sostituisce requisiti e decisioni di questo documento. Il 21 ottobre 2026 l’utente ha prima richiesto la checklist e poi l’esecuzione del setup generale. SET-00–SET-04 sono ora completati, con esiti e limiti registrati; il backend applicativo resta da realizzare.

## 1. Scopo

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
| RF7 | Funzionale | Previsioni separate per +30 minuti, +1 ora e giornata, con fonte, intervallo di validità, ultimo recupero e stato indisponibile; non derivate arbitrariamente dai tre sensori |
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
5. **Non indovinare il CSV.** L’esempio fornito è illustrativo; delimitatore, intestazioni, formato decimale, scrittura e contenuto effettivo devono essere verificati su un file reale.
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
- Tutti i task di setup sono specificati con scopo, file/input, procedura, verifiche ed esito; i 23 task applicativi successivi restano non completati. Il codice frontend e le configurazioni remote sono invariati.

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

Provider previsioni ── lettura/cache previsionale separata ── frontend
                     (località, fonte e tempi espliciti)

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
| Fonte previsionale (I) | Fornire una previsione per la località, indipendente dal CSV | Fonte esterna proposta; nessuna misura del provider presentata come osservazione della scuola; licenza, risoluzione e località da validare |
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
- Per lo storico per data usare solo istanti di misura ammessi dalla policy di qualità; mostrare separatamente record senza orario. Un'eventuale vista per data di ricezione deve dichiarare questa semantica. Non mescolare in silenzio i due assi temporali.
- Un calo dell'uptime è un indizio di reset, overflow, riordino o file riscritto, non una prova sufficiente. Conservare valore grezzo e contesto; non cancellare record precedenti e non riusare identità di eventi.
- Se il firmware fornisce un'identità di avvio verificabile, usarla per delimitare le sessioni. In alternativa progettare sessioni locali con evidenze e stato di incertezza; una semplice crescita del contatore dopo una pausa non esclude un riavvio non osservato.
- Ricostruire tempi da uptime solo con ancoraggio attendibile nella stessa sessione e ipotesi documentate su clock, drift e overflow. Non trasformare l'uptime in Unix time, non sommarlo a `received_at`, non inferire ore storiche dal solo ordine delle righe o dall'ultima modifica del file.
- Testare riavvio Arduino, solo riavvio PC/uploader, reset durante offline, ripetizione degli stessi valori/uptime e possibile overflow. Firmware, frequenza reale e rappresentazione del contatore restano da verificare.

### Previsioni: requisito aggiunto e proposta tecnica

**U:** mostrare la mezz’ora successiva, l’ora seguente e una sintesi della giornata. **I:** usare un provider meteo esterno; le letture circa orarie di temperatura, umidità e pressione non sono in questa attività un modello previsionale validato. Nessuna previsione generata tramite formule improvvisate o attribuita ai sensori della scuola.

**Candidato proposto: Open-Meteo**, senza integrazione o chiamate al servizio dati in questa attività. La documentazione ufficiale descrive serie orarie, giornaliere e a 15 minuti; queste ultime possono essere interpolate da dati orari a seconda dell’area e della variabile. Occorre validare coordinate, copertura effettiva e risoluzione del modello per la località scolastica; non si presume un nowcasting locale nativo. [Fonte: documentazione Open-Meteo, consultata il 21 ottobre 2026](https://open-meteo.com/en/docs).

Il servizio gratuito è subordinato alle condizioni di uso non commerciale, alle quote e alla licenza con attribuzione. Verificare che l’uso effettivo scolastico/open day rientri nelle condizioni, senza assumere che qualsiasi attività promozionale sia automaticamente inclusa. Non è stata scelta una sottoscrizione né attivato alcun servizio. [Fonte: termini Open-Meteo, consultati il 21 ottobre 2026](https://open-meteo.com/en/terms).

| Area UI | Contratto proposto e criterio di accettazione |
|---|---|
| Prossimi 30 minuti | Finestra esplicita riferita all’ora corrente; usare passi disponibili sufficientemente fini, dichiarando eventuale interpolazione. Non presentare un campione distante come previsione esatta a +30 minuti |
| Ora successiva | Finestra e validità chiare; selezionare la serie coerente e indicare se si mostra un istante o un aggregato. Niente arrotondamento temporale nascosto |
| Giornata | Sintesi sul giorno civile Europe/Rome: condizioni e, se disponibili, min/max e pioggia previsti. Non confondere intera giornata con sole ore residue |
| Fonte indisponibile | Misure della stazione continuano a funzionare; indicare previsioni non disponibili oppure cache con età e limite. Nessun fallback a valori inventati |

Campi interni concettuali da progettare, separati dalle misure: `provider`, coordinate/località, `fetched_at` (recupero), `issued_at` se realmente fornito dal provider (non inventarlo), `valid_at` o intervallo di validità, unità e metodo/risoluzione. Non confondere questi tempi con `measured_at`/`received_at`. Nell’MVP basta valutare una cache breve e controllata, senza archiviare permanentemente tutti i run previsionali se non serve; il requisito di storico permanente riguarda i dati della stazione.

Proposta di UI minima: “Misure della stazione” e “Previsioni per la località”, con temperatura e condizioni previste, pioggia se disponibile e sintesi giornaliera; vento o altre grandezze eventuali sono dati del provider e non nuovi sensori dichiarati. Nomi precisi delle variabili da confermare sul payload reale. Nessun invio del CSV al provider necessario per questa proposta.

## 7. Fasi di lavoro

Le fasi sono ordinate per dipendenza. Ogni fase deve lasciare il repository in uno stato comprensibile e verificabile. Le fasi con decisioni esterne sono punti di revisione: non proseguire assumendo le risposte mancanti.

### Fase 0 — Revisione iniziale e baseline

**Attività**

- Registrare stato Git e modifiche locali preesistenti.
- Esaminare package, lint, TypeScript, HTML, README, `.gitignore` e configurazioni Vercel senza stampare segreti.
- Verificare che `.env.local` e credenziali non siano tracciati.
- Stabilire i comandi di baseline (`npm run build`, `npm run lint`) e salvare gli esiti.
- Inventariare dipendenze inutilizzate e struttura attuale senza aggiungere librerie non motivate.

**Completamento**

- Stato iniziale documentato, modifiche preesistenti conservate, nessun segreto divulgato.
- Problemi preesistenti separati dai problemi introdotti successivamente.

### Fase 1 — Specifica funzionale e decisioni minime

**Attività**

- Convertire questo documento in decisioni approvate/respinte/da chiarire.
- Definire metriche, range fisici accettati, frequenza attesa, soglia di stazione non aggiornata e semantica del fuso orario.
- Applicare la scelta U: consultazione pubblica dei dati meteo, nessun account/profilazione né download; selezionare le sole colonne da esporre e mantenere privati i metadati interni.
- Concordare cosa significa “online/offline” quando non esistono ancora dati o la frequenza non è rispettata.
- Identificare responsabili e accesso consentito all’eventuale storage backup scolastico.

**Completamento**

- Decisioni minime registrate in questo piano o in una specifica collegata.
- Nessuna migrazione o chiave creata in questa fase.

### Fase 2 — Contratto di acquisizione e campione CSV

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

### Fase 3 — Progettazione schema, accessi e retention

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

### Fase 4 — Endpoint di ingestione

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

### Fase 5 — Uploader Python per Windows

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

### Fase 6 — Interfaccia e lettura dei dati

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

**Organizzazione confermata dall'utente:** il 22 ottobre 2026 i due studenti resteranno a scuola per una sessione congiunta di circa **due ore**. Prima della sessione, il compagno installerà/aprirà Figma e verrà creato un file di progetto, nome proposto **MeteOlivelli — Dashboard**. L'installazione, il file e la sessione sono **previsti, non ancora completati**.

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

### Fase 7 — Backup, migrazione e ripristino

**Livelli minimi richiesti**

1. **Database online:** Supabase/PostgreSQL per le interrogazioni del sito.
2. **Sorgente locale:** CSV originale completo sul computer scolastico, mantenuto secondo le regole concordate.
3. **Backup indipendente:** esportazione periodica cifrata/controllata su storage separato, autorizzato dalla scuola e con credenziali distinte.

**Da decidere**

- Proprietario dello storage e modalità di ripristino: l’utente è responsabile del progetto; si propone come possibile esecutore del restore, da confermare (Q26).
- Frequenza, retention, cifratura, verifica automatica del completamento e gestione dei fallimenti.
- Formato di esportazione portabile (ad esempio dump PostgreSQL e/o CSV versionato).
- Ripristino in ambiente separato senza sovrascrivere i dati correnti.
- Procedura per confrontare conteggi, range temporali, duplicati e valori tra backup e database ripristinato.
- Obiettivi realistici di perdita massima (RPO) e tempo di recupero (RTO) compatibili con costo zero.

**Regola di validità**

Un job “riuscito” o un file presente non dimostra che il backup sia ripristinabile. Prima del rilascio documentare almeno un restore di prova e la verifica dei dati recuperati. Pianificare poi prove periodiche.

### Fase 8 — Rilascio ed esercizio del sito per scuola/open day

- Verificare target e scope Vercel, variabili ambiente e domini prima di ogni operazione.
- Usare preview deployment per revisione; la pubblicazione di produzione richiede esplicita decisione del proprietario del progetto.
- Monitorare errori ingestione, ritardo dati e spazio/quote senza registrare segreti.
- Documentare runbook per sensore fermo, uploader fermo, credenziale revocata, database non disponibile e restore.
- Consegnare il sito per scuola/open day con breve descrizione del progetto e dei limiti delle misure. Nessuna relazione, slide o presentazione separata richiesta (U: Q34).
- Riesaminare costi e condizioni dei piani periodicamente.

### Dipendenze, risultati attesi e criteri di uscita

Il setup generale locale SET-00–SET-04 è stato eseguito su richiesta dell’utente. Le fasi applicative successive restano future; il loro piano non autorizza automaticamente operazioni remote o migrazioni.

| Fase | Dipende da | Risultato concreto | Criterio di completamento |
|---|---|---|---|
| 0 — Baseline | Repository disponibile | Inventario, stato Git, esiti e limiti dei controlli | Ispezione locale e baseline completate; verifica remota rinviata ed esplicita, nessun segreto letto |
| 1 — Specifica | 0 e risposte dell'utente | Perimetro MVP, metriche, accessi, responsabili e criteri misurabili concordati | Decisioni minime registrate senza trasformare ipotesi in fatti |
| 2 — Contratto | 1, CSV reale, descrizione del writer | Specifica CSV e payload versionato; regole di tempo/reset/reimportazione; esempi reali depurati e fixture etichettate | Ogni campo e caso limite ha semantica e comportamento concordati; nessun parser definitivo prima del campione |
| 3 — Schema/accessi | 2 e decisioni su pubblico/retention | Disegno dati, vincoli, chiavi, indici, matrice ruoli/RLS e stima volumi/costi | Revisione tecnica dello schema e del modello di accesso; successiva richiesta esplicita prima di applicare migrazioni |
| 4 — Ingestione | 3 e autorizzazione alla specifica implementazione | Endpoint documentato e prove su ambiente separato autorizzato | Validazione, autenticazione, concorrenza, conflitti e retry verificati; nessun segreto client; schema applicato solo se richiesto |
| 5 — Uploader | 2, contratto 4 stabile, vincoli Windows | Uploader, outbox durevole, guida installazione/avvio/diagnosi | Crash/restart, offline, reset, rotazione e risposte parziali recuperabili senza perdite dei dati già persistiti o duplicati |
| 6 — Frontend | 1; per misure reali anche 2–4; previsioni anche località/provider validati | Dashboard, aggiornamento automatico, grafici e tre orizzonti previsionali distinti | Build/lint, accessibilità, confronto con sorgenti; latenza osservabile; previsioni con fonte e validità, errori indipendenti |
| 7 — Backup/restore | 3, storage e responsabili approvati | Runbook, esportazioni indipendenti, retention, verbale di restore | Restore separato riuscito entro obiettivi concordati, con integrità e accessi verificati; responsabilità trasferibile |
| 8 — Esercizio/rilascio | 4–7, accettazione e richiesta di pubblicazione | Checklist rilascio, istruzioni essenziali di gestione e sito per scuola/open day | Flusso completo verificato, restore provato, quote/condizioni ricontrollate, decisioni bloccanti chiuse e autorizzazioni esplicite |

La UI con stati vuoti può essere progettata dopo la fase 1, senza presumere schema o usare misure dimostrative non dichiarate. La progettazione dei backup parte dalla fase 3 e non deve aspettare la perdita di dati. Nessuna pubblicazione prima della fase 7 completata.

### Sequenza accelerata per la consegna della prossima settimana (proposta)

Finestra richiesta: **26 ottobre–1 novembre 2026**, interpretata rispetto al 21 ottobre; non è una promessa di completamento o una data già concordata per la pubblicazione. Ridurre il lavoro al flusso essenziale, senza saltare autenticazione, unicità, timestamp e prova di recupero. Non iniziare l’implementazione in questa revisione.

1. **Prima del parser/schema definitivo:** acquisire un campione reale e osservare writer/seriale sul PC; identificare località previsioni e verificare permessi, clock e riavvio automatico. Se il campione manca, il flusso reale non è dichiarabile pronto.
2. **In parallelo come attività indipendenti, dopo richiesta di implementazione:** UI italiana con stati vuoti e grafici; validazione del provider e dei tre orizzonti su località reale. Nessun dato simulato non marcato.
3. **Catena minima reale:** endpoint autenticato, vincolo idempotente e outbox persistente; una misura nuova attraversa PC → DB → pagina aperta. Preferire lettura incrementale delle righe al caricamento ricorrente dell’intero CSV.
4. **Accettazione prima del rilascio:** CSV reale confrontato con DB/UI, retry senza duplicati, rete assente e ripresa, UI senza reload, previsioni mancanti/vecchie, separazione fonti, copia indipendente con restore minimo, build/lint e test critici.
5. **Rifinitura e rilascio autorizzato:** layout mobile/open day, testi, crediti del provider e breve guida per l’utente. Rimandare confronti avanzati, account/download già esclusi, modelli previsionali propri e automazioni non necessarie.

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
- fuso orario di visualizzazione (probabilmente `Europe/Rome`, con dati memorizzati in UTC);
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
- Evitare IP, nomi, account o percorsi del PC nei log se non necessari. Nessun account visitatore, profilazione o tracciamento analitico aggiunto al sito; accessi tecnici e log infrastrutturali vanno distinti e minimizzati.
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

Per le tabelle esposte progettare RLS e provarla con i ruoli effettivi, includendo rifiuto di insert/update/delete non autorizzati e assenza di bypass tramite viste/funzioni. Nessuna verifica delle policy remote è stata effettuata. [Riferimento: RLS Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security).

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

Esiti al 21 ottobre 2026, fonte risposte dell’utente Q1–Q35. “Deciso (U)” indica una scelta dichiarata, non una configurazione implementata o un’autorizzazione a intervenire sui servizi.

| ID | Tema | Stato / esito | Verifica o dipendenza residua |
|---|---|---|---|
| D1 | CSV e writer | Aperto: campione assente; append probabile, file mai cancellato (U) | Campione reale, writer, encoding, separatori, intestazioni e comportamento file prima del parser |
| D2 | Tempo misura | Scelta delegata: storico senza date conservato e fuori dai grafici per data; timestamp locale per nuove acquisizioni proposto | Clock, buffering e punto di acquisizione da validare; non equiparare ricezione a misura senza evidenze |
| D3 | Identità eventi | Aperto | Progettare chiave persistente per retry/reset/reimportazione |
| D4 | Lettura dati | Aperto tecnicamente; pubblico read-only deciso | Scegliere accesso diretto limitato o endpoint, con RLS/privilegi verificati |
| D5 | Sensori e validità | Parziale: °C, %, hPa confermati (U) | Modelli, precisione, sentinelle e pressione assoluta/corretta mancanti |
| D6 | Backup | Aperto: PC/GitHub/Vercel/Supabase indicati come candidati | Scegliere vera copia indipendente, destinazione/permessi, capacità e restore; non dedurre un upload autorizzato |
| D7 | Responsabile credenziali/PC | Deciso (U): utente responsabile e custode | Custodia concreta, procedura revoca e diritti tecnici Windows da verificare |
| D8 | Ritardo | Deciso (U): oltre 20 minuti dalla misura successiva attesa | Validare cadenza/ancoraggio e testare esattamente la soglia; non confondere arrivo con misura |
| D9 | Budget/quote | Deciso (U): 0 € | Quote attuali, volumi, tolleranza ai fermi e comportamento a limite esaurito ancora aperti |
| D10 | Retention | Deciso (U): CSV/storico permanenti | Capacità e copie sostenibili; retention log/quarantena/versioni backup aperta |
| D11 | Download pubblico | Deciso (U): escluso | Esportazioni amministrative per backup ammesse come requisito tecnico, non download per visitatori |
| D12 | Fuso UI | Deciso (U): Europe/Rome | Memorizzazione UTC proposta; test DST e provenienza del timestamp |
| D13 | Sessioni Arduino | Parziale: GIGA R1 dichiarato (U) | Firmware, rollover, reset e riordino da verificare |
| D14 | Replay/perdita stato | Aperto | Registro identità e procedura di riconciliazione, prima dell’import storico |
| D15 | Vincoli Windows | Parziale: PC dedicato/adattabile, installazione consentita (U) | Append, attività continua, avvio senza login, proxy, spazio e permessi effettivi da provare |
| D16 | Anomalie | Deciso (U): conservare e segnalare | Definire flag e sentinelle; isolare righe non interpretabili senza perderne l’originale |
| D17 | Recupero/offline | Aperto | RPO/RTO e durata offline non indicati; nessun valore assunto come approvato |
| D18 | MVP/scadenza | Deciso (U): pronto settimana prossima; misure/grafici/stato, aggiornamento automatico e previsioni +30m/+1h/giornata | Finestra interpretata 26 ottobre–1 novembre 2026; giorno preciso non indicato; dati reali e nuovo requisito previsioni condizionano la consegna |
| D19 | Gestione/continuità | Utente responsabile; chiusura complessiva ipotizzata a dicembre (U), non confermata | Data e perimetro della chiusura da decidere allora; nessuna cancellazione o spegnimento implicito, storico da preservare |
| D20 | Roadmap unica | Deciso (U: Q35): tenere solo plan.md | Fonte piano.md rimossa dopo integrazione dei contenuti utili |
| D21 | Avvisi al responsabile | Destinatario deciso (U): utente; canale aperto | Scegliere canale e permessi senza introdurre account visitatore o servizi a pagamento |
| D22 | Design/presentazione | Deciso (U): sito curato per scuola/open day, niente slide o relazione | Proposta visiva da valutare; blu notte non obbligatorio; buone pratiche accessibilità di base |
| D23 | Previsioni | Richieste (U): mezz’ora, ora successiva e giornata; proposta fonte esterna Open-Meteo | Località, copertura/risoluzione, campi, condizioni d’uso, cache e attribuzione da validare prima del collegamento |
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
| Scadenza ravvicinata e CSV ancora assente | Impossibile validare il flusso reale in tempo | Campione/writer come prima dipendenza; UI/provider possono essere progettati separatamente senza spacciare simulazioni per funzionamento |
| Previsioni confuse con misure | Attribuzione falsa alla stazione | Sezioni e tempi distinti, fonte e interpolazione dichiarate, nessuna previsione inventata |
| Provider indisponibile o senza risoluzione utile | Orizzonte di mezz’ora fuorviante | Verifica località/modello, cache etichettata e stato indisponibile indipendente dalle misure |
| Chiusura a dicembre interpretata come cancellazione | Perdita dello storico permanente | Conferma esplicita di data/perimetro, copia e restore verificati prima di arresti o revoche |

## 13. Test e verifiche previste

### Verifiche frontend

- Build TypeScript/Vite e lint.
- Layout mobile/desktop, focus, tastiera, contrasto e riduzione animazioni.
- Dataset vuoto, reale, obsoleto, errore HTTP e recupero dopo errore.
- Nessuna misura segnaposto presentata come reale.
- Query e fusi orari ai limiti di giorno/settimana e ora legale.
- Nuovo evento nel DB visibile sulla pagina già aperta senza reload; misurare ritardo, ripresa dopo disconnessione e assenza di falsi record.
- Previsioni +30m/+1h/giornata: selezione intervalli al cambio ora/giorno e DST, distinzione istante/accumulo, fonte/validità, risoluzione/interpolazione, risposta mancante e cache scaduta. Fallimento provider non nasconde le misure.
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

Il progetto è pronto per essere considerato un setup completo solo quando:

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

Il setup generale SET-00–SET-04 è completato. Per il prossimo intervento seguire [tasks.md](tasks.md#9-da-dove-ripartire-dopo-la-revisione-insieme): bozza DATA-02/DATA-03 e validazione BE-01. Il modulo di configurazione e i suoi test non completano la validazione delle misure; chiudere parser/schema dipendenti dai dati soltanto con campione reale.

La baseline locale della fase 0 è completata nei limiti della sezione 4. L’MVP della fase 1 è ora definito: sito pubblico per scuola/open day, ultimi valori, grafici 24h/7g/30g, aggiornamento automatico, previsioni +30 minuti/+1 ora/giornata, stato con tolleranza di 20 minuti oltre l’atteso, niente account/profilazione/download. Consegna richiesta settimana prossima, finestra interpretata 26 ottobre–1 novembre 2026; eventuale chiusura a dicembre ancora incerta. Non riproporre come aperte queste scelte.

Prima di parser e schema definitivi serve il campione reale, oggi non disponibile, e una breve osservazione del writer/seriale. La disponibilità a modificare il PC permette di progettare un timestamp locale per le nuove righe, ma non rende automaticamente noto l’orario delle misure storiche. Possibile progettare in seguito la UI con stati vuoti, senza inventare dati o iniziare ora l’implementazione.

Dipendenze residue prioritarie: campione CSV/writer, località esatta per validare le previsioni, destinazione della copia indipendente e procedura minima di recupero; canale delle notifiche. Trattamento storico senza date scelto tecnicamente su delega; chiusura a dicembre da confermare solo quando concreta. Se non noti, diventano attività esplicite, non default approvati. Migrazioni, installazioni, pubblicazione e altre modifiche remote richiedono comunque richiesta esplicita.

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
- **Nuovo requisito U:** previsioni per mezz’ora successiva, ora dopo e giornata. Fonte esterna proposta e verifiche richieste nella sezione 6; nessun modello locale validato o previsione reale già ottenuta.

### Questioni residue e attività di verifica

1. **Campione CSV e writer:** da ottenere appena disponibile per completare contratto, tempo e parser; non ripetere ora la richiesta di un file che l’utente non ha con sé.
2. **Località previsionale:** confermare posizione o indirizzo della stazione scolastica; Pavia è il contesto del README, non coordinate già verificate. Validare il provider prima di promettere risoluzione utile a mezz’ora.
3. **Backup minimo e avvisi:** restano aperti destinazione indipendente, recupero e canale verso l’utente; proporre una soluzione essenziale compatibile con 0 € e permessi reali.
4. **Fine esercizio:** non chiedere nuovamente se Natale sia la consegna; è già chiarito che la consegna è settimana prossima. Confermare data/perimetro della chiusura solo prima di eseguirla, senza cancellare dati per deduzione.

La scadenza è un obiettivo, non prova di fattibilità della catena reale senza campione e verifiche. Questa raccolta di requisiti era documentale. Il setup successivo ha predisposto runtime/configurazione locale e test; restano non implementati ingestione, collegamento applicativo, migrazioni, previsioni e deploy.
