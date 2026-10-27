# Design MeteOlivelli — riferimento corrente

La pagina quiz `/gioca` usa gli stessi token, testata, footer e temi del sito. Le risposte corrette e sbagliate hanno superfici verdi e rosse semantiche ad alto contrasto, accompagnate da ✓/×. Il ripple circolare nasce nel punto di contatto e si espande sul pulsante scelto tramite trasformazione, per una resa affidabile anche su touch. Con `prefers-reduced-motion` resta il colore di esito senza movimento. Il quiz è responsive.

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
5. La versione finale locale non espone campioni sintetici e non mostra la postilla provvisoria; non usare l’aspetto “live” per attestare freschezza non verificata.
6. Aggiornare questo file se cambiano token, layout o motion. Registrare requisiti nuovi in `plan.md`, verifiche in `tasks.md` e soltanto bug verificati in `CORRECTIONS.md`.

## Aspetto e struttura

- Canvas caldo `#101010`, pannello temperatura e schede scuri `#171615`, testo `#eeeeee`, bordi sottili `#3d3a39`. Superfici piatte senza vetro, sfocatura o ombre.
- Inter variabile locale con licenza già presente, peso 400 per i titoli, tracking stretto; didascalie monospaziate di sistema. Nessun font scaricato o dipendenza aggiunta.
- Marchio MeteOlivelli: sole delineato con raggi alternati, derivato dal favicon originale e rifinito per la lettura a dimensione ridotta. Varianti coordinate in oro su antracite per dark mode e antracite/oro su avorio per clear mode; intestazione e favicon seguono il tema attivo. Il logo ufficiale del Liceo resta separato e invariato.
- Hero desktop a due colonne: titolo grande a sinistra, ultima temperatura e grafico a destra. Mobile a colonna singola. Il pannello inizialmente chiaro è stato portato al tema scuro su richiesta.
- Tre misure, archivio, cronologia, stime indisponibili e progetto conservati. Filtri neutri, selezione chiara con testo scuro leggibile anche in hover.
- Nessuna postilla provvisoria nella versione finale locale: i campioni di prova e quelli privi di provenienza sono esclusi dalla visualizzazione. [Dati di prova e vincoli](docs/data-preview.md).

## Coreografia degli ingressi

| Elemento | Comportamento corrente |
|---|---|
| Header | Motion, dissolvenza e spostamento da −8 px, 420 ms |
| Hero e sezioni | Dissolvenza e spostamento da +12 px, 420 ms |
| Elementi intro e schede | Observer individuale, ritardi 0/60/120 ms; nessuna doppia traslazione del contenitore |
| Griglia del grafico | Dissolvenza 220 ms, ritardo 30 ms fra linee |
| Serie (curve, area, punti) | Rivelazione da sinistra a destra con una sola maschera SVG, 700 ms dopo 60 ms, easing lineare |

Preparazione in `useLayoutEffect` prima del paint: gli elementi osservati hanno opacità zero e mantengono lo spazio nel layout. `IntersectionObserver` (soglia 8%, margine inferiore −24 px) avvia l’effetto una sola volta al loro ingresso, poi rimuove lo stato pendente. I grafici osservano la propria zona SVG, non soltanto il titolo della scheda. L’effetto procede nel tempo dopo l’ingresso; non è vincolato alla distanza di scroll.

Una nuova serie o un grafico ricreato dopo loading/errore può avviare un nuovo disegno; il polling invariato non lo riavvia. Null e sospetti restano interruzioni della curva, non vengono interpolati per l’animazione. I numeri non vengono contati da zero con valori intermedi inventati.

Focus tastiera rivela subito il contenitore; movimento ridotto cancella effetti in corso e stati nascosti anche se cambiato durante la visita. Senza supporto observer/animazioni il contenuto resta visibile. Observer, listener e animazioni hanno cleanup. Scroll manuale nativo, scroll morbido soltanto per collegamenti ad ancore, disattivato con movimento ridotto.

## Riflesso sui bordi

