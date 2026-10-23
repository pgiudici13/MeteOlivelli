# Fixture sintetica per test browser

`frontend_synthetic.csv` contiene valori inventati esclusivamente per i test
browser. Non è incluso nell'applicazione, non viene caricato nel database e non
è una misurazione della stazione MeteOlivelli.

Le colonne seguono l'ordine dichiarato per il controllo locale: secondi
dall'accensione Arduino, temperatura in °C, umidità in percentuale e pressione
in hPa. I valori decimali usano il punto. Questo fixture non conferma il
separatore, l'intestazione o il comportamento del writer reale.

`Prova misure.csv` è un secondo fixture interamente sintetico, creato per la
richiesta di prova del 23 ottobre 2026. Contiene 121 righe distanti sei ore,
dal 23 settembre al 23 ottobre 2026, con intestazione
`ora;temperatura;umidità;pressione`, timestamp ISO 8601 con offset `+02:00`
(CEST) e decimali con virgola. I valori sono generati matematicamente e non
sono osservazioni della stazione. Il formato è quello richiesto per questa
prova e non certifica il dialetto del CSV reale né è direttamente compatibile
con il parser uploader, che si aspetta i secondi Arduino al posto dell'ora.
