// Contratto client → validatore API, senza rete o database. Dati sintetici.
import { createWeatherFeed } from '../../../src/weather-feed.ts'
import type { WeatherState } from '../../../src/weather-feed.ts'
import { parseReadQuery } from '../read-measurements/handler.ts'

Deno.test('Auto normalizza il timestamp PostgreSQL per il validatore API reale', async () => {
  let published: WeatherState | undefined
  const row = {
    acquisition_kind: 'live' as const,
    ingestion_id: '12345678-1234-4234-8234-123456789abc',
    temperature_c: 18,
    humidity_pct: 60,
    pressure_hpa: 1015,
    captured_at: '2026-10-22T19:43:00.123456+00:00',
    measured_at: null,
    received_at: '2026-10-22T20:00:00+00:00',
    quality_flags: [],
  }
  const feed = createWeatherFeed('30g', (state) => {
    published = state
  }, (params) => {
    const query = parseReadQuery(
      new URL(`https://example.test/?${params}`),
      new Date('2026-10-23T00:00:00Z'),
    )
    if (!query) throw new Error('Richiesta client rifiutata dal validatore API')
    return Promise.resolve({
      items: query.basis === 'measured_at' ? [] : [row],
      next_cursor: null,
      until: query.until,
      time_basis: query.basis,
    })
  }, { anchorToLatest: true })
  await feed.refresh()
  if (
    !published || published.historyError || published.history.length !== 1 ||
    published.windowUntil !== '2026-10-22T19:43:00.124Z'
  ) {
    throw new Error('Auto non ha caricato il campione entro la finestra normalizzata')
  }
  feed.stop()
})
