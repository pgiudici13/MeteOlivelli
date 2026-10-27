# Piano futuro di controllo qualità (QA) — MeteOlivelli

> **Scopo:** dare una lista di prove eseguibili, nell'ordine giusto, prima di dichiarare pronta ogni parte del prodotto.
> **Stato:** dashboard Factory pubblicata, 18 test frontend, 41 Deno, 21 Python e 13 scenari browser superati nel rilascio `bce39e2`; collaudo pubblico senza mock con cinque campioni `synthetic`, quattro grafici e postilla verificati ([esiti](data-preview.md)). CSV/writer/Arduino/Windows, clock/cadenza/latenza reali, backup/restore, avvisi, modello e prove su dispositivi fisici restano aperti. Le sezioni sotto sono criteri di prova: non sono tutte completate dalle evidenze sintetiche.
> **Regola:** una prova è “superata” solo con evidenza annotata. Una prova non eseguita non è superata.

## Come leggere questa checklist

Ogni prova indica **quando farla**, **cosa serve**, **passaggi**, **risultato atteso** ed **evidenza da salvare**. Per ogni passaggio segnare `PASS` se il risultato atteso si verifica, `FAIL` se non si verifica, oppure `BLOCCATO` se manca un prerequisito. Non inserire segreti, token o dati personali nelle note e negli screenshot.

Per “dati di prova” si intendono fixture locali intercettate, copie reali depurate autorizzate oppure il batch pubblico esplicitamente autorizzato con tipo `synthetic`, metadati distinti e postilla visibile. Non rietichettarli come misure reali. Il batch pubblico è descritto in [data-preview.md](data-preview.md); ulteriori scritture richiedono un’autorizzazione specifica.

## 0. Preparazione di ogni sessione QA

1. Annotare data, versione/commit del codice, persona che prova e ambiente: locale, ambiente di prova separato o produzione.
2. Elencare quali funzioni esistono davvero. Non segnare prove future come superate solo perché il codice compila.
3. Verificare di avere il permesso e l'ambiente corretti prima di inviare dati, creare record o provare credenziali. Non fare altre prove di scrittura/cancellazione sul database di produzione senza richiesta specifica: il batch già autorizzato non è un’autorizzazione generale.
4. Preparare input sintetici confinati ai test e un risultato atteso per ciascun input.
5. Aprire la scheda di registrazione in fondo al documento. Per un `FAIL`, conservare messaggio, orario e passaggi minimi per riprodurlo; oscurare dati sensibili.
6. Ripetere dopo ogni correzione la prova fallita e le prove vicine che potrebbero essere state influenzate.

## 1. Dati della stazione e file CSV

**Quando:** dopo aver osservato un campione reale depurato e il programma che lo scrive (attività DATA-01). Prima di allora sono ammesse solo prove sintetiche; il formato di produzione è BLOCCATO.

1. **Formato e intestazione** — Usare una copia depurata del CSV. Confrontare intestazione e righe con il contratto documentato. Atteso: encoding, delimitatore, decimale, ordine, unità e intestazione coincidono con quanto configurato; nessun autodetect cambia il formato in silenzio. Registrare un campione minimo depurato e la sua provenienza.
2. **Numeri e unità** — Verificare almeno un numero intero, un decimale, valori negativi se ammessi dal sensore e il separatore decimale effettivo. Atteso: temperatura in °C, umidità in %, pressione in hPa; nessuna conversione o arrotondamento non dichiarato.
3. **Campi mancanti e sentinelle** — Provare campo vuoto, sentinella osservata, testo e colonna mancante. Atteso: ciascun caso è rifiutato o marcato secondo una regola scritta; mai trasformato silenziosamente in zero o misura normale.
4. **Riga in scrittura** — Osservare il file mentre il writer produce una riga. Leggere prima della fine e dopo il completamento. Atteso: la riga parziale non viene accodata come misura; quella completa viene elaborata una sola volta.
5. **Riavvio del programma/PC** — Interrompere e riavviare l'uploader su una copia di prova del file. Atteso: nessuna riga già elaborata viene persa o inviata di nuovo come evento nuovo; la coda riparte.
6. **Reset Arduino e contatore** — Usare evidenza di reset o una fixture di test con contatore che torna indietro. Atteso: l'uptime non viene interpretato come data assoluta e gli eventi distinti non vengono fusi solo perché i valori coincidono.
7. **File sostituito, troncato o ruotato** — In ambiente locale di prova, sostituire/troncare una copia del file e riprendere la lettura. Atteso: il cursore rileva il cambio e non salta righe né riusa identità; gli originali sono conservati secondo la regola approvata.
8. **Timestamp PC** — Confrontare l'orologio del PC con una fonte di riferimento senza modificare i record. Provare sospensione/riavvio e ritardo di rete. Atteso: `captured_at` è l'istante della cattura, `measured_at` resta nullo se ignoto, `received_at` è assegnato dal server; un retry non riscrive gli istanti originari.