Gradiente bianco radiale ritagliato al contorno tramite maschera, centrato sul puntatore. Raggio 220 px sui pannelli, 180 px su pulsanti/CTA; bordo luminoso 1 px sulle schede, 2 px sui pulsanti, dissolvenza 220 ms. Segue il puntatore con interpolazione 0,18 per frame; con movimento ridotto segue immediatamente. Il ciclo si ferma a convergenza e viene cancellato all’uscita/smontaggio.

È attivo solo il bersaglio più vicino: pannello temperatura, scheda misura, grafico archivio, scheda stima, progetto, pulsante abilitato o CTA. I divisori di sezione non reagiscono al passaggio sui filtri. Nessun cambiamento di dimensioni/layout; nessun cursore artificiale. Su touch l’effetto è escluso; focus tastiera bianco indipendente dall’hover. Link e dettagli hanno sottolineatura, righe cronologia un riscontro discreto.

## Verifiche, storia e limiti

Rilasci UI `fab71cb`, dati/contratto `bce39e2`, produzione verificata sul dominio principale. Build/lint e suite in [frontend.md](docs/frontend.md); 13 scenari browser in [risultati locali](docs/factory-verification/results.json), evidenze pubbliche in [data-preview.md](docs/data-preview.md).

Le revisioni intermedie — pannello chiaro, marchi “m.” e “O”, hover uniforme e ingressi senza stato nascosto — sono state sostituite dalla specifica sopra. I problemi verificati sono in [CORRECTIONS.md](CORRECTIONS.md), in particolare COR-005 e COR-006. Gli screenshot precedenti in `docs/design-review/` e `docs/frontend-verification/` restano evidenze storiche, non lo stato corrente.

Il test visuale non certifica WCAG, prestazioni su telefono reale, funzionamento Arduino o freschezza delle misure. Il modello previsionale resta non validato. La revisione Motion del 23 ottobre introduce la libreria di animazione; i grafici restano SVG del progetto.

## Scale temporali e correzione al refresh — 22 ottobre 2026

La maschera della serie sostituisce il tratteggio animato normalizzato che produceva segmenti separati nel grafico iniziale. Linee, area e punti vengono scoperti insieme con avanzamento lineare; le interruzioni per campioni nulli/sospetti rimangono parte dei dati, non artefatti del disegno. Assi e testi restano esterni alla maschera.

La scala orizzontale copre l’intera finestra API fino a `until`, non il solo intervallo fra primo e ultimo campione: 24 ore, 168 ore o 720 ore. Le linee fanno riferimento al calendario Europe/Rome: ogni 6 ore locali per 24h, ogni mezzanotte per 7g; nella vista 30g linee giornaliere attenuate e lunedì evidenziati come separatori settimanali. Le etichette interne sono diradate e tenute lontane dagli estremi per evitare sovrapposizioni; nessun valore aggiunto negli intervalli vuoti. Il cambio ora è gestito dal fuso, non assumendo che le mezzanotti siano sempre distanti 24 ore.

## Auto predefinito e medie per fascia

Auto è la selezione iniziale per tutti e quattro i grafici. Per contenere il trasferimento si caricano al massimo i 30 giorni precedenti l’ultima lettura disponibile, anche se la stazione è ferma da tempo; non si deve far sembrare fresca una misura vecchia. Nell’orizzonte caricato, con estensione fino a sette giorni l’asse si adatta al primo/ultimo campione: due giorni restano due giorni. Un campione singolo ha una finestra minima di un’ora. Oltre sette giorni si mostrano le ultime sette date di calendario disponibili in Europe/Rome.

Nella vista aggregata, per ogni giorno si calcola la media aritmetica dei valori validi disponibili in tre fasce concordate: **mattina 00–12, primo pomeriggio 12–17, sera 17–24**. La notte è inclusa nella mattina su indicazione dell’utente. Ogni campo esclude i propri null/sospetti; una fascia senza valori validi interrompe la curva. Non si mescolano campioni di prova e live nelle medie: Auto privilegia le letture live quando disponibili. Le medie sono derivate in memoria e non inserite nel database né nella cronologia; tooltip con fascia e numero di contributi, dicitura “Ultima media” e minimo/massimo delle medie. Le posizioni temporali sono i centri delle fasce, non nuovi timestamp di misura.

