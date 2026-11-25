import { createHandler } from './handler.ts'
const env: Record<string, string> = {
  SUPABASE_URL: 'https://example.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'test-only-key',
}
function assert(value: unknown) {
  if (!value) throw new Error('Verifica non riuscita')
}
Deno.test('lettura pubblica: proiezione limitata, paginazione, metodi e parametri', async () => {
  let called = 0
  const handler = createHandler((name) => env[name], (url, options) => {
    called++
    assert(
      new URL(String(url)).searchParams.get('select') ===
        'observed_at,cloud,rain,wind,phenomenon,phenomenon_detail',
    )
    assert(options?.method === undefined)
    return Promise.resolve(
      Response.json([{
        observed_at: '2026-01-01T00:00:00Z',
        cloud: 'sereno',
        rain: 'assente',
        wind: 'calmo',
        secret: 'non pubblico',
      }]),
    )
  })
  const res = await handler(new Request('https://example.invalid/conditions'))
  const body = await res.json()
  assert(res.status === 200 && body.items.length === 1 && !('secret' in body.items[0]))
  assert(
    (await handler(new Request('https://example.invalid/conditions?offset=-1'))).status === 400,
  )
  assert((await handler(new Request('https://example.invalid/conditions?select=*'))).status === 400)
  assert(
    (await handler(new Request('https://example.invalid/conditions', { method: 'POST' })))
      .status === 405,
  )
  assert(called === 1)
})
Deno.test('lettura pubblica: errori backend non diffusi', async () => {
  const handler = createHandler(
    (name) => env[name],
    () => Promise.resolve(new Response('private error', { status: 500 })),
  )
  const res = await handler(new Request('https://example.invalid/conditions'))
  assert(res.status === 503 && !JSON.stringify(await res.json()).includes('private error'))
})
