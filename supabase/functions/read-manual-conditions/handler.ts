import { json } from '../_shared/http.ts'

const cors = { 'Access-Control-Allow-Origin': '*' }
export function createHandler(
  env: (name: string) => string | undefined,
  fetcher: typeof fetch = fetch,
) {
  return async (request: Request) => {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'content-type',
        },
      })
    }
    if (request.method !== 'GET') return json({ code: 'method_not_allowed' }, 405, cors)
    const params = new URL(request.url).searchParams
    if ([...params.keys()].some((key) => key !== 'offset' || params.getAll(key).length !== 1)) {
      return json({ code: 'invalid_query' }, 400, cors)
    }
    const offset = params.get('offset') ?? '0'
    if (!/^(0|[1-9]\d{0,4})$/.test(offset) || Number(offset) > 99000) {
      return json({ code: 'invalid_query' }, 400, cors)
    }
    try {
      const base = new URL(env('SUPABASE_URL') ?? '')
      const key = env('SUPABASE_SERVICE_ROLE_KEY')
      if (
        base.protocol !== 'https:' || base.username || base.password || base.search || base.hash ||
        !key
      ) throw new Error('Configurazione non valida')
      const url = new URL('/rest/v1/manual_weather_conditions', base)
      url.search = new URLSearchParams({
        select: 'observed_at,cloud,rain,wind,phenomenon,phenomenon_detail',
        observed_at: `lte.${new Date().toISOString()}`,
        order: 'observed_at.desc,id.desc',
        limit: '101',
        offset,
      }).toString()
      const result = await fetcher(url, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(8000),
      })
      if (!result.ok) throw new Error('Database non disponibile')
      const rows: unknown = await result.json()
      if (!Array.isArray(rows) || rows.length > 101) throw new Error('Risposta non valida')
      const items = rows.slice(0, 100).map((row) => ({
        observed_at: row.observed_at,
        cloud: row.cloud,
        rain: row.rain,
        wind: row.wind,
        phenomenon: row.phenomenon,
        phenomenon_detail: row.phenomenon_detail,
      }))
      return json({ items, next_offset: rows.length > 100 ? Number(offset) + 100 : null }, 200, {
        ...cors,
        'Cache-Control': 'public, max-age=10',
      })
    } catch {
      return json({ code: 'temporarily_unavailable' }, 503, cors)
    }
  }
}
