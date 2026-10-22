# Fixture sintetiche — non sono misure della stazione

`synthetic_backend.csv` è inventato esclusivamente per la prova del backend.
Non definisce il formato reale del CSV scolastico. Dialetto della fixture: UTF-8,
separatore `;`, decimali `,`, intestazione esplicita, misure vuote ammesse come null.

Contiene sei eventi numerici (due identici con ID distinti, un reset del contatore,
umidità sospetta 101%, temperatura assente) e una riga non numerica da conservare
in quarantena. La prova scrive inizialmente solo parte dell'ultima riga in una
copia temporanea e la completa in seguito, verificando che non venga letta prima
del terminatore. Il file versionato non viene alterato.

Gli eventi HTTP sono inviati solo come `historical`, con `captured_at` e
`measured_at` nulli, quindi esclusi da schede live e grafici datati. Gli UUID della
prova sono registrati in un manifesto locale prima dell'invio; dopo la verifica,
si eliminano dal backend esclusivamente gli eventi del manifesto, con sorgente e
provenienza storica controllate. Non eseguire prove live senza richiesta esplicita
e verifica del target; i test unitari non inviano questo file automaticamente.
