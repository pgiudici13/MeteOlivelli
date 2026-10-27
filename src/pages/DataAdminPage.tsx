import { useCallback, useEffect, useState } from 'react'
import { dateInput, measurementTime } from '../admin-time.ts'
import './DataAdminPage.css'

type Row = {
  ingestion_id: string
  arduino_seconds: number
  temperature_c: number | null
  humidity_pct: number | null
  pressure_hpa: number | null
  acquisition_kind: string
  captured_at: string | null
  measured_at: string | null
  received_at: string
  quality_flags: { field: string; label: string }[]
}
type FormValue = Omit<Pick<Row, 'arduino_seconds' | 'temperature_c' | 'humidity_pct' | 'pressure_hpa'>, 'arduino_seconds'> & { arduino_seconds: number | null; measured_at: string }
const endpoint = 'https://pvtzncseisbxaaseqfvo.supabase.co/functions/v1/manage-measurements'
const blank: FormValue = { arduino_seconds: null, temperature_c: null, humidity_pct: null, pressure_hpa: null, measured_at: '' }

async function api(password: string, method: string, body?: unknown, id?: string) {
  const url = new URL(endpoint)
  if (id) url.searchParams.set('id', id)
  const response = await fetch(url, {
    method,
    headers: { 'x-admin-password': password, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(response.status === 401 ? 'Password non corretta.' : response.status === 403 ? 'Origine non autorizzata.' : 'Operazione non riuscita. Verifica la configurazione e riprova.')
  return response.status === 204 ? null : response.json()
}

export function DataAdminPage() {
  const [password, setPassword] = useState('')
  const [enteredPassword, setEnteredPassword] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [value, setValue] = useState<FormValue>(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async (secret: string) => {
    const result = await api(secret, 'GET') as { items: Row[] }
    setRows(result.items)
  }, [])

  useEffect(() => { document.title = 'Gestione dati — MeteOlivelli' }, [])

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true); setMessage('')
    try {
      await refresh(enteredPassword)
      setPassword(enteredPassword)
      setEnteredPassword('')
      setMessage('Accesso effettuato.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Accesso non riuscito.') }
    finally { setBusy(false) }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setMessage('')
    try {
      const original = rows.find(row => row.ingestion_id === editing)?.measured_at ?? null
      const payload = { ...value, measured_at: measurementTime(value.measured_at, original) }
      await api(password, editing ? 'PATCH' : 'POST', payload, editing ?? undefined)
      await refresh(password)
      setValue(blank); setEditing(null)
      setMessage(editing ? 'Modifiche salvate.' : 'Misura aggiunta.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Salvataggio non riuscito.') }
    finally { setBusy(false) }
  }

  function edit(row: Row) {
    setEditing(row.ingestion_id)
    setValue({
      arduino_seconds: row.arduino_seconds,
      temperature_c: row.temperature_c,
      humidity_pct: row.humidity_pct,
      pressure_hpa: row.pressure_hpa,
      measured_at: dateInput(row.measured_at),
    })
    document.getElementById('data-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function remove(row: Row) {
    if (!window.confirm(`Eliminare la misura ${row.ingestion_id}? L’operazione non si può annullare.`)) return
    setBusy(true); setMessage('')
    try {
      await api(password, 'DELETE', undefined, row.ingestion_id)
      await refresh(password)
      if (editing === row.ingestion_id) { setEditing(null); setValue(blank) }
      setMessage('Misura rimossa.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Eliminazione non riuscita.') }
    finally { setBusy(false) }
  }

  function logout() { setPassword(''); setRows([]); setValue(blank); setEditing(null); setMessage('Sessione chiusa.') }

  function setNumber(key: 'arduino_seconds' | 'temperature_c' | 'humidity_pct' | 'pressure_hpa', raw: string) {
    setValue(current => ({ ...current, [key]: raw === '' ? null : Number(raw) }))
  }

  return <main className="data-admin">
    <a href="/home">← Torna al sito</a>
    <p className="eyebrow">Area riservata</p>
    <h1>Gestione delle misure</h1>
    <p>Inserisci, correggi o rimuovi misure nel database. Le date inserite sono l’ora della misura, non l’ora di ricezione.</p>
    {!password ? <form className="data-admin-login" onSubmit={login}>
      <label>Password amministratore<input autoComplete="current-password" type="password" value={enteredPassword} onChange={event => setEnteredPassword(event.target.value)} required /></label>
      <button disabled={busy}>{busy ? 'Accesso…' : 'Accedi'}</button>
    </form> : <>
      <div className="data-admin-toolbar"><p>Connesso · {rows.length} delle ultime 100 misure</p><button type="button" className="quiet-button" onClick={logout}>Esci</button></div>
      <form id="data-form" className="data-admin-form" onSubmit={save}>
        <h2>{editing ? 'Modifica misura' : 'Aggiungi misura'}</h2>
        <div className="data-admin-fields">
          <label>Secondi Arduino<input type="number" min="0" max="9007199254740991" step="any" value={value.arduino_seconds ?? ''} onChange={event => setNumber('arduino_seconds', event.target.value)} required /></label>
          <label>Temperatura (°C)<input type="number" step="any" value={value.temperature_c ?? ''} onChange={event => setNumber('temperature_c', event.target.value)} /></label>
          <label>Umidità (%)<input type="number" step="any" value={value.humidity_pct ?? ''} onChange={event => setNumber('humidity_pct', event.target.value)} /></label>
          <label>Pressione (hPa)<input type="number" step="any" value={value.pressure_hpa ?? ''} onChange={event => setNumber('pressure_hpa', event.target.value)} /></label>
          <label>Data e ora della misura (ora locale)<input type="datetime-local" step="0.001" value={value.measured_at} onChange={event => setValue(current => ({ ...current, measured_at: event.target.value }))} /></label>
        </div>
        <p className="data-admin-note">Il contatore è richiesto dal formato attuale del database. Lascia vuoti i valori non disponibili. Una misura inserita a mano viene registrata come storica; l’orario di acquisizione sul PC resta vuoto. Le modifiche ricalcolano i flag qualità e conservano il payload originale; l’audit registra l’ID e l’operazione.</p>
        <div className="data-admin-actions"><button disabled={busy}>{busy ? 'Salvataggio…' : editing ? 'Salva modifiche' : 'Aggiungi al database'}</button>{editing && <button type="button" className="quiet-button" onClick={() => { setEditing(null); setValue(blank) }}>Annulla modifica</button>}</div>
      </form>
      <section className="data-admin-list" aria-labelledby="data-list-title">
        <h2 id="data-list-title">Misure recenti</h2>
        {rows.length === 0 ? <p>Non ci sono misure da mostrare.</p> : <div className="data-admin-table-wrap"><table>
          <thead><tr><th>Ricevuta</th><th>Misurata</th><th>°C</th><th>%</th><th>hPa</th><th>Contatore</th><th>Azioni</th></tr></thead>
          <tbody>{rows.map(row => <tr key={row.ingestion_id}>
            <td>{new Date(row.received_at).toLocaleString('it-IT')}</td><td>{row.measured_at ? new Date(row.measured_at).toLocaleString('it-IT') : '—'}</td>
            <td>{row.temperature_c ?? '—'}</td><td>{row.humidity_pct ?? '—'}</td><td>{row.pressure_hpa ?? '—'}</td><td>{row.arduino_seconds}</td>
            <td className="data-admin-row-actions"><button type="button" disabled={busy} onClick={() => edit(row)}>Modifica</button><button type="button" className="danger-button" disabled={busy} onClick={() => void remove(row)}>Rimuovi</button></td>
          </tr>)}</tbody>
        </table></div>}
      </section>
    </>}
    <p className="data-admin-status" role="status" aria-live="polite">{message}</p>
  </main>
}
