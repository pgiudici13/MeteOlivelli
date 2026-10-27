# Prove database — BE-07

`station_backend.sql` verifica grant, RLS, accessi negati, unicità, conflitti,
immutabilità della ricevuta, parità di valori, storico e lettura/paginazione.
Usa una sorgente esclusivamente sintetica e termina con ROLLBACK.
Eseguito con successo tramite connettore sul progetto esistente scelto
dall’utente il 22 ottobre 2026, con ROLLBACK. Per ripeterlo usare un target
autorizzato e psql ON_ERROR_STOP; [verbale](../../docs/backend-verification.md).
Non fa parte di `npm run backend:test`: quel comando non accede a un database.

`read_query_indexes.sql` è la regressione della migrazione AUD-11 (indici e RPC
con rami separati, [migrazione predisposta](../migrations/20261027120000_read_query_indexes.sql)):
verifica presenza degli indici, semantica invariata di latest/finestre/cronologia,
paginazione e validazione dei parametri. Anch'esso termina con ROLLBACK e va
eseguito solo sul target autorizzato DOPO l'applicazione della migrazione,
insieme a `station_backend.sql`. La verifica EXPLAIN dell'uso degli indici è
un controllo manuale separato sul volume dichiarato.

## Protocollo concorrente su due connessioni

BE-07 ha verificato sei richieste HTTP contemporanee, una 201 e cinque 200
con la stessa ricevuta. L’interleaving deterministico qui sotto è una verifica
aggiuntiva non eseguita manualmente sul target remoto.

Su due connessioni nel DB autorizzato, con ruolo service_role e fixture sintetica:

1. A apre BEGIN e chiama `ingest_station_measurement` con un nuovo ID; lascia
   aperta la transazione dopo la risposta accepted.
2. B invia lo stesso payload. Deve restare in attesa del vincolo univoco.
3. A esegue COMMIT. B deve restituire duplicate e lo stesso received_at.
4. Ripetere con stesso ID e valore diverso in B: deve restituire conflict.
5. Ripetere facendo ROLLBACK di A: B deve diventare accepted.
6. Verificare una sola riga per ID, poi rimuovere esclusivamente le fixture
   concordate con l'amministratore del DB di prova.

Non confondere uno store simulato nei test HTTP con questa prova PostgreSQL.
L'applicazione, l'esecuzione SQL e la prova su due connessioni sono BE-07.