**Superamento della fase:** contratto CSV aggiornato in `docs/backend.md`, campione reale depurato verificato, casi di file parziale/reset/riavvio documentati e test del parser allineati. Se non c'è campione, segnare BLOCCATO.

## 2. Uploader Windows e coda offline

**Quando:** dopo l'implementazione dell'uploader e solo sul PC/ambiente autorizzato.

1. **Primo avvio** — Avviare con configurazione valida di prova. Atteso: legge il percorso previsto, dichiara lo stato operativo e non mostra segreti nei messaggi.
2. **Nuova riga** — Aggiungere una riga completa sintetica nel file di prova. Atteso: viene creata una sola voce di coda con ID persistente e timestamp di cattura.
3. **Rete assente** — Disconnettere la rete prima dell'invio e aggiungere una riga. Atteso: l'evento resta nella coda locale, chiaramente in attesa; non viene cancellato né dato per inviato.
4. **Rete ripristinata** — Ripristinare la rete. Atteso: la coda si svuota soltanto dopo conferma server; il numero di eventi salvati corrisponde alle righe attese.
5. **Risposta persa** — Simulare timeout dopo che il server potrebbe aver ricevuto l'evento, poi ritentare. Atteso: stesso ID e stesso contenuto; sul server una sola misura.
6. **Riavvio con coda piena** — Fermare/riavviare il PC o processo con eventi in attesa. Atteso: la coda è integra e riparte senza duplicati o perdite.
7. **Spazio/permessi insufficienti** — In una cartella locale di prova togliere permesso di scrittura o simulare spazio esaurito. Atteso: errore esplicito, nessuna cancellazione silenziosa della coda, istruzione di recupero.
8. **Segreto assente o non valido** — In ambiente isolato usare credenziale fittizia/non valida, mai una chiave reale nei test. Atteso: invio negato, errore comprensibile, nessun valore della credenziale in log o schermata.
9. **Dati storici e backlog** — Importare una copia di righe vecchie. Atteso: non vengono presentate come nuove misure live; il loro orario resta qualificato e l'ordine è deterministico.

**Superamento della fase:** casi offline, retry, riavvio e spazio/permessi passano su un ambiente di prova; conteggio locale e remoto riconciliato.

## 3. Endpoint di ricezione e database

**Quando:** BE-07 è già stato verificato sul progetto scelto; consultare prima [docs/backend-verification.md](backend-verification.md) per non ripetere prove già eseguite. Ripetere i controlli pertinenti dopo modifiche a codice/schema o prima del rilascio, usando un ambiente separato o un target esplicitamente autorizzato. Mai eseguire casi distruttivi in produzione.

