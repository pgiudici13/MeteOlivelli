// Dati e credenziali esclusivamente fittizi; nessuna rete o lettura dell'ambiente.
import { createManageHandler } from './handler.ts'
import { dateInput, measurementTime } from '../../../src/admin-time.ts'

const origin = 'https://meteolivelli.vercel.app'
const password = 'synthetic-admin-password-for-tests'
const id = '12345678-1234-4234-8234-123456789abc'
const input = {
  arduino_seconds: 12,
  temperature_c: 18,
  humidity_pct: 60,
  pressure_hpa: 1015,
  measured_at: '2026-10-27T10:00:00.000Z',
}
const environment: Record<string, string> = {
  METEOLIVELLI_ADMIN_PASSWORD: password,
  SUPABASE_URL: 'https://example.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key',
  STATION_SOURCE_ID: 'synthetic-admin-test',
}

function assert(condition: unknown, message = 'Verifica amministrazione fallita') {
  if (!condition) throw new Error(message)
}

function request(method = 'GET', body?: unknown, headers: Record<string, string> = {}) {
  return new Request(`https://example.invalid/manage-measurements?id=${id}`, {
    method,
    headers: { origin, 'x-admin-password': password, ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}

Deno.test('Admin gestisce preflight, configurazione assente e URL backend invalido', async () => {
  let calls = 0
  const noDatabase: typeof fetch = () => {
    calls++
    throw new Error('Il database non deve essere chiamato')
  }
  const unavailable = createManageHandler(() => undefined, noDatabase)
  assert((await unavailable(request('OPTIONS'))).status === 204)
  assert((await unavailable(request())).status === 503)
  for (
    const url of [
      'not-a-url',
      'http://example.invalid',
      'https://user:placeholder@example.invalid',
      'https://example.invalid?unexpected=query',
      'https://example.invalid#fragment',
    ]
  ) {
    const handler = createManageHandler(
      (name) => ({ ...environment, SUPABASE_URL: url })[name],
      noDatabase,
    )
    const response = await handler(request())
    assert(response.status === 503, 'Configurazione invalida senza risposta 503')
    assert(response.headers.get('access-control-allow-origin') === origin)
    assert((await response.json()).code === 'temporarily_unavailable')
  }
  assert(calls === 0)
})

Deno.test('Admin rifiuta origine e password errate prima di interrogare il database', async () => {
  let calls = 0
  const handler = createManageHandler((name) => environment[name], () => {
    calls++
    return Promise.resolve(Response.json([]))
  })
  assert(
    (await handler(request('GET', undefined, { origin: 'https://other.invalid' }))).status === 403,
  )
  assert(
    (await handler(request('GET', undefined, { 'x-admin-password': 'incorrect' }))).status === 401,
  )
  assert(calls === 0)
  assert((await handler(request())).status === 200)
  assert(calls === 1)
})

Deno.test('Admin valida date e valori prima delle scritture e conserva i flag di qualità', async () => {
  const calls: { url: string; body: Record<string, unknown> }[] = []
  const handler = createManageHandler((name) => environment[name], (url, init) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) })
    return Promise.resolve(Response.json({ status: 'accepted' }))
  })
  for (
    const body of [
      { ...input, measured_at: '2026-02-30T10:00:00.000Z' },
      { ...input, arduino_seconds: -1 },
      { ...input, temperature_c: null, humidity_pct: null, pressure_hpa: null },
    ]
  ) assert((await handler(request('POST', body))).status === 400)
  assert(calls.length === 0)
  const response = await handler(request('POST', { ...input, humidity_pct: 150 }))
  assert(response.status === 201)
  assert(calls.length === 1)
  assert(calls[0].url.endsWith('/rpc/ingest_station_measurement'))
  const body = calls[0].body
  const measurement = body.p_measurement as Record<string, unknown>
  assert(measurement.acquisition_kind === 'historical')
  assert(measurement.captured_at === null)
  assert(measurement.measured_at === input.measured_at)
  assert(measurement.humidity_pct === 150)
  const flags = body.p_quality_flags as { field: string; code: string }[]
  assert(
    flags.some((flag) => flag.field === 'humidity_pct' && flag.code === 'outside_physical_bounds'),
  )
})

