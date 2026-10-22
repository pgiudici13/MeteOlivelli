# Fixture sintetica per test browser

`frontend_synthetic.csv` contiene valori inventati esclusivamente per i test
browser. Non è incluso nell'applicazione, non viene caricato nel database e non
è una misurazione della stazione MeteOlivelli.

Le colonne seguono l'ordine dichiarato per il controllo locale: secondi
dall'accensione Arduino, temperatura in °C, umidità in percentuale e pressione
in hPa. I valori decimali usano il punto. Questo fixture non conferma il
separatore, l'intestazione o il comportamento del writer reale.
