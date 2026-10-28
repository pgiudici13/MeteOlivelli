import type { MeasurementStore, ReadQuery } from '../_shared/database.ts'
import { json } from '../_shared/http.ts'

const cors = { 'Access-Control-Allow-Origin': '*' }
const timestamp = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^(?!0000)\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
// La chiave SQL può avere microsecondi: Date serve soltanto a validare il calendario.
function cursorTimestamp(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = /^(?!0000)(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?(?:Z|\+00:00)$/.exec(
    value,
  )
  if (!match || !Number.isFinite(Date.parse(value))) return null
  const fraction = (match[2] ?? '').padEnd(3, '0')
  if (new Date(value).toISOString() !== `${match[1]}.${fraction.slice(0, 3)}Z`) return null
  return `${match[1]}.${fraction}Z`
}
const timestampKey = (value: string) =>
  value.replace(/\.(\d+)Z$/, (_, fraction: string) => `.${fraction.padEnd(6, '0')}Z`)
const uuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(value)

export function parseReadQuery(url: URL, now: Date): ReadQuery | null {
  const allowed = ['view', 'period', 'basis', 'until', 'limit', 'cursor']
  for (const key of url.searchParams.keys()) {
    if (!allowed.includes(key) || url.searchParams.getAll(key).length !== 1) return null
  }
  const view = url.searchParams.get('view') ?? 'latest'
  const period = url.searchParams.get('period') ?? '24h'
  const basis = url.searchParams.get('basis') ?? 'captured_at'
  const limitText = url.searchParams.get('limit') ?? '100'
  if (
    !['latest', 'history'].includes(view) || !['24h', '7g', '30g', 'all'].includes(period) ||
    (period === 'all' && (view !== 'history' || basis !== 'captured_at')) ||
    !['captured_at', 'measured_at'].includes(basis) || !/^[1-9]\d{0,2}$/.test(limitText) ||
    Number(limitText) > 500
  ) return null
  if (view === 'latest' && [...url.searchParams.keys()].some((key) => key !== 'view')) return null
  let until = url.searchParams.get('until') ?? now.toISOString()
  let afterTime: string | null = null
  let afterId: string | null = null
  const cursor = url.searchParams.get('cursor')
  if (cursor !== null) {
    if (!cursor || cursor.length > 512 || !/^[A-Za-z0-9+/=]+$/.test(cursor)) return null
    try {
      const values: unknown = JSON.parse(atob(cursor))
      if (!Array.isArray(values) || values.length !== 5) return null
      if (
        values[0] !== period || values[1] !== basis || !timestamp(values[2]) ||
        typeof values[3] !== 'string' || cursorTimestamp(values[3]) !== values[3] ||
        !uuid(values[4])
      ) return null
      if (url.searchParams.has('until') && until !== values[2]) return null
      until = values[2]
      afterTime = values[3] as string
      afterId = values[4]
    } catch {
      return null
    }
  }
  if (!timestamp(until) || Date.parse(until) > now.getTime()) return null
  const hours = period === '24h' ? 24 : period === '7g' ? 168 : 720
  if (
    afterTime &&
    (period !== 'all' && timestampKey(afterTime) <
          timestampKey(new Date(Date.parse(until) - hours * 3600000).toISOString()) ||
      timestampKey(afterTime) > timestampKey(until))
  ) return null
  return {
    view: view as ReadQuery['view'],
    period: period as ReadQuery['period'],
    basis: basis as ReadQuery['basis'],
    until,
    limit: Number(limitText),
    after_time: afterTime,
    after_id: afterId,
  }
}

export function createReadHandler(config: {
  source: string
  store: MeasurementStore
  now?: () => Date
}): (request: Request) => Promise<Response> {
  if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(config.source)) throw new Error('Sorgente non valida')
  return async (request) => {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'apikey, content-type, x-client-info',
        },
      })
    }
    if (request.method !== 'GET') {
      return json({ code: 'method_not_allowed' }, 405, { ...cors, Allow: 'GET, OPTIONS' })
    }
    const query = parseReadQuery(new URL(request.url), (config.now ?? (() => new Date()))())
    if (!query) return json({ code: 'invalid_query' }, 400, cors)
    try {
      const rows = await config.store.read(config.source, query)
      const items = rows.slice(0, query.view === 'latest' ? 1 : query.limit)
      let nextCursor: string | null = null
      if (query.view === 'history' && rows.length > query.limit) {
        const last = items[items.length - 1]
        // Normalizzare UTC senza troncare la chiave temporale PostgreSQL.
        const time = query.period === 'all'
          ? last.captured_at ?? last.received_at
          : query.basis === 'captured_at'
          ? last.entry_method === 'manual' ? last.measured_at ?? last.captured_at : last.captured_at
          : last.measured_at
        const normalizedTime = cursorTimestamp(time)
        if (!normalizedTime || !uuid(last.ingestion_id)) {
          throw new Error('Cursore database non valido')
        }
        nextCursor = btoa(
          JSON.stringify([
            query.period,
            query.basis,
            query.until,
            normalizedTime,
            last.ingestion_id,
          ]),
        )
      }
      return json(
        {
          items,
          next_cursor: nextCursor,
          until: query.until,
          time_basis: query.view === 'latest' ? 'captured_at' : query.basis,
          time_label: query.view === 'history' && query.basis === 'measured_at'
            ? 'ora della misura fisica'
            : 'ora della misura fisica, se disponibile; altrimenti acquisizione sul PC',
        },
        200,
        { ...cors, 'Cache-Control': 'public, max-age=10' },
      )
    } catch {
      return json({ code: 'temporarily_unavailable' }, 503, { ...cors, 'Retry-After': '15' })
    }
  }
}
