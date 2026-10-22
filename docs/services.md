# Inventario servizi — verifica in sola lettura

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
