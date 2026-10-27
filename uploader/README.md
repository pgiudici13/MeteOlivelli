# Uploader Windows — Fase 6

Implementazione locale provvisoria per il contratto v1. **Non installata sul PC
scolastico e non collegata alla stazione.** Tutti i test usano dati sintetici.
Python 3.11 o successivo, solo libreria standard; verificato localmente con Python
3.15.0 su macOS. Compatibilità Windows, Python effettivo e filesystem da provare.

## Funzionamento

Il programma apre il CSV in sola lettura, cerca nuove righe terminate da LF/CRLF
e registra in SQLite riga originale (byte), UUID v4, generazione, posizione,
payload congelato e cursore nella stessa transazione. Due righe identiche sono
due eventi diversi. Il reset dei secondi Arduino non cambia questa regola.
Una riga senza newline resta in attesa; non viene consumata dopo un timeout.

Prima di inviare esiste già una copia durevole. Dopo un'interruzione riparte dagli
stessi ID. Solo una conferma `accepted`/201 o `duplicate`/200 con sorgente, UUID e
ricezione coerenti chiude l'evento. Un timeout, anche dopo il salvataggio server,
causa retry dello stesso payload. Gli eventi confermati restano nel registro.

Il parser replica il formato a quattro campi dichiarato: secondi Arduino, °C, %, hPa.
Separatore, decimali, encoding, intestazione e politica dei vuoti sono obbligatori
in configurazione. Non c'è riconoscimento automatico. Numeri sospetti conservati:
la classificazione «probabile errato» è assegnata dal backend v1. Righe illeggibili
e rifiuti permanenti 400/409/413/415/422 sono conservati in quarantena con motivo.
L'originale non viene corretto o modificato.

## Ora di acquisizione e limiti del monitor

`measured_at` resta sempre null: il CSV dichiarato non contiene un'ora assoluta.
Senza `acquisition_kind`, o con `historical`, ogni riga ha `captured_at: null`.
La modalità `synthetic` deve essere richiesta esplicitamente nella configurazione:
assegna `captured_at` sul PC, mantiene `measured_at: null` e aggiunge
`_provenance.kind: synthetic`, validato anche dall'endpoint e dal vincolo DB.
Non rappresenta un'ora di misura della stazione. La modalità `live` resta soggetta
alla verifica del writer descritta sotto.

