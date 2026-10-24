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
Non si deducono sessioni Arduino. Nessuna cancellazione o modifica di misure.

Chiave primaria `(source_id, ingestion_id)`, senza unicità su uptime o valori.
Indici parziali per `(source_id, captured_at, ingestion_id)` dei soli eventi live
e per `(source_id, measured_at, ingestion_id)` datati. Lo storico non datato rimane
archiviato; un import storico non diventa l'evento live corrente.

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
