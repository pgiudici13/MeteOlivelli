import { BodyError, json, readBody } from '../_shared/http.ts'
import { type Measurement, parseMeasurementJson } from '../_shared/measurement.ts'

const allowedOrigins = new Set([
  'https://meteolivelli.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])
const attempts = new Map<string, { count: number; resetAt: number }>()

function response(request: Request, body: unknown, status = 200) {
  const origin = request.headers.get('origin') ?? ''
  const headers = {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'content-type, x-admin-password',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Vary': 'Origin',
  }
  return status === 204 ? new Response(null, { status, headers }) : json(body, status, headers)
}

function equalSecret(left: string, right: string) {
  const a = new TextEncoder().encode(left)
  const b = new TextEncoder().encode(right)
  let difference = a.length ^ b.length
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index++) difference |= (a[index] ?? 0) ^ (b[index] ?? 0)
  return difference === 0
}

function authorized(request: Request, password: string) {
  const supplied = request.headers.get('x-admin-password') ?? ''
  const key = request.headers.get('cf-connecting-ip') ?? 'unknown'
  const now = Date.now()
  const state = attempts.get(key)
  if (state && state.resetAt > now && state.count >= 12) return false
  if (supplied.length <= 256 && equalSecret(supplied, password)) {
    attempts.delete(key)
    return true
  }
  if (!state || state.resetAt <= now) {
    if (attempts.size >= 1000 && !state) return false
    attempts.set(key, { count: 1, resetAt: now + 60_000 })
  } else state.count++
  return false
}

function validId(value: string | null) {
  return value !== null &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function validInput(value: unknown): value is {
  arduino_seconds: number
  temperature_c: number | null
  humidity_pct: number | null
  pressure_hpa: number | null
  measured_at: string | null
} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const row = value as Record<string, unknown>
  return typeof row.arduino_seconds === 'number' && Number.isFinite(row.arduino_seconds) &&
    row.arduino_seconds >= 0 && row.arduino_seconds <= Number.MAX_SAFE_INTEGER &&
    ['temperature_c', 'humidity_pct', 'pressure_hpa'].every((key) =>
      row[key] === null || (typeof row[key] === 'number' && Number.isFinite(row[key]))
    ) &&
    ['temperature_c', 'humidity_pct', 'pressure_hpa'].some((key) => row[key] !== null) &&
    (row.measured_at === null || (typeof row.measured_at === 'string' &&
      /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(row.measured_at)))
}

export function createManageHandler(
  env: (name: string) => string | undefined = (name) => Deno.env.get(name),
  request: typeof fetch = fetch,
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return response(req, null, 204)
    const password = env('METEOLIVELLI_ADMIN_PASSWORD')
    const url = env('SUPABASE_URL')
    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')
    const source = env('STATION_SOURCE_ID')
    if (!password || password.length < 24 || !url || !serviceKey || !source) {
      return response(req, { code: 'temporarily_unavailable' }, 503)
    }
    if (!allowedOrigins.has(req.headers.get('origin') ?? '')) {
      return response(req, { code: 'forbidden' }, 403)
    }
    if (!authorized(req, password)) return response(req, { code: 'unauthorized' }, 401)

    const base = new URL(url)
    if (base.protocol !== 'https:' || base.username || base.password) {
      return response(req, { code: 'temporarily_unavailable' }, 503)
    }
    const db = async (path: string, method: string, body?: unknown) => {
      const result = await request(new URL(path, base), {
        method,
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        signal: AbortSignal.timeout(10_000),
      })
      if (!result.ok) {
        await result.body?.cancel()
        throw new Error('database_error')
      }
      return result.status === 204 ? null : result.json()
    }

    try {
      const id = new URL(req.url).searchParams.get('id')
      if (req.method === 'GET') {
        const rows = await db(
          `/rest/v1/station_measurements?select=source_id,ingestion_id,arduino_seconds,temperature_c,humidity_pct,pressure_hpa,acquisition_kind,captured_at,measured_at,received_at,quality_flags&source_id=eq.${
            encodeURIComponent(source)
          }&order=received_at.desc&limit=100`,
          'GET',
        )
        return response(req, { items: rows })
      }
      if (req.method === 'DELETE') {
        if (!validId(id)) return response(req, { code: 'invalid_request' }, 400)
        const removed = await db('/rest/v1/rpc/admin_delete_station_measurement', 'POST', {
          p_source_id: source,
          p_ingestion_id: id,
        })
        return removed
          ? response(req, { deleted: true })
          : response(req, { code: 'not_found' }, 404)
      }
      if (req.method !== 'POST' && req.method !== 'PATCH') {
        return response(req, { code: 'method_not_allowed' }, 405)
      }
      let rawBody: string
      try {
        rawBody = await readBody(req)
      } catch (error) {
        return response(
          req,
          { code: 'invalid_request' },
          error instanceof BodyError && error.code === 'payload_too_large' ? 413 : 400,
        )
      }
      let input: unknown
      try {
        input = JSON.parse(rawBody)
      } catch {
        return response(req, { code: 'invalid_request' }, 400)
      }
      if (!validInput(input)) return response(req, { code: 'invalid_request' }, 400)

      let current: Record<string, unknown> | undefined
      let ingestionId: string = crypto.randomUUID()
      let acquisitionKind: Measurement['acquisition_kind'] = 'historical'
      let capturedAt: string | null = null
      if (req.method === 'PATCH') {
        if (!validId(id)) return response(req, { code: 'invalid_request' }, 400)
        const rows = await db(
          `/rest/v1/station_measurements?select=source_id,ingestion_id,arduino_seconds,temperature_c,humidity_pct,pressure_hpa,acquisition_kind,captured_at,measured_at,payload&source_id=eq.${
            encodeURIComponent(source)
          }&ingestion_id=eq.${id}&limit=1`,
          'GET',
        ) as Record<string, unknown>[]
        current = rows[0]
        if (!current) return response(req, { code: 'not_found' }, 404)
        ingestionId = String(current.ingestion_id)
        acquisitionKind = current.acquisition_kind as Measurement['acquisition_kind']
        const storedCapturedAt = current.captured_at as string | null
        capturedAt = storedCapturedAt && Number.isFinite(Date.parse(storedCapturedAt))
          ? new Date(storedCapturedAt).toISOString()
          : null
      }
      const candidate = {
        schema_version: 1,
        source_id: source,
        ingestion_id: ingestionId,
        arduino_seconds: input.arduino_seconds,
        temperature_c: input.temperature_c,
        humidity_pct: input.humidity_pct,
        pressure_hpa: input.pressure_hpa,
        acquisition_kind: acquisitionKind,
        captured_at: capturedAt,
        measured_at: input.measured_at,
        ...(acquisitionKind === 'synthetic'
          ? { _provenance: (current?.payload as Record<string, unknown> | undefined)?._provenance }
          : {}),
      }
      const raw = JSON.stringify(candidate)
      const parsed = parseMeasurementJson(raw)
      if (!parsed.ok) return response(req, { code: 'invalid_measurement' }, 400)
      if (req.method === 'POST') {
        const receipt = await db('/rest/v1/rpc/ingest_station_measurement', 'POST', {
          p_measurement: parsed.measurement,
          p_quality_flags: parsed.quality_flags,
          p_raw_payload: raw,
        })
        return response(req, { item: receipt }, 201)
      }
      const updated = await db('/rest/v1/rpc/admin_update_station_measurement', 'POST', {
        p_measurement: parsed.measurement,
        p_quality_flags: parsed.quality_flags,
      })
      return updated ? response(req, { updated: true }) : response(req, { code: 'not_found' }, 404)
    } catch {
      return response(req, { code: 'temporarily_unavailable' }, 503)
    }
  }
}

Deno.serve(createManageHandler())
