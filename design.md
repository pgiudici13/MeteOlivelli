# Design MeteOlivelli — riferimento corrente

Aggiornato il 22 ottobre 2026. Per ogni modifica visiva consultare questo file insieme ad `AGENTS.md`. Requisiti e priorità restano in `plan.md`; l’esecuzione è in `tasks.md`. Questo documento specifica il design e non autorizza modifiche o pubblicazioni ulteriori.

La proposta allegata `DESIGN (1).md` è stata adattata al sito MeteOlivelli e alle successive richieste dell’utente. Gli esempi commerciali Factory non hanno introdotto login, partner o funzionalità commerciali. Il riferimento Figma Obsidian v5 e le sue schermate sono storici; non descrivono la grafica corrente né attestano modifiche al file Figma.

## Linee guida ricavate dall’allegato

**Fonte fornita dall’utente:** `DESIGN (1).md`, “Factory — Style Reference”, allegato alla conversazione. Il documento è un riferimento visivo: esempi di componenti, nomi commerciali, suggerimenti Tailwind e prompt per altri agenti non sono richieste di nuove funzionalità o di cambio stack. Il file in Downloads non è necessario per lavorare sul progetto: le scelte applicabili sono riportate qui.

| Principio dell’allegato | Applicazione nel sito |
|---|---|
| Canvas quasi nero e neutri caldi | Sfondo uniforme `#101010`; superfici `#171615` / `#1d1a18`, testo `#eeeeee` e secondario `#b8b3b0` |
| Colore come segnale funzionale | Arancio `#ee6018` per temperatura/segnali, verde `#a0ca92` per altre serie; nessun riempimento cromatico delle CTA |
| Tipografia autorevole per scala, non grassetto | Titoli regolari con tracking stretto; Inter locale, sostituto ammesso di Geist, monospaziato di sistema per etichette |
| Poche forme e superfici piatte | Bordi da 1 px, schede da 10 px, pulsanti da 3 px; nessun vetro, sfocatura o ombra diffusa |
| Gerarchia e spazio | Contenuto centrato, hero a due colonne, respiro fra sezioni, griglie leggibili; mantenere il reflow mobile |
| Hero con titolo e prodotto affiancati | Titolo grande a sinistra, grafico dinamico della temperatura a destra; nessuna schermata di dashboard finta al posto dei dati |
| Interazioni misurate | Transizioni brevi per controlli e rispetto del movimento ridotto; coreografia di ingressi e riflessi aggiornata su richiesta dell’utente |

### Adattamenti espliciti successivi

- L’allegato propone una scheda chiara come elemento principale: l’utente ha chiesto il pannello temperatura **scuro**. La versione corrente deve conservarlo scuro salvo nuova richiesta.
- Le durate sobrie della reference sono state estese per gli ingressi e il disegno dei grafici; valgono i tempi nella tabella sotto. Nessuno scroll artificiale o parallax è stato introdotto.
- Il riflesso bianco localizzato sul bordo è una richiesta successiva: è consentito come riscontro di puntamento, senza aggiungere ombre/glow diffusi ai pannelli.
- La reference contiene esempi incoerenti sui raggi dei pulsanti (anche pillola): nel sito il riferimento corrente è il raggio contenuto da 3 px, non pillole generalizzate.
- I contenuti dell’allegato su login, vendite, partner, screenshot macOS e loghi Factory non appartengono al prodotto scolastico. Non introdurli per somiglianza con la reference.

## Regole da preservare nelle prossime modifiche

1. Mantenere titolo e grafico affiancati su desktop, impilati su mobile; evitare contenuti decorativi che spostino temperatura o controlli fuori dalla prima vista utile.
2. Usare la palette neutra con arancio/verde solo per segnali e dati; mantenere leggibili selezione dei filtri, avvisi e unità anche senza colore.
3. Conservare layout, tabella equivalente, nomi accessibili dei grafici, focus visibile e gestione di movimento ridotto; niente lampeggi prima dell’ingresso.
4. Non introdurre valori, punti o curve inventati per riempire la UI. Animare la presentazione dei campioni ricevuti, preservando interruzioni, qualità e provenienza.
5. Non togliere la postilla mentre sono esposti i campioni sintetici autorizzati; non usare l’aspetto “live” per attestare freschezza non verificata.
6. Aggiornare questo file se cambiano token, layout o motion. Registrare requisiti nuovi in `plan.md`, verifiche in `tasks.md` e soltanto bug verificati in `CORRECTIONS.md`.

## Aspetto e struttura

