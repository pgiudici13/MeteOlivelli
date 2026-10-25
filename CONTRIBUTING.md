# Contribuire a MeteOlivelli

Grazie per l'interesse! MeteOlivelli è un progetto scolastico sviluppato da Pietro Giudici e Nicholas Borin. L'obiettivo è renderlo comprensibile, verificabile e utile anche ad altri studenti.

## Prima di iniziare

- Leggi [README.md](README.md) per panoramica, avvio e stato reale; [plan.md](plan.md) è l'unica roadmap, mentre [tasks.md](tasks.md) contiene la checklist.
- Per interventi sul codice consulta [AGENTS.md](AGENTS.md) e la documentazione specifica in `docs/`. Le indicazioni tecniche esistenti rimangono applicabili.
- Se vuoi proporre una funzione importante o modificare l'architettura, apri prima una **issue** che illustri il problema, la motivazione e una possibile soluzione.
- La licenza MIT è proposta nella PR di adozione e richiede conferma dei titolari dei diritti prima dell'unione al ramo principale. Contribuisci soltanto materiale che hai il diritto di condividere.

## Segnalazioni e proposte

Una buona issue include: il problema osservato, come riprodurlo, il comportamento atteso, dispositivo/browser (se pertinente) e informazioni non sensibili utili alla diagnosi.

Non inserire password, token, file `.env`, informazioni personali, dump del database o dati della scuola non autorizzati. Per questioni di sicurezza che potrebbero esporre segreti, contatta i responsabili attraverso un canale privato concordato: evita una issue pubblica con dettagli sfruttabili.

## Procedura per una pull request

1. Parti da `main` aggiornato e crea un branch dedicato alla modifica.
2. Mantieni i cambiamenti piccoli, leggibili e coerenti con React, TypeScript, Vite, Deno, Python e i contratti esistenti.
3. Documenta perché hai modificato i file e quali verifiche hai eseguito.
4. Se cambi il funzionamento, aggiorna i documenti interessati; non dichiarare completati i task senza prove.
5. Apri una pull request verso `main` indicando cosa cambia, eventuali rischi e ciò che resta da testare. Non effettuare deploy, migrazioni o modifiche ai servizi di produzione come parte di una proposta non autorizzata.

## Verifiche locali

Dalla root del repository:

```sh
npm ci
npm run check
```

`npm run check` comprende build, lint, test frontend, controlli Deno e test dell'uploader Python. Per una modifica **solo documentale**, verifica accuratezza, collegamenti, ortografia e coerenza con `plan.md` e `tasks.md`; non è necessario dichiarare test applicativi non eseguiti.

## Qualità e provenienza dei dati

- Distingui sempre campioni `synthetic`, `historical` e `live`.
- Non presentare valori sintetici come osservazioni fisiche, né simulazioni come previsioni meteorologiche reali.
- Non inventare timestamp di misura da un contatore Arduino o dalla data di ricezione server.
- Non caricare campioni nel database pubblico, né modificare segreti o infrastruttura, per rendere più impressionante una demo.
- Prima di affermare che la stazione è operativa servono verifiche sulla catena Arduino → Windows/CSV → uploader → Supabase → sito.

## Diritti e materiali di terzi

La proposta di licenza MIT riguarda il materiale originale per il quale i titolari possono concederla. Il logo del liceo, nomi, marchi, fotografie, font, librerie e altri elementi di terzi possono avere condizioni diverse: non presumere che siano coperti da MIT. Segnala sempre l'origine di risorse esterne e verifica i diritti di distribuzione.

Per informazioni operative, consulta [docs/operations.md](docs/operations.md). Per l'attendibilità dei dati di prova, consulta [docs/data-preview.md](docs/data-preview.md).