Le viste manuali comprendono 24h/7g/14g/30g: 24h mostra i campioni originali; 7g/14g/30g mostrano una media per giorno fra le 09:00 incluse e le 18:00 escluse in Europe/Rome. La cronologia Auto conserva i campioni originali dei 30 giorni caricati. I pulsanti sono cinque e devono restare utilizzabili a 320 px. La maschera lineare e gli ingressi sono stati accelerati ai tempi della tabella; movimento ridotto e assenza di lampeggi restano obbligatori.


## Misure compatte nel pannello iniziale — 23 ottobre 2026

Temperatura principale affiancata da umidità e pressione dello stesso ultimo campione, con etichette monospaziate da 10 px e valori da 16 px. Le due misure secondarie sono impilate; il gruppo va a capo quando manca spazio, senza overflow a 320 px. Restano unità, null e avvisi qualità. Grafico e tema scuro conservati. Revisione locale non ancora pubblicata.


## Sezione stime sperimentali — 23 ottobre 2026

Tre schede +30 minuti, +1 ora, Giornata · +24 ore. Ogni scheda presenta temperatura/umidità/pressione in una lista di definizioni, con divisori discreti, valori da 28 px, unità da 16 px e istante previsto. Ogni campo può essere indisponibile separatamente e ne dichiara il motivo. Dettagli nativi da tastiera per metodo/errore storico e scadenza; metodologia generale sotto le schede. Palette e reflow della griglia esistenti, nessuna icona sole/pioggia o affidabilità percentuale. Spiegazione esplicita del significato +24 ore e dei limiti; nessun mix con le osservazioni.

## Tema chiaro e preferenza di sistema — 23 ottobre 2026

La palette scura resta disponibile come variante. Il tema iniziale segue `prefers-color-scheme` e si aggiorna se il sistema cambia finché non viene scelta manualmente una modalità; lo switch nell’intestazione è presente sia in Home sia in Informazioni. La scelta manuale viene salvata localmente. Uno script iniziale imposta il tema prima del render per evitare il flash. La palette chiara usa fondo avorio, superfici chiare, testo antracite, bordi grigi e accento arancio; grafici, stati, controlli, overlay e `theme-color` seguono il tema. Il controllo resta utilizzabile a 320 px.

## Logo del Liceo Olivelli — 23 ottobre 2026

Il logo trasparente fornito dall’utente compare al centro della barra superiore fra il marchio MeteOlivelli e le azioni di navigazione, e nel footer comune alle quattro pagine. Il link apre il sito ufficiale del liceo in una nuova scheda e annuncia questo comportamento alle tecnologie assistive. Non ha un riquadro di sfondo; nel tema scuro l’immagine viene schiarita per mantenere leggibile il testo blu. Su schermi fino a 760 px il marchio, il logo e le azioni occupano righe distinte; dimensioni fluide e footer avvolgibile evitano overflow.

### Footer completo — 26 ottobre 2026

Il footer condiviso riunisce nome e descrizione del progetto, autori e scuola, collegamenti a Home/Informazioni/Gioca/Privacy, link al sito ufficiale e alla licenza MIT. Include anche il contesto dell’aggiornamento dati, specificando che la verifica ogni 15 secondi avviene in Home mentre la pagina è visibile. Su desktop le informazioni sono disposte in tre colonne; a 760 px passano a due colonne e a 450 px a una colonna. Il logo scolastico mantiene le proprie proporzioni e si adatta al tema.

## Paginazione della cronologia — 23 ottobre 2026

Al cambio pagina le righe correnti escono in sequenza con dissolvenza e breve spostamento; dopo l’uscita, le nuove righe entrano con una sequenza analoga. I controlli sono disabilitati durante il passaggio, lo stato comunica l’intervallo visibile e il totale, e la tabella espone `aria-busy`. Con `prefers-reduced-motion` il cambio è immediato. Su mobile le righe diventano schede compatte con etichette dei campi, data in testa e dettagli qualità separati; su desktop restano una tabella accessibile con numeri allineati e intestazioni discrete. Nessun contenuto o dato viene interpolato.

