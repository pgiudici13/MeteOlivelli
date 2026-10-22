# Backend: setup locale e controllo dati

## Cosa è pronto

Il backend previsto è una Supabase Edge Function TypeScript per ricevere eventi
dall'uploader Windows. Sono pronti runtime, configurazione e validazione pura del
contratto locale v1. Migrazione, database/RPC e handler HTTP ingest/read sono
ora applicati e verificati nel progetto Supabase MeteOlivelli scelto dall’utente.
[Verbale BE-07](backend-verification.md): prove sintetiche SQL/HTTPS, fixture rimosse;
CSV, clock, writer e PC reali ancora da convalidare.

Schema, matrice accessi, letture, applicazione e limiti: [backend-schema.md](backend-schema.md).

Sono presenti:

- Deno 2.9.6, fissato nelle dipendenze di sviluppo npm e nel lockfile;
- `supabase/functions/deno.json`, con controlli separati da TypeScript/ESLint del frontend;
- `_shared/config.ts`, che richiede esplicitamente una variabile e segnala un valore
  mancante senza includere valori nell'errore;
- `_shared/measurement.ts`, con parsing JSON, validazione, flag per campo e confronto canonico;
- `_shared/measurement_csv.ts`, adattatore provvisorio di una riga completa, senza dialetto predefinito;
- 39 test con valori sintetici (3 configurazione, 14 controllo dati, 10 CSV, 12 HTTP/adapter), senza permessi su ambiente, rete o file applicativi;
- esempi di configurazione vuoti, distinti per browser e server.

Importare `config.ts` non legge variabili ambiente o file: il chiamante deve passare
esplicitamente un lettore. Non viene enumerato l'ambiente. Una stringa composta solo
da spazi viene rifiutata; una stringa valida viene preservata senza modificarla.

`config.ts` è una base per il futuro controllo della configurazione, non verifica
connessione al database, forza del token o correttezza di un payload meteorologico.

## Perché Deno è separato da React

Il codice React resta in `src/`, compilato con TypeScript/Vite e controllato da ESLint.
Il codice Edge resta in `supabase/functions/`, controllato da Deno. Il lint browser
esclude questa cartella: `npm run lint` da solo non prova il backend.

La CLI Deno è adatta ai controlli locali. Il runtime Edge di Supabase usato per
servire le funzioni è un ambiente distinto: i test qui non sostituiscono la prova
della funzione nell'ambiente effettivo. [Fonte ufficiale Supabase](https://supabase.com/docs/guides/functions/development-environment).

Non sono stati installati Docker, un database locale o servizi aggiuntivi.
`supabase/config.toml`, cartelle ingest/read, migrazione e prove SQL sono presenti.
La migrazione è applicata e le funzioni pubblicate in BE-07; i controlli Deno
continuano a non eseguire SQL o collegarsi al servizio.

## Comandi, dalla root del repository

```sh
npm ci
npm run backend:check
npm run backend:lint
npm run backend:test
```

- `backend:check` controlla tutti i moduli `.ts` in `supabase/functions/`, ricorsivamente.
- `backend:lint` controlla lint e formato dell'intera cartella funzioni, incluso `deno.json`.
- `backend:test` cerca i test ricorsivamente nella cartella funzioni, fallisce se non ci sono test e non carica `.env`.

Endpoint e sottocartelle TypeScript sono inclusi nei controlli. Il 22 ottobre una
prova in copia temporanea con un modulo annidato volutamente errato ha verificato
la scoperta ricorsiva da parte di check, lint e test. Eventuali nuovi linguaggi o
esclusioni richiederanno una verifica specifica.
Le opzioni `--no-remote` e `--no-npm` impediscono ai controlli attuali di scaricare
moduli; non ci sono dipendenze server esterne. Aggiungerne richiederà una scelta e
un lockfile coerenti, senza rimuovere questi vincoli per nascondere un errore.

Nell'ambiente ristretto dell'agente è stato usato `DENO_DIR` su una directory
temporanea scrivibile per la cache. Non è una variabile del prodotto e non va
aggiunta a `.env.local`.

## Convenzioni per la configurazione

