// Fixture interamente sintetiche; store/fetch simulati, nessun DB o token reale.
import type { MeasurementStore, PublicMeasurement, Receipt } from './database.ts'
import { createRestStore } from './database.ts'
import { createIngestHandler } from '../ingest-measurement/handler.ts'
import { createReadHandler, parseReadQuery } from '../read-measurements/handler.ts'
import { canonicalMeasurementContent, type Measurement } from './measurement.ts'

function assert(value: unknown, message = 'Esito inatteso'): asserts value {
  if (!value) throw new Error(message)
}
const token = 'token-sintetico-solo-test-0123456789abcdef'
const fixture: Measurement = {
  schema_version: 1,
  source_id: 'test',
  ingestion_id: '12345678-1234-4234-8234-123456789abc',
  arduino_seconds: 1,
  temperature_c: 21,
  humidity_pct: 50,
  pressure_hpa: 1013,
  acquisition_kind: 'live',
  captured_at: '2026-10-22T08:00:00.000Z',
  measured_at: null,
}
const receipt: Receipt = {
  status: 'accepted',
  source_id: fixture.source_id,
  ingestion_id: fixture.ingestion_id,
  received_at: '2026-10-22T08:00:01.000Z',
  quality_flags: [],
}
function request(body: unknown = fixture, headers: Record<string, string> = {}) {
  return new Request('https://example.test/ingest', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}
function store(overrides: Partial<MeasurementStore> = {}): MeasurementStore {
  return { save: () => Promise.resolve(receipt), read: () => Promise.resolve([]), ...overrides }
}

Deno.test('ingest rifiuta metodo, token e media type prima del salvataggio', async () => {
  let calls = 0
  const handler = createIngestHandler({
    token,
    source: 'test',
    store: store({
      save: () => {
        calls++
        throw new Error('Non previsto')
      },
    }),
  })
  assert((await handler(new Request('https://example.test'))).status === 405)
  assert((await handler(request(fixture, { authorization: '' }))).status === 401)
  assert((await handler(request(fixture, { authorization: 'Bearer errato' }))).status === 401)
  assert((await handler(request(fixture, { 'content-type': 'text/plain' }))).status === 415)
  assert(calls === 0)
})

Deno.test('ingest separa JSON invalido, struttura e sorgente non autorizzata', async () => {
  const handler = createIngestHandler({ token, source: 'test', store: store() })
  assert((await handler(request('{'))).status === 400)
  assert((await handler(request({ ...fixture, received_at: receipt.received_at }))).status === 422)
  assert((await handler(request({ ...fixture, source_id: 'altra' }))).status === 403)
})

Deno.test('limite corpo controllato sui byte reali senza fidarsi di Content-Length', async () => {
  const handler = createIngestHandler({ token, source: 'test', store: store() })
  assert((await handler(request(' '.repeat(16385)))).status === 413)
  assert((await handler(request('é'.repeat(9000), { 'content-length': '1' }))).status === 413)
  assert((await handler(request(fixture, { 'content-length': '20000' }))).status === 413)
})

Deno.test('stream corpo invalido e UTF-8 non valido non salvano eventi', async () => {
  const handler = createIngestHandler({ token, source: 'test', store: store() })
  const req = new Request('https://example.test', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: new Uint8Array([255]),
  })
  assert((await handler(req)).status === 400)
})

Deno.test('conferma solo dopo persistenza, qualità ricalcolata e originale preservato', async () => {
  let release!: (value: Receipt) => void
  let completed = false
  const raw = JSON.stringify({ ...fixture, humidity_pct: 120 }, null, 2)
  const handler = createIngestHandler({
    token,
    source: 'test',
    store: store({
      save: (value, flags, original) => {
        assert(
          value.humidity_pct === 120 && flags[0].label === 'probabile errato' && original === raw,
        )
        return new Promise((resolve) => {
          release = resolve
        })
      },
    }),
  })
  const pending = handler(request(raw)).then((value) => {
    completed = true
    return value
  })
  // Attendere l'ingresso nello store senza timer o I/O.
  while (!release) await new Promise((resolve) => setTimeout(resolve, 0))
  assert(!completed)
  release(receipt)
  const response = await pending
  assert(response.status === 201 && response.headers.get('cache-control') === 'no-store')
})

Deno.test('risposta persa e retry preservano identità, conflitto non sovrascrive', async () => {
  let saved: string | null = null
  let loseResponse = true
  const handler = createIngestHandler({
    token,
    source: 'test',
    store: store({
      save: (value) => {
        const content = canonicalMeasurementContent(value)
        if (saved !== null) {
          return Promise.resolve(
            saved === content ? { ...receipt, status: 'duplicate' } : { status: 'conflict' },
          )
        }
        saved = content
        if (loseResponse) {
          loseResponse = false
          throw new Error('Risposta persa dopo commit simulato')
        }
        return Promise.resolve(receipt)
      },
    }),
  })
  assert((await handler(request())).status === 503)
  const retry = await handler(request())
  assert(retry.status === 200 && (await retry.json()).received_at === receipt.received_at)
  assert((await handler(request({ ...fixture, temperature_c: 25 }))).status === 409)
  assert((await handler(request())).status === 200)
})

