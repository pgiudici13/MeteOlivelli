# Cinque campioni di prova — 22 ottobre 2026

## Autorizzazione e destinazione

L’utente ha autorizzato commit/push su `main`, la postilla visibile “Work in progress · Possibili dati presenti fittizi” e, successivamente, l’aggiornamento di schema ed endpoint per distinguere i campioni sintetici. Target verificati: Supabase MeteOlivelli `pvtzncseisbxaaseqfvo`; Vercel `meteolivelli`, team `team_WF8R8uiIvXzKOKJgGrlcCYtF`.

Il primo rilascio `fab71cb` ha pubblicato grafica, motion, hover e postilla sul dominio principale, verificato READY e HTTP 200. La lettura pubblica allora rispondeva con archivio vuoto: nessun problema di connessione. I precedenti tentativi di inserimento come `live` sono stati rifiutati dalla revisione automatica e non hanno scritto righe. La nuova implementazione usa il tipo distinto `synthetic`.

## Contratto applicato

Migrazione remota e locale `20261022194231_synthetic_measurement_kind`:

- `acquisition_kind` ammette `live`, `historical`, `synthetic`. I sintetici richiedono timestamp di scenario in `captured_at`, `measured_at` NULL e metadato `_provenance.kind = synthetic`.
- Indice parziale delle acquisizioni aggiornato per includere il tipo distinto. RLS, ruoli, privilegi e RPC di scrittura conservati.
- La RPC di lettura espone `acquisition_kind`, include i sintetici nelle finestre `captured_at`; non li tratta come misure fisiche in `measured_at`. Una misura `live` ha priorità sui campioni di prova nella lettura `latest`.
- Endpoint pubblico `read-measurements` ripubblicato; proiezione esplicita del tipo senza esporre payload/raw. Nessun SDK o segreto client.
- Client: conserva e valida il tipo, accetta risposte precedenti prive del campo per compatibilità di rilascio; un sintetico non diventa “aggiornato” nel calcolo di freschezza. L’ingestione ordinaria rifiuta `synthetic`: i cinque campioni sono un inserimento amministrativo richiesto, non una misura Arduino.
- L’interfaccia mantiene soltanto la postilla concordata, senza selettori o altre etichette aggiunte. La postilla deve restare visibile finché questi campioni sono esposti.

## Inserimento verificato

Batch idempotente `ui-preview-20261022-five-half-hour`, nella stessa tabella finale `public.station_measurements`, source `meteolivelli`. Nessuna modifica o cancellazione dei record preesistenti. Cinque righe, tipo `synthetic`; `received_at` è l’ora effettiva di inserimento, `measured_at` rimane NULL. Gli orari della tabella seguente sono tempi di scenario, non acquisizioni reali della stazione.

| Europe/Rome, 22 ottobre | °C | % | hPa |
|---|---:|---:|---:|
| 19:43 | 18,2 | 65,4 | 1015,2 |
| 20:13 | 18,0 | 66,1 | 1015,4 |
| 20:43 | 17,7 | 67,0 | 1015,5 |
| 21:13 | 17,5 | 67,6 | 1015,7 |
| 21:43 | 17,3 | 68,2 | 1015,8 |

Query SQL conferma count 5, intervalli minimo/massimo 1800 secondi e provenienza corretta. Identificativi e risposte pubbliche in [evidenza JSON](data-preview-verification/results.json). Per rimuoverli in futuro selezionare il batch esplicito; nessuna cancellazione automatica prevista in questo intervento.

## Verifiche

- `npm run check`: build/lint, 18 test frontend, 41 Deno, 21 Python superati.
- `supabase/tests/station_backend.sql` e `supabase/tests/synthetic_measurements.sql` eseguiti nel progetto autorizzato: rollback finale, nessuna fixture persistente. Verificati isolamento dei ruoli, idempotenza/cursori, tipo sintetico, cinque campioni, vincolo di provenienza, assenza di data fisica.
- Advisor Supabase: solo INFO preesistente RLS attiva senza policy; comportamento voluto con accesso diretto pubblico revocato. Nessun ampliamento dei privilegi.
- 13 scenari browser locali superati. Lo stato vuoto è ora intercettato nel test, per non dipendere dal contenuto del database pubblico.
- Collaudo reale API → pagina pubblica, senza mock: postilla visibile, 4 grafici, 5 righe di cronologia, ultimo valore 17,3 °C, reflow a 390 px e nessun errore JavaScript. [Desktop](data-preview-verification/desktop.png), [mobile](data-preview-verification/mobile.png).

I dati non attestano funzionamento di Arduino, writer o uploader Windows; UI-02 reale e WX restano aperti.