| Nome introdotto nel setup | Destinatario | Stato |
|---|---|---|
| `VITE_SUPABASE_URL` | Futuro browser | Pubblico; nessun client collegato oggi |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Futuro browser | Solo chiave pubblicabile; non fornisce da sola protezione dei dati |
| `SUPABASE_URL` | Futuro backend | URL server; fornito dal runtime in produzione |
| `STATION_INGEST_TOKEN` | Endpoint e futuro uploader | Token dedicato, almeno 32 caratteri; esempio vuoto |
| `STATION_SOURCE_ID` | Endpoint server | Sorgente associata al token; esempio vuoto |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo runtime Edge | Credenziale DB privilegiata; mai browser/uploader; esempio vuoto |

Questi sono nomi definiti per il progetto; non descrivono il contenuto dei file
locali o delle configurazioni remote, che non è stato letto. `SUPABASE_URL` è una
variabile predefinita del runtime: [documentazione ufficiale](https://supabase.com/docs/guides/functions/secrets).

BE-03 sceglie la credenziale service_role fornita dal runtime solo sul server,
con grant espliciti e RPC invoker; poteri e limiti sono documentati nella matrice
[backend-schema.md](backend-schema.md). Non è stato letto o generato alcun segreto.
Sorgente e token sono stati configurati tramite un canale protetto in BE-07; una
configurazione incompleta restituisce 503. Gli handler non registrano credenziali.

## Cosa serve prima dell'ingestione

1. **DATA-01:** campione CSV e osservazione del writer; nessun delimitatore definitivo presunto.
2. **DATA-02:** punto di timestamp sul PC, clock e buffering; storico senza date conservato senza inventarle.
3. **DATA-03:** contratto JSON, identità dell'evento e risposte di conferma/conflitto.
4. **BE-01:** validazione locale v1 implementata e testata; riallineare contratto e test dopo il campione reale.
5. **BE-02–BE-04:** schema/accessi revisionabili prima delle migrazioni.
6. **BE-05–BE-07:** handler, lettura e applicazione richiesta nel target verificato, con prove reali.

Il contatore Arduino non è una data o un'identità evento sufficiente. Un evento
ritentato deve conservare ID e primo `received_at`. La persistenza di queste regole è implementata nei file SQL e
verificata nel DB reale in BE-07; resta da realizzare/provare l’outbox nell’uploader. Il validatore non salva eventi.

Le scelte delegate del 22 ottobre sono in [plan.md §18](../plan.md#18-revisione-delle-criticità-e-scelte-delegate--22-ottobre-2026):
`captured_at` completo nell’evento quando viene osservata una nuova riga completa,
SQLite per identità/coda/cursore, endpoint di lettura limitato, valori sospetti
conservati con “probabile errato” e modello sperimentale nostro senza provider meteo.
Non equiparare il timestamp di osservazione del CSV all’ora fisica della misura.
Il contratto definitivo e il parser restano dipendenti dal campione futuro.

Vedere [tasks.md](../tasks.md) per i singoli passaggi e [plan.md](../plan.md) per
semantica, requisiti e decisioni. L'inventario corrente dei servizi è in
[services.md](services.md).

## Formato sorgente: dichiarazione dell'utente del 22 ottobre 2026

Ordine dichiarato: **secondi dall'accensione Arduino, temperatura °C, umidità %, pressione hPa**.
È un'informazione dell'utente, non l'esito dell'ispezione di un CSV. Il primo campo
è `arduino_seconds`, non Unix time. Nessuna conversione di unità o arrotondamento.
Risoluzione del contatore (intera/frazionaria), encoding, separatore, decimali,
intestazioni, valori vuoti/sentinelle, flush e append/riscrittura restano da osservare.
L'utente dichiara di non conoscere questi dettagli e ipotizza un formato “standard”:
non è una conferma di delimitatore o decimali. L'adattatore provvisorio descritto
sotto richiede una scelta esplicita, senza presumere un formato della stazione.

## Adattatore CSV provvisorio

`parseMeasurementCsvRow(rawRow, dialect, context, ranges?)` adatta **una riga dati
già completa, senza terminatore** al contratto JSON v1 e riusa `validateMeasurement`.
Non legge il file, non rileva automaticamente formato/intestazione, non genera ID
e non assegna orari. Il suo output non è una prova di persistenza o quarantena.

Configurazione obbligatoria `CsvDialect`, senza default:

| Proprietà | Valori supportati e significato |
|---|---|
| `delimiter` | Virgola, punto e virgola, tabulazione o barra verticale; scegliere dopo il campione |
| `decimal_separator` | Punto o virgola, senza separatori delle migliaia |
| `empty_measurement` | `reject` oppure `null`; i vuoti delle tre misure diventano null soltanto nella seconda policy. Uptime sempre obbligatorio |

Ordine fisso dichiarato dall'utente: uptime, °C, %, hPa. Esattamente quattro campi.
Supporta quote doppie e raddoppio della quote interna; quote solo all'inizio del
campo e delimitatore subito dopo la chiusura. Decimali con virgola e delimitatore
virgola richiedono quote. Spazi esterni al numero vengono rimossi solo per la lettura,
senza modificare l'originale. Sintassi numerica decimale, segno ed esponente ammessi;
niente lettura parziale (`21°C`, `12abc`), esadecimali o conversioni di sentinelle.
Overflow/non finiti e underflow non nullo verso zero vengono segnalati. La
rappresentazione numerica è quella `number` JavaScript; nessun arrotondamento per la UI.
Testo non interpretabile resta un errore, numeri sospetti mantengono i flag qualità.

`context` fornisce sorgente, ID persistito, tipo di acquisizione e `captured_at`.
L'adattatore imposta sempre `measured_at: null`: questi quattro campi non dichiarano
un orario fisico affidabile. Restano valide le regole storico/live del contratto.

Ogni esito restituisce `raw_row` identico alla stringa ricevuta, anche se invalida.
Su errore `stage: csv` distingue `invalid_dialect`, `invalid_csv`,
`invalid_column_count` e `invalid_number`; `stage: measurement` contiene gli errori
del validatore condiviso. Nessun valore ricevuto è inserito nei messaggi diagnostici.
L'originale è testo già decodificato, non una copia dei byte del file: conservare
anche il CSV originale nell'uploader. Non pubblicare o stampare righe nei log.

Il chiamante futuro dovrà decodificare l'encoding verificato, gestire eventuale BOM
solo all'inizio del file, riconoscere l'intestazione verificata e togliere LF/CRLF
dopo avere accertato la completezza. BOM e newline ricevuti dall'adattatore sono
rifiutati; righe vuote/intestazioni non vengono saltate in silenzio. Non supporta
campi multilinea: se comparissero nel campione, adeguare prima il contratto.
Una riga come `1;21;55;1013` può essere sintatticamente valida anche se il writer
sta ancora scrivendo decimali: il parser non prova la stabilità del file e non
autorizza l'avanzamento del cursore. EOF da solo non basta (UP-01).

Per chiudere la verifica reale di DATA-01–DATA-03, registrare queste evidenze:

| Evidenza ancora necessaria | Verifica operativa richiesta |
|---|---|
| CSV depurato, intestazione e righe esatte | Confermare encoding, dialetto, campi vuoti/sentinelle; aggiungere fixture di provenienza reale e relativo test |
| Writer e fine riga | Osservare append/riscrittura, flush, righe parziali, LF/CRLF e campi effettivi; fissare la configurazione senza autodetect silenzioso |
| Timestamp del PC | Verificare sincronizzazione, sospensione e buffering; confermare punto di cattura e separazione fra nuove righe e storico |
| Reset/rotazione e replay | Osservare reset Arduino, restart uploader e file sostituito; preservare generazione/posizione e ID persistiti, senza dedurre sessioni dall'uptime |

L'ultima riga sarà provata end-to-end nei task uploader/backend: qui sono specificati
i comportamenti e provate solo le trasformazioni pure. Le specifiche locali sono
pronte; la convalida contro la sorgente rimane aperta. Nessun dato sintetico dei test
è presentato come campione della stazione.

## Contratto JSON locale v1 — DATA-02/DATA-03/BE-01

Questo è il contratto implementato per i controlli locali; la convalida contro
writer e campione rimane aperta. Il JSON è un formato di scambio nuovo del progetto,
non una trascrizione certificata del CSV della stazione. Un evento per richiesta;
batch non ammessi nella v1. L'adattatore CSV provvisorio produce numeri JSON secondo
il dialetto esplicito; la configurazione operativa va confermata sul formato reale.

Esempio **interamente sintetico per test**, mai dato della stazione:

```json
{
  "schema_version": 1,
  "source_id": "stazione-test",
  "ingestion_id": "12345678-1234-4234-8234-123456789abc",
  "arduino_seconds": 3600,
  "temperature_c": 21.12345,
  "humidity_pct": 55,
  "pressure_hpa": 1013.25,
  "acquisition_kind": "live",
  "captured_at": "2026-10-22T08:00:00.000Z",
  "measured_at": null
}
```

Tutti i campi sono obbligatori; `null` esplicito è ammesso dove indicato.

| Campo | Regola locale v1 |
|---|---|
| `schema_version` | Numero intero esatto `1`; altre versioni rifiutate |
| `source_id` | Identificatore tecnico da 1 a 64 caratteri: minuscole ASCII, cifre, `_`, `-`; primo carattere alfanumerico. Nessun percorso PC; la sorgente effettiva sarà associata alla credenziale nell'handler |
| `ingestion_id` | UUID v4 persistito una volta per evento dall'uploader; lettere normalizzate in minuscolo. Nessun ID generato dal validatore |
| `arduino_seconds` | Numero finito non negativo, al massimo `Number.MAX_SAFE_INTEGER`; frazioni ammesse finché la risoluzione non è verificata. Zero valido; `null` e stringhe rifiutati |
| `temperature_c` | Numero finito in °C oppure `null` |
| `humidity_pct` | Numero finito in % oppure `null` |
| `pressure_hpa` | Numero finito in hPa oppure `null` |
| `acquisition_kind` | `live` per riga nuova osservata dal monitor; `historical` per import pregresso. È provenienza di acquisizione, non prova di freschezza del sensore |
| `captured_at` | UTC completo obbligatorio in `live`. Nullo in `historical` nella v1: l'ora dell'import non sostituisce un'acquisizione originale ignota |
| `measured_at` | UTC completo solo con fonte attendibile indipendente; altrimenti `null`. Per il formato CSV attualmente dichiarato resta `null` |

Istanti accettati: `YYYY-MM-DDTHH:mm:ss[.SSS]Z`, frazione da 1 a 3 cifre facoltativa;
normalizzazione esplicita a tre cifre, anni 0001–9999 (nessun anno zero nel DB). Date impossibili, rollover, secondi intercalari,
offset, date senza ora e ore locali senza fuso sono rifiutati. L'uploader deve
convertire in UTC con una provenienza attendibile, senza indovinare orari ambigui
Europe/Rome durante il cambio d'ora. Nessun confronto con l'ora corrente nel modulo
puro: verifica clock, buffering e freschezza restano attività d'integrazione.

`captured_at` viene fissato una volta all'osservazione della nuova riga completa e
salvato prima dell'invio. `measured_at` non viene ricavato dall'uptime né dal tempo PC.
Il backend assegnerà `received_at` solo alla prima accettazione persistita; non è
un campo accettato dal client. I retry non modificano nessuno di questi istanti.
Un batch rilasciato in ritardo non riceve date di misura ricostruite artificialmente.
Un calo dell'uptime non genera un `boot_id`: potrebbe essere reset, rollover o riordino.
Il solo restart dell'uploader non cambia la sessione Arduino o le identità persistite.

### Errori strutturali e qualità dei valori

`validateMeasurement(unknown, ranges?)` e `parseMeasurementJson(string, ranges?)`
restituiscono un'unione discriminata tramite `ok`:

- `ok: false`, con `issues` contenenti solo `field` e `code`; nessuna copia dei valori
  ricevuti. Codici stabili: `invalid_json`, `invalid_object`, `missing_field`,
  `unknown_field`, `unsupported_version`, `invalid_identifier`, `invalid_number`,
  `invalid_timestamp`, `invalid_acquisition_kind`, `inconsistent_time`.
- `ok: true`, con `measurement` normalizzata e `quality_flags` per campo. Il dato
  numerico originale rimane invariato e non arrotondato.

Campi extra, compresi `received_at` e flag qualità inviati dal client, sono rifiutati.
Stringhe numeriche, booleani, array, `NaN` e infiniti sono invalidi; `null` sulle
tre misure significa “dato assente”, mai zero. Un campo omesso è un errore strutturale.
Tutte e tre le misure possono essere esplicitamente assenti senza inventare valori.
Un errore non salva automaticamente in quarantena: sarà l'uploader a conservarvi
riga originale e motivo in modo durevole (UP-03).

Controlli minimi di coerenza delle grandezze dichiarate: umidità fuori da `[0, 100]`,
pressione `<= 0` e temperatura `< -273.15` producono `outside_physical_bounds`, con
etichetta esatta **“probabile errato”** e motivo per campo. Non sono una taratura dei
sensori. Non è imposto un intervallo meteorologico locale inventato: soglie specifiche
sono opzionali tramite `QualityRanges` con estremi inclusivi e finiti, verificati
prima dell'uso operativo. Configurazione incoerente produce un errore di programmazione.
Una sentinella numerica plausibile non è riconoscibile senza conoscere il sensore.
Assenza di flag non significa accuratezza certificata. I flag sono ricalcolati dal server;
non correggono né eliminano il valore. Dati assenti/sospetti restano distinguibili
per UI, statistiche e modello nei task successivi.

### Identità, conferme e risposte previste per il futuro handler

`canonicalMeasurementContent` serializza i soli campi v1 in ordine fisso **dopo la
validazione**, con UUID e UTC normalizzati. Confronta contenuti senza dipendere
dall'ordine delle proprietà JSON. Non include flag ricalcolabili, tentativi o tempi
server. Non è una funzione di deduplicazione per valori: due ID distinti restano
eventi distinti anche con misure e uptime uguali.

L'handler userà unicità atomica su `(source_id, ingestion_id)`: stesso contenuto
canonico → conferma precedente; contenuto diverso → conflitto senza sovrascrivere.
L'ID, la generazione del file, la posizione e il payload congelato saranno persistiti
insieme nell'outbox. Dopo perdita del registro identità fermare il reimport automatico
e riconciliare: un nuovo UUID per ogni replay non garantisce unicità.

Contratto BE-05 implementato e verificato tramite HTTPS/DB in BE-07, **sul payload v1 ancora da convalidare sul CSV reale**: POST HTTPS con token dedicato
alla sorgente, un evento e limite corpo di 16 KiB; controllare autenticazione,
sorgente e limite prima della scrittura. Nessuna chiave DB sul PC o nel browser.

| HTTP / codice | Significato e comportamento uploader previsto |
|---|---|
| 201 / `accepted` | Nuovo evento confermato solo dopo commit; risposta con `source_id`, `ingestion_id`, primo `received_at` e flag qualità |
| 200 / `duplicate` | Stesso ID e contenuto; stesso `received_at` della prima accettazione |
| 400 / `invalid_json` | JSON malformato; quarantena durevole, nessun retry automatico identico |
| 422 / `invalid_measurement` | `issues` del validatore; quarantena durevole, nessuno scarto silenzioso |
| 401 / `unauthorized` | Token assente/errato; sospendere e segnalare |
| 403 / `source_mismatch` | Sorgente non autorizzata dal token; sospendere e segnalare |
| 415 / `unsupported_media_type` | Content-Type diverso da application/json; correggere il client |
| 408 / `body_timeout` | Corpo non completato entro 5 s; retry dello stesso evento |
| 400 / `invalid_encoding` | UTF-8 invalido; quarantena e diagnosi |
| 405 / `method_not_allowed` | Metodo diverso da POST; correggere configurazione |
| 413 / `payload_too_large` | Superato limite; quarantena e diagnosi |
| 409 / `event_conflict` | Stesso ID, contenuto differente; conservare entrambi per diagnosi, nessuna sovrascrittura |
| 429 / `rate_limited` | Eventuale risposta della piattaforma: retry con `Retry-After` se presente; l’handler non implementa un rate limit distribuito e le soglie non sono misurate |
| 5xx / `temporarily_unavailable` o timeout | Retry con backoff/jitter e stesso evento; mancata risposta non prova mancato commit |

Le prove locali verificano trasformazioni, confronto e handler con store simulato,
autenticazione e conferme HTTP. Le prove BE-07 aggiungono privilegi/RLS,
unicità e invii HTTP concorrenti nel DB reale. La riconciliazione dell’outbox e
la catena fisica rimangono UP-02/UP-03; i dettagli sono nel verbale BE-07.