1. **Richiesta valida** — Inviare un evento sintetico autorizzato. Atteso: risposta di successo solo dopo la scrittura persistente; un record presente con ID, valori/unità e tempi corretti.
2. **Corpo malformato/incompleto** — Provare JSON non valido, campo richiesto assente, tipo errato, numero non finito e payload troppo grande. Atteso: rifiuto chiaro, nessun record scritto, nessun dettaglio interno o segreto nella risposta.
3. **Autenticazione** — Provare token assente, errato e valido di test. Atteso: i primi due non scrivono; il valido può scrivere solo ciò che l'endpoint consente. Non mostrare o registrare il token.
4. **Retry identico** — Inviare due volte lo stesso ID e contenuto. Atteso: un solo record e risposta coerente che conferma l'esito già ottenuto.
5. **ID riutilizzato con contenuto diverso** — Inviare lo stesso ID con un valore diverso. Atteso: conflitto esplicito, record originale non sovrascritto.
6. **Invii contemporanei** — Lanciare due invii simultanei dello stesso evento in ambiente isolato. Atteso: un record solo; la protezione è atomica nel database, non solo nel codice applicativo.
7. **Errore database/risposta persa** — Simulare indisponibilità o timeout controllato. Atteso: nessuna falsa conferma; uploader conserva l'evento e il retry non duplica.
8. **Limiti HTTP** — Provare metodo non consentito, richiesta troppo grande e frequenza oltre il limite se definito. Atteso: rifiuto controllato e servizio ancora disponibile.
9. **Tempi server** — Confrontare `received_at` del primo inserimento e dopo retry. Atteso: il valore è generato lato server e non cambia al retry; non sostituisce `captured_at` o `measured_at`.
10. **Conservazione anomalie** — Inviare valore sintetico classificato sospetto. Atteso: resta conservato e marcato “probabile errato” secondo la policy; non diventa un dato normale e non viene cancellato senza regola.

**Esito già registrato:** prove SQL in transazione con rollback e verifiche HTTPS sintetiche sul progetto scelto sono documentate in `docs/backend-verification.md`. Restano da ripetere i controlli che cambiano con il codice e quelli che richiedono uploader, fault injection o un ambiente separato; non dichiararli superati per inferenza.

## 4. Permessi e privacy

**Quando:** la lettura anonima è già pubblica e ha verifiche registrate in `docs/backend-verification.md`; ripetere i controlli dopo ogni modifica a ruoli, policy, viste o funzioni e prima del rilascio della UI.

1. **Visitatore anonimo legge** — Con client pubblico, leggere solo campi approvati. Atteso: si vedono le misure destinate al pubblico, senza credenziali, percorsi PC o dettagli interni.
2. **Visitatore anonimo scrive** — Tentare insert, update e delete con ruolo anonimo nell'ambiente di prova. Atteso: tutte le operazioni sono negate.
3. **Uploader** — Verificare che possa inviare attraverso l'endpoint previsto ma non accedere direttamente con privilegi amministrativi al database.
4. **Ruoli non autorizzati** — Provare accesso a tabelle interne, coda, log e dati di configurazione. Atteso: negato.
5. **Risposte ed errori** — Cercare nei log e nelle risposte token, chiavi, URL privati o righe CSV complete. Atteso: nessun segreto; log limitati a identificativo tecnico e tipo di errore necessari.
6. **Verifica dopo cambi policy** — Ripetere lettura e tentativi di scrittura dopo ogni migrazione/policy. Atteso: solo lettura pubblica necessaria; nessun accesso aggiuntivo involontario.

**Superamento della fase:** matrice ruoli/accessi confrontata con i risultati osservati e nessuna scrittura anonima consentita. Annotare progetto/ambiente senza annotare credenziali.

## 5. Dashboard, grafici e stime

**Quando:** quando UI e API di lettura sono collegate. Usare fixture dichiarate sintetiche solo nei test e poi dati reali autorizzati in ambiente appropriato.

