# Backend v1 — schema, accessi e verifica

> **Aggiornamento 24 ottobre:** il tipo applicativo `synthetic` è distinto; il batch pubblico corrente comprende 241 campioni amministrativi ogni tre ore, in sostituzione dei record presenti; [contratto ed evidenze](data-preview.md). Le descrizioni storiche dei soli tipi live/historical sotto sono precedenti agli aggiornamenti sintetici.

Specifica locale del blocco 5 di `tasks.md`, 22 ottobre 2026. Usa il contratto JSON
v1; il CSV e il writer reali restano da verificare. Dopo preparazione e scelta
esplicita dell’utente, schema ed endpoint sono stati applicati al progetto esistente
MeteOlivelli: [verbale e limiti BE-07](backend-verification.md).

## Disegno revisionato prima dell'implementazione

Una sola tabella `public.station_measurements`: sorgente, UUID evento, versione,
uptime, tre numeri `double precision` nullabili, tipo di acquisizione, istanti
`captured_at`/`measured_at` nullabili e `received_at` assegnato dal DB. Conserva
anche payload normalizzato, testo JSON originale accettato e flag qualità con
versione. Il CSV originale resta sul PC: non è contenuto nel contratto HTTP v1.
Non si deducono sessioni Arduino.

Chiave primaria `(source_id, ingestion_id)`, senza unicità su uptime o valori.
Indici parziali per `(source_id, captured_at, ingestion_id)` dei soli eventi live
e per `(source_id, measured_at, ingestion_id)` datati. Lo storico non datato rimane
archiviato; un import storico non diventa l'evento live corrente.

## Area amministrativa `/data` — rilascio 27 ottobre 2026

La route non compare nella navigazione ed è `noindex`, ma l'URL non è una misura
di sicurezza. Il browser chiede la password; l'Edge Function
`manage-measurements` la verifica sul server tramite `METEOLIVELLI_ADMIN_PASSWORD`.
Il browser la mantiene solo in memoria durante la sessione e non la scrive in
localStorage. La funzione espone soltanto le righe della sorgente configurata,
limita la lista alle 100 più recenti e accetta inserimento, correzione e rimozione.
Non espone la chiave service role. La password deve essere un segreto casuale di
almeno 24 caratteri; l'handler limita i tentativi per IP nell'istanza Edge e
controlla l'origine browser consentita.

La migrazione `20261027113158_admin_measurement_writes.sql` concede UPDATE/DELETE
solo a `service_role`, crea RPC invoker non pubbliche e una tabella di audit che
registra ID, azione e istante (non i valori precedenti). La cancellazione rimuove
la misura dalla tabella primaria; l'audit conserva solo l'identificativo e il
fatto che sia stata eliminata. L'inserimento manuale produce una riga `historical`;
chiede esplicitamente il contatore Arduino richiesto dal contratto attuale e
accetta la data fisica solo se digitata. La funzione non crea `captured_at`. Una
correzione aggiorna il payload normalizzato e i flag qualità, lasciando intatto
`raw_payload` come prova del record originariamente ricevuto.

La migrazione è stata applicata al progetto MeteOlivelli e la Edge Function è
`ACTIVE` v1. `METEOLIVELLI_ADMIN_PASSWORD` non è ancora configurata: perciò le
richieste operative rispondono 503 e la pagina non consente ancora accesso.
Rimane necessario impostare il segreto dal pannello Supabase, controllare il
dominio CORS effettivo e verificare login/CRUD con una riga di prova approvata.
Il conteggio tentativi è in memoria per istanza e si azzera con il riavvio; non
è un limite durevole contro attacchi distribuiti.

L'RPC `ingest_station_measurement` esegue INSERT ON CONFLICT DO NOTHING e, in un
comando successivo della stessa funzione VOLATILE, legge il record già commesso:
la seconda lettura evita il problema di snapshot di una singola CTE concorrente.
Confronta JSONB normalizzato, senza flag o tempi server. Restituisce accepted,
duplicate o conflict; il retry non aggiorna dati, qualità o primo received_at.
Una risposta HTTP conferma solo dopo la risposta riuscita della transazione RPC.

## Matrice di accesso

| Attore | Accesso |
|---|---|
| Visitatore / anon / authenticated | Nessun privilegio su tabella o RPC; solo GET pubblico della Edge Function di lettura |
| Uploader | POST HTTPS con token dedicato e sorgente associata; nessuna credenziale DB |
| Edge Function | `SUPABASE_SERVICE_ROLE_KEY` solo nel runtime server; SELECT/INSERT sulla tabella, EXECUTE sulle due RPC |
| Amministratore DB | Accesso amministrativo separato, non disponibile al browser o al PC uploader |

