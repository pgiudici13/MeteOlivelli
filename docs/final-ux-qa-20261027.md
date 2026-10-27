# Rifinitura finale dell'esperienza utente — 27 ottobre 2026

Sei interventi richiesti, sviluppati con test, commit e push separati:

1. Se la stazione non fornisce dati recenti, un messaggio unico distingue attesa, errore e archivio soltanto storico. Nessuna lettura è simulata.
2. Sui telefoni stretti la testata può andare a capo; navigazione e pulsanti PDF mantengono dimensioni di tocco adeguate.
3. I grafici offrono, su smartphone, pulsanti per scegliere il punto precedente o successivo oltre a tocco e tastiera; date e valori restano derivati dai campioni disponibili.
4. L'orario di acquisizione delle ultime letture compare una sola volta sopra le schede, con dettaglio della provenienza disponibile separatamente.
5. I PDF hanno intestazioni di contesto ripetute; ogni grafico occupa una pagina dedicata e la cronologia mantiene l'intestazione della tabella su più pagine.
6. Focus visibile rafforzato, aree attivabili di almeno 44 px per i controlli espandibili, testi secondari verificati rispetto a una soglia di contrasto 4,5:1 sui colori documentati.

I test automatizzati verificano comportamento, generazione PDF e alcune proprietà dei fogli stile. Non sostituiscono il collaudo manuale su un campione di dispositivi fisici, con lettori di schermo né l'integrazione della stazione reale. Restano validi i vincoli di provenienza, qualità e non interpolazione delle misure.
