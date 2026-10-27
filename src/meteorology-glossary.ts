/** Termini semplici, rivolti a chiunque visiti il sito. */
export const meteorologyGlossary = [
  { term: 'Temperatura', definition: 'Indica quanto è calda o fredda l’aria. La stazione la esprime in gradi Celsius (°C).' },
  { term: 'Umidità relativa', definition: 'Percentuale che confronta il vapore acqueo presente nell’aria con il massimo possibile alla stessa temperatura. Non corrisponde alla probabilità di pioggia.' },
  { term: 'Pressione atmosferica', definition: 'È la forza esercitata dall’aria su una superficie. Qui è espressa in ettopascal (hPa); dipende anche dalla quota della stazione.' },
  { term: 'Misurazione', definition: 'È un valore rilevato dai sensori in un certo momento. Descrive una condizione osservata, non ciò che accadrà.' },
  { term: 'Previsione', definition: 'È una stima di condizioni future costruita con un modello. Può essere incerta e non va confusa con le misure già registrate.' },
  { term: 'Media', definition: 'Somma dei valori validi divisa per il numero di osservazioni considerate. Se mancano delle ore, non rappresenta automaticamente l’intera giornata.' },
  { term: 'Valore sospetto', definition: 'Una lettura fuori dai limiti di controllo. Può comparire nella cronologia, ma viene esclusa dalle elaborazioni statistiche.' },
  { term: 'Orario di misura e di ricezione', definition: 'Il primo indica quando la stazione ha misurato; il secondo quando il sistema ha ricevuto il dato. Possono essere diversi.' },
] as const