- Canvas caldo `#101010`, pannello temperatura e schede scuri `#171615`, testo `#eeeeee`, bordi sottili `#3d3a39`. Superfici piatte senza vetro, sfocatura o ombre.
- Inter variabile locale con licenza già presente, peso 400 per i titoli, tracking stretto; didascalie monospaziate di sistema. Nessun font scaricato o dipendenza aggiunta.
- Marchio `MO.` con dimensione ereditata da “MeteOlivelli” e separatore verticale decorativo.
- Hero desktop a due colonne: titolo grande a sinistra, ultima temperatura e grafico a destra. Mobile a colonna singola. Il pannello inizialmente chiaro è stato portato al tema scuro su richiesta.
- Tre misure, archivio, cronologia, stime indisponibili e progetto conservati. Filtri neutri, selezione chiara con testo scuro leggibile anche in hover.
- Postilla visibile sopra il contenuto: “Work in progress · Possibili dati presenti fittizi”. Rimane fuori dalle animazioni. [Dati pubblici di prova e vincoli](docs/data-preview.md).

## Coreografia degli ingressi

| Elemento | Comportamento corrente |
|---|---|
| Header | Dissolvenza e spostamento da −8 px, 500 ms |
| Hero e sezioni | Dissolvenza e spostamento da +16 px, 560 ms |
| Elementi intro e schede | Observer individuale, ritardi 0/80/160 ms |
| Griglia del grafico | Dissolvenza 400 ms, ritardo 55 ms fra linee |
| Curve | Disegno lungo il tracciato, 1400 ms dopo 180 ms |
| Aree | Dissolvenza 900 ms dopo 500 ms |
| Punti | Dissolvenza 280 ms, ritardo proporzionale alla posizione temporale |

Preparazione in `useLayoutEffect` prima del paint: gli elementi osservati hanno opacità zero e mantengono lo spazio nel layout. `IntersectionObserver` (soglia 8%, margine inferiore −24 px) avvia l’effetto una sola volta al loro ingresso, poi rimuove lo stato pendente. I grafici osservano la propria zona SVG, non soltanto il titolo della scheda. L’effetto procede nel tempo dopo l’ingresso; non è vincolato alla distanza di scroll.

Una nuova serie o un grafico ricreato dopo loading/errore può avviare un nuovo disegno; il polling invariato non lo riavvia. Null e sospetti restano interruzioni della curva, non vengono interpolati per l’animazione. I numeri non vengono contati da zero con valori intermedi inventati.

Focus tastiera rivela subito il contenitore; movimento ridotto cancella effetti in corso e stati nascosti anche se cambiato durante la visita. Senza supporto observer/animazioni il contenuto resta visibile. Observer, listener e animazioni hanno cleanup. Scroll manuale nativo, scroll morbido soltanto per collegamenti ad ancore, disattivato con movimento ridotto.

## Riflesso sui bordi

Gradiente bianco radiale ritagliato al contorno tramite maschera, centrato sul puntatore. Raggio 220 px sui pannelli, 180 px su pulsanti/CTA; bordo luminoso 1 px sulle schede, 2 px sui pulsanti, dissolvenza 220 ms. Segue il puntatore con interpolazione 0,18 per frame; con movimento ridotto segue immediatamente. Il ciclo si ferma a convergenza e viene cancellato all’uscita/smontaggio.

È attivo solo il bersaglio più vicino: pannello temperatura, scheda misura, grafico archivio, scheda stima, progetto, pulsante abilitato o CTA. I divisori di sezione non reagiscono al passaggio sui filtri. Nessun cambiamento di dimensioni/layout; nessun cursore artificiale. Su touch l’effetto è escluso; focus tastiera bianco indipendente dall’hover. Link e dettagli hanno sottolineatura, righe cronologia un riscontro discreto.

## Verifiche, storia e limiti

Rilasci UI `fab71cb`, dati/contratto `bce39e2`, produzione verificata sul dominio principale. Build/lint e suite in [frontend.md](docs/frontend.md); 13 scenari browser in [risultati locali](docs/factory-verification/results.json), evidenze pubbliche in [data-preview.md](docs/data-preview.md).

Le revisioni intermedie — pannello chiaro, marchi “m.” e “O”, hover uniforme e ingressi senza stato nascosto — sono state sostituite dalla specifica sopra. I problemi verificati sono in [CORRECTIONS.md](CORRECTIONS.md), in particolare COR-005 e COR-006. Gli screenshot precedenti in `docs/design-review/` e `docs/frontend-verification/` restano evidenze storiche, non lo stato corrente.

Il test visuale non certifica WCAG, prestazioni su telefono reale, funzionamento Arduino o freschezza delle misure. Il modello previsionale resta non validato. Nessuna nuova libreria di animazione o grafici introdotta.
