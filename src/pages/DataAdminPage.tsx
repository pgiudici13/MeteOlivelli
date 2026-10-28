import { SiteLanguageBar } from '../components/DisplayPreferences.tsx'
import { getLocale } from '../preferences.ts'
import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { useCallback, useEffect, useState } from 'react'
import { BrandMark } from '../components/BrandMark.tsx'
import { ThemeToggle } from '../components/ThemeToggle.tsx'
import { dateInput, measurementTime } from '../admin-time.ts'
import './DataAdminPage.css'

type Row = {
  ingestion_id: string
  arduino_seconds: number
  temperature_c: number | null
  humidity_pct: number | null
  pressure_hpa: number | null
  acquisition_kind: 'live' | 'historical' | 'synthetic'
  captured_at: string | null
  measured_at: string | null
  received_at: string
  quality_flags: { field: string; label: string }[]
  entry_method: 'manual' | null
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

function kindLabel(row: Row) {
  return row.entry_method === 'manual' ? 'Inserimento manuale' : row.acquisition_kind === 'live' ? 'Stazione' : row.acquisition_kind === 'synthetic' ? 'Sintetico' : 'Storico'
}

export function DataAdminPage() {
  const preferences = usePreferences()
  const [password, setPassword] = useState('')
  const [enteredPassword, setEnteredPassword] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [value, setValue] = useState<FormValue>(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [listStale, setListStale] = useState(false)

  const refresh = useCallback(async (secret: string) => {
    const result = await api(secret, 'GET') as { items: Row[] }
    setRows(result.items)
  }, [])

  useEffect(() => { document.title = translate('Gestione dati — MeteOlivelli') }, [preferences])

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setMessage('')
    try {
      await refresh(enteredPassword)
      setPassword(enteredPassword)
      setEnteredPassword('')
      setMessage('Accesso effettuato.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Accesso non riuscito.') }
    finally { setBusy(false) }
  }

  async function refreshAfterWrite(success: string) {
    setMessage(success)
    try { await refresh(password); setListStale(false) }
    catch { setListStale(true); setMessage(`${success} L’elenco non è stato aggiornato: premi “Aggiorna elenco” prima di altre modifiche.`) }
  }

  async function reloadRows() {
    if (busy) return
    setBusy(true); setMessage('')
    try { await refresh(password); setListStale(false); setMessage('Elenco aggiornato.') }
    catch { setMessage('Elenco non aggiornato. Riprova tra poco.') }
    finally { setBusy(false) }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || listStale) return
    setBusy(true); setMessage('')
    try {
      const original = rows.find(row => row.ingestion_id === editing)?.measured_at ?? null
      const payload = { ...value, measured_at: measurementTime(value.measured_at, original) }
      await api(password, editing ? 'PATCH' : 'POST', payload, editing ?? undefined)
      setValue(blank); setEditing(null)
      await refreshAfterWrite(editing ? 'Modifiche salvate.' : 'Misura aggiunta.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Salvataggio non riuscito.') }
    finally { setBusy(false) }
  }

  function edit(row: Row) {
    if (busy || listStale) return
    setEditing(row.ingestion_id)
    setValue({
      arduino_seconds: row.arduino_seconds,
      temperature_c: row.temperature_c,
      humidity_pct: row.humidity_pct,
      pressure_hpa: row.pressure_hpa,
      measured_at: dateInput(row.measured_at),
    })
    document.getElementById('data-form')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
  }

  async function remove(row: Row) {
    if (busy || listStale) return
    if (!window.confirm(translate(`Eliminare la misura ${row.ingestion_id}? L’operazione non si può annullare.`))) return
    setBusy(true); setMessage('')
    try {
      await api(password, 'DELETE', undefined, row.ingestion_id)
      setRows(previous => previous.filter(item => item.ingestion_id !== row.ingestion_id))
      if (editing === row.ingestion_id) { setEditing(null); setValue(blank) }
      await refreshAfterWrite('Misura rimossa.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Eliminazione non riuscita.') }
    finally { setBusy(false) }
  }

  function logout() { setPassword(''); setRows([]); setValue(blank); setEditing(null); setListStale(false); setMessage('Sessione chiusa.') }

  function setNumber(key: 'arduino_seconds' | 'temperature_c' | 'humidity_pct' | 'pressure_hpa', raw: string) {
    setValue(current => ({ ...current, [key]: raw === '' ? null : Number(raw) }))
  }

  return <div className="site-shell data-admin-shell">
    <a className="skip-link" href="#admin-content">{translate("Vai al contenuto")}</a>
    <header className="site-header data-admin-header">
      <a className="brand" href="/home"><BrandMark />{translate("MeteOlivelli")}<span className="brand-index">{translate(" / Dati")}</span></a>
      <div className="data-admin-header-actions"><a href="/home">{translate("Torna al sito ")}<span aria-hidden="true">↗</span></a><ThemeToggle /></div>
    </header>
    <main id="admin-content" className="data-admin" tabIndex={-1}>
      <section className="data-admin-hero" aria-labelledby="admin-title">
        <div><p className="eyebrow"><span className="signal-mark" aria-hidden="true" />{translate(" AREA RISERVATA · PAVIA")}</p><h1 id="admin-title">{translate("Misure,")}<br /><span>{translate("senza sorprese.")}</span></h1></div>
        <p className="data-admin-lead">{translate("Gestisci le letture dell’archivio. Le misure inserite qui vengono marcate come storiche e restano distinguibili dai dati acquisiti dalla stazione.")}</p>
      </section>
      {translate(!password ? <form className="data-admin-login" onSubmit={login}>
        <p className="eyebrow section-index">{translate("ACCESSO · 01")}</p>
        <h2>{translate("Entra nell’area dati")}</h2>
        <label>{translate("Password amministratore")}<input autoComplete="current-password" type="password" value={enteredPassword} disabled={busy} onChange={event => setEnteredPassword(event.target.value)} required /></label>
        <button className="data-admin-primary" disabled={busy}>{translate(busy ? 'Accesso…' : 'Accedi')} <span aria-hidden="true">↗</span></button>
      </form> : <>
        <div className="data-admin-toolbar">
          <p className="data-admin-session">{translate("Sessione amministrativa attiva · ")}{translate(rows.length)}{translate(" di 100 righe recenti")}</p>
          <div className="data-admin-actions"><button type="button" className="quiet-button" disabled={busy} onClick={() => void reloadRows()}>{translate("Aggiorna elenco")}</button><button type="button" className="quiet-button" disabled={busy} onClick={logout}>{translate("Esci")}</button></div>
        </div>
        <form id="data-form" className="data-admin-form" onSubmit={save}>
          <div className="data-admin-section-head"><div><p className="eyebrow section-index">{translate("01 / INSERIMENTO")}</p><h2>{translate(editing ? 'Modifica misura' : 'Aggiungi misura')}</h2></div></div>
          <fieldset className="data-admin-fields" disabled={busy || listStale}>
            <label>{translate("Secondi Arduino")}<input type="number" min="0" max="9007199254740991" step="any" value={value.arduino_seconds ?? ''} onChange={event => setNumber('arduino_seconds', event.target.value)} required /></label>
            <label>{translate("Temperatura · °C")}<input type="number" step="any" value={value.temperature_c ?? ''} onChange={event => setNumber('temperature_c', event.target.value)} /></label>
            <label>{translate("Umidità · %")}<input type="number" step="any" value={value.humidity_pct ?? ''} onChange={event => setNumber('humidity_pct', event.target.value)} /></label>
            <label>{translate("Pressione · hPa")}<input type="number" step="any" value={value.pressure_hpa ?? ''} onChange={event => setNumber('pressure_hpa', event.target.value)} /></label>
            <label>{translate("Data e ora della misura · ora locale")}<input type="datetime-local" step="0.001" value={value.measured_at} onChange={event => setValue(current => ({ ...current, measured_at: event.target.value }))} /></label>
          </fieldset>
          <p id="data-admin-note" className="data-admin-note">{translate("Inserisci misure reali: il database le contrassegna come manuali e il sito le include in grafici, statistiche, record e previsioni usando questo orario. Il contatore è richiesto dal formato attuale; lascia vuoti i valori non disponibili. L’ora di acquisizione sul PC resta vuota.")}</p>
          <div className="data-admin-actions"><button className="data-admin-primary" disabled={busy || listStale}>{translate(busy ? 'Salvataggio…' : editing ? 'Salva modifiche' : 'Aggiungi misura')} <span aria-hidden="true">↗</span></button>{translate(editing && <button type="button" className="quiet-button" disabled={busy} onClick={() => { setEditing(null); setValue(blank) }}>{translate("Annulla modifica")}</button>)}</div>
        </form>
        <section className="data-admin-list" aria-labelledby="data-list-title">
          <div className="data-admin-section-head"><div><p className="eyebrow section-index">{translate("02 / ARCHIVIO")}</p><h2 id="data-list-title">{translate("Misure recenti")}</h2></div><p className="data-admin-count">{translate("Più recenti per ricezione")}<br />{translate("Europe/Rome")}</p></div>
          {translate(rows.length === 0 ? <p>{translate("Non ci sono misure da mostrare.")}</p> : <div className="data-admin-table-wrap"><table>
            <thead><tr><th scope="col">{translate("Tipo")}</th><th scope="col">{translate("Ricevuta")}</th><th scope="col">{translate("Misurata")}</th><th scope="col">{translate("°C")}</th><th scope="col">%</th><th scope="col">{translate("hPa")}</th><th scope="col">{translate("Contatore")}</th><th scope="col">{translate("Azioni")}</th></tr></thead>
            <tbody>{translate(rows.map(row => <tr key={row.ingestion_id}>
              <td><span className="data-admin-kind" data-kind={row.acquisition_kind}>{translate(kindLabel(row))}</span></td>
              <td>{translate(new Date(row.received_at).toLocaleString(getLocale()))}</td><td>{translate(row.measured_at ? new Date(row.measured_at).toLocaleString(getLocale()) : '—')}</td>
              <td>{translate(row.temperature_c ?? '—')}</td><td>{translate(row.humidity_pct ?? '—')}</td><td>{translate(row.pressure_hpa ?? '—')}</td><td>{translate(row.arduino_seconds)}</td>
              <td className="data-admin-row-actions"><button type="button" disabled={busy || listStale} onClick={() => edit(row)}>{translate("Modifica")}</button><button type="button" className="danger-button" disabled={busy || listStale} onClick={() => void remove(row)}>{translate("Rimuovi")}</button></td>
            </tr>))}</tbody>
          </table></div>)}
        </section>
      </>)}
      <p className="data-admin-status" role="status" aria-live="polite">{translate(message)}</p>
    </main>
    <SiteLanguageBar />
  </div>
}
