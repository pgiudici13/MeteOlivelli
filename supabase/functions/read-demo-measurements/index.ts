// Lettura isolata dei campioni DEMO conservati in Supabase.
// Orari di visualizzazione sintetici: mai salvati sul database.
const sourceId = 'meteolivelli-demo-20261022'
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS' }
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: cors })
  try {
    const base = Deno.env.get('SUPABASE_URL')
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!base || !key) throw new Error('configuration')
    const url = new URL('/rest/v1/station_measurements', base)
    url.searchParams.set('source_id', 'eq.' + sourceId)
    url.searchParams.set('select', 'ingestion_id,arduino_seconds,temperature_c,humidity_pct,pressure_hpa,quality_flags')
    url.searchParams.set('order', 'arduino_seconds.asc')
    url.searchParams.set('limit', '500')
    const result = await fetch(url, { headers: { apikey: key, Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(8000) })
    if (!result.ok) throw new Error('database')
    const rows: unknown = await result.json()
    if (!Array.isArray(rows) || rows.length > 500) throw new Error('response')
    const now = Date.now()
    const maxSeconds = Math.max(0, ...rows.map((row) => Number(row.arduino_seconds)))
    const items = rows.map((row) => {
      const synthetic = new Date(now - (maxSeconds - Number(row.arduino_seconds)) * 1000).toISOString()
      return {
        ingestion_id: row.ingestion_id,
        temperature_c: row.temperature_c,
        humidity_pct: row.humidity_pct,
        pressure_hpa: row.pressure_hpa,
        quality_flags: row.quality_flags,
        captured_at: synthetic,
        measured_at: null,
        received_at: synthetic,
      }
    })
    return new Response(JSON.stringify({ demo: true, source: sourceId, items }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
    })
  } catch {
    return new Response(JSON.stringify({ error: 'demo_unavailable' }), { status: 503,
      headers: { ...cors, 'Content-Type': 'application/json' } })
  }
})
