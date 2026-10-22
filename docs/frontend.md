# Frontend Fase 7 — 22 ottobre 2026

La dashboard React/TypeScript sostituisce la pagina provvisoria. Riferimento:
[MeteOlivelli · Obsidian UI v5](https://www.figma.com/design/dMJqTphynvTgGm6yqUsVrP/MeteOlivelli?node-id=7-2),
viste desktop `7:3` e mobile `7:4`, lette tramite il plugin Figma con contesto
e screenshot. Il file Figma non è stato modificato. Branch locale:
`codex/frontend-phase-7`; nessun commit, push, PR o deploy eseguito.

## Comportamento implementato

- Sfondo uniforme `#05080E`, superfici satinate, accenti menta/azzurro/lilla,
  font Inter variabile locale con licenza OFL, impaginazione responsive.
- Le tre schede provengono dallo stesso evento. Un campo nullo dice “Dato assente”;
  archivio vuoto, caricamento ed errore sono distinti. Nessuno zero sostitutivo.
- Tre grafici SVG generati dalle serie ricevute, assi con unità e tempo dichiarati,
  minimo/massimo, riepilogo accessibile e cronologia equivalente in tabella.
  Null/sospetti interrompono la linea per il solo campo interessato; i valori
  originali e i motivi restano consultabili nei dettagli.
- Periodi 24h/7g/30g con pulsanti nativi e stato `aria-pressed`. Tutte le pagine
  API sono lette con cursore e finestra coerente, deduplicate per UUID e ordinate.
  La tabella presenta sei campioni per pagina, dal più recente.
- Acquisizione sul PC, misura fisica e prima ricezione restano distinte;
  visualizzazione in `Europe/Rome`, data disponibile e nessuna conversione
  dell'uptime in data. La ricezione recente non prova freschezza.
- Le sezioni sotto la piega entrano una sola volta con fade/8 px in 220 ms;
  stagger 40 ms, massimo 120 ms per le schede. Scroll nativo; movimento ridotto
  senza animazioni. I contenuti non dipendono dall'animazione per essere visibili.
  Fallback statico `noscript` esplicito, senza promettere dati live senza JS.
- Stime +30 minuti/+1 ora/giornata: solo “Stima non disponibile”, con stato non
  validato. Nessun provider esterno o previsione dedotta dai sensori.

Le curve vettoriali del mockup rappresentano dati sintetici: sono state tradotte
in grafici dinamici alimentati dall'API. Non sono immagini decorative da inserire
come osservazioni reali. Non ci sono immagini statiche Figma necessarie nella
dashboard; nessun URL temporaneo di asset è presente nel codice.

## Letture e aggiornamenti

Endpoint pubblico già documentato in BE-07:
[read-measurements](https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/read-measurements).
Solo GET anonimo, senza SDK, credenziali, cookie o letture di `.env`.
Il browser non accede alle tabelle e non esegue scritture.

`src/weather.ts` verifica la risposta e mantiene una proiezione dei campi pubblici.
`weather-feed.ts` gestisce letture e recupero; `use-weather.ts` collega ciclo e
visibilità a React. Timeout 10 secondi per richiesta, annullamento allo smontaggio,
nessun ciclo sovrapposto. Risposte invalide/errori HTTP non diventano archivi vuoti.
Un errore conserva gli ultimi dati riusciti con avviso esplicito.

Polling latest ogni 15 secondi a pagina visibile; ritorno in primo piano e evento
online avviano un tentativo. Storico all'apertura, cambio periodo, variazione
dell'ultimo evento e recupero da errore dello storico. Il backend dichiara cache
pubblica di 10 secondi; finestre scadute eliminate usando `until` del server anche
senza nuovi campioni. Oltre 100 pagine/50.000 eventi la consultazione fallisce
esplicitamente, senza presentare una serie parziale come completa.

Cadenza e ancoraggio reali restano ignoti: `getFreshness` ha test prima/al/dopo
atteso +20 minuti, ma il client passa cadenza non configurata. Lo stato corrente è
quindi “Freschezza non determinabile” in presenza di misure. Non dedurre la cadenza
dai campioni DEMO Figma. La soglia usa `measured_at`, mai `received_at` come surrogato.

## Verifiche eseguite e ripetibili

`npm run check` su copia del progetto priva di `.env*`, `.vercel` e configurazioni
locali, con le dipendenze già installate: build/lint frontend, **16 test Node**,
check/lint/formato backend, **39 test Deno** e **21 test Python** superati.
Nessuna dipendenza aggiunta. `npm run frontend:test` richiede Node 24+ per il
supporto nativo al TypeScript; verificato con Node 26.12.0.

QA browser opzionale in `tests/frontend-browser.mjs`, con Playwright disponibile
esternamente. Il controllo `npm run check` non scarica né avvia browser.
Con Vite già in ascolto su localhost:

```sh
node tests/frontend-browser.mjs /percorso/playwright/index.mjs /percorso/chrome
```

Se Playwright e il suo Chromium sono già disponibili tramite normale risoluzione
Node, basta `node tests/frontend-browser.mjs`. Il terzo argomento opzionale è
l'URL locale. Il runner registra screenshot e [risultati JSON](frontend-verification/results.json).

Undici scenari browser superati: GET reale vuoto, tre grafici con fixture,
reflow 320/390/768/1280 px, tastiera e filtri, assenza di riletture inutili,
nuovo evento in due pagine senza reload, errore/riconnessione, null e sospetti,
reflow equivalente a viewport dimezzato per zoom 200% e movimento ridotto,
caricamento e fallback senza JavaScript. Nessun errore JavaScript non gestito;
le richieste fallite nel caso offline sono intenzionali. Non è una certificazione
WCAG o una prova manuale di zoom/lettore di schermo su dispositivo fisico.

Screenshot ispezionati:

- [Desktop con API reale vuota](frontend-verification/desktop-empty.png).
- [Desktop con fixture DEMO](frontend-verification/desktop-demo.png).
- [Mobile con fixture DEMO](frontend-verification/mobile-demo.png).

I numeri negli screenshot DEMO sono fixture intercettate solo nel browser di
prova e marcate nelle evidenze; non sono nel bundle applicativo né nel database.
Le evidenze verificano l'interazione locale, non osservazioni meteorologiche.

## Limiti ancora aperti

- UI-00: revisione con il compagno e QA con utenti/dispositivi reali.
- UI-02: inserimento reale DB → pagina aperta, latenza dal commit, quote/costi
  con pubblico reale, cadenza e ancoraggio verificati. Il GET pubblico attuale è
  stato provato vuoto; tutti i casi positivi del frontend sono sintetici.
- Il contratto latest non cambia per i soli inserimenti storici anteriori:
  questi diventano visibili riaprendo la pagina o cambiando periodo. Non è
  promesso un cursore su `received_at` o un rilevamento completo dei backfill.
- WX-01–WX-02: modello e orizzonti da valutare su dati idonei, separatamente dal
  completamento frontend. Nessuna attendibilità previsionale attestata.
- CSV/writer, clock, installazione e prove Windows restano DATA/UP; nessuna prova
  frontend li sostituisce. La Fase 7 complessiva e il rilascio restano aperti.
