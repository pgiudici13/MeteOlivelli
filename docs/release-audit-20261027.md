# Audit software finale — 27 ottobre 2026

## Perimetro e autorizzazione

Checkout iniziale `4088438`, pulito su `main`, repository
`pgiudici13/MeteOlivelli`. L’utente ha richiesto revisione completa, correzioni
proporzionate senza restyling, test e commit/push dopo ogni risoluzione verificata.
Stack, dati e struttura del sito conservati; nessuna dipendenza introdotta.
Non sono state applicate migrazioni o modifiche di configurazione Supabase/Vercel.
I push avviano la normale integrazione Git di Vercel.

## Risultati

Tredici problemi verificati, con prove e correzioni in
[COR-033–COR-045](../CORRECTIONS.md#cor-033--ordine-dei-grafici-perde-le-frazioni-sotto-il-millisecondo):
precisione e riconciliazione dei grafici, ora delle modifiche amministrative,
conferma delle scritture, gestione ricevute uploader, testata tablet, focus quiz,
selezione SVG, durata delle animazioni cronologia, opt-out fra schede,
inizializzazione Motion lazy e recupero dagli errori di pagina.

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
| Diff, segreti e file stagionati | Controllati; nessun valore ambiente letto/stampato |

Il build segnala soltanto i chunk PDF oltre 500 kB già caricati su richiesta:
non fanno parte del caricamento iniziale. Nessuna nuova misurazione Lighthouse o
prestazione su telefono fisico; COR-015 resta aperto.

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
| **Totale** | **50** | Nessun errore JavaScript non gestito nelle prove finali |

I runner che salvano immagini/JSON accettano una directory opzionale per non
sovrascrivere le evidenze storiche. In questa sessione gli output sono temporanei
in `/tmp/meteolivelli-release-audit/`; i runner versionati rendono le prove
ripetibili. La QA non certifica conformità WCAG completa o prestazioni su ogni
browser/dispositivo esistente.

## Stato di rilascio e limiti

Le correzioni frontend sono pushate su `main`; la verifica del dominio pubblico
è registrata nell’aggiornamento di rilascio in fondo. Le correzioni locali
`manage-measurements` richiedono un deployment Edge separatamente autorizzato.
Il push Git non aggiorna le Edge Function e non applica gli indici predisposti.

Restano aperti i criteri operativi già in roadmap: writer/CSV e Windows reali,
catena Arduino→sito, clock/cadenza, continuità dell’acquisizione, backup con prova
di restore, avvisi e validazione meteorologica. Non è stato eseguito il runner
CSV online che inserisce dati, né sono state rieseguite prove SQL remote. I dati
sintetici restano esclusi dalla dashboard finale. Non viene attestata l’assenza
assoluta di bug né chiusa REL-01 sulla sola base di queste prove software.