## Pagina Informazioni — revisione del 23 ottobre 2026

La route `/info` accompagna il lettore in cinque tappe: progetto, stazione e percorso previsto dei dati, guida ai grafici, trasparenza e team. Un indice interno usa link semantici con destinazioni esplicite. L’apertura ha titolo editoriale, introduzione e tre fatti essenziali; la chiusura propone il ritorno alla Home.

Il percorso dei dati è una sequenza numerata di sensori, Arduino, archivio e sito; resta dichiarato come percorso previsto finché writer e cadenza reale non sono verificati. Una legenda testuale distingue misura fisica, acquisizione sul PC e ricezione server. Le viste 24 ore, 7/14/30 giorni e Auto sono spiegate senza far passare le medie per nuove misure. Sezioni in superfici neutre, bordi sottili e tipografia del sito; griglie a due colonne su desktop e a colonna singola su mobile. Il flusso tecnico diventa una griglia 2×2 sugli schermi stretti. Colori semantici seguono entrambi i temi, link restano sottolineabili/focalizzabili e non sono introdotte animazioni aggiuntive.


## Cronologia e PDF — correzioni locali del 23 ottobre 2026

La Cronologia aggiunge il comando “Aggiorna cronologia”, con gli stili dei pulsanti già presenti, e la data di rilettura dello snapshot. La tabella e la pagina selezionata restano visibili durante aggiornamento ed errore; gli avvisi distinguono il caricamento iniziale dai dati precedentemente letti. Nessun cambio di palette o animazione. Il PDF cronologia mantiene A4 orizzontale e margini laterali di 28 pt: colonne degli orari ridimensionate, tre colonne dei valori flessibili e intestazione ripetuta sulle pagine. Verifiche e schermata in [verbale](docs/project-review/README.md#correzioni-locali-successive-alla-revisione).


## Motion e interazioni — 23 ottobre 2026

Revisione locale richiesta dall’utente: `motion/mini` gestisce ingressi, disegno SVG, titolo, microinterazioni e paginazione con il motore Web Animations di Motion. Non richiede Motion+ né servizi esterni in esecuzione. I riflessi dei bordi e i riscontri cromatici restano nelle implementazioni esistenti.

- Titolo delle quattro pagine: parole intere in sequenza, dissolvenza e +12 px in 480 ms; ritardo 45 ms limitato a 200 ms. Spazi, a-capo, reflow e semantica del singolo h1 conservati. Nessun effetto macchina da scrivere o lettere casuali sui dati.
- Informazioni e Privacy: sezioni autonome in ingresso una sola volta, 420 ms e +10 px. La Home conserva observer individuali per le schede; postilla fuori dagli effetti.
- Pulsanti abilitati e link di navigazione/CTA: hover −2 px, pressione scala 0,97, ritorno in 160 ms. Un solo insieme di listener con cleanup gestisce anche i controlli dinamici. Le risposte quiz conservano il proprio ripple e le animazioni dedicate.
- Cronologia: uscita e ingresso delle righe in 180 ms per fase, ritardo 25 ms fra righe; la fase successiva segue il completamento effettivo, senza timer a durata stimata. Movimento ridotto anche durante un passaggio completa subito il cambio.
- Grafici: maschera lineare in 700 ms e griglia in 220 ms conservate, ora tramite Motion. Il puntatore o il tocco selezionano il punto più vicino; focus e frecce scorrono i punti, Home/End raggiungono gli estremi, Escape chiude la selezione. Un cursore verticale e una didascalia mostrano soltanto il valore e l’etichetta del punto esistente, incluse le medie dichiarate. Nessuna curva o misura intermedia creata.

Con movimento ridotto gli ingressi e le microinterazioni sono esclusi e gli effetti in corso vengono cancellati; focus rivela subito il contenuto. Le larghezze applicate alla maschera da Motion vengono ripristinate prima di nuove serie e al cambio preferenza. Scroll manuale nativo e controlli HTML conservati. Evidenze locali con fixture sintetiche in [motion-verification](docs/motion-verification/results.json); nessuna nuova pubblicazione.