1. **Ultima misura** — Preparare record con valori noti e timestamp distinti. Atteso: temperatura °C, umidità %, pressione hPa corretti; ora di misura e ora di ricezione non confuse.
2. **Nessun dato** — API restituisce insieme vuoto. Atteso: messaggio “nessuna misura disponibile”; niente zero, trattino ambiguo o numero inventato.
3. **Errore rete/server** — Interrompere la risposta API. Atteso: messaggio di errore distinto dallo stato vuoto; la pagina non mostra dati vecchi come appena aggiornati.
4. **Dato vecchio** — Fornire un'ultima misura oltre la soglia di freschezza approvata. Atteso: stato non aggiornato/offline secondo regola documentata; non basta che il sito sia raggiungibile per dire che la stazione è online.
5. **Intervalli grafici** — Preparare record appena dentro/fuori 24 ore, 7 giorni e 30 giorni. Atteso: inclusione/esclusione coerenti con confini e fuso dichiarati; ordinamento crescente e nessun punto duplicato.
6. **Buchi e valori sospetti** — Inserire serie con intervalli mancanti e un flag qualità. Atteso: nessuna interpolazione ingannevole; anomalia riconoscibile e spiegata; dato grezzo non alterato.
7. **Dati insufficienti** — Restituire serie vuota o troppo corta per il modello. Atteso: stima dichiarata indisponibile, non inventata.
8. **Stime** — Per ogni stima mostrare chiaramente che è calcolata dal progetto, orizzonte (+30 minuti, +1 ora, giornata), dati d'origine e validità/versione del metodo. Atteso: mai confusa con osservazione o previsione di fonte esterna; metodo approvato confrontato su dati storici prima della pubblicazione.
9. **Aggiornamento automatico** — Aggiungere un record nuovo tramite ambiente di prova e misurare il ritardo fino alla UI. Atteso: aggiornamento senza ricaricare manualmente entro la soglia concordata; dati storici arretrati non fanno apparire fresca la stazione.
10. **Provenienza dei campioni** — Distinguere le fixture intercettate dal batch pubblico autorizzato. Verificare `acquisition_kind = synthetic` e `measured_at` NULL per il batch, postilla sempre visibile e assenza di esposizione di payload/credenziali; un inserimento sensori con tipo sintetico deve essere rifiutato. Alla transizione reale applicare OPS-03 e non collegare in modo ingannevole dati di prova e osservazioni.

**Superamento della fase:** risultati UI confrontati con fixture attese per tutte le finestre e stati; unità, provenienza e qualità leggibili.

## 6. Usabilità, accessibilità e browser

**Quando:** dopo ogni modifica visibile importante e prima di un rilascio.

1. **Schermi** — Provare larghezze 320, 390, 768, 1024 e 1440 px, poi zoom browser 200%. Atteso: niente sovrapposizioni o scorrimento orizzontale non necessario; grafici e controlli restano utilizzabili.
2. **Tastiera** — Senza mouse, usare Tab/Shift+Tab, Invio e frecce dove appropriate. Atteso: ordine logico, focus sempre visibile, tutti i filtri e controlli attivabili.
3. **Lettore schermo** — Verificare titoli, nome/valore/unità delle misure, grafici con riepilogo testuale, stati di caricamento/errore. Atteso: informazione equivalente disponibile senza affidarsi solo al colore o alla forma del grafico.
4. **Contrasto e colore** — Verificare testi, linee e stati su tema previsto. Atteso: testo leggibile e allarmi distinguibili anche senza percepire il colore.
5. **Ingressi e movimento ridotto** — Fuori vista verificare opacità zero prima del paint; scorrere e osservare comparsa individuale e disegno SVG, senza lampeggi o replay al polling invariato. Attivare “riduci animazioni” anche durante un effetto: contenuti subito visibili e nessuno stato pendente. Con tastiera, il focus rivela immediatamente il contenitore. Provare il riflesso locale e verificare che l’hover di “7 giorni” non illumini il divisore archivio.
6. **Lingua e formati** — Controllare italiano, decimali, date, fuso e unità. Atteso: etichette coerenti e orario qualificato; nessuna data assoluta derivata dall'uptime.
7. **Browser** — Provare almeno Chrome/Edge e Firefox aggiornati, più Safari se disponibile; verificare anche un telefono reale. Atteso: funzioni essenziali identiche e nessun errore che blocchi la consultazione.
8. **Console** — Aprire gli strumenti sviluppatore durante caricamento, cambio periodo e errore controllato. Atteso: nessun errore non gestito o segreto stampato.

**Superamento della fase:** tutte le prove essenziali passano sui dispositivi/browser concordati; eventuali limiti noti sono descritti e accettati prima del rilascio.

## 7. Prestazioni e aggiornamento

**Quando:** con API e dati di volume realistico; prima di fissare soglie servono obiettivi concordati nel piano.

1. Misurare il tempo dal commit nel database alla visualizzazione aggiornata in 10 prove consecutive; registrare ogni misura e mediana/massimo.
2. Provare caricamento storico per 24 ore, 7 giorni e 30 giorni con un volume di dati concordato. Atteso: nessun blocco della UI e nessuna risposta incompleta.
3. Ricaricare la pagina e cambiare intervallo più volte. Atteso: richieste duplicate sotto controllo, grafici coerenti, errori gestiti.
4. Provare connessione lenta o intermittente. Atteso: indicatore di caricamento, errore/recupero chiaro e nessuna falsa indicazione di dato aggiornato.
5. Confrontare uso delle quote e traffico con i limiti correnti del servizio prima del rilascio; non assumere che il piano gratuito garantisca disponibilità o permanenza.

