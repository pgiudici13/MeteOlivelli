# Gestione operativa — MeteOlivelli

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

1. Aprire il sito e controllare postilla, stato delle misure, ultimo campione e cronologia. HTTP 200 indica disponibilità della pagina, non freschezza della stazione.
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