Deno.test('Admin aggiorna conservando identità e provenienza, gestisce righe mancanti e errori DB', async () => {
  const calls: { url: string; body: Record<string, unknown> | null }[] = []
  const handler = createManageHandler((name) => environment[name], (url, init) => {
    calls.push({ url: String(url), body: init?.body ? JSON.parse(String(init.body)) : null })
    return Promise.resolve(
      Response.json(
        init?.method === 'GET'
          ? [{
            ingestion_id: id,
            acquisition_kind: 'live',
            captured_at: '2026-10-27T09:00:00+00:00',
          }]
          : true,
      ),
    )
  })
  assert((await handler(request('PATCH', input))).status === 200)
  const measurement = calls[1].body?.p_measurement as Record<string, unknown>
  assert(measurement.ingestion_id === id && measurement.acquisition_kind === 'live')
  assert(measurement.captured_at === '2026-10-27T09:00:00+00:00')
  assert((await handler(request('DELETE'))).status === 200)
  assert(calls[2].url.endsWith('/rpc/admin_delete_station_measurement'))
  const missing = createManageHandler(
    (name) => environment[name],
    (_url, init) => Promise.resolve(Response.json(init?.method === 'GET' ? [] : false)),
  )
  assert((await missing(request('PATCH', input))).status === 404)
  assert((await missing(request('DELETE'))).status === 404)
  const failed = createManageHandler(
    (name) => environment[name],
    () =>
      Promise.resolve(Response.json({ internal: 'synthetic-database-detail' }, { status: 500 })),
  )
  const error = await failed(request())
  assert(error.status === 503)
  assert(!JSON.stringify(await error.json()).includes('synthetic-database-detail'))
})

Deno.test('Admin limita i tentativi falliti anche se viene poi fornita la password corretta', async () => {
  let calls = 0
  const handler = createManageHandler((name) => environment[name], () => {
    calls++
    return Promise.resolve(Response.json([]))
  })
  const headers = { 'cf-connecting-ip': '192.0.2.17' }
  for (let attempt = 0; attempt < 12; attempt++) {
    assert(
      (await handler(request('GET', undefined, { ...headers, 'x-admin-password': 'incorrect' })))
        .status === 401,
    )
  }
  assert((await handler(request('GET', undefined, headers))).status === 401)
  assert(calls === 0)
})

Deno.test('Admin integra il campo locale e conserva microsecondi PostgreSQL per istanti invariati', async () => {
  for (
    const original of [
      '2026-10-25T01:30:45.123456+00:00',
      '2026-10-25T01:30:00+00:00',
    ]
  ) {
    const captured = '2026-10-25T01:29:00.654321+00:00'
    const saved: Record<string, unknown>[] = []
    const handler = createManageHandler((name) => environment[name], (_url, init) => {
      if (init?.method === 'GET') {
        return Promise.resolve(Response.json([{
          ingestion_id: id,
          acquisition_kind: 'live',
          captured_at: captured,
          measured_at: original,
        }]))
      }
      saved.push(JSON.parse(String(init?.body)).p_measurement)
      return Promise.resolve(Response.json(true))
    })
    const unchanged = measurementTime(dateInput(original), original)
    assert((await handler(request('PATCH', { ...input, measured_at: unchanged }))).status === 200)
    assert(saved[0].measured_at === original, 'Persi microsecondi della misura invariata')
    assert(saved[0].captured_at === captured, 'Persi microsecondi di acquisizione')
    assert((await handler(request('PATCH', input))).status === 200)
    assert(saved[1].measured_at === input.measured_at, 'Modifica della data ignorata')
    assert(saved[1].captured_at === captured)
    assert((await handler(request('PATCH', { ...input, measured_at: null }))).status === 200)
    assert(saved[2].measured_at === null, 'Rimozione della data ignorata')
  }
})

Deno.test('Admin conserva la forma originale del payload solo se coincide fino ai microsecondi', async () => {
  for (const precision of ['microseconds', 'milliseconds', 'mismatch']) {
    const matches = precision !== 'mismatch'
    const captured = `2026-10-25T01:29:00.654${precision === 'milliseconds' ? '000' : '321'}+00:00`
    const measured = `2026-10-25T01:30:45.123${precision === 'milliseconds' ? '000' : '456'}+00:00`
    const payload = {
      captured_at: precision === 'microseconds'
        ? '2026-10-25T01:29:00.654321Z'
        : '2026-10-25T01:29:00.654Z',
      measured_at: precision === 'microseconds'
        ? '2026-10-25T01:30:45.123456Z'
        : '2026-10-25T01:30:45.123Z',
    }
    let saved: Record<string, unknown> = {}
    const handler = createManageHandler((name) => environment[name], (_url, init) => {
      if (init?.method === 'GET') {
        return Promise.resolve(Response.json([{
          ingestion_id: id,
          acquisition_kind: 'live',
          captured_at: captured,
          measured_at: measured,
          payload,
        }]))
      }
      saved = JSON.parse(String(init?.body)).p_measurement
      return Promise.resolve(Response.json(true))
    })
    const unchanged = measurementTime(dateInput(measured), measured)
    assert((await handler(request('PATCH', { ...input, measured_at: unchanged }))).status === 200)
    assert(saved.captured_at === (matches ? payload.captured_at : captured))
    assert(saved.measured_at === (matches ? payload.measured_at : measured))
  }
})
