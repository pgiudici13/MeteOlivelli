# Audit software finale — 27 ottobre 2026

## Perimetro e autorizzazione

Checkout iniziale `4088438`, pulito su `main`, repository
`pgiudici13/MeteOlivelli`. L’utente ha richiesto revisione completa, correzioni
proporzionate senza restyling, test e commit/push dopo ogni risoluzione verificata.
Stack, dati e struttura del sito conservati; nessuna dipendenza introdotta.
Non sono state applicate migrazioni o modifiche di configurazione Supabase/Vercel.
I push avviano la normale integrazione Git di Vercel.

## Risultati

Quattordici problemi verificati, con prove e correzioni in
[COR-033–COR-046](../CORRECTIONS.md#cor-033--ordine-dei-grafici-perde-le-frazioni-sotto-il-millisecondo):
precisione e riconciliazione dei grafici, ora delle modifiche amministrative,
conferma delle scritture, gestione ricevute uploader, testata tablet, focus quiz,
selezione SVG, durata delle animazioni cronologia, opt-out fra schede,
inizializzazione Motion lazy, recupero dagli errori di pagina e nome accessibile
del link scolastico. Ottimizzato anche il caricamento del font per COR-015.

Ogni correzione è stata sottoposta a controlli prima del relativo commit/push.
Un controllo completo intermedio ha intercettato il test analytics appena creato
mentre il file era ancora in lavorazione: nessun commit è stato creato da quel
comando; il controllo completo è stato ripetuto con successo dopo il completamento.

| Controllo | Esito finale |
|---|---|
| Build TypeScript/Vite e route statiche | Passato |
| ESLint e controlli Deno | Passati |
| Test frontend Node | 107/107 |
| Test backend Deno, senza rete/ambiente/filesystem | 54/54 |
| Test uploader Python | 28/28 |
| Audit npm sul registro ufficiale | 0 vulnerabilità segnalate |
| Diff, segreti e file inclusi nel commit | Controllati; nessun valore ambiente letto/stampato |

Il build segnala soltanto i chunk PDF oltre 500 kB già caricati su richiesta:
non fanno parte del caricamento iniziale. I quattro audit Lighthouse sono descritti
sotto; nessuna prova su telefono fisico, COR-015 resta aperto.

## Prove browser

Playwright esterno al progetto e Chrome locale, nessuna dipendenza npm aggiunta.
Tutti i dati inventati sono fixture intercettate nel solo browser; le prove non
scrivono nel database e non attestano misure o previsioni reali.

| Runner in `tests/` | Scenari | Copertura principale |
|---|---:|---|
| `frontend-browser.mjs` | 14 | Vuoto, grafici, filtri, polling, errori/rete, tastiera, reflow, senza JS |
| `complete-history-browser.mjs` | 11 | Cronologia, aggiornamento, pagina conservata, throttle, offline/visibilità |
| `motion-browser.mjs` | 5 | Ingressi, grafici, riduzione dinamica movimento, hover, temi |
| `forecast-browser.mjs` | 7 | Worker reale, paginazione, isolamento filtri, scadenza, esclusione sintetici |
| `ui-regressions-browser.mjs` | 6 | 52 layout, footer, lazy Motion, quiz da tastiera, SVG, 300 righe, stesso UUID |
| `admin-browser.mjs` | 2 | Ora solare/precisione e POST riuscito seguito da GET fallito |
| `analytics-browser.mjs` | 3 | Opt-out tra schede, ripristino default e cookie host/domain |
| `page-errors-browser.mjs` | 2 | Moduli Info/Quiz bloccati, focus, temi/reflow, ricarica e ritorno home |
| `school-link-browser.mjs` | 4 | Nome accessibile del link scuola, regola axe verificata separatamente |
| `font-browser.mjs` | 3 | Solo subset iniziale, temi/quiz, stessi ingombri e altri alfabeti |
| **Totale** | **57** | Nessun errore JavaScript non gestito nelle prove finali |

I runner che salvano immagini/JSON accettano una directory opzionale per non
sovrascrivere le evidenze storiche. In questa sessione gli output sono temporanei
in `/tmp/meteolivelli-release-audit/`; [riepilogo versionato](release-audit-20261027/browser-results.json)
e runner rendono le prove ripetibili. Dashboard e 52 layout sono stati rieseguiti
anche dopo il nuovo font. La QA non certifica conformità WCAG completa o prestazioni su ogni
browser/dispositivo esistente.

## Prestazioni mobile e font

Lighthouse 13.5, Chrome 156, profili temporanei, 412×823 px, rete e CPU simulate,
medesima configurazione per quattro navigazioni del sito pubblico. Preferenze
statistiche predefinite del progetto, senza modifiche agli strumenti remoti.

| Versione | Performance | LCP simulato | LCP osservato | TBT | CLS |
|---|---:|---:|---:|---:|---:|
| Prima, run 1 | 73 | 6,56 s | 2,725 s | 65 ms | 0 |
| Prima, run 2 | 88 | 3,70 s | 1,543 s | 46 ms | 0 |
| Dopo, run 1 | 80 | 5,19 s | 1,583 s | 54 ms | 0 |
| Dopo, run 2 | 98 | 2,03 s | 1,580 s | 15,5 ms | 0 |

Accessibilità, best practice e SEO: 100 in tutte le misure. Il difetto non pesato
`label-content-name-mismatch` presente nelle baseline scompare dopo COR-046.
I punteggi di laboratorio oscillano: queste misure non dimostrano una garanzia
di LCP, non equivalgono a CrUX/PSI e non chiudono COR-015.

Il risparmio del font è invece verificato: 352.240 → 72.260 byte, −79,5%; nessuna
richiesta del font completo nelle due navigazioni Home successive. Il totale
trasferito passa da circa 735 kB a 456 kB. Originale, forme e metriche sono
conservati; nessuna dipendenza aggiunta al sito. Strumenti FontTools, Lighthouse
e axe utilizzati soltanto da directory temporanee esterne al progetto.
[Quattro audit sanificati](release-audit-20261027/lighthouse-summary.json),
[audit npm](release-audit-20261027/npm-audit.json).

## Stato di rilascio e limiti

Le correzioni frontend sono pushate su `main`; la verifica del dominio pubblico
è completata sul commit `e625950`, stato Vercel `success`:
[deployment](https://vercel.com/pedro13-projects/meteolivelli/6LBdk6TXqC3qo26c6yqhS6FS5xwW).
JavaScript, CSS e font pubblicati sono identici byte per byte alla build locale;
sette risposte HTTP e sei pagine browser superano controllo di route, 404,
noindex, titoli, reflow 320/390/1280 e assenza di errori JavaScript.
[Hash ed esiti pubblici](release-audit-20261027/public-smoke.json).

L’API di lettura risponde 200 con ultima riga `synthetic`, esclusa dalla UI finale.
L’API amministrativa risponde 503: la configurazione deve essere completata e
la prova autenticata resta aperta. Le correzioni locali
`manage-measurements` richiedono un deployment Edge separatamente autorizzato.
Il push Git non aggiorna le Edge Function e non applica gli indici predisposti.

Restano aperti i criteri operativi già in roadmap: writer/CSV e Windows reali,
catena Arduino→sito, clock/cadenza, continuità dell’acquisizione, backup con prova
di restore, avvisi e validazione meteorologica. Non è stato eseguito il runner
CSV online che inserisce dati, né sono state rieseguite prove SQL remote. I dati
sintetici restano esclusi dalla dashboard finale. Non viene attestata l’assenza
assoluta di bug né chiusa REL-01 sulla sola base di queste prove software.
