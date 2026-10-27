/** Il campo locale mostra secondi e millisecondi previsti dal contratto v1. */
export function dateInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 23)
}

export function measurementTime(value: string, original: string | null): string | null {
  // Durante l'ora ripetuta in autunno, ricostruire la stessa ora locale può
  // scegliere l'altro offset. Un orario non modificato resta esattamente quello letto.
  if (value === dateInput(original)) return original ? new Date(original).toISOString() : null
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(value)
  const date = new Date(value)
  const fields = match ? [...match.slice(1, 7).map(part => Number(part ?? 0)), Number((match[7] ?? '').padEnd(3, '0'))] : []
  const actual = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()]
  if (!match || !Number.isFinite(date.getTime()) || fields.some((part, index) => part !== actual[index])) {
    throw new Error('Data e ora della misura non valide o inesistenti nel fuso del browser.')
  }
  return date.toISOString()
}
