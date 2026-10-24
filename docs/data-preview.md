# Campioni di prova — stato al 24 ottobre 2026

## Batch corrente: 241 campioni ogni tre ore

Su richiesta esplicita del 24 ottobre sono state sovrascritte tutte le righe
presenti in `public.station_measurements` del progetto Supabase MeteOlivelli
`pvtzncseisbxaaseqfvo`. La lettura prima dell’intervento mostrava 11 righe,
tutte già `synthetic` per la sorgente `meteolivelli`; non erano presenti righe
`live` o `historical`. Il batch `ui-preview-20261024-thirty-day-three-hour`
contiene 241 nuovi record, uno ogni 10.800 secondi, dal 24 settembre 2026
14:08:07 al 24 ottobre 2026 14:08:07 Europe/Rome. Gli istanti sono tempi di
scenario, ancorati all’istante corrente della sostituzione. Temperature,
umidità e pressione sono valori generati per il test, non misure osservate.

Ogni record ha `acquisition_kind = synthetic`, `measured_at = NULL`,
`payload._provenance.kind = synthetic`, `physical_observation = false` e
mantiene la postilla pubblica esistente. La verifica SQL dopo la scrittura ha
confermato 241 righe, intervalli minimo e massimo di 10.800 secondi e zero righe
non conformi. Intervalli dei valori generati: 9,3–22,8 °C, 54,7–78,7% e
1010,7–1017,6 hPa. Nessuna migrazione o modifica dei privilegi.

La scrittura ha rimosso le 11 righe precedenti e le ha sostituite nel database;
il vecchio batch `ui-preview-20261023-ten-six-hour` non è più presente. Le
sezioni sottostanti sono verbali storici dei batch precedenti.

## Verbale storico: dieci campioni ogni sei ore

Su richiesta esplicita del 23 ottobre, aggiornati i cinque record sintetici precedenti e aggiunti altri cinque nel progetto Supabase MeteOlivelli `pvtzncseisbxaaseqfvo`. Nuovo batch `ui-preview-20261023-ten-six-hour`; il precedente `ui-preview-20261022-five-half-hour` non contiene più righe. UUID e `received_at` dei cinque record aggiornati conservati; payload e raw aggiornati coerentemente ai valori di scenario. Nessun record live/historical modificato, nessuna migrazione o modifica dei privilegi.

SQL verifica 10 record, intervalli minimo e massimo 21600 secondi, tutti `synthetic`, `measured_at` NULL e provenienza sintetica. Orari **di scenario**, in Europe/Rome:

| Data e ora | °C | % | hPa |
|---|---:|---:|---:|
| 21 ottobre 00:00 | 13,8 | 78,0 | 1014,2 |
| 21 ottobre 06:00 | 12,6 | 81,5 | 1014,5 |
| 21 ottobre 12:00 | 18,1 | 64,2 | 1014,8 |
| 21 ottobre 18:00 | 20,4 | 57,8 | 1014,4 |
| 22 ottobre 00:00 | 14,2 | 76,3 | 1015,0 |
| 22 ottobre 06:00 | 12,9 | 80,1 | 1015,4 |
| 22 ottobre 12:00 | 18,7 | 62,4 | 1015,7 |
| 22 ottobre 18:00 | 21,1 | 55,6 | 1015,3 |
| 23 ottobre 00:00 | 14,6 | 74,8 | 1015,9 |
| 23 ottobre 06:00 | 13,2 | 79,2 | 1016,2 |

Postilla pubblica conservata. Prove del frontend locale con API reale in [auto-verification/results.json](auto-verification/results.json). La modifica del database è remota; la correzione del frontend resta locale, senza nuovo commit/push/deploy.

## Verbale storico: cinque campioni del 22 ottobre

Le sezioni seguenti descrivono il batch precedente, ora sostituito.

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
