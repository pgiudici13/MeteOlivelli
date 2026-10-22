# BE-07 — verifica del backend Supabase

**Prova successiva, 22 ottobre 2026:** completata anche la verifica CSV sintetico
→ uploader Python → HTTPS → DB, con retry, concorrenza, controlli SQL e pulizia
finale. [Verbale della prova CSV](backend-csv-verification.md). Le evidenze BE-07
riportate sotto restano il registro dell'intervento precedente.

**Data:** 22 ottobre 2026. **Target scelto esplicitamente dall’utente:** progetto
esistente `MeteOlivelli`, riferimento `pvtzncseisbxaaseqfvo`, regione eu-west-1,
PostgreSQL 17.11.0.003. Nessun progetto o servizio a pagamento attivato.

## Stato applicato

Prima dell'intervento: nessuna tabella in public, funzione Edge o migrazione;
nessuno schema applicativo aggiuntivo rilevato. Nessun dato applicativo preesistente
modificato. Nessun avviso iniziale di sicurezza.

- Migrazione remota `20261022125448`, nome `station_backend_v1`.
- File locale rinominato allo stesso identificatore remoto dopo applicazione via
  connettore; era stato creato inizialmente con `supabase migration new`.
- Tabella `public.station_measurements`, RLS attiva, chiave sorgente/UUID e due indici.
- RPC invoker ingest/read, grant espliciti; nessun accesso diretto anon/authenticated.
- Edge Function `ingest-measurement` e `read-measurements`, entrambe ACTIVE,
  versione finale 3, `verify_jwt=false` coerente con auth handler/pubblico.
- Sorgente definitiva `meteolivelli`. Configurazione server creata tramite CLI;
  token casuale conservato anche in `supabase/functions/.env.station.local`,
  ignorato da Git, permessi 600. Nessun valore di segreto nei documenti, log o client.
  Non copiare questo file in una build o in un canale pubblico.

[Endpoint pubblico di lettura](https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/read-measurements).
Endpoint di ingestione: stesso prefisso con `ingest-measurement`, solo POST con
token della stazione. Nessun collegamento frontend o uploader installato da BE-07.

## Prove eseguite

`supabase/tests/station_backend.sql` eseguito sul target scelto e concluso con
ROLLBACK: grant per anon/authenticated/service_role, RLS, accessi respinti,
prima accettazione, retry e primo received_at immutato, conflitto senza overwrite,
ID diversi con valori uguali, ultimo evento coerente, spareggio UUID, storico
senza data, paginazione e vincoli di tempo/numeri finiti.

Le prove HTTPS hanno usato una sorgente temporanea `fixture-sintetica-be07`,
separata dalla sorgente definitiva. Eventi solo historical, captured_at e measured_at
nulli: nessuna misura inventata nei grafici o nella scheda corrente. Esiti:

| Prova | HTTP / risultato |
|---|---|
| Lettura anonima iniziale, finale e periodi 24h/7g/30g | 200, items vuoto |
| Token assente o errato | 401 |
| Metodo di ingestione errato | 405 |
| JSON malformato / contratto invalido | 400 / 422 |
| Corpo oltre 16 KiB / Content-Type errato | 413 / 415 |
| Sorgente non associata al token | 403 |
| Primo invio / retry dopo ricevuta ignorata | 201 / 200, stesso received_at |
| ID uguale e contenuto diverso | 409 |
| Valori uguali con ID diverso | 201 |
| Sei richieste HTTP simultanee per lo stesso evento | una 201, cinque 200, stessa ricevuta |
| Anomalia di umidità | Valore conservato, flag «probabile errato» |
| Query pubblica invalida / tentativo di POST su read | 400 / 405 |
| Preflight CORS della lettura | 204, Access-Control-Allow-Origin * |
| GET/POST/PATCH/DELETE diretti sulla tabella con chiave pubblica | 401 |
| Chiamata diretta alle due RPC con chiave pubblica | 401 |
| Vecchia sorgente di test dopo configurazione definitiva | 403 |

Gli invii HTTP hanno persistito tre eventi sintetici: eliminati esclusivamente
per sorgente e UUID generati dalla prova, verificando anche tipo historical e date
nulle. Il conteggio finale reale è **zero eventi**, RLS ancora attiva. Le fixture SQL
e le prove di volume sono state annullate con rollback. Nessuna cancellazione di
dati della stazione.

Prova di volume: 8.760 eventi orari sintetici (un anno), isolati per sorgente e
annullati. RPC storico 30g con limite 500: 501 righe incluso lookahead. EXPLAIN
ANALYZE della query temporale ordinata: Index Only Scan su
`station_measurements_captured_idx`, 501 righe, 0,556 ms di esecuzione osservati.
È una singola prova DB con cache calda, non una garanzia di latenza HTTP o capacità
in produzione. Nessuna statistica, interpolazione o stima ricavata dalle fixture.

Advisor prestazioni: nessun avviso. Advisor sicurezza: solo INFO
[RLS Enabled No Policy](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy),
coerente con il disegno: nessuna policy pubblica, grant revocati e server service_role.
Non è stata aggiunta una policy permissiva per eliminare l’avviso.

## Limiti e recupero

BE-07 è verificato sul contratto locale v1. CSV, writer, clock e Windows reali
restano DATA-01–DATA-03/UP-01–UP-04: nessuna prova della catena fisica Arduino → sito.
La UI rimane “Work in progress”, senza misure. Le letture positive con dati sono
provate via RPC in transazione; l’endpoint pubblico è provato nello stato vuoto.
Non sono stati forzati un guasto DB o una disconnessione dopo commit nel servizio
remoto: gli errori sono coperti dai test locali con store simulato. Nessuna garanzia
sul rate limit distribuito: risposta 429 e soglie della piattaforma non misurate;
monitoraggio e capacità restano verifiche operative prima del rilascio completo.
Nessuna suite frontend dedicata aggiunta.

39 test locali sintetici, build/lint e check/lint/formato backend già superati nella
preparazione dei medesimi moduli. Nessun codice TypeScript cambiato nel deploy.
Nessun commit, push, configurazione Vercel o pubblicazione frontend eseguiti.

Per fermare ingestione revocare/sostituire il token tramite configurazione protetta;
non eliminare la tabella. Per correggere un endpoint usare il codice versionato e
una nuova versione della funzione, preservando eventi e ricevute. Mai eseguire reset
o DROP come annullamento del deploy. Backup indipendente/restore sono OPS-01,
non sono attestati dalla sola applicazione della migrazione.