Per creare uno scenario sintetico con orari distanziati (senza simularne il tempo
d'attesa), la sola modalità `synthetic` può abilitare
`synthetic_timestamp_column: true`. Il CSV passa a cinque campi:
`contatore_scenario;temperatura;umidità;pressione;captured_at`; l'ultimo deve
essere un timestamp UTC esplicito con `Z`. Le intestazioni configurate devono
avere cinque campi. Il timestamp è soltanto l'ora dello scenario sintetico:
`measured_at` resta null e ogni record conserva provenienza `synthetic`. Questa
opzione è rifiutata per `live` e `historical`.

Impostare `live_verified: true` solo dopo DATA-01–DATA-03: writer append verificato,
clock UTC corretto, latenza/buffering noti e completamento riga osservabile. In
esecuzione continua il timestamp UTC al millisecondo viene assegnato solo a una
singola riga nuova fra due osservazioni distanti al massimo 10 secondi. Prima
lettura, `--once`, righe già parzialmente presenti, batch di più righe e riprese
dopo pause più lunghe restano storico. Il timestamp descrive l'osservazione sul PC,
non l'istante fisico della misura. Il polling locale è ogni 2 secondi, distinto
dal polling futuro del sito. Questi limiti conservativi potranno essere adattati
solo dopo la prova del writer; il monitor da solo non certifica assenza di buffering.

Un file sostituito/troncato o un cambiamento delle porzioni già lette controllate
provoca fermo per riconciliazione. Non si assegnano automaticamente nuovi ID al
file successivo. I controlli incrementali usano identità del filesystem, dimensione,
mtime a EOF e hash di testa/coda (4 KiB ciascuna). **Non garantiscono il rilevamento
di riscritture arbitrarie nella parte centrale di un grande file**: un writer che
riscrive richiede un adattatore diverso. Nessun accesso esclusivo al CSV è imposto.
UTF-8 senza BOM o cp1252, record su una sola riga e terminatore LF/CRLF sono i soli
formati predisposti. BOM, altri encoding e CSV multilinea richiedono verifica e
adattamento; niente deduzioni dal nome CSV. Oltre 64 KiB per riga il programma si
ferma, conservando il cursore e la sorgente.

## Preparazione sul PC autorizzato

Procedura predisposta, **non eseguita**. Non sostituire i segnaposto senza aver
osservato sorgente e writer. L'esempio `config.example.json` contiene un dialetto
puramente illustrativo, non quello della stazione, e un endpoint `.invalid`.

1. Verificare `py -3 --version`, orologio Windows, sincronizzazione ora, permessi
   dell'account tecnico, rete/proxy e accesso al CSV. Scegliere percorsi locali
   stabili e non sincronizzati per SQLite; non usare share di rete per lo stato.
2. Copiare il pacchetto `uploader/` in una cartella applicativa. Creare una cartella
   di stato separata, scrivibile soltanto dall'account tecnico e amministratori.
   `state_dir` contiene anche quarantena e ricevute: proteggerla e copiarla con il
   registro. Nel repository usare eventualmente `uploader/runtime/`, già ignorata.
3. Preparare un JSON locale fuori Git (oppure `uploader/config.local.json`, ignorato).
   Specificare percorsi assoluti, dialetto e intestazione esatta o `null` se assente.
   Sorgente registrata in BE-07: `meteolivelli`; verificare il target nel verbale
   `docs/backend-verification.md`. Non trasferire chiavi DB o service_role sul PC.
4. Configurare nell'ambiente del processo il solo `STATION_INGEST_TOKEN` già
   concordato con l'endpoint. Usare un canale protetto dell'account tecnico; niente
   token in JSON, argomenti CLI, script, screenshot o cronologia dei comandi.
   L'attuale loader legge solo questa variabile, non carica `.env` e non integra
   Windows Credential Manager: la custodia definitiva va verificata sul PC.
5. Solo per una sorgente mai importata, inizializzare una volta dalla cartella
   applicativa, senza rete né token:

   ```powershell
   py -3 -m uploader --config "C:\PERCORSO_CONFIG_VERIFICATO\config.json" --initialize
   py -3 -m uploader --config "C:\PERCORSO_CONFIG_VERIFICATO\config.json" --status
   ```

   **Attenzione:** l'inizializzazione parte dall'offset zero. Al primo ciclo
   vengono quindi lette e inviate tutte le righe complete già presenti nel CSV,
   non soltanto quelle aggiunte dopo l'installazione. Prima di inizializzare,
   concordare se importare l'intero storico. Non eseguire il comando sul CSV
   originale per fare una prova: usare una copia isolata e un target di prova.
   La procedura attuale non offre un'opzione per iniziare dalla fine del file.

6. Dopo aver verificato destinazione e contratto, avviare un ciclo oppure la
   modalità continua. Il ciclo può acquisire fino a 100 righe e inviare fino a 20
   eventi pronti; il lavoro rimanente persiste per i cicli successivi:

   ```powershell
   py -3 -m uploader --config "C:\PERCORSO_CONFIG_VERIFICATO\config.json" --once
   py -3 -m uploader --config "C:\PERCORSO_CONFIG_VERIFICATO\config.json"
   ```

La singola istanza usa un lock del sistema operativo nella cartella di stato,
rilasciato anche dopo crash. Usare sempre lo stesso `state_dir` per la sorgente:
due cartelle diverse non condividono il lock o l'identità degli eventi.

## Avvio automatico Windows (UP-04 da provare)

Nell'Utilità di pianificazione predisporre un'attività per l'account tecnico con
trigger all'avvio, esecuzione anche senza sessione utente e opzione «non avviare
una nuova istanza». Usare il percorso assoluto dell'interprete verificato con
`py -3 -c "import sys; print(sys.executable)"`, argomenti `-m uploader --config
"C:\PERCORSO_CONFIG_VERIFICATO\config.json"` e cartella iniziale dell'applicazione.
Non inserire il token negli argomenti. Verificare che l'ambiente del processo
pianificato riceva il segreto protetto: non basta quello del terminale interattivo.
Configurare ripartenza dopo errore e verificare condizioni su alimentazione,
sospensione e accesso al file; un riavvio con errore auth non cancella la sospensione
persistente. Nessuna attività Windows è creata automaticamente da questo pacchetto.

Per fermare: Ctrl+C in primo piano; nell'attività pianificata arrestare il processo
e verificare che non sia più attivo prima di aggiornare i file applicativi.
Per aggiornare, conservare configurazione e stato; non inizializzare di nuovo.
Questa versione non migra automaticamente schemi SQLite diversi da v1.

Prova necessaria: avvio senza login, nuova riga fino al DB, reboot, file occupato,
sospensione/ripresa, rete assente/ripristinata e replay invariato degli ID. Richiede
accesso al PC e target concordato; non è sostituita dai test locali su macOS.

## Diagnosi, recupero e capacità

`--status` mostra conteggi per stato e motivo di sospensione, senza leggere token
o CSV. I log contengono solo messaggi controllati e conteggi; rotazione di 256 KiB
con tre copie. Mai stampare le risposte HTTP arbitrarie o le eccezioni originali.
Per ispezionare la quarantena usare una copia consistente di SQLite sul PC, senza
pubblicarla: contiene le righe originali. Non ci sono email o monitor indipendente
in questa fase; un processo spento non può avvisare da solo (OPS-02).

- **Offline/408/429/5xx:** tentativi persistenti, backoff con jitter fino a 256 s
  prima di eventuali `Retry-After` più lunghi; supportati secondi e data HTTP.
  Un errore di protocollo o redirect sospende l'invio; nessun token inoltrato
  attraverso redirect. HTTPS con validazione certificato standard, timeout 15 s.
- **401/403:** invio sospeso e uscita con codice 2; dopo aver corretto credenziale,
  sorgente e target, usare `--resume` e poi riavviare. Nessuna riga cancellata.
- **Conferma illeggibile/incoerente:** evento ancora in coda, stesso payload/ID.
- **Disco:** sotto 64 MiB liberi il ciclo si ferma senza cancellare righe. Un errore
  SQLite annulla la transazione; la sorgente deve rimanere disponibile. Misurare
  crescita reale di CSV e SQLite e capacità libera prima di promettere giorni di
  autonomia offline. Nessuna durata offline garantita o pulizia automatica.
- **File sostituito, stato perso/corrotto o configurazione diversa:** arrestare,
  preservare copie e riconciliare generazione/offset/ID. Non cancellare cartella,
  marcatore `initialized` o SQLite per far ripartire. `--initialize` rifiuta stato
  o marcatore preesistente; senza entrambe le copie la perdita totale non è
  riconoscibile automaticamente. Non è ancora fornito un comando di cambio
  generazione: questa operazione richiede esame del writer e riconciliazione.
- **Restore:** usare `sqlite3.Connection.backup()` per una copia consistente;
  copiare anche configurazione non segreta, marcatore e CSV. Non copiare un DB
  aperto con una semplice copia del file. Dopo restore server precedente alle
  conferme locali, `--replay-confirmed` riporta in coda gli eventi confermati
  conservando payload e ID; poi riavviare. Nessuna correzione automatica dei conflitti.
  Il restore effettivo e il backup indipendente restano OPS-01.

## Verifiche ripetibili

Da root, su macOS/Linux: `npm run uploader:test` (richiede `python3`). Su Windows:
`py -3 -m unittest discover -s uploader/tests -v`. Nessuna dipendenza pip.
`npm run check` include anche i test Python, oltre ai controlli frontend/backend.
Su Windows senza alias `python3`, eseguire separatamente i comandi npm frontend/
backend e il comando `py -3` precedente.

Le prove coprono parsing, parziali, ripetizioni/reset, quarantena, restart, rollback
atomico mediante errore SQLite indotto, perdita conferma, retry, 429/5xx, auth,
replay invariato, conferme incoerenti e lock locale. Non simulano un'interruzione
elettrica fisica, un disco realmente pieno, TLS/proxy della scuola o il runtime
Windows. Non attestano l'acquisizione della stazione né un invio remoto.

Il protocollo usato è quello degli handler v1 nel repository, con `Authorization:
Bearer` e autorizzazione della sorgente nell'handler. La distinzione tra controllo
JWT della piattaforma e autenticazione applicativa è documentata da
[Supabase](https://supabase.com/docs/guides/functions/auth); nessuna configurazione
del backend è stata modificata in questa fase.

## Colonna timestamp di misura (AUD-03, 27 ottobre 2026)

Chiave opzionale `measured_timestamp_column` (booleana, default `false`): quando
è `true` il CSV ha una quinta colonna con l'**ora di misura attestata dal writer**
(formato UTC rigoroso `AAAA-MM-GGTHH:MM:SS[.mmm]Z`, come il timestamp scenario).
Il valore diventa `measured_at` dell'evento; `captured_at` resta l'osservazione
sul PC secondo le regole usuali. Ammessa per `acquisition_kind` `live` e
`historical`, **mai** per `synthetic`; incompatibile con
`synthetic_timestamp_column`. La colonna non esiste o non è attendibile: tenere
`false`, perché `measured_at` nullo è preferibile a una data inventata; la
ricostruzione da uptime Arduino non è implementata e non è equivalente.

## Collaudo del primo avvio (AUD-02 / REL-01)

Checklist per il primo contatto con la sorgente reale; ogni passo va documentato
con esito. Finché non è completata, i dati della stazione non sono attestati.

1. Campione reale del CSV del writer (anche poche righe): annotare separatore,
   decimali, eventuale intestazione, encoding e numero di colonne. **Non** usare
   `tests/fixtures/Prova misure.csv` come riferimento: è sintetico e non compatibile.
2. Allineare `config.json` al dialetto osservato; per il primo invio usare
   `acquisition_kind: "historical"` (o `live` con `live_verified: true` solo dopo
   aver verificato il comportamento del writer).
3. `python -m uploader --config <cfg> --initialize` su una cartella di stato nuova
   **e conservarne subito una copia di backup** (vedi runbook in
   [operations.md](../docs/operations.md)).
4. `python -m uploader --config <cfg> --status`: attese righe in `pending`, zero
   in `quarantine`. Righe in quarantena con `csv_non_valido` ⇒ dialetto errato:
   correggere la configurazione, non lo stato.
5. Primo invio reale con `--once` (storico) oppure avvio continuo con
   `live_verified` se l'ora PC è attendibile; verificare le ricevute e la
   comparsa in dashboard con `scripts/check-station-health.mjs`.
6. Provare esplicitamente: riavvio del PC (ripresa dallo stesso outbox),
   interruzione di rete e ripresa, reset di Arduino (il contatore riparte senza
   duplicati né date inventate) e writer che aggiunge righe durante l'esecuzione.
7. Registrare gli esiti in `tasks.md` (UP-01–UP-04, REL-01) prima di dichiarare
   operativa la catena di acquisizione.

**Verifica ricevute (audit 27 ottobre 2026):** le risposte di conferma devono
essere JSON UTF-8. Risposte UTF-16/32 o malformate lasciano l’evento pendente;
il retry conserva identità e payload, senza interrompere il processo.
