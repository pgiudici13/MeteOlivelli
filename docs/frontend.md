# Frontend — stato e verifiche

## Aggiornamento locale — 27 ottobre 2026

La dashboard, le previsioni e i PDF mostrano solo campioni con provenienza esplicita `live` o `historical`: `synthetic` e provenienza non specificata sono esclusi, senza cancellare i dati dal backend. La simulazione pubblica e la postilla provvisoria sono rimosse localmente. L’API remota può ancora restituire i campioni di prova; finché sono gli unici presenti, la dashboard locale mostra gli stati vuoti. Una acquisizione futura rispetto al server non è mostrata, produce un avviso e non blocca i grafici; la cronologia conserva il giorno selezionato quando arrivano altri giorni.

Con storage indisponibile la revoca applica il flag di disabilitazione Google e filtra gli invii Vercel già caricati; la riattivazione ripristina i segnali nella pagina corrente. La preferenza non salvabile non persiste al caricamento successivo. I paragrafi successivi sono verbali storici se descrivono postilla, simulazione o funzionamento precedente. Nessun deploy eseguito.

Il 26 ottobre Tempo reale GA4 mostrava 2 utenti e 9 `page_view` negli ultimi 30 minuti; la richiesta di raccolta ha ricevuto HTTP 204. I report ordinari restavano a zero nel periodo precedente.

## Preferenze statistiche e privacy — comportamento locale aggiornato il 26 ottobre 2026

La proprietà Google usa l’ID `G-F2LRCD93NW`. Google Analytics, Vercel Analytics (`inject()`) e Speed Insights sono attivi per impostazione predefinita, secondo la verifica delle condizioni applicabili comunicata dall’utente; una scelta salvata `denied` li disattiva. “Preferenze statistiche” consente di disattivarli o riattivarli e la scelta resta in `localStorage` finché non viene cambiata o cancellata. La disattivazione aggiorna GA4, rimuove i cookie `_ga*` accessibili alla pagina e ricarica il sito. Segnali Google Ads e personalizzazione annunci sono disattivati. Vercel Analytics è senza cookie secondo la documentazione del fornitore.

