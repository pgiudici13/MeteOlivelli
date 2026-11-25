import { useCallback, useEffect, useState } from 'react'
import { dateInput, measurementTime } from '../admin-time.ts'
import { loadWeather, type Weather } from '../sky/weather.ts'
import { translate } from '../i18n.ts'

type Fields = { observed_at: string; cloud: string; rain: string; wind: string; phenomenon: string | null; phenomenon_detail: string | null }
type Row = Fields & { id: string }
type Props = { password: string; endpoint: string }
const blank: Fields = { observed_at: '', cloud: '', rain: '', wind: '', phenomenon: null, phenomenon_detail: null }
const choices = {
  cloud: [['sereno', 'Sereno'], ['poco_nuvoloso', 'Poco nuvoloso'], ['nuvoloso', 'Nuvoloso'], ['coperto', 'Coperto']],
  rain: [['assente', 'Assente'], ['debole', 'Debole'], ['moderata', 'Moderata'], ['forte', 'Forte']],
  wind: [['calmo', 'Calmo'], ['debole', 'Debole'], ['moderato', 'Moderato'], ['forte', 'Forte']],
} as const
const phenomena = [['nessuna', 'Nessuna'], ['pioviggine', 'Pioviggine'], ['pioggia', 'Pioggia'], ['neve', 'Neve'], ['grandine', 'Grandine'], ['altro', 'Altro']] as const
function suggestions(w: Weather) {
  const liquid = w.rain != null && w.showers != null ? w.rain + w.showers : null
  return {
    cloud: w.cloud == null ? '' : w.cloud < 20 ? 'sereno' : w.cloud < 50 ? 'poco_nuvoloso' : w.cloud < 85 ? 'nuvoloso' : 'coperto',
    rain: liquid == null ? '' : liquid === 0 ? 'assente' : liquid < 2.5 ? 'debole' : liquid < 7.6 ? 'moderata' : 'forte',
    wind: w.wind == null ? '' : w.wind < 1 ? 'calmo' : w.wind < 20 ? 'debole' : w.wind < 40 ? 'moderato' : 'forte',
  }
}
export function ManualConditions({ password, endpoint }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [form, setForm] = useState<Fields>(blank)
  const [editing, setEditing] = useState<Row | null>(null)
  const [weather, setWeather] = useState<Weather | null>(null)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const api = useCallback(async (method: string, body?: Fields, id?: string) => {
    const url = new URL(endpoint); url.searchParams.set('resource', 'conditions'); if (id) url.searchParams.set('id', id)
    const response = await fetch(url, { method, headers: { 'x-admin-password': password, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store' })
    if (!response.ok) throw new Error('Operazione non riuscita. Riprova.')
    return response.json()
  }, [endpoint, password])
  const refresh = useCallback(async () => { const result = await api('GET') as { items: Row[] }; setRows(result.items) }, [api])
  useEffect(() => { let active = true; void api('GET').then((result: { items: Row[] }) => { if (active) setRows(result.items) }).catch(() => { if (active) setMessage('Storico non disponibile. Riprova.') }); void loadWeather().then(result => { if (active) setWeather(result) }).catch(() => { if (active) setWeather(null) }); return () => { active = false } }, [api])
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage('')
    try {
      const observed_at = measurementTime(form.observed_at, editing?.observed_at ?? null)
      if (!observed_at) throw new Error('Inserisci data e ora.')
      await api(editing ? 'PATCH' : 'POST', { ...form, observed_at }, editing?.id)
      setForm(blank); setEditing(null); setMessage('Osservazione salvata.')
      try { await refresh() } catch { setMessage('Osservazione salvata, ma storico non aggiornato. Ricarica la pagina.') }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Salvataggio non riuscito.') }
    finally { setBusy(false) }
  }
  const proposed = weather ? suggestions(weather) : null
  return <section className="data-admin-list" aria-labelledby="conditions-title">
    <div className="data-admin-section-head"><div><p className="eyebrow section-index">03 / OSSERVAZIONI MANUALI</p><h2 id="conditions-title">Condizioni meteo</h2></div></div>
    <p>Registra le condizioni osservate da voi, incluso il fenomeno all’orario indicato. I suggerimenti Open-Meteo sono stime esterne attuali, non misure della stazione.</p>
    <p className="data-admin-note">{weather ? `Open-Meteo · condizioni riferite al ${new Date(weather.observedAt).toLocaleString('it-IT')} (ora del dispositivo). I suggerimenti non descrivono osservazioni passate.` : 'Suggerimenti Open-Meteo non disponibili: puoi compilare i campi manualmente.'}</p>
    <form className="data-admin-form" onSubmit={save}>
      <h3>{editing ? 'Modifica osservazione' : 'Nuova osservazione'}</h3>
      <fieldset className="data-admin-fields" disabled={busy}>
        <label>Data e ora osservazione · ora locale<input type="datetime-local" step="0.001" required value={form.observed_at} onChange={e => setForm({ ...form, observed_at: e.target.value })} /></label>
        {(['cloud', 'wind'] as const).map(key => <label key={key}>{key === 'cloud' ? 'Cielo' : 'Vento'}
          <select required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}><option value="">Seleziona</option>{choices[key].map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
          {proposed?.[key] && <button type="button" className="quiet-button" onClick={() => setForm(current => ({ ...current, [key]: proposed[key] }))}>Usa suggerimento: {choices[key].find(([value]) => value === proposed[key])?.[1]}</button>}
        </label>)}
        <label>Fenomeno osservato<select required={!editing} value={form.phenomenon ?? ''} onChange={e => { const phenomenon = e.target.value || null; setForm(current => ({ ...current, phenomenon, phenomenon_detail: null, rain: phenomenon === 'nessuna' ? 'assente' : current.phenomenon === 'nessuna' ? '' : current.rain })) }}><option value="">Non indicato</option>{phenomena.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        {form.phenomenon === 'altro' && <label>Descrivi il fenomeno<input required maxLength={100} value={form.phenomenon_detail ?? ''} onChange={e => setForm({ ...form, phenomenon_detail: e.target.value })} /></label>}
        {form.phenomenon !== 'nessuna' && <label>Intensità della precipitazione<select required value={form.rain} onChange={e => setForm({ ...form, rain: e.target.value })}><option value="">Seleziona</option>{choices.rain.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>{proposed?.rain && ['pioviggine', 'pioggia'].includes(form.phenomenon ?? '') && <button type="button" className="quiet-button" onClick={() => setForm(current => ({ ...current, rain: proposed.rain }))}>Usa suggerimento Open-Meteo per la pioggia: {choices.rain.find(([value]) => value === proposed.rain)?.[1]}</button>}</label>}
      </fieldset>
      <div className="data-admin-actions"><button className="data-admin-primary" disabled={busy}>{editing ? 'Salva modifiche' : 'Salva osservazione'}</button>{editing && <button type="button" disabled={busy} onClick={() => { setEditing(null); setForm(blank) }}>Annulla modifica</button>}</div>
    </form>
    <p role="status" aria-live="polite">{translate(message)}</p>
    <h3>Osservazioni recenti</h3>
    {rows === null ? <p>Storico non disponibile o in caricamento.</p> : rows.length === 0 ? <p>Nessuna osservazione da mostrare.</p> : <div className="data-admin-table-wrap"><table><thead><tr><th>Osservata</th><th>Cielo</th><th>Pioggia</th><th>Vento</th><th>Fenomeno osservato</th><th>Azioni</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td>{new Date(row.observed_at).toLocaleString('it-IT')}</td>{(['cloud', 'rain', 'wind'] as const).map(key => <td key={key}>{choices[key].find(([value]) => value === row[key])?.[1] ?? '—'}</td>)}<td>{row.phenomenon === "altro" ? row.phenomenon_detail : phenomena.find(([value]) => value === row.phenomenon)?.[1] ?? "Non indicato"}</td><td><button type="button" disabled={busy} onClick={() => { setEditing(row); setForm({ observed_at: dateInput(row.observed_at), cloud: row.cloud, rain: row.rain, wind: row.wind, phenomenon: row.phenomenon ?? null, phenomenon_detail: row.phenomenon_detail ?? null }) }}>Modifica</button></td></tr>)}</tbody></table></div>}
  </section>
}
