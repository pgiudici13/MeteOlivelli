/** Il chiamante fornisce il lettore: importare questo modulo non legge ambiente o file. */
export type EnvironmentReader = (name: string) => string | undefined

export class ConfigurationError extends Error {
  constructor(variable: string) {
    super(`Configurazione backend incompleta: manca ${variable}.`)
    this.name = 'ConfigurationError'
  }
}

/** Segnala solo il nome mancante e preserva esattamente il valore, anche se segreto. */
export function requireEnvironmentVariable(read: EnvironmentReader, name: string): string {
  const value = read(name)

  if (value === undefined || value.trim() === '') {
    throw new ConfigurationError(name)
  }

  return value
}
