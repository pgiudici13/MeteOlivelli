# Gestione operativa — MeteOlivelli

> **Verifica corrente — 27 ottobre 2026:** frontend `e625950` distribuito con successo via Git e verificato sul dominio pubblico; dettagli e hash nel [verbale](release-audit-20261027.md). La UI finale esclude sintetici e non mostra la vecchia postilla: i paragrafi storici sotto non superano questa decisione. API di lettura 200, API amministrativa 503; correzioni Edge locali e configurazione server non pubblicate/modificate in questa sessione. Backup, avvisi e stazione reale restano aperti.

Stato documentato il 22 ottobre 2026, riferito al rilascio applicativo `bce39e2`. Questa guida registra le procedure e i limiti; non attiva backup, allarmi, pulizie o modifiche remote. I task esecutivi restano nella [Fase 8](../tasks.md#8-fase-8--backup-gestione-e-rilascio).

## Target e accessi

| Componente | Target verificato nel rilascio |
|---|---|
| Repository | `pgiudici13/MeteOlivelli`, branch produzione `main` |
| Sito pubblico | [meteolivelli.vercel.app](https://meteolivelli.vercel.app/) |
| Vercel | progetto `meteolivelli`, ID `prj_Jlxt1vouwTWorxUmqBbCxzRJK4Xm`, team `team_WF8R8uiIvXzKOKJgGrlcCYtF` |
| Supabase | progetto MeteOlivelli, ref `pvtzncseisbxaaseqfvo` |
| Lettura | Edge Function `read-measurements`, GET pubblico |
| Ingestione | Edge Function `ingest-measurement`, token stazione sul server e PC autorizzato |
| Database | `public.station_measurements`, source `meteolivelli`; RLS attiva, scritture pubbliche revocate |

Prima di ogni intervento verificare nuovamente progetto, ambiente, commit e ambito autorizzato. Gli ID qui non sono credenziali. Non leggere/stampare `.env`, token o chiavi per la diagnosi ordinaria; non trasferire la service role al client o all’uploader.

## Diagnosi senza scritture

1. Aprire il sito e controllare stato delle misure, ultimo campione e cronologia. HTTP 200 indica disponibilità della pagina, non freschezza della stazione.
2. Provare in sola lettura:

```sh
curl --fail --silent --show-error 'https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/read-measurements?view=latest'
curl --fail --silent --show-error 'https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/read-measurements?view=history&period=24h'
```

3. `items: []` con risposta valida significa assenza di campioni nel perimetro della query, non credenziale mancante. Non aggiungere dati per mascherare uno stato vuoto.
4. Errori 503/rete: controllare disponibilità endpoint e log depurati nel progetto corretto. La UI conserva l’ultima lettura riuscita con avviso e riprova; non cancellare dati o ruotare chiavi senza aver individuato il guasto.
5. API popolata ma UI vuota: confrontare commit effettivamente servito, dominio, contratto e periodo; controllare errori browser. La cache API è di 10 secondi e il polling latest di 15 secondi a pagina visibile. Questi intervalli non sono uno SLA.
6. Valori presenti ma vecchi: confrontare `acquisition_kind`, `measured_at`, `captured_at`, `received_at`. I campioni sintetici non attestano attività della stazione; una ricezione recente non ringiovanisce una misura vecchia. Finché clock e cadenza non sono verificati, “Freschezza non determinabile” è lo stato previsto.
7. Nuovi dati Arduino assenti: verificare prima CSV/writer, uploader e outbox sul PC autorizzato. Non ricreare l’outbox o azzerarne lo stato per tentativi; seguire [guida uploader](../uploader/README.md).
8. Stime indisponibili: comportamento previsto finché WX-01/WX-02 non sono completati; nessun modello va simulato con i valori dei sensori.

## Rilasciare una modifica autorizzata

- Leggere istruzioni e `git status`, ispezionare il diff e preservare i file locali. Confermare autorizzazione a commit/push e al rilascio previsto.
- Per codice eseguire `npm run check` e prove pertinenti; per sola documentazione controllare diff, rimandi e coerenza degli stati. Non dichiarare test runtime rieseguiti se non lo sono.
- Stagiare file espliciti e controllare `git diff --cached --check`; escludere segreti, dump, cache e configurazioni locali.
- Fetch e confronto con `origin/main`; gestire divergenze senza force push o riscritture non autorizzate. Commit in inglese, poi push del branch concordato.
- L’integrazione Git avvia il deploy Vercel: verificare commit, ambiente production, stato READY e dominio. Non creare un deploy manuale duplicato se quello Git funziona.
- Controllare dal dominio principale UI, API, dati/provenienza, postilla, grafici e console. Registrare commit, target, esiti e limiti; non confondere la pubblicazione WIP con REL-01 completato.
- Per incidenti scegliere rollback/revert solo nell’ambito autorizzato. Un rollback frontend non ripristina il database e non elimina i campioni.

## Campioni sintetici e passaggio ai dati reali

Batch corrente `ui-preview-20261024-thirty-day-three-hour`, 241 record `synthetic` ogni tre ore nel database finale, dal 24 settembre alle 14:08:07 al 24 ottobre alle 14:08:07 Europe/Rome (richiesta del 24 ottobre). Ha sostituito tutte le righe presenti, che erano 11 e tutte sintetiche. [Contratto e prove](data-preview.md). La sola postilla concordata deve rimanere visibile finché sono esposti. Non cambiare il tipo in `live` né assegnare loro una data fisica.

Per l’ispezione amministrativa in sola lettura, senza segreti:

```sql
select ingestion_id, acquisition_kind, captured_at, measured_at
from public.station_measurements
where payload->'_provenance'->>'batch_id' = 'ui-preview-20261024-thirty-day-three-hour'
order by captured_at;
```

OPS-03 deve definire se conservarli identificati o rimuoverli su richiesta. Prima di una cancellazione futura: confermare batch e 241 UUID contro l’evidenza, concordare l’eventuale copia, preparare una transazione limitata a quei record e richiedere l’autorizzazione. La sostituzione del 24 ottobre è già stata eseguita su richiesta esplicita. Non usare `source_id = meteolivelli` come criterio di pulizia: è condiviso con i futuri campioni reali.

Alla prima misura reale verificare che `latest` privilegi `live`, controllare che le curve non inducano a confondere campioni reali e di prova e decidere il destino del batch. Solo dopo la verifica della rimozione dall’esposizione pubblica valutare una modifica della postilla, separatamente autorizzata. Aggiornare la documentazione nello stesso intervento.

## Backup, allarmi e responsabilità ancora aperti

**OPS-01 — destinazione e uso scelti, procedura aperta (22 ottobre 2026):** l’utente indica Google Drive scolastico per archiviare backup del database e conferma che gestirà manualmente i file del programma. Drive non va collegato dal PC scolastico. Il flusso da valutare è export Supabase cifrato e upload da un dispositivo amministrativo autorizzato; cartella, spazio, permessi e custode vanno ancora verificati. Nessun account è collegato e nessun file è stato caricato.

Per Supabase Free, la documentazione raccomanda esportazioni regolari via CLI e copie fuori sede; non assumere backup automatici giornalieri gestiti. Il flusso gratuito proposto è un export amministrativo cifrato da un computer autorizzato, seguito da upload manuale alla cartella Drive scolastica; dispositivo, frequenza ed export/restore vanno ancora scelti e provati. [Documentazione ufficiale backup Supabase](https://supabase.com/docs/guides/platform/backups).

Come base da approvare: esportazione cifrata giornaliera, 30 copie giornaliere e 12 mensili; RPO massimo 24 ore e RTO massimo un giorno lavorativo. Sono proposte, non valori confermati. Il RPO giornaliero può lasciare a rischio fino a una giornata di dati; il RTO è il tempo desiderato per ripristinare. La copia dovrà preservare misure e provenienza, schema/migrazioni e gli elementi necessari al recupero. Git e screenshot non sono backup dei dati. Non mettere dump in questo repository. Il restore separato con confronto di conteggi, tipo, null temporali, duplicati e permessi resta necessario prima di dichiarare il backup operativo. Nessun export o upload è stato eseguito.

**Dati reali e batch pubblico — nota storica del 22 ottobre, superata per il batch dalla richiesta del 23 ottobre:** CSV reale e PC Windows non sono ancora disponibili. I cinque record `synthetic` del batch `ui-preview-20261022-five-half-hour` e la postilla pubblica restano invariati per decisione dell’utente. Non cancellarli o modificarli; dopo la prima misura reale confrontare priorità `live` e chiarezza dello storico, poi chiedere la decisione successiva sul batch. La postilla resta finché i campioni sono esposti.

**OPS-02:** l’utente resta il referente del progetto; il recapito email, il meccanismo gratuito di avviso e la prova di consegna sono aperti. Avvisi, rotazione/revoca credenziali, quote e incidenti PC devono essere provati prima di dichiararli operativi. Nessun monitor o invio email è stato attivato in questo lavoro. Non fissare soglie di allarme freschezza prima di verificare clock e cadenza.

**REL-01:** CSV/writer/Windows, catena completa Arduino → sito, autonomia offline, latenza reale e validità delle stime restano da collaudare. Le prove sintetiche non li sostituiscono.

**END-01:** chiusura a dicembre soltanto se riconfermata, dopo conservazione/ripristino dello storico e decisione su cosa fermare. Nessuna cancellazione o spegnimento programmati.

## Health check della pipeline — AUD-10 (27 ottobre 2026)

`scripts/check-station-health.mjs` è un controllo **di sola lettura** sull'endpoint
pubblico, senza credenziali: verifica raggiungibilità e contratto, presenza di
misure della stazione (distingue i soli campioni sintetici), età dell'ultimo
campione ricevuto e sincronizzazione dell'orologio locale col tempo del server.

```sh
node scripts/check-station-health.mjs                    # output leggibile, soglia 26 ore
node scripts/check-station-health.mjs --max-age-hours 4   # soglia più stretta
node scripts/check-station-health.mjs --json              # output machine-readable
```

Esiti: `0` entro i limiti, `1` avviso (nessun campione, solo sintetici, dati
fermi oltre soglia, orologio fuori sincronia), `2` endpoint irraggiungibile o
risposta non valida. L'età è sempre calcolata sul tempo del server; con
`measured_at` assente è dichiarata sulla ricezione. Logica pura testata in
`tests/station-health.test.mjs`. Da pianificare su un dispositivo autorizzato
(Windows Task Scheduler o equivalente) con notifica su esito ≠ 0: il canale di
notifica resta aperto (OPS-02). Lo script non sostituisce il writer/uploader:
segnala solo che i dati non arrivano.

## Runbook backup e restore — AUD-01 (27 ottobre 2026)

Procedura proposta per un **dispositivo amministrativo autorizzato** (non il PC
della scuola, non questo repository). Lo stato corrente è stato controllato il
27 ottobre 2026: il progetto Supabase è sul piano Free; la documentazione
ufficiale raccomanda export regolari e copie fuori sede per questo piano. Il
piano non garantisce backup automatici gestiti. **Nessun export o restore è stato
eseguito.** La CLI Supabase, `psql`, `pg_dump`, `age`, `gpg` e `supabase` non sono
installati in questo ambiente; Docker è disponibile. La procedura va provata sul
dispositivo amministrativo scelto prima di dichiararla operativa.

1. **Preparare gli strumenti e il target:** installare la Supabase CLI ufficiale
   e Docker; per il restore aggiungere `psql`. Usare il pooler di sessione o la
   connessione diretta consigliata dal pannello. `METEO_ADMIN_DB_URL` deve essere
   disponibile solo nella sessione amministrativa protetta: non inserirla in Git,
   in un file `.env`, nei comandi salvati o nei log. La CLI filtra gli schemi
   gestiti da Supabase; non sostituirla con `pg_dump` raw.
2. **Esportare ruoli, schema e dati separatamente** (proposta giornaliera, RPO
   24 h). `supabase db dump` senza opzioni esporta schema soltanto, non dati o
   ruoli: tutti e tre i file sono necessari per questa copia logica.

```sh
umask 077
backup_prefix="meteolivelli-$(date +%F)"
backup_dir="$backup_prefix-files"
mkdir "$backup_dir"
supabase db dump --db-url "$METEO_ADMIN_DB_URL" -f "$backup_dir/roles.sql" --role-only
supabase db dump --db-url "$METEO_ADMIN_DB_URL" -f "$backup_dir/schema.sql"
supabase db dump --db-url "$METEO_ADMIN_DB_URL" -f "$backup_dir/data.sql" \
  --use-copy --data-only -x "storage.buckets_vectors" -x "storage.vector_indexes"
```

3. **Includere lo stato dell'uploader** del PC autorizzato: snapshot SQLite
   coerente di `uploader/runtime/<sorgente>/state/outbox.sqlite3` e del marcatore
   associato. Usare la SQLite Backup API oppure fermare l'uploader e copiare i
   file mentre è fermo; non copiare il DB attivo alla cieca e non includere la
   configurazione che contiene il token. Preservare la outbox evita di riassegnare
   identità agli eventi pendenti (AUD-09). Dopo avere creato questi due snapshot,
   impostare `METEO_OUTBOX_SNAPSHOT` e `METEO_STATE_MARKER` ai loro percorsi:

```sh
cp "$METEO_OUTBOX_SNAPSHOT" "$backup_dir/outbox.sqlite3"
cp "$METEO_STATE_MARKER" "$backup_dir/state.marker"
tar -czf "$backup_prefix.tar.gz" -C "$backup_dir" .
```

4. **Impacchettare e cifrare con autenticazione** prima di lasciare il dispositivo.
   Usare `age` con una chiave pubblica di backup; custodire la chiave privata
   separatamente e fuori da Drive. Il destinatario pubblico può stare nella
   configurazione del job; la chiave privata no. Esempio, dopo aver creato il
   pacchetto `.tar.gz` con i dump e lo snapshot SQLite:

```sh
age -r "$METEO_BACKUP_RECIPIENT" -o "$backup_prefix.tar.gz.age" "$backup_prefix.tar.gz"
shasum -a 256 "$backup_prefix.tar.gz.age" > "$backup_prefix.tar.gz.age.sha256"
```

   `age` rileva alterazioni del contenuto cifrato; il checksum rileva errori di
   copia. La precedente bozza usava AES-CBC senza autenticazione e un solo dump
   predefinito, quindi non esportava i record e non rilevava manomissioni: non
   usare quei comandi.
5. **Caricare solo artefatti cifrati** nella cartella Google Drive scolastica
   concordata (OPS-01), dopo aver verificato permessi, spazio e custode. Mantenere
   30 copie giornaliere e 12 mensili solo se lo spazio lo consente; sono proposte,
   non impostazioni già attive. Proteggere separatamente la chiave privata.
6. **Provare periodicamente il restore in un progetto/database separato e
   autorizzato, mai in produzione.** Verificare prima il checksum, decifrare con
   la chiave custodita separatamente, estrarre i tre dump e ripristinarli con
   `psql` secondo la procedura ufficiale. L'esempio seguente presuppone che il
   pacchetto sia già stato verificato e decifrato; `METEO_RESTORE_TEST_URL` deve
   puntare esclusivamente al target isolato.

```sh
shasum -a 256 -c "$backup_prefix.tar.gz.age.sha256"
age -d -i "$METEO_BACKUP_IDENTITY" -o "$backup_prefix.tar.gz" "$backup_prefix.tar.gz.age"
mkdir -p "$backup_prefix-restore"
tar -xzf "$backup_prefix.tar.gz" -C "$backup_prefix-restore"
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file "$backup_prefix-restore/roles.sql" \
  --file "$backup_prefix-restore/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$backup_prefix-restore/data.sql" \
  --dbname "$METEO_RESTORE_TEST_URL"
```

   Questo esempio è da validare sul target scelto: ruoli riservati, privilegi
   predefiniti, estensioni e differenze di versione possono richiedere passaggi
   separati. Un dump logico Supabase non comprende oggetti Storage, deployment
   delle Edge Function o credenziali runtime; questi elementi richiedono una
   procedura separata, senza copiare segreti nel backup Drive.

Checklist di verifica del restore: conteggio righe per `source_id` e
`acquisition_kind`; campione di UUID identici al dump; null di `captured_at`/
`measured_at` invariati; assenza di duplicati (query sotto); privilegi, RLS e
RPC uguali alla produzione; eventuale replay controllato dell'uploader con gli
stessi ID (`--replay-confirmed`) senza nuove righe. Verificare anche che la
decifratura rifiuti un artefatto alterato e conservare un manifest con data,
versioni CLI/PostgreSQL, conteggi e hash. Registrare durata, RPO effettivo ed esito.

Riferimenti: [backup Supabase](https://supabase.com/docs/guides/platform/backups),
[dump CLI](https://supabase.com/docs/reference/cli/supabase-db-dump),
[restore CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
e [formato age](https://c2sp.org/age%40v1.0.0).

## Duplicati: rilevamento e regole — AUD-09 (27 ottobre 2026)

Regole operative: **non reinizializzare mai uno stato uploader esistente**; in
caso di perdita dello stato fermarsi e usare questa query prima di riprendere;
mai cancellare righe per “pulire” senza identificare gli UUID esatti.

```sql
-- Candidati duplicati: stessa uptime e stesso contenuto grezzo.
-- Attenzione: righe identiche scritte due volte dal writer sono eventi legittimi
-- (plan.md §6); ogni segnalazione va valutata, non eliminata automaticamente.
select arduino_seconds, md5(raw_payload) as digest, count(*) as n,
       array_agg(ingestion_id order by received_at)
from public.station_measurements
where source_id = 'meteolivelli'
group by 1, 2
having count(*) > 1;
```

Le alternative strutturali (unicità sul contenuto, ID deterministici) sono
analizzate in `plan.md` e non implementate: richiedono una decisione di contratto.

## Verifiche periodiche e decisioni ancora aperte — AUD-06/07/08

- **AUD-07, continuità del piano Free:** verificare periodicamente quota storage
  ed egress nel pannello Supabase e lo stato del progetto (rischio pausa per
  inattività con uploader fermo). Nessun SLA: documentare eventuali superamenti.
- **AUD-06, rate limiting:** valutato un limitatore in-memory dentro le Edge
  Function e **non implementato**: senza un `x-forwarded-for` verificato della
  piattaforma il bucket sarebbe condiviso tra tutti gli utenti e genererebbe 429
  ingiustificati. Operazione manuale richiesta: verificare nel pannello Supabase
  l'esistenza di limiti/protectio a livello di gateway; solo dopo, eventualmente,
  reintrodurre un limitatore per IP con test dedicati.
- **AUD-08, consenso statistico:** il comportamento attuale (tracker attivi di
  default con opt-out persistente) è una scelta del titolare documentata il 26
  ottobre. Resta da validare con una valutazione GDPR/ePrivacy: se richiesto, il
  passaggio a opt-in è un cambiamento minimo (il codice distingue già granted/
  denied). Decisione non tecnica: non modificare il default senza richiesta.

## Gestione manuale delle misure — predisposizione `/data` (27 ottobre 2026)

La pagina non compare nei menu e dichiara `noindex`; l'indirizzo è comunque
pubblico. Ogni richiesta di elenco o modifica viene autenticata dalla Edge Function
con `METEOLIVELLI_ADMIN_PASSWORD`, mantenuta in memoria dal browser. Configurare
un valore casuale di almeno 24 caratteri solo nella sezione Secrets delle Edge
Functions Supabase; non aggiungerlo a `.env` versionati, Vercel, HTML o argomenti
CLI. Prima dell'uso controllare il dominio CORS autorizzato. Il limitatore attuale
è in memoria per istanza e non offre un limite durevole contro tentativi
distribuiti: verificare prima le protezioni gateway Supabase e non usare la pagina
finché non è stata fatta una revisione di sicurezza.

La migrazione `20261027113158_admin_measurement_writes.sql` è applicata e
`manage-measurements` è distribuita come Edge Function v1. Il segreto
`METEOLIVELLI_ADMIN_PASSWORD` è ancora da impostare nel pannello Supabase; fino a
quel momento le operazioni rispondono 503. Il limite tentativi corrente è solo
in-memory e non sostituisce una protezione durevole. Dopo aver impostato il
segreto, provare prima su una riga di test autorizzata. La cancellazione toglie
la misura dalla tabella, ma l'audit conserva ID, azione e data; non contiene una
copia del contenuto eliminato. Prima dell'uso definire come ripristinare errori
umani tramite backup, poiché il comando non è annullabile.
