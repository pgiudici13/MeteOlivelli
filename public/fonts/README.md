# Inter

Font variabile Inter, distribuito localmente senza richieste a provider di font.
Fonte ufficiale: [InterVariable.woff2](https://github.com/rsms/inter/blob/master/docs/font-files/InterVariable.woff2), acquisito il 22 ottobre 2026.
Licenza SIL Open Font License 1.1: [Inter-LICENSE.txt](Inter-LICENSE.txt).
Il file originale `InterVariable.woff2` resta invariato.

Dal 27 ottobre 2026 la UI italiana precarica `InterVariable-latin.woff2`, un subset
del medesimo font (circa 70 KiB contro 344 KiB dell'originale). Glifi, pesi variabili
e metriche sono conservati; gli altri alfabeti continuano a usare l’originale.
Gli intervalli `unicode-range` in `src/inter-font.css` sono disgiunti e derivati
dalla mappa dei glifi originale, così simboli non presenti in Inter usano il normale
fallback di sistema senza scaricare inutilmente il font completo.

Asset generati con FontTools 4.67.0 e Brotli 1.2.1, utilizzati solo come strumenti
temporanei fuori dal progetto; nessuna dipendenza del sito. Per rigenerare, rendere
disponibile `fonttools[woff]` in un ambiente Python separato ed eseguire
`python3 scripts/subset-font.py`. Il comando ricrea il subset e `src/inter-font.css`.
Entrambi i font restano distribuiti sotto SIL OFL 1.1 e con gli avvisi originali.