Deno.test('DB indisponibile non rivela dettagli o segreti', async () => {
  const handler = createIngestHandler({
    token,
    source: 'test',
    store: store({
      save: () => {
        throw new Error(token)
      },
    }),
  })
  const response = await handler(request())
  assert(response.status === 503 && !(await response.text()).includes(token))
})

const now = () => new Date('2026-10-22T09:00:00.000Z')
Deno.test('query read ammette solo periodi, basi, limiti e parametri unici', () => {
  for (
    const query of [
      'period=1g',
      'limit=501',
      'limit=1.5',
      'limit=0',
      'view=history&limit=2&limit=3',
      'source_id=altra',
      'view=history&until=2026-02-30T00:00:00.000Z',
      'view=latest&basis=measured_at',
      'view=history&cursor=',
      'view=history&until=2027-01-01T00:00:00.000Z',
    ]
  ) {
    assert(parseReadQuery(new URL(`https://example.test/?${query}`), now()) === null)
  }
  for (const period of ['24h', '7g', '30g']) {
    assert(
      parseReadQuery(
        new URL(`https://example.test/?view=history&period=${period}&basis=measured_at&limit=500`),
        now(),
      )?.limit === 500,
    )
  }
})

Deno.test('read vuota esplicita, CORS e rifiuto scritture', async () => {
  const handler = createReadHandler({ source: 'test', store: store(), now })
  const response = await handler(new Request('https://example.test/'))
  const result = await response.json()
  assert(response.status === 200 && result.items.length === 0 && result.next_cursor === null)
  assert(
    result.time_label === 'ora di acquisizione sul PC' &&
      response.headers.get('access-control-allow-origin') === '*',
  )
  assert((await handler(request())).status === 405)
  assert(
    (await handler(new Request('https://example.test/', { method: 'OPTIONS' }))).status === 204,
  )
})

Deno.test('paginazione conserva finestra, base e spareggio UUID senza usare received_at', async () => {
  const row: PublicMeasurement = {
    ingestion_id: fixture.ingestion_id,
    temperature_c: 21,
    humidity_pct: 50,
    pressure_hpa: 1013,
    captured_at: '2026-10-22T08:00:00+00:00',
    measured_at: null,
    received_at: receipt.received_at,
    quality_flags: [],
  }
  const handler = createReadHandler({
    source: 'test',
    now,
    store: store({
      read: (source, query) => {
        assert(source === 'test' && query.limit === 1)
        return Promise.resolve([row, {
          ...row,
          ingestion_id: '22345678-1234-4234-8234-123456789abc',
        }])
      },
    }),
  })
  const response = await handler(new Request('https://example.test/?view=history&limit=1'))
  const result = await response.json()
  assert(result.items.length === 1 && result.next_cursor)
  const url = new URL('https://example.test/?view=history&limit=1')
  url.searchParams.set('cursor', result.next_cursor)
  const next = parseReadQuery(url, new Date('2026-10-22T10:00:00.000Z'))
  assert(
    next?.until === now().toISOString() && next.after_time === fixture.captured_at &&
      next.after_id === fixture.ingestion_id,
  )
  url.searchParams.set('basis', 'measured_at')
  assert(parseReadQuery(url, now()) === null)
})

Deno.test('adapter RPC usa solo URL e credenziale server, fallisce su conferma ambigua', async () => {
  const calls: string[] = []
  const database = createRestStore(
    'https://example.test',
    'chiave-sintetica',
    ((_url, init) => {
      calls.push(String(_url))
      const headers = new Headers(init?.headers)
      assert(headers.get('apikey') === 'chiave-sintetica')
      assert(!headers.get('authorization')?.includes(token))
      return Promise.resolve(new Response(JSON.stringify(receipt)))
    }) as typeof fetch,
  )
  assert((await database.save(fixture, [], '{}')).status === 'accepted')
  assert(calls[0] === 'https://example.test/rest/v1/rpc/ingest_station_measurement')
  const broken = createRestStore(
    'https://example.test',
    'sintetica',
    (() => Promise.resolve(new Response('{}'))) as typeof fetch,
  )
  let failed = false
  try {
    await broken.save(fixture, [], '{}')
  } catch {
    failed = true
  }
  assert(failed)
})

Deno.test('adapter read proietta colonne pubbliche e non propaga payload interno', async () => {
  const database = createRestStore(
    'https://example.test',
    'sintetica',
    (() =>
      Promise.resolve(
        new Response(
          JSON.stringify([{
            ...fixture,
            received_at: receipt.received_at,
            quality_flags: [],
            raw_payload: 'interno',
            payload: fixture,
          }]),
        ),
      )) as typeof fetch,
  )
  const query = parseReadQuery(new URL('https://example.test/'), now())!
  const rows = await database.read('test', query)
  assert(!('raw_payload' in rows[0]) && !('payload' in rows[0]) && !('arduino_seconds' in rows[0]))
})