**Superamento della fase:** tempi e volume misurati, confrontati con soglie approvate; nessuna soglia inventata a posteriori.

## 8. Backup e ripristino

**Quando:** prima del rilascio e poi alla frequenza di manutenzione concordata. Il restore va eseguito su ambiente separato.

1. Creare un backup secondo procedura documentata e registrare data, intervallo dati e risultato del job, senza dati sensibili nei log.
2. Ripristinare il backup in un database separato, mai sopra la produzione per la prova.
3. Confrontare conteggio record, primo/ultimo timestamp disponibile, ID duplicati e un campione di valori tra origine e ripristino.
4. Verificare che i permessi del database ripristinato rispettino la stessa matrice: pubblico in sola lettura, uploader limitato.
5. Cronometrare il ripristino e annotare quante misure si perderebbero rispetto all'ultimo backup. Confrontare con obiettivi RTO/RPO concordati.
6. Registrare esito, problemi e azione correttiva; ripetere dopo aver corretto. Un file di backup presente o job “verde” non equivale a restore riuscito.

**Superamento della fase:** restore separato riuscito e integrità confrontata; responsabile, frequenza, destinazione e obiettivi di recupero documentati.

## 9. Controlli automatici prima di integrare codice

Eseguire dalla root dopo le modifiche, in ambiente locale senza copiare segreti nei log:

```sh
npm run check
```

Atteso: lint frontend, build frontend, controllo tipi backend, lint/formato backend e test backend tutti terminano con codice 0. Questo dimostra che quei controlli automatici passano; **non** dimostra che CSV reale, Windows, database, permessi, browser o backup funzionino. La copertura frontend esiste: contratto, serie, provenienza, polling e freschezza sono verificati dai test Node; la QA browser opzionale e le prove SQL hanno esecuzione separata.

## 10. Prova completa prima del rilascio

Eseguirla soltanto con ambiente e richiesta di rilascio autorizzati; usare un evento di test identificabile e rimuoverlo solo secondo procedura approvata, senza cancellare dati reali.

1. Produrre/acquisire una riga di prova dichiarata e verificare CSV → coda locale.
2. Verificare invio endpoint → record DB → risposta di conferma.
3. Simulare una risposta persa e ritentare: un record solo.
4. Verificare lettura API → dashboard, unità, timestamp, qualità e aggiornamento automatico.
5. Togliere rete, accodare una prova e ripristinare rete: nessuna perdita o duplicato.
6. Verificare che l'accesso anonimo legga solo il previsto e non possa scrivere.
7. Eseguire o confermare il restore di prova documentato.
8. Eseguire `npm run check` e tutte le prove manuali bloccanti; revisionare errori browser e note aperte.

**Rilascio pronto solo se:** ogni prova bloccante è PASS; nessun FAIL di integrità, accesso o segreti resta aperto; i BLOCCATI hanno una decisione esplicita; backup/restore è dimostrato; responsabili e procedure operative sono trasferibili.

## Scheda da copiare per ogni prova

```text
ID prova:
Data e ora:
Versione/commit:
Ambiente (locale / prova separata / produzione):
Persona:
Input usato (fixture sintetica / reale depurato):
Passaggi eseguiti:
Risultato atteso:
Risultato osservato:
Esito (PASS / FAIL / BLOCCATO):
Evidenza (screenshot o log depurato):
Difetto/azione successiva:
Ripetuta dopo correzione? (sì/no/non applicabile):
```

# Controlli continui e budget (27 ottobre 2026)

Il workflow GitHub Actions `verify.yml` esegue `npm ci` e `npm run check` su push e pull request senza credenziali di produzione. Il controllo include build, lint, test frontend/backend/uploader e un budget per gli asset critici iniziali: JavaScript fino a 110 KiB gzip e CSS fino a 10 KiB gzip. I chunk PDF caricati su richiesta non sono compresi nel budget della navigazione iniziale; le prestazioni reali vanno sempre misurate separatamente su dispositivi e reti diversi.
