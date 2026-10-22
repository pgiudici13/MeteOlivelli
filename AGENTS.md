# Istruzioni operative — MeteOlivelli

- Conservare React, TypeScript, Vite, ESLint e npm; non ricreare il progetto o cambiare stack senza richiesta esplicita. Mantenere soluzioni semplici e proporzionate.
- Prima di modificare, leggere i file interessati, le istruzioni applicabili e `git status`. Preservare modifiche locali e file non tracciati; non sovrascrivere il lavoro presente.
- “Fase N” indica sempre il blocco N di `tasks.md`; mantenere numerazione, rimandi e stato sincronizzati con `plan.md`.
- Consultare `plan.md` per stato, requisiti, ipotesi e decisioni; usare `tasks.md` per ordine operativo, dipendenze e verifiche, aggiornando gli esiti quando si completa un’attività. Non trattare una proposta documentata come autorizzazione a implementarla. `plan.md` è l’unica roadmap: il duplicato `piano.md` è stato rimosso su richiesta dell’utente; non ricrearlo.
- Distinguere fatti verificati, informazioni dell'utente, ipotesi e decisioni. Non assumere formato, unità, timestamp o modalità di scrittura del CSV senza un campione reale.
- Non presentare misurazioni inventate come dati della stazione. I dati dimostrativi devono essere chiaramente e permanentemente etichettati. Distinguere le previsioni dalle osservazioni della stazione, indicando fonte e validità; non inventare previsioni dai valori dei sensori.
- Tenere distinti `measured_at` e `received_at`; il contatore Arduino che si azzera non è una data assoluta né una chiave univoca sufficiente.
- Non inserire segreti nel codice, nel client, nei log, nella documentazione o in Git. Non leggere o stampare valori di `.env`, token o chiavi durante attività che non ne richiedono esplicitamente l'uso. Usare eventuali esempi solo con segnaposto.
- Non modificare GitHub, Vercel o Supabase, né applicare migrazioni, senza richiesta esplicita dell'utente. Verificare progetto, ambiente e ambito prima di operazioni autorizzate. Non attivare servizi a pagamento senza autorizzazione.
- Non creare commit, push, merge o riscritture della storia Git senza richiesta esplicita. Preferire identificatori e messaggi di commit in inglese quando richiesti.
- Usare l'italiano nelle spiegazioni, nella documentazione e nella UI.
- Quando si modifica codice, eseguire `npm run build`, `npm run lint` e i test pertinenti disponibili; riportare esiti e limiti. Se mancano test, dichiararlo. Aggiungere test mirati per logica critica, senza introdurre dipendenze o suite sproporzionate.
- Registrare in `CORRECTIONS.md` soltanto problemi verificati o esplicitamente segnalati, con prova, impatto e verifica richiesta. Tenere ipotesi e decisioni in `plan.md`; aggiornare la documentazione quando cambia il comportamento.
