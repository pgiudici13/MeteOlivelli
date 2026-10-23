# Inventario servizi — verifica in sola lettura

## Stato del rilascio applicativo — 22 ottobre 2026

Versione pubblica `bce39e2` su `main`, Vercel `meteolivelli`, ID `prj_Jlxt1vouwTWorxUmqBbCxzRJK4Xm`, team `team_WF8R8uiIvXzKOKJgGrlcCYtF`, dominio [meteolivelli.vercel.app](https://meteolivelli.vercel.app/). Deploy `dpl_5RJvmAgBs38hmsfCJdmE7PMgicvt` verificato READY con lo stesso commit.

Supabase `pvtzncseisbxaaseqfvo`: aggiunta migrazione `20261022194231_synthetic_measurement_kind`, lettura `read-measurements` ripubblicata e cinque record di prova `synthetic` inseriti su richiesta; l’ingestione sensori e i permessi restano invariati. [Contratto, batch ed evidenze](data-preview.md). Il backend non è più vuoto. Nessun servizio a pagamento, monitor o backup è stato attivato in questi interventi.

Target, diagnosi e limiti in [operations.md](operations.md). Le sezioni successive sono inventari storici delle rispettive sessioni: nomi/versioni/assenza dati riportati al loro interno non sostituiscono questo stato di rilascio. Quote e condizioni non sono state rivalutate nella revisione documentale.

Verifica: 21 ottobre 2026, task SET-04. Nessun progetto, tabella, funzione, migrazione,
chiave, dominio o piano a pagamento creato o modificato. Nessun valore di `.env`,
token, chiave API o password recuperato.

## GitHub

**Verificato tramite connettore GitHub:** repository `pgiudici13/MeteOlivelli`, pubblico,
non archiviato, branch predefinito `main`. Il controllo riguarda metadati, non un
fetch o la sincronizzazione attuale dei commit locali con il server.

All'inizio del setup il branch locale è `main`; i quattro documenti di pianificazione
sono già presenti e non tracciati. Il loro contenuto va preservato e aggiornato,
senza creare commit automaticamente.

## Supabase

**Verificato tramite connettore Supabase:**

| Elemento | Esito |
|---|---|
| Progetto | `MeteOlivelli` |
| Riferimento progetto, non segreto | `pvtzncseisbxaaseqfvo` |
| Regione | `eu-west-1` |
| Stato al controllo | `ACTIVE_HEALTHY` |
| PostgreSQL dichiarato dal servizio | 17.11.0.003 |
| Tabelle nello schema `public` | Nessuna restituita da `list_tables`, filtro `public` |
| Edge Functions | Nessuna restituita da `list_edge_functions` |
| Migrazioni registrate | Nessuna restituita da `list_migrations` |

Non è un inventario di tutti gli schemi di sistema/privati. Non ci sono tabelle
applicative pubbliche su cui attestare policy funzionanti; nessun accesso applicativo,
inserimento o restore è stato provato. Impostazioni Data API, credenziali, billing
effettivo e backup del progetto non sono certificati da queste risposte.

Per la progettazione successiva, non presumere che creare una tabella la renda
accessibile tramite API: privilegi espliciti, RLS e policy vanno progettati e provati
insieme. Il changelog descrive la transizione dei default, con scadenza generale
30 ottobre 2026, vicina alla consegna. Nessuna modifica è stata applicata per questo.
[Fonte: aggiornamento ufficiale Supabase](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically).

## Vercel

**Verificato in sola lettura con CLI 65.0.0:**

- `.vercel/repo.json` contiene un mapping per `meteolivelli` nella directory `.`;
  sono stati estratti solo nome, directory e identificatore organizzazione.
- La risoluzione implicita dalla directory non ha completato la lettura (`fetch failed`).
  Non sono stati eseguiti `link`, `pull`, login o altri tentativi di riconfigurazione.
- Con progetto e scope espliciti del mapping, `project inspect` ha confermato
  `meteolivelli`, ID non segreto `prj_Jlxt1vouwTWorxUmqBbCxzRJK4Xm`, framework `vite`,
  root predefinita e runtime Node `24.x`.

Non sono state stampate variabili ambiente né risposta JSON integrale del progetto.
La corrispondenza del deploy corrente con il codice, l'integrazione Git effettiva,
la raggiungibilità della produzione e il piano billing dell'account restano da
verificare nei task di rilascio. Il runtime locale provato è Node 26.12.0: la build
non costituisce ancora una prova sul runtime Node 24 del deployment.

## Verifica privacy dei servizi — 23 ottobre 2026

**Vercel:** la dashboard del progetto `meteolivelli` nel team `Pedro13 Projects` mostra il piano Hobby. Le finestre di reporting verificate nella documentazione del piano sono 1 mese per Web Analytics e 7 giorni per Speed Insights; i runtime log delle funzioni Hobby sono consultabili per 1 ora. Il frontend corrente è statico e non usa funzioni Vercel. La conservazione dei registri per richieste statiche/CDN non è stata determinata.

**Google Analytics:** nella proprietà attualmente integrata, l’interfaccia Amministrazione → Conservazione dei dati mostra 2 mesi per i dati evento, 14 mesi per i dati a livello utente e il reset del periodo utente dopo nuova attività abilitato. Consultazione in sola lettura; nessuna impostazione cambiata.

**Supabase:** verifica read-only del progetto e dell’organizzazione: regione `eu-west-1`, piano Free. La pagina ufficiale dei piani indica 1 giorno di retention per i log API e Database sul piano Free; nessun log drain è incluso. Non confondere retention del database, query dei log e trasferimenti dei dati di account/telemetria.

Questi riscontri sono riferiti al 23 ottobre 2026 e sostengono la pagina locale [privacy](/privacy); condizioni e impostazioni possono cambiare. Fonti: [retention Vercel runtime logs](https://vercel.com/docs/logs/runtime), [piani e retention Supabase](https://supabase.com/pricing). [Frontend e comportamento del consenso](frontend.md).

## Quote e condizioni consultate: offerte, non piano effettivo dell'account

**Aggiornamento documentale del 22 ottobre:** Open-Meteo resta qui come consultazione
storica del setup; la successiva richiesta dell’utente prevede un modello calcolato
dal progetto senza provider meteo esterno. Non integrarlo sulla base di questo inventario.

| Servizio/offerta | Informazioni consultate | Conseguenza per il progetto |
|---|---|---|
| Supabase Free | 500 MB database, 5 GB egress, 1 GB file storage; pausa dopo una settimana di inattività, massimo due progetti attivi | Stimare spazio/traffico quando avremo dati reali; non presumere storico sempre disponibile o backup indipendenti inclusi |
| Vercel Hobby | Uso personale non commerciale; il superamento dei limiti può sospendere una funzione fino al rinnovo della finestra | Verificare idoneità dell'uso scolastico/open day e traffico; nessuna garanzia di disponibilità illimitata |
| Open-Meteo Free | Uso non commerciale, attribuzione CC BY 4.0; meno di 10.000 richieste/giorno, 5.000/ora e 600/minuto | Validare località, condizioni d'uso e caching prima dell'integrazione; nessuna chiamata previsionale reale effettuata |

Fonti consultate il 21 ottobre 2026: [Supabase pricing](https://supabase.com/pricing),
[Vercel Hobby](https://vercel.com/docs/plans/hobby),
[Open-Meteo Terms](https://open-meteo.com/en/terms). Le condizioni possono cambiare:
ricontrollarle prima del rilascio. L'offerta pubblica gratuita non dimostra quale
piano sia attivo sugli account dell'utente; non sono stati autorizzati addebiti.

## Ambiente di prova e decisioni successive

- **Scelta per questo setup:** typecheck, lint e test di configurazione locali e isolati;
  nessun accesso a database o rete dai test.
- **Prima di BE-07:** scegliere ambiente separato per le prove DB, modalità di custodia
  dei segreti e richiesta esplicita di applicazione. Il progetto vuoto non viene
  automaticamente usato come ambiente sacrificabile.
- **Dati necessari:** CSV/writer e clock sul PC; modelli/sentinelle e collocazione sensori;
  serie datate idonee alla valutazione del modello; volume/traffico atteso, storage backup e obiettivi di recupero.
- **Non deciso:** lettura diretta o endpoint, schema definitivo, ruoli DB server,
  destinazione backup, canale avvisi e conferma della possibile chiusura di dicembre.

L'inventario iniziale SET-04 è concluso con questi limiti espliciti. Le verifiche
applicative restano nei task BE, WX, OPS e REL di [tasks.md](../tasks.md).

## Aggiornamento progettuale locale — 22 ottobre 2026, Fase 5

L’inventario remoto sopra rimane quello del 21 ottobre, senza nuova certificazione
dello stato corrente. La lettura tramite endpoint e la credenziale server sono ora
scelte locali BE-03, documentate in [backend-schema.md](backend-schema.md). Schema,
migrazione e funzioni preparati non sono risorse già presenti sul servizio.
Nella successiva scelta BE-07 l’utente ha indicato esplicitamente il progetto
esistente; l’applicazione e le prove live sono descritte sotto.

## Backend applicato e verificato — 22 ottobre 2026, BE-07

L’utente sceglie il progetto esistente MeteOlivelli, riferimento verificato
pvtzncseisbxaaseqfvo, ACTIVE_HEALTHY, PostgreSQL 17.11.0.003. Prima di applicare
risultano ancora vuoti tabelle public, funzioni e migrazioni. Nessun oggetto
applicativo preesistente modificato.

Migrazione 20261022125448 station_backend_v1 applicata; tabella
public.station_measurements con RLS, due RPC invoker e indici. Edge Function ingest
e read ACTIVE v3. Segreti stazione configurati tramite CLI senza pubblicarne i
valori. Sorgente definitiva meteolivelli.

Prove SQL/HTTP, concorrenza e permessi effettivi superati. Advisor prestazioni
senza avvisi; sicurezza solo INFO RLS senza policy, coerente con accessi pubblici
revocati. Evidenze e limiti in [backend-verification.md](backend-verification.md).
Nessuna modifica GitHub/Vercel, frontend o piano a pagamento. CSV e PC reali non
verificati da questo intervento; inventario precedente conservato come storico.

## Pulizia successiva dei dati e della funzione dimostrativa — 22 ottobre 2026

Su richiesta esplicita dell'utente, nel progetto MeteOlivelli sono state eliminate
50 righe `historical` della sorgente isolata `meteolivelli-demo-20261022` e 6 righe
storiche identificate come test dell'uploader nella sorgente `meteolivelli`.
`DELETE ... RETURNING` ha confermato 50 e 6 righe. La query finale non restituisce
righe per nessuna delle due sorgenti. È stata rimossa anche la Edge Function
`read-demo-measurements`; l'inventario corrente mostra solo `ingest-measurement`
e `read-measurements`, entrambe ACTIVE v3. Schema, RPC e funzioni reali conservati.
