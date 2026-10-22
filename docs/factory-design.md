# Design Factory — specifica corrente, 22 ottobre 2026

La proposta allegata `DESIGN (1).md` è stata adattata al sito MeteOlivelli e alle successive richieste dell’utente. Gli esempi commerciali Factory non hanno introdotto login, partner o funzionalità commerciali. Il riferimento Figma Obsidian v5 e le sue schermate sono storici; non descrivono la grafica corrente né attestano modifiche al file Figma.

## Aspetto e struttura

- Canvas caldo `#101010`, pannello temperatura e schede scuri `#171615`, testo `#eeeeee`, bordi sottili `#3d3a39`. Superfici piatte senza vetro, sfocatura o ombre.
- Inter variabile locale con licenza già presente, peso 400 per i titoli, tracking stretto; didascalie monospaziate di sistema. Nessun font scaricato o dipendenza aggiunta.
- Marchio `MO.` con dimensione ereditata da “MeteOlivelli” e separatore verticale decorativo.
- Hero desktop a due colonne: titolo grande a sinistra, ultima temperatura e grafico a destra. Mobile a colonna singola. Il pannello inizialmente chiaro è stato portato al tema scuro su richiesta.
- Tre misure, archivio, cronologia, stime indisponibili e progetto conservati. Filtri neutri, selezione chiara con testo scuro leggibile anche in hover.
- Postilla visibile sopra il contenuto: “Work in progress · Possibili dati presenti fittizi”. Rimane fuori dalle animazioni. [Dati pubblici di prova e vincoli](data-preview.md).

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

Rilasci UI `fab71cb`, dati/contratto `bce39e2`, produzione verificata sul dominio principale. Build/lint e suite in [frontend.md](frontend.md); 13 scenari browser in [risultati locali](factory-verification/results.json), evidenze pubbliche in [data-preview.md](data-preview.md).

Le revisioni intermedie — pannello chiaro, marchi “m.” e “O”, hover uniforme e ingressi senza stato nascosto — sono state sostituite dalla specifica sopra. I problemi verificati sono in [CORRECTIONS.md](../CORRECTIONS.md), in particolare COR-005 e COR-006. Gli screenshot precedenti in `docs/design-review/` e `docs/frontend-verification/` restano evidenze storiche, non lo stato corrente.

Il test visuale non certifica WCAG, prestazioni su telefono reale, funzionamento Arduino o freschezza delle misure. Il modello previsionale resta non validato. Nessuna nuova libreria di animazione o grafici introdotta.
