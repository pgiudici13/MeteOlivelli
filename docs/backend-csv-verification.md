# Prova backend con CSV sintetico — 22 ottobre 2026

**Esito: superato.** Richiesta esplicita dell'utente di testare il backend con
Supabase e un CSV fittizio. Target verificato tramite connettore Supabase:
`MeteOlivelli`, `pvtzncseisbxaaseqfvo`, eu-west-1, stato ACTIVE_HEALTHY.
Funzioni ingest/read ACTIVE v3, `verify_jwt=false`; autenticazione della stazione
verificata dall'handler. Nessun deploy, modifica dello schema/configurazione,
servizio a pagamento, commit o push.

## Dati e percorso effettivamente provati

**Tutti i dati sono inventati, non misure della stazione.** Fixture versionata:
[`synthetic_backend.csv`](../uploader/tests/fixtures/synthetic_backend.csv), con
[descrizione del dialetto sintetico](../uploader/tests/fixtures/README.md).
Il dialetto non certifica il formato del CSV scolastico.

Percorso reale: copia temporanea del CSV → parser Python → SQLite/outbox →
HTTPS `ingest-measurement` → RPC/database Supabase. Il connettore Supabase ha
verificato stato del progetto, persistenza, contenuti, flag qualità e pulizia.
Il token già custodito localmente è stato usato soltanto in memoria per le
richieste di ingestione, senza stamparlo, copiarlo negli artefatti o usare chiavi DB
nell'uploader. Nessun valore di credenziale è stato modificato.

Baseline: **zero eventi**. Tutti gli invii HTTP di prova sono `historical`, con
`captured_at` e `measured_at` nulli, quindi esclusi dalle schede live e dai grafici.
Prima del primo invio è stato scritto un manifesto locale dei sette UUID
sintetici. Sono stati persistiti sei eventi del CSV e un evento aggiuntivo per la
concorrenza; la riga non numerica è rimasta soltanto in quarantena locale.

## Risultati osservati

| Verifica | Esito |
|---|---|
| Ultima riga inizialmente senza terminatore | Non consumata; acquisita soltanto dopo completamento |
| Restart dell'outbox prima degli invii | Identità e payload conservati |
| Sei righe numeriche del CSV | Sei risposte 201, sei eventi distinti |
| Due righe identiche e reset del contatore a zero | Eventi conservati con UUID distinti |
| Riga non numerica | Quarantena con originale, senza bloccare le altre |
| Ricevuta ignorata dopo un vero 201 remoto | Retry 200; stesso UUID, payload e `received_at` |
| Replay di tutti i sei confermati | Sei risposte 200, date di ricezione immutate, nessun duplicato |
| Stesso ID con temperatura cambiata | 409; payload persistito invariato |
| Sei richieste simultanee con un nuovo ID | Una 201, cinque 200, un solo evento e stessa ricezione |
| Umidità sintetica 101% | Conservata, flag «probabile errato» verificato nel DB |
| Temperatura vuota con policy null | Null conservato, flag `missing_value` verificato nel DB |
| Token assente / errato | 401 / 401 |
| Sorgente diversa da quella autorizzata | 403 |
| GET sull'ingestione | 405 |
| JSON malformato / contratto incompleto | 400 / 422 |
| Content-Type errato / corpo oltre 16 KiB | 415 / 413 |
| GET pubblico latest e storico 24h/7g/30g | 200, nessuna fixture storica senza data esposta |
| GET storico con base `measured_at` | 200, nessuna data inventata |
| Query lettura invalida / POST sulla lettura | 400 / 405 |
| Preflight CORS | 204, origine `*` |
| Confronto diretto DB/manifesto | Sette payload identici a quelli inviati, tutti storici senza date |

In aggiunta, `supabase/tests/station_backend.sql` è stato rieseguito tramite
connettore sul target verificato: privilegi effettivi, RLS, RPC, idempotenza,
conflitti, vincoli, letture positive e paginazione superati. Le relative fixture
di sorgente separata sono state annullate con **ROLLBACK**.

## Pulizia e stato finale

Eliminati **esclusivamente sette eventi del manifesto**, verificando congiuntamente
sorgente, UUID, payload completo e provenienza historical con date nulle. Nessuna
cancellazione generica per sorgente, TRUNCATE o modifica di dati reali.

Controllo indipendente successivo alla cancellazione: **zero eventi residui**, RLS
ancora attiva. Il numero di eventi iniziale e finale coincide. Manifesto non
segreto e risultati sono archiviati in
[`test-evidence/backend-csv-2026-10-22.json`](test-evidence/backend-csv-2026-10-22.json).

## Limiti

Questa prova conferma la pipeline applicativa sul contratto v1 con un CSV
sintetico. Non verifica writer, seriale, sensori, clock, installazione o runtime
Windows. DATA-01–DATA-03 e UP-01–UP-04 restano aperti per la catena fisica.

La perdita di ricevuta è simulata dal client **dopo aver ricevuto un vero 201**;
non è una disconnessione di rete provocata sul servizio. Le letture positive e
la paginazione sono provate via RPC in transazione con rollback; HTTP read è
provato con risultati vuoti e corretta esclusione dello storico senza data.
Non sono stati esposti dati live sintetici per ottenere un grafico positivo.
Nessuna misura di carico sostenuto, rate limit 429, guasto DB, disponibilità
continua, backup/restore operativo o previsione meteorologica attestata.

Nessun codice applicativo è cambiato in questa prova: sono stati aggiunti soltanto
fixture, evidenze e documentazione. Build/lint non rieseguiti per queste aggiunte;
i loro esiti precedenti restano quelli della Fase 6. I test reali di questo
intervento sono quelli HTTP, CSV/outbox e SQL elencati sopra.