RLS abilitata, senza policy per visitatori. Revoche esplicite anche per funzioni
(EXECUTE è altrimenti pubblico). RPC SECURITY INVOKER con search_path vuoto;
nessuna vista o SECURITY DEFINER. Il ruolo service_role bypassa RLS ed è una
credenziale potente dell'intero progetto: è scelto per l'RPC PostgREST nativo,
limitando i grant della tabella a SELECT/INSERT, ma non è un ruolo isolato per
singola sorgente. Non modifica privilegi di altri oggetti. Se il progetto ospiterà
altri dati, rivalutare un ruolo dedicato e connessione server prima di ampliarli.

`verify_jwt = false` per entrambe le funzioni: ingest autentica il token opaco
nell'handler; read è intenzionalmente pubblico. La chiave service_role non viene
inoltrata dall'uploader. I segreti mancanti impediscono il servizio; errori esterni
non vengono copiati in risposta o nei log. Rotazione: sostituire token sul server
e poi sul PC fermato; i retry conservano identità e payload. Non generare segreti
nei documenti o con comandi che li stampano.

## Lettura pubblica v1

GET `read-measurements?view=latest`: ultimo evento live ordinato per captured_at e
UUID, tutte e tre le schede appartengono allo stesso evento (null e sospetti inclusi).

GET `read-measurements?view=history&period=24h|7g|30g&basis=captured_at|measured_at` per le serie temporali; `period=all&basis=captured_at` è riservato alla cronologia completa e include anche i record privi di `captured_at`.
serie cronologica, limiti [inizio, fine], `limit` 1–500 (default 100), `until` UTC
opzionale, `cursor` opaco restituito dal server. Default basis captured_at, con
etichetta «ora di acquisizione sul PC»; measured_at è una serie distinta. Le righe
sospette sono restituite con flag, non interpolate né corrette: il frontend deve
escluderle dalla linea principale per campo e renderle consultabili. Colonne
pubbliche: ingestion_id, tre valori/unità implicite nei nomi, captured_at,
measured_at, received_at, qualità; mai raw_payload, payload o uptime.

Il cursore incorpora periodo, base, fine finestra e coppia (tempo, UUID); per `all` il tempo è `captured_at` oppure, solo per ordinare record senza acquisizione, `received_at`. Il valore ricevuto non viene presentato come ora della misura. Non può essere riusato per un'altra query. La finestra non scorre durante la
paginazione. Non è uno snapshot MVCC tra richieste: acquisizioni concorrenti con
orario arretrato possono comparire solo nella rilettura completa della finestra.
Nessun cursore di polling su received_at è promesso: l'ordine di commit può essere
diverso dall'ordine dei timestamp. UI-02 dovrà rileggere la finestra per riconciliare
le novità. `period=all` consente la lettura paginata dello storico completo senza
limite temporale; non è un endpoint di esportazione.

Il server fissa source_id dalla configurazione; query sconosciute, ripetute,
periodi/limiti/cursori invalidi sono rifiutati. Risposte vuote esplicite; errori 503
senza dettagli DB. GET cache pubblica fino a 10 s; POST sempre no-store. CORS read
permette l'origine `*`, senza cookie; CORS non è un controllo di autorizzazione.
Limite di corpo 16 KiB misurato sullo stream, timeout DB 8 s e lettura corpo 5 s.
Protezione volumetrica/rate limit distribuito e latenza complessiva restano da misurare prima del rilascio;
non esiste una garanzia di 429 da un contatore in memoria di una singola istanza.

## Applicazione e recupero — BE-07 eseguito sul target scelto

Migrazione creata con CLI `supabase migration new station_backend_v1` (CLI 2.121.0).
File applicato via connettore il 22 ottobre 2026, versione 20261022125448;
nessun dato applicativo preesistente. Il target esistente è stato scelto dall’utente
invece di un ambiente separato. Per applicazioni future: verificare target autorizzato, inventario, versione PostgreSQL e schema esposto,
preservare dati esistenti, rivedere diff e configurare segreti in canale protetto.
Non usare `db reset` sul progetto remoto. Test SQL in `supabase/tests/` eseguibili
con psql ON_ERROR_STOP in una transazione che termina con ROLLBACK; fixture solo
sintetiche. SQL con rollback e sei invii HTTP concorrenti provati in BE-07;
lo script descrive anche l’interleaving deterministico su due connessioni, non
eseguito manualmente nel servizio remoto.