GA4 riceve lo stato predefinito `analytics_storage=granted`; gli storage pubblicitari restano negati. Il tag GA4 si carica solo su `meteolivelli.vercel.app`: i sottodomini univoci dei deploy Vercel non sono domini pubblici/cross-domain e non devono inviare dati allo stream di produzione. La configurazione automatica di pagina è disattivata e viene inviato un solo `page_view` esplicito con titolo e URL correnti. I comandi gtag sono accodati nel formato `arguments` previsto da Google. La diagnostica che rileva `ad_user_data=denied` sempre è attesa quando non si usa la personalizzazione degli annunci; secondo Google, con Consent Mode già configurato e senza personalizzazione pubblicitaria non serve modificare questo segnale. Il report della proprietà non mostra ancora hit recenti: verificare `page_view` in Tag Assistant e Tempo reale da un browser/rete che non blocchi Google Tag. [Guida gtag.js](https://developers.google.com/tag-platform/gtagjs), [diagnostica Google Tag](https://support.google.com/tagmanager/answer/14681508?hl=it), [impostazioni consenso del Google Tag](https://support.google.com/tagmanager/answer/12131703?hl=it).

I PDF dei grafici dichiarano per ogni serie la provenienza dei campioni effettivamente tracciati: dati live, storico, sintetici, misti, origine non specificata o nessuna serie. Le medie contano i campioni per origine, così la dicitura segue i dati inclusi nel grafico.

La pagina `/privacy` descrive il comportamento del client, il titolare e il recapito forniti dall’utente, i periodi Analytics osservati e le finestre dei due strumenti Vercel per il piano Hobby verificato in dashboard. I log tecnici hosting/backend dipendono dalle impostazioni e dai termini dei fornitori, non sono configurati dal frontend. Il record Google Analytics mostrava conservazione eventi di 2 mesi, livello utente di 14 mesi e reset del periodo dopo nuova attività abilitato. La pagina resta da approvare dal titolare prima della pubblicazione e i contratti/configurazioni di fornitore vanno verificati per il trattamento effettivo.

Resta da verificare attivazione/disattivazione effettiva con Tag Assistant e in Tempo reale; verificare log hosting/backend, ruoli e trasferimenti rispetto agli accordi dei fornitori e far approvare l’informativa al titolare. La proprietà Analytics non è stata modificata. Il dataLayer corretto è pubblicato su `main` nel commit `6059b1d`; Vercel Production è `READY`, mentre la raccolta degli hit è ancora da confermare.

## Versione pubblicata

[MeteOlivelli](https://meteolivelli.vercel.app/) è pubblicato da `main` attraverso l’integrazione GitHub → Vercel. Rilasci verificati: `fab71cb` (grafica, motion, hover e postilla) e `bce39e2` (contratto con provenienza sintetica distinta). Il secondo deploy è stato verificato READY sul dominio principale, con HTTP 200 e nessun errore JavaScript non gestito. Queste verifiche riguardano la versione applicativa, non il collaudo della stazione reale.

Aggiornamento del 26 ottobre: `775c248` porta i tracker Analytics attivi per default, il `page_view` esplicito singolo, l’opt-out e la provenienza nei PDF grafici; il deploy Production risulta `READY`. Ricezione GA4 e disattivazione live non sono state verificate.

Stack conservato: React, TypeScript, Vite, ESLint, npm. Nessuna dipendenza aggiunta per grafici, animazioni o riflessi. Il riferimento Figma Obsidian v5 documenta la fase precedente; il sito corrente segue la proposta Factory adattata ai commenti dell’utente, senza aggiornamento del file Figma. [Storia Figma](design-review/README.md), [specifiche grafiche correnti](../design.md).

## Struttura e contenuti

1. Intestazione con sole delineato e wordmark `MeteOlivelli`, più collegamenti alla stazione e all’archivio.
2. Postilla permanente, fuori dalle animazioni: **Work in progress · Possibili dati presenti fittizi**.
3. Titolo grande a sinistra e pannello scuro della temperatura con grafico a destra; su mobile il pannello segue il titolo. Il numero è l’ultima lettura disponibile, non una temperatura attuale garantita.
4. Tre schede per temperatura, umidità e pressione, sempre dallo stesso evento.
5. Archivio 24 ore / 7 giorni / 30 giorni con tre grafici SVG. Il grafico iniziale segue lo stesso periodo; “Cambia periodo” porta ai filtri.
6. Cronologia dal campione più recente, sei righe per pagina, dettagli temporali e qualità per campo.
7. Previsioni meteo +30 minuti / +1 ora / +24 ore, con verifica temporale per campo, metodo, errore storico e scadenza; non disponibili quando dati o verifica non bastano. Informazioni sul progetto e footer.

Caricamento, archivio vuoto, periodo vuoto, errore, campo nullo e valore sospetto rimangono stati distinti. Un campo nullo mostra “Dato assente”, mai uno zero inventato. I flag qualità restano consultabili; null e sospetti interrompono la curva del campo interessato. I grafici dichiarano unità, assi temporali, minimo/massimo e riepilogo accessibile; la tabella permette di consultare i valori senza il grafico.

## Origine dei dati e tempi

GET anonimo [read-measurements](https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/read-measurements?view=latest), senza SDK, credenziali, cookie o lettura di `.env`. Il browser non scrive tabelle e non chiama l’ingestione.

La migrazione `20261022194231_synthetic_measurement_kind` distingue `live`, `historical` e `synthetic`. La lettura pubblica espone `acquisition_kind`; l’adapter frontend lo valida e conserva, accettando anche il contratto precedente privo del campo durante il rilascio. Il backend non espone payload o credenziali. Un sintetico restituisce freschezza sconosciuta; l’ingestione sensori rifiuta quel tipo.

Il batch corrente contiene **241 campioni di prova** ogni tre ore, dal 24 settembre al 24 ottobre 2026 (aggiornamento autorizzato del 24 ottobre), con provenienza nei metadati e postilla pubblica concordata. Tutte le righe precedenti sono state sostituite. [Autorizzazione, intervalli, valori ed evidenze](data-preview.md). Le fixture del runner browser restano intercettazioni locali; il batch pubblico è un inserimento amministrativo separato e autorizzato. Non esiste un selettore DEMO né un database parallelo.

`measured_at` (misura fisica), `captured_at` (acquisizione PC o tempo di scenario per i sintetici) e `received_at` (prima ricezione server) rimangono separati. I 241 sintetici hanno `measured_at` NULL. Visualizzazione in `Europe/Rome`; uptime Arduino mai convertito in data. Per le misure reali, ora fisica e cadenza non sono ancora verificate: la UI dichiara “Freschezza non determinabile”.

## Letture e aggiornamenti

- `src/weather.ts`: verifica del contratto pubblico, formattazione, serie e freschezza.
- `src/weather-feed.ts`: letture, finestre, recupero e gestione stato.
- `src/use-weather.ts`: ciclo React, visibilità e ritorno online.

Polling latest ogni 15 secondi solo a pagina visibile, tentativo al ritorno in primo piano/online, timeout per richiesta di 10 secondi, annullamento allo smontaggio e nessun ciclo sovrapposto. Lo storico si aggiorna all’apertura, al cambio periodo, al nuovo ultimo evento e al recupero da errore. Cache pubblica server di 10 secondi. Risposte invalide/errori HTTP non diventano archivi vuoti; un errore mantiene gli ultimi dati riusciti con avviso.

Il feed dei grafici e delle previsioni usa paginazione API con cursore e finestra `until` coerenti, deduplica UUID e limite conservativo di 100 pagine/50.000 eventi; non presenta serie parziali come complete. La tabella Cronologia viene riletta quando cambia l’ultimo UUID e al ritorno visibile/online. Il comando “Aggiorna cronologia” permette di includere importazioni storiche che non cambiano latest. La UI dichiara l’istante dell’ultima rilettura; aggiornamenti ed errori mantengono i campioni e la pagina selezionata. Richieste superate annullate; nessuna rilettura integrale ogni 15 secondi se latest è invariato. Usa una lettura separata `period=all`, continua fino all’ultimo cursore senza limite temporale o numero massimo di pagine e include record senza `captured_at`; questi ultimi sono ordinati per `received_at`, mostrato separatamente e mai come ora di misura. Le finestre dei grafici scadute sono eliminate anche senza nuove misure usando l’ora server.

## Animazioni e interazioni

Le [specifiche correnti](../design.md) sostituiscono quelle storiche da 220 ms: ingressi individuali, grafici progressivi e riflesso locale sui bordi. `useLayoutEffect` prepara gli elementi nascosti prima del paint; `IntersectionObserver` li rivela all’ingresso in vista. Focus tastiera e movimento ridotto rendono il contenuto immediatamente visibile; nessun blocco dello scroll manuale. Il fallback `noscript` spiega che senza JavaScript non vengono mostrati dati live.

Nella cronologia, il cambio pagina anima le righe a cascata in uscita e poi in ingresso, con direzione legata a “Più recenti”/“Precedenti”; i pulsanti restano disabilitati durante l’animazione e lo stato dichiara intervallo e totale. Con movimento ridotto il cambio avviene subito. Sotto 760 px ogni riga è impaginata come scheda con etichette dei valori e dettagli separati.

## Verifiche e ripetibilità

Ultima verifica completa prima del rilascio `bce39e2`: `npm run check` superato — build/lint, **18 test Node, 41 Deno, 21 Python**. Nessun segreto necessario ai test automatici locali. Le prove SQL separate non fanno parte di questo comando.

Runner browser opzionale, Playwright esterno al progetto e server locale già avviato:

```sh
node tests/frontend-browser.mjs /percorso/playwright/index.mjs /percorso/chrome http://127.0.0.1:5179/
```

**13 scenari browser**: risposte vuote/positive intercettate, reflow 320/390/768/1280 px, tastiera e periodi, polling e due pagine, errori/recupero, null/sospetti, movimento ridotto, caricamento, noscript, motion e riflessi. [Risultati locali](factory-verification/results.json). Gli screenshot con fixture sono marcati come test e non sono osservazioni della stazione.

Collaudo pubblico senza mock: cinque righe di cronologia, quattro grafici, ultimo valore 17,3 °C, intervalli di 30 minuti, postilla visibile, reflow 390 px e nessun errore JavaScript. [Risultati pubblici](data-preview-verification/results.json), [desktop](data-preview-verification/desktop.png), [mobile](data-preview-verification/mobile.png).

Restano aperti: prova CSV/writer/Arduino/Windows, latenza reale DB → pagina aperta, clock e cadenza, revisione con il compagno e dispositivi fisici, lettore di schermo e zoom manuale, volume/quote, backup/restore e avvisi. Nessuna certificazione WCAG o attendibilità previsionale attestata. Checklist: [Fase 8](../tasks.md#8-fase-8--backup-gestione-e-rilascio), [QA](qa.md), [gestione operativa](operations.md).

## Revisione grafici successiva al rilascio bce39e2

Correzione locale del glitch al refresh segnalato dall’utente: rivelazione SVG unica con maschera e avanzamento lineare per curva/area/punti. Nessun tratteggio del tracciato e nessun replay al solo aggiornamento del limite temporale.

`src/chart.ts` definisce finestre complete e separatori ore/giorni/settimane in Europe/Rome. `windowUntil` nello stato del feed conserva il riferimento server delle letture; non si usa l’orologio del browser per inventare la finestra. Una serie breve occupa soltanto il tratto di periodo per cui esistono campioni. Test Node aggiunti per durate 24/168/720 ore e mezzanotti al cambio d’ora; test browser della maschera a metà corsa verifica avanzamento al 50%, easing lineare e assenza di dash. Nessuna modifica ai dati, al polling o al backend.

**Verifiche della revisione locale dei grafici:** `npm run check` superato (20 Node, 41 Deno, 21 Python) e 13 scenari browser, inclusa progressione lineare al 50% e separatori settimanali. Screenshot di collaudo aggiornati in `docs/factory-verification/`; nessun nuovo commit, push o deploy eseguito per questa revisione.

## Auto e aggregazione locale

La selezione iniziale è Auto. Il feed grafici usa la lettura 30g con `until` ancorato all’ultima acquisizione disponibile, per rendere consultabili anche i campioni di una stazione ferma da mesi senza dichiararne freschezza. La cronologia completa è caricata da `useCompleteHistory`, indipendente dai filtri e dal polling dei grafici. Il caricamento Auto legge prima latest e poi lo storico ancorato; il polling invariato non ricarica la serie. Le viste manuali mantengono la finestra server attuale e le richieste iniziali indipendenti.

In `src/chart.ts`, lo storico caricato di durata ≤7 giorni resta grezzo e l’asse ne segue l’estensione; oltre sette giorni viene derivata l’ultima settimana di calendario con tre medie aritmetiche per giorno: 00–12, 12–17, 17–24. Sono usati solo i valori validi per campo; nessuna fascia vuota viene interpolata o trasformata in zero. Campioni live e di prova non contribuiscono alla stessa media. Se sono disponibili live, Auto li privilegia. Il feed dei grafici conserva gli originali dei 30 giorni letti; la tabella Cronologia usa invece la lettura completa separata. Nessuna media diventa una misura o viene inviata al database. Tooltip con fascia e numero di contributi, titolo “Ultima media” e riepilogo accessibile dichiarano l’aggregazione.

Nelle viste manuali, 24 ore mantiene tutti i campioni originali. 7, 14 e 30 giorni mostrano una media giornaliera dei campioni validi acquisiti dalle 09:00 incluse alle 18:00 escluse in Europe/Rome. Una giornata senza valori validi interrompe la linea; la cronologia conserva sempre i campioni originali. L’API non espone una finestra 14g: la UI legge 30g e limita localmente la serie agli ultimi 14 giorni ancorati all’orario server.

Dati raw e medie hanno punti del grafico distinti dal tipo `Measurement`. I centri delle fasce servono al posizionamento sul grafico e non sono orari di misura. Le sette date e le fasce rispettano Europe/Rome e il cambio d’ora. Maschera lineare accelerata a 700 ms dopo 60 ms; ingressi generali a 420 ms.

**Verifica Auto locale:** `npm run check` superato (26 Node, 41 Deno, 21 Python), 14 scenari browser superati, inclusi Auto predefinito, 21 medie per fascia su serie lunga e cronologia originale. Resta una modifica locale non pubblicata.


## Correzione Auto e riepilogo hero — 23 ottobre 2026

Riprodotto HTTP 400 `invalid_query` usando in `until` il `captured_at` PostgreSQL `2026-10-22T19:43:00+00:00`. Il validatore richiede UTC canonico con millisecondi e Z. Il feed normalizza la richiesta, arrotonda verso l’alto eventuali microsecondi e mantiene il limite della lettura storica nei polling invariati. Nessun endpoint remoto modificato. Test Node per offset, microsecondi, paginazione e polling; test Deno del feed contro `parseReadQuery` reale.

La hero mostra umidità e pressione compatte accanto alla temperatura, dallo stesso campione, mantenendo null, unità e qualità. Layout con reflow; nessuna dipendenza aggiunta.

Verifiche: `npm run check` superato (27 Node, 42 Deno, 21 Python); 14 scenari browser sintetici di regressione superati. Prova frontend locale → API pubblica reale: quattro grafici, dieci campioni, richieste HTTP 200, polling invariato, nessun errore JavaScript o overflow a 1440/390/320 px. [Evidenze](auto-verification/results.json). I campioni del database sono sintetici, non una prova della stazione. Modifiche frontend locali, senza commit/push/deploy.


## Previsioni statistiche locali — 23 ottobre 2026

`ForecastSection` usa un feed indipendente (`forecast-feed.ts`, `use-forecast.ts`) e il worker `forecast.worker.ts`; il motore puro è `forecast.ts`. Il feed fisico 30g e la simulazione sintetica restano separati. Interfaccia italiana: tre orizzonti, tre grandezze, istante previsto e dettagli su metodo, MAE, riferimento, numero dei casi, origine e scadenza. La simulazione usa `captured_at`, presenta un avviso esplicito e orizzonti +3/+6/+24 ore, coerenti con la cadenza sintetica. Null/sospetti e campioni vecchi producono motivi specifici senza numeri sostitutivi. Errori di lettura/calcolo ritirano le stime; misure e grafici continuano a funzionare. La giornata indica +24 ore e non massime/minime; nessuna condizione sole/pioggia generata. [Specifica del modello e limiti](backend.md#modello-previsionale-locale-v2--24-ottobre-2026).

La cronologia completa raggruppa le righe per giorno civile `Europe/Rome`: una pagina per ciascuna data disponibile, con titolo del giorno e conteggio dei campioni. Un timestamp senza `captured_at` usa il giorno di `received_at`, mantenendo quest’ultimo esplicitamente indicato come ricezione.

`npm run check` include ora anche `tests/forecast.test.mjs`; verifica modelli, mancati confronti, selezione/verifica, ricezioni tardive, scadenza, cadenza, DST, cache, recupero e stop. `tests/forecast-browser.mjs` usa fixture locali simulate e il worker reale per valori/metodi, paginazione, reflow, filtri indipendenti, errore rete, null/sospetti, scadenza e sintetici esclusi. Prove in [forecast-verification/results.json](forecast-verification/results.json). Gli screenshot con stime numeriche sono marcati come simulazioni di collaudo.

Prova frontend locale → API pubblica reale: lettura `measured_at` vuota, nove risultati indisponibili con ragione esplicita, quattro grafici delle osservazioni ancora presenti, nessun errore JavaScript. [Evidenza reale](forecast-verification/live-results.json). È una verifica funzionale dello stato indisponibile, non una previsione meteorologica reale riuscita. Modifiche locali non pubblicate.


**Esito finale del 23 ottobre:** `npm run check` superato: build, lint, 41 test Node (27 frontend + 14 modello/feed), 42 Deno e 21 Python. Sette scenari browser previsionali e 14 scenari di regressione frontend superati. API fisica reale vuota e nove stime indisponibili verificati separatamente. Nessuna validazione meteorologica o pubblicazione attestata.

**Revisione Cronologia del 23 ottobre:** `npm run build`, `npm run lint`, `npm run frontend:test` (41 test) e `git diff --check` superati. La preview browser locale non si è avviata: il sandbox ha negato il bind Vite su 127.0.0.1:4173 (`EPERM`); quindi questa revisione non ha verifica visiva interattiva. Nessuna pubblicazione.


## Pagine e indicizzazione — aggiornamento 26 ottobre 2026

La dashboard è disponibile alla radice e resta compatibile su `/home`; il router mostra la stessa home in entrambi i percorsi. `/info` contiene introduzione al progetto scolastico, descrizione documentata della stazione, semantica/provenienza dei dati e team. Il canonical della home indica la radice.

La build produce documenti statici per home, `/info`, `/privacy` e `/gioca` con title, description e canonical specifici. La homepage contiene `WebSite` JSON-LD con nome preferito `MeteOlivelli`, Open Graph e favicon PNG 96×96. Le varianti coordinate scura/chiara del sole seguono il tema iniziale e quello scelto manualmente; il segno nella testata usa un solo asset da 80 px per tema. `public/robots.txt` consente la scansione e indica `https://meteolivelli.vercel.app/sitemap.xml`; la sitemap elenca la radice e le tre pagine informative. I metadati SEO e il logo premium sono stati pubblicati nel checkpoint precedente; questa revisione ottimizza le risorse responsive. Verifica di Google Search Console e ricrawl restano da fare dopo il rilascio corrente. Google decide autonomamente nome, titolo, snippet e favicon mostrati.

La pagina Informazioni (`src/pages/InfoPage.tsx`) presenta progetto, stazione e percorso dei dati, guida alla lettura di periodi e medie, provenienza, previsioni e team. L’indice conduce alle cinque sezioni. Il polling a 15 secondi descrive la lettura del sito, non la cadenza della stazione; la pagina distingue i diversi orari e spiega quando la freschezza non è determinabile. Il diagramma diventa una griglia mobile 2×2. Il test frontend verifica che ogni ancora dell’indice abbia una destinazione reale.

Nella sezione team il contatto meteolivelli@liceoolivelli.pv.it apre in una nuova scheda la composizione di Gmail con il destinatario già compilato; Gmail può richiedere l’accesso all’account.

**Revisione responsive, nomenclatura, provenienza e baseline — 26 ottobre 2026:** la sezione Previsioni meteo ha spazio interno e schede con bordi più leggibili su mobile. Tra 761 e 1000 px le griglie metriche, grafici e previsioni usano due colonne, con la terza scheda previsionale estesa sull’intera riga; la hero si impila. La nomenclatura pubblica ora usa “Previsioni meteo” e “Previsione non disponibile”. Una query aggregata in sola lettura ha trovato 251 righe `synthetic` e zero con `measured_at`; la Home dichiara indisponibili le previsioni reali e chiude per default la simulazione in un riquadro distinto. Nel modello v3 la persistenza è soltanto il riferimento: quando è il metodo selezionato, l’uscita viene ritirata invece di ripetere la misura a ogni orizzonte. Test locali coprono questo caso e orizzonti variabili; accuratezza meteorologica reale e QA su telefono/tablet restano da verificare.

Il logo del liceo nella testata di Home, Informazioni, Privacy e Gioca apre in una nuova scheda la homepage ufficiale `https://www.liceoolivelli.pv.it/`. Un componente condiviso centralizza URL, `noopener noreferrer` e l’annuncio accessibile della nuova scheda. Il footer condiviso raccoglie navigazione, autori, scuola, note sul polling e licenza; il testo MIT pubblicato in `/LICENSE` viene mantenuto uguale a `LICENSE` nella root del repository.

## Quiz “Gioca con il meteo”

La route `/gioca` contiene 20 curiosità fornite dall’utente e ne estrae 10 diverse a ogni partita con Fisher–Yates. Le tre risposte vengono mescolate per ciascuna domanda e la chiave corretta segue il testo della risposta. Quando si sceglie un’opzione, un ripple circolare scalato parte dal punto di contatto e colora soltanto il pulsante selezionato; la forma usa trasformazioni per mantenere compatibilità con i browser touch. Verde e rosso hanno contrasto rinforzato nei temi scuro e chiaro, con un segno ✓/× oltre al testo. Il feedback indica se la risposta è giusta e spiega il fatto meteorologico, includendo la risposta esatta se la scelta è errata. Con `prefers-reduced-motion` il ripple si ferma e resta il colore di esito ben visibile. L’ingresso è limitato a domanda, risposte e feedback; la barra di avanzamento usa una transizione lineare di 500 ms. Al termine il quiz mostra il punteggio corrette/10. È autonomo e non legge né modifica dati meteorologici. Navigazione, metadati statici e sitemap includono la route.

Verifiche locali: `npm run build`, `npm run lint`, 41 test frontend e `git diff --check` superati; controllati i due HTML compilati, i canonical/title/description, robots e sitemap. La preview browser non è stata possibile: il container ha negato l'apertura del server locale (`EPERM`). Nessuna pubblicazione o invio alla Search Console eseguiti.

## Esportazione PDF

La sezione Archivio offre “Scarica PDF dei grafici” per il periodo selezionato. Al clic il browser rilegge lo storico aggiornato; Auto legge prima l’ultimo campione e ancora i dati al suo `captured_at`. Il documento usa `prepareChart`, come la UI: tre grafici vettoriali con unità e finestre coerenti, medie 09:00–18:00 per 7/14/30 giorni e interruzioni sui dati null/sospetti. Per i grafici aggregati dichiara sia il numero delle medie disegnate sia i campioni validi da cui derivano. Il PDF annota istante di generazione, periodo e regole di lettura.

La sezione Cronologia offre “Scarica PDF della cronologia completa”. Al clic ripete `readAllHistory`, completa tutte le pagine `period=all` e rifiuta errori o cursori incoerenti prima di creare il file. La tabella A4 orizzontale contiene una riga per campione, intestazione ripetuta, acquisizione sul PC, misura fisica, ricezione server e temperatura/umidità/pressione. Null, probabili errori e campioni `SINTETICO` sono indicati; i campioni senza acquisizione usano la ricezione solo per l’ordinamento e non la presentano come ora di misura. La generazione avviene nel browser sul contenuto appena letto; nessun file è salvato sul server.

`pdfmake` e i font sono caricati dinamicamente solo all’avvio dell’esportazione. `src/pdf-download.ts` verifica il MIME PDF, nomina il file con la data locale Europe/Rome e revoca l’URL temporaneo. Un errore di lettura o generazione mostra lo stato e non avvia un download parziale.

Verifiche: `npm run check` superato con 72 test frontend, 44 Deno e 23 Python, oltre build/lint; generati e riaperti con PDFKit PDF effettivi per grafici e cronologia. Archivio vuoto e grafici senza valori validi producono file PDF validi senza righe o punti inventati. Il test errore pagina 2 verifica che non venga generato un PDF parziale; il test positivo compone soltanto dopo aver raccolto tutte le pagine. Prova multipagina con 300 righe sintetiche: 11 pagine, intestazione presente su tutte, ultima acquisizione e ultimo valore leggibili. Prova di carico in Node con 5.000 righe sintetiche: PDF da 1,6 MB in 1,7 secondi, 173 pagine, intestazioni ripetute e ultima riga completa secondo PDFKit; questi tempi non rappresentano una garanzia sui dispositivi browser. Test integrato del 23 ottobre: `readAllHistory` → PDF con il GET pubblico, 11 righe su una pagina, MIME `application/pdf`, PDFKit conferma intestazione e legenda temporale. Anche il percorso Auto è stato provato sul GET pubblico: 11 righe → PDF vettoriale di tre pagine, con titolo Auto, generazione e tutte le tre grandezze leggibili. GET pubblico `period=all`: base `captured_at`, nessun cursore successivo; i record sono sintetici e restano dichiarati tali. Le prove non costituiscono un collaudo della stazione.

Distribuzione: la route pubblica `/home` serve il bundle con entrambi i pulsanti PDF. Al checkpoint 20 il JavaScript scaricato da Vercel (`index-BbrWPwr6.js`, 316.446 byte) è identico byte per byte a `dist/assets/index-BbrWPwr6.js` prodotto dalla build finale. Non è disponibile un browser automatizzato in questo ambiente per provare il clic fisico sulla pagina pubblica; composizione, firma PDF, contenuti e download via link sono verificati con test e PDFKit.


## Audit locale del 23 ottobre — limiti verificati a `6e5f197`

[Verbale e prove riproducibili](project-review/README.md). `npm run check` passa (72 frontend, 44 Deno, 23 Python), ma non copre i difetti COR-009–COR-012: il cursore può troncare i microsecondi della ricezione dei record storici; i PDF dei grafici non etichettano i sintetici; la tabella Cronologia non segue i nuovi campioni; il bordo destro della tabella PDF eccede la pagina. I download sono stati esercitati anche tramite clic in Chrome locale con risposte sintetiche intercettate; nessun errore JavaScript, Home e quiz senza overflow a 320/390/1280 px. Queste nuove prove locali integrano i verbali precedenti senza attestare il click sul sito pubblico o la pipeline della stazione. Le prove di firma, testo e numero di pagine non garantiscono da sole correttezza del layout, provenienza o completezza dell’API.


## Correzioni successive all’audit — 23 ottobre 2026

COR-009, COR-011 e COR-012 sono stati corretti localmente il 23 ottobre. COR-010 è stato corretto nel commit `775c248` del 26 ottobre; GA4 ha un `page_view` esplicito e i tre tracker sono attivi per default. La precedente esclusione dei sintetici è superata dalla richiesta del 26 ottobre. Il deploy Production è `READY`; dati live non verificati e nessuna funzione Edge o schema backend modificati.


## Motion — verifica locale del 23 ottobre 2026

Integrata la dipendenza npm `motion`, usando l’importazione ridotta `motion/mini` secondo la [documentazione ufficiale](https://motion.dev/docs/quick-start). `src/motion.ts` conserva il coordinamento di observer, focus, preferenza ridotta e cleanup, delegando l’animazione a Motion. `AnimatedHeading` anima le parole dei titoli senza duplicare il testo accessibile; `usePageMotion` gestisce header, sezioni editoriali e riscontro dei controlli. `Reveal` evita animazioni concorrenti su contenitore e figli. La paginazione passa da keyframe CSS/timer al completamento delle animazioni Motion.

I grafici conservano le serie e le interruzioni originali. Selezione con puntatore/tocco, frecce, Home/End ed Escape; punto evidenziato e didascalia testuale con valore/etichetta esistenti. Nessun conteggio numerico da zero. Hover solo mouse, pressione sui controlli abilitati, movimento ridotto dinamico; le risposte quiz mantengono la propria animazione dedicata. Specifiche correnti in [design.md](../design.md#motion-e-interazioni--23-ottobre-2026).

Verifiche: build e lint superati, 74 test frontend superati; cinque scenari browser dedicati con Chrome headless e fixture esplicitamente sintetiche, senza accessi API remoti. Coperti ingressi e disegno, preferenza ridotta dinamica, esplorazione dei grafici, hover, completamento/inversione della paginazione e interruzione con movimento ridotto. Reflow verificato a 320/390/1280 px sulle route Home/Informazioni/Privacy/Gioca in tema chiaro e scuro; nessun errore JavaScript non gestito. Risultati e schermate in [motion-verification](motion-verification/results.json). Le prove non attestano misurazioni reali, telefono fisico o conformità WCAG complessiva. Build segnala ancora chunk PDF oltre 500 kB.

Ripetibilità, con Vite locale già avviato:

```sh
node tests/motion-browser.mjs /percorso/playwright/index.mjs /percorso/chrome http://127.0.0.1:5179
```

Nessun commit, push, deploy o modifica dei servizi remoti eseguiti per questa revisione.


## Performance mobile e stato Analytics — 26 ottobre 2026

PageSpeed Insights mobile (Lighthouse 13.5, report delle 12:00) mostra 86/100; FCP 1,4 s, LCP 4,1 s, TBT 0 ms, CLS 0. È un test di laboratorio, non dati di campo; Search Console riporta che il CrUX non ha campioni sufficienti negli ultimi 90 giorni. Il candidato LCP nel precedente dettaglio Lighthouse è il testo del banner consenso, renderizzato lato client; PSI stima circa 310 ms risparmiabili sul CSS render-blocking e 68,5 KiB sulle immagini.

Correzioni locali: introdotte versioni del logo scolastico a 220 e 420 px, scelte con `srcSet`/`sizes`, dimensioni intrinseche per evitare spazio non riservato e caricamento lazy del solo logo nel footer. Il logo in testata usa sorgenti responsive; le icone del marchio sono ridotte da 128 a 80 px e viene richiesto un solo asset per tema. Le pagine Info, Privacy e Quiz vengono caricate con chunk separati quando si visita la route; la home non importa più quei moduli inizialmente. La nuova analisi dopo il deploy `eeb677f` misura 85/100, LCP 4,1 s, FCP 1,4 s, TBT 40 ms e CLS 0. Il risparmio immagini stimato è sceso da 68,5 a 40 KiB, il CSS render-blocking da 310 a 150 ms e il JS inutilizzato da 52 a 44 KiB; LCP resta invariato. Il punteggio può variare tra esecuzioni; [report post-rilascio](https://pagespeed.web.dev/analysis/https-meteolivelli-vercel-app/n90zf19urh?form_factor=mobile).

Analytics: la schermata Admin GA4 indicava il corretto dominio e ID stream ma nessun dato ricevuto nelle ultime 48 ore. Tag Assistant, connesso alla Home pubblica in Chrome, ora legge `analytics_storage=Concesso` e gli stati pubblicitari negati; nella sessione non risultano hit `page_view`. Il formato dei comandi dataLayer è stato corretto e pubblicato in `6059b1d` (Production `READY`). La raccolta in Tempo reale non è ancora confermata; la diagnosi non ha cambiato impostazioni della proprietà o protezioni del browser.

## Remediation audit 27 ottobre 2026 — comportamento UI e qualità

- **Solo dati storici (AUD-12):** senza letture recenti della stazione ma con importazioni `historical` in cronologia, lo stato diventa “Solo dati storici disponibili” con nota dedicata nell'eroe e “Nessuna lettura recente” nelle schede, invece di un archivio apparentemente vuoto. Logica pura `stationStatusText` in `weather.ts`, testata.
- **Riletture della cronologia (AUD-04):** cambio dell'ultima lettura e “Aggiorna cronologia” rileggono sempre; i soli stimoli ritorno-pagina/rete sono limitati a una rilettura integrale al minuto (`shouldAutoRefreshHistory`, `HISTORY_AUTO_REFRESH_MIN_MS`). Test di regressione dedicati.
- **TypeScript strict (AUD-05):** attivo su `tsconfig.app.json` e `tsconfig.node.json`; il codice esistente era già compatibile, la build intercetta ora futuri errori di tipizzazione.
- **HistoryTable (AUD-13):** raggruppamento per giorno memoizzato con `useMemo`; nessun cambiamento visibile, meno ricalcoli durante le transizioni di paginazione.
- **Distribuzione (AUD-16):** `googlead8bb9c28d0d4e51.html` è ora servito da `public/` (prima non entrava in `dist/`); il build genera `dist/404.html` con `noindex` e titolo dedicato, e la SPA rende la pagina “Pagina non trovata” brandizzata. Route esistenti invariate; effetto sul dominio da verificare al prossimo deploy.
- **PDF (AUD-14):** valutati senza modifiche: pdfmake e font (~1,8 MB) sono caricati solo al primo export, fuori dal bundle iniziale; ridurli degraderebbe i documenti. Nota in `src/pdf-runtime.ts`.

## Audit del 27 ottobre 2026 — precisione delle serie

Le letture paginate dei grafici ordinano acquisizione e misura fisica mantenendo
le sei cifre frazionarie del server; gli UUID risolvono soltanto gli istanti uguali.
`tests/weather-order.test.mjs` riproduce l’inversione precedente e confronta anche
le forme UTC equivalenti. Il comando `npm run frontend:test` include tutti i file
`tests/*.test.mjs`; i runner `*-browser.mjs` restano separati e opzionali.
