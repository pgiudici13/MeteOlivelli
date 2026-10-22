# Pubblicazione del branch e collaudo CSV online — 22 ottobre 2026

**Verbale storico:** il prodotto non ha più una modalità DEMO. Le righe sintetiche
furono intercettate solo nel browser di QA; il lettore DEMO e i dati sintetici nel
database sono stati rimossi il 22 ottobre 2026. Il fixture browser resta confinato
in `tests/fixtures/`.

Richiesta dell'utente: commit e push dell'intero frontend, poi prova della pagina
online con il fixture CSV sintetica esistente. Chiarimento esplicito: **solo collaudo con
dati simulati**, nessuna modalità DEMO pubblica o importazione nel database.

## Target verificati e pubblicazione

- Repository `pgiudici13/MeteOlivelli`, branch `codex/frontend-phase-7`.
- Commit frontend pubblicato: [`0af54b8`](https://github.com/pgiudici13/MeteOlivelli/commit/0af54b811dc9c6a076ab2a68241c6a9041f9ee0a).
  Commit locale e riferimento remoto verificati identici dopo il push.
- Vercel `meteolivelli`, progetto `prj_Jlxt1vouwTWorxUmqBbCxzRJK4Xm`, scope
  `team_WF8R8uiIvXzKOKJgGrlcCYtF`, framework Vite, Node `24.x`.
- Deploy Git automatico **preview**, stato **READY**:
  [pagina verificata](https://meteolivelli-dyq0vqzkt-pedro13-projects.vercel.app/),
  ID `dpl_GeFGD6NEBGCenUgE95vDDLf9QWzU`. Metadati Vercel e stato del commit GitHub
  confermano il branch/commit previsto.
- Nel solo collaudo preview non eseguiti merge verso `main`, promozioni o deploy manuali in produzione.
  La produzione rilevata resta sul commit `ee9f16a`, precedente alla dashboard.

Il preview richiede autenticazione Vercel. HTTP autenticato restituisce 200 con
titolo `MeteOlivelli — Il meteo a scuola`. Per la QA browser, HTML, JavaScript,
CSS e font sono stati ottenuti dall'URL del deploy tramite `vercel curl` e resi
allo stesso URL nel browser di prova. Nessun asset è servito dalla build locale.
La protezione rimane attiva; la CLI ha gestito il proprio accesso autenticato.
Nessuna credenziale è stampata, inclusa negli screenshot o versionata.

La strada OIDC tramite `vercel env run` non è risultata utilizzabile con la CLI
nativa installata; il collaudo riuscito usa `vercel curl`, senza dipendere da
file ambiente locali. Non è una prova di accesso anonimo al preview protetto.

## Dati di prova e limiti temporali

Fonte: [frontend_synthetic.csv](../tests/fixtures/frontend_synthetic.csv), 50 righe,
separatore virgola e punto decimale specifici di questa fixture. SHA-256:
`6b18a57a17e4ee4646a460e18e6dcc64e02150f5976936396467d0886ec934ca`.

Il CSV non contiene date assolute. Le date nei soli payload del test sono
**virtuali**: inizio 22 ottobre 2026, 00:00 UTC, più i secondi della fixture.
Non ricostruiscono date fisiche e non diventano acquisizioni reali. `measured_at`
resta nullo e la UI dichiara freschezza non determinabile.

Il GET pubblico reale è stato provato senza sostituzioni e restituisce archivio
vuoto, correttamente reso dalla pagina. Nei casi positivi soltanto il GET
`read-measurements` viene intercettato nel browser: i valori derivano dal CSV
originale. Nessun POST di ingestione, SQL o inserimento Supabase eseguito.
Gli screenshot archiviati sono marcati come dati sintetici di collaudo; chi apre
normalmente il preview non vede quelle misure.

## Risultati

Otto scenari superati, nessun errore JavaScript non gestito o asset fallito:

1. HTML online HTTP 200, titolo, JS/CSS/font online e stato API reale vuoto.
2. Ultimo campione esatto: **−4,1 °C · 89,6 % · 1008,3 hPa**.
3. 50 punti per ciascuno dei tre grafici; minimi/massimi coerenti col CSV e
   nessuna coordinata `NaN`.
4. Tutti i 50 campioni della cronologia, su nove pagine, confrontati campo per
   campo col CSV originale in ordine inverso: nessun salto o duplicato.
5. Filtri 24h/7g/30g e parametri richiesti corretti; sempre 50 campioni esistenti,
   nessun riempimento artificiale dell'intero intervallo.
6. Reflow a 320, 390, 768 e 1280 px senza overflow orizzontale; screenshot
   desktop/mobile ispezionati.
7. Nuovo evento aggiuntivo esclusivamente simulato, con temperatura zero:
   compare nella pagina aperta e nei grafici al polling, senza reload.
8. Interruzione di rete simulata: valori conservati con avviso; recupero
   automatico senza falso stato vuoto.

Asset applicativi letti dal deploy: `index-C72V-Nq2.js`, `index-CnNBW7TE.css` e
`InterVariable.woff2`. Corrispondono ai nomi della build già verificata localmente.
Lint e 16 test frontend ripetuti con successo dopo l'aggiunta del runner; la
precedente suite completa aveva superato anche 39 test Deno e 21 Python.

Evidenze:

- [Risultati macchina](frontend-online-verification/results.json).
- [Pagina online con API reale vuota](frontend-online-verification/online-empty.png).
- [Desktop online con CSV intercettato per il collaudo](frontend-online-verification/online-csv-1280.png).
- [Mobile online con CSV intercettato per il collaudo](frontend-online-verification/online-csv-390.png).

## Ripetere il collaudo

Runner: `tests/frontend-csv-online.mjs`. Playwright e Chrome sono strumenti esterni
opzionali, non nuove dipendenze del progetto. Prima verificare progetto, ambiente,
URL immutabile e commit del deploy tramite CLI. Con accesso CLI esistente:

```sh
node tests/frontend-csv-online.mjs /percorso/playwright/index.mjs /percorso/chrome \
  https://URL-preview.vercel.app/ vercel-curl SCOPE-verificato COMMIT-verificato
```

Il commit finale è un'etichetta di provenienza da fornire dopo la verifica CLI,
non un'identità dedotta automaticamente dal browser. Su deploy pubblici è possibile
omettere `vercel-curl` e lo scope; il runner supporta anche un token OIDC già
disponibile in memoria, inviato soltanto all'origine del deploy, mai a Supabase.
Non stampare o passare il valore di credenziali nella riga di comando.

Il collaudo dimostra il rendering e le interazioni del frontend online con questa
fixture; non dimostra CSV/writer/Windows reali, latenza dal commit DB, modello
previsionale, accessibilità completa o prestazioni su tutti i dispositivi.
UI-02 resta provvisoria e la Fase 7 complessiva rimane aperta.

## Rilascio frontend in produzione richiesto successivamente

Il 22 ottobre 2026 l'utente richiede esplicitamente il deployment Vercel per
vedere il sito, insieme a commit e push di tutto il lavoro. Pubblicazione tramite
avanzamento di `main` alla versione frontend già collaudata, senza riscritture
Git o modifiche applicative; deploy di produzione automatico della stessa
integrazione Git nel progetto/scope già verificati. Dominio pubblico confermato:
[meteolivelli.vercel.app](https://meteolivelli.vercel.app/).

Restano validi i limiti del collaudo: fixture CSV sintetica solo nel browser di prova,
archivio reale attualmente vuoto e stime indisponibili. Il rilascio del frontend
non certifica il completamento della pipeline fisica o dell'intero MVP. Prima
della consegna del collegamento controllare stato READY, commit del deploy e
accesso pubblico HTTP/browser; riportare l'esito nel riepilogo del rilascio.