Dopo l'applicazione autorizzata: provare RPC e vincoli con DB reale, privilegi per
anon/authenticated/service_role, due invii concorrenti, conflitto, risposta persa,
read da browser anonimo e rifiuto di scritture dirette; misurare query con EXPLAIN
su volume sintetico dichiarato. Verificare impostazioni Data API e auth piattaforma,
rate limit e CORS nel runtime effettivo. Nessun deploy riuscito sostituisce queste
prove. Per recuperare dopo rilascio: fermare ingest, preservare dati e ripristinare
la precedente funzione; non eliminare la tabella per annullare un deploy.

Fonti ufficiali consultate: [auth Edge](https://supabase.com/docs/guides/functions/auth-headers),
[grant espliciti e cambiamento dei default](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically),
[concorrenza INSERT](https://www.postgresql.org/docs/17/sql-insert.html).
L'indice changelog non era recuperabile; è stata consultata la modifica pertinente
ai grant, oltre alla documentazione attuale tramite il connettore Supabase.


## Audit locale 23 ottobre — limite del cursore `all`

**Problema storico riprodotto nell’audit, poi corretto localmente (COR-009):** `received_at` è generato da PostgreSQL con possibili microsecondi, mentre l’handler serializza il tempo nel cursore tramite `Date.toISOString()` al millisecondo. Per record senza `captured_at`, il confronto SQL usa quindi una soglia diversa dalla riga restituita: può ripetere il cursore e bloccare `readAllHistory`/PDF. [Riproduzione senza database o rete](project-review/reproduce-history-cursor.mjs), [analisi e verifica richiesta](project-review/README.md). La normalizzazione già presente per `captured_at` non è sufficiente per il fallback `received_at`; non è stata applicata alcuna migrazione o modifica remota.

**Correzione locale successiva:** il cursore normalizza UTC senza perdere le cifre decimali, fino a sei; il validatore ammette tali cursori e conserva la compatibilità con quelli a tre cifre. Anche il confronto con i confini conserva i microsecondi. `until` resta UTC canonico al millisecondo; query/RPC e migrazioni SQL non cambiano. [Regressione locale positiva](project-review/reproduce-history-cursor.mjs): tutti i 501 record recuperati; suite Deno con 1.201 record e confini sub-millisecondo. Nessuna prova SQL remota o pubblicazione in questa sessione; serve il deploy autorizzato della sola Edge Function per rendere la correzione effettiva in produzione. PostgreSQL documenta precisione fino al microsecondo: [tipi data/ora](https://www.postgresql.org/docs/current/datatype-datetime.html). Il changelog Markdown Supabase non è stato recuperabile dal browser di ricerca; non sono state introdotte nuove API o configurazioni Supabase.

## Storico manuale su una sola tabella — 28 ottobre 2026

Decisione richiesta dall'utente: conservare `station_measurements` come unica tabella dati. Le nuove righe manuali e la riga storica amministrativa già presente sono identificate con `payload._entry_method = "manual"`; il read RPC proietta soltanto `entry_method`, mai il payload. La cronologia pubblica, l'ultima misura, i grafici, le statistiche, i record e le previsioni includono queste misure reali; per righe senza `captured_at` viene usato `measured_at` senza inventare un orario di acquisizione PC. L'interfaccia mantiene l'etichetta di inserimento manuale. Le righe `synthetic` restano escluse dal sito. La tabella `station_measurement_admin_audit` non viene più usata: la relativa migrazione la elimina (era stata verificata vuota) e rimuove gli insert di audit dalle RPC di modifica/cancellazione. Restano ID operazione e conferma nel flusso admin, ma non uno storico delle modifiche/cancellazioni: il recupero da errore umano dipende da backup.

**Stato successivo — 28 ottobre 2026:** l'utente ha impostato il segreto e il login è stato provato con esito positivo nell'interfaccia. Migration `one_table_manual_history` applicata; SQL conferma una sola tabella base nel public, 252 record, il record manuale marcato e nessuna tabella audit. Le funzioni sono attive `read-measurements` v9 e `manage-measurements` v5. La risposta API pubblica restituisce il record con `entry_method=manual`; la homepage lo mostra nella cronologia con etichetta. La successiva richiesta dell'utente annulla l'esclusione dai calcoli: migration `manual_measurements_public` e adeguamento locale di frontend/handler includono le righe manuali come misure reali, mantenendo il marcatore. La pubblicazione richiede applicare la migration, aggiornare `read-measurements` e rilasciare il frontend.
