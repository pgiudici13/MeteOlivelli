import { requireEnvironmentVariable } from '../_shared/config.ts'
import { json } from '../_shared/http.ts'
import { runtimeConfig } from '../_shared/runtime.ts'
import { createIngestHandler } from './handler.ts'

try {
  const handler = createIngestHandler({
    ...runtimeConfig(),
    token: requireEnvironmentVariable((name) => Deno.env.get(name), 'STATION_INGEST_TOKEN'),
  })
  Deno.serve(handler)
} catch {
  // Risposta chiusa anche per configurazione incompleta; nessun valore nei log.
  Deno.serve(() => json({ code: 'temporarily_unavailable' }, 503))
}
