import { ConfigurationError, requireEnvironmentVariable } from './config.ts'

Deno.test('preserva il valore configurato senza modificarlo', () => {
  const fixture = ' valore sintetico per il test '
  const actual = requireEnvironmentVariable(() => fixture, 'EXAMPLE_SETTING')

  if (actual !== fixture) {
    throw new Error('Il valore deve essere restituito senza normalizzazioni implicite')
  }
})

Deno.test('rifiuta configurazione assente, vuota o composta da spazi', () => {
  for (const fixture of [undefined, '', ' \t\n']) {
    let failure: unknown

    try {
      requireEnvironmentVariable(() => fixture, 'EXAMPLE_SETTING')
    } catch (error) {
      failure = error
    }

    if (!(failure instanceof ConfigurationError)) {
      throw new Error('La configurazione mancante deve produrre ConfigurationError')
    }

    if (failure.message !== 'Configurazione backend incompleta: manca EXAMPLE_SETTING.') {
      throw new Error('Il messaggio deve indicare solo il nome della variabile mancante')
    }
  }
})

Deno.test('richiede solo la variabile indicata senza enumerare le altre', () => {
  const requested: string[] = []
  requireEnvironmentVariable((name) => {
    requested.push(name)
    return 'fixture'
  }, 'EXAMPLE_SETTING')

  if (requested.length !== 1 || requested[0] !== 'EXAMPLE_SETTING') {
    throw new Error('Il lettore deve accedere soltanto alla configurazione richiesta')
  }
})
