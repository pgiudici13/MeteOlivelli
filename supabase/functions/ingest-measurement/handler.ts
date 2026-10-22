import type { MeasurementStore } from '../_shared/database.ts'
import { BodyError, json, readBody } from '../_shared/http.ts'
import { parseMeasurementJson } from '../_shared/measurement.ts'

export function createIngestHandler(config: {
  token: string
  source: string
  store: MeasurementStore
}): (request: Request) => Promise<Response> {
  if (config.token.length < 32 || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(config.source)) {
    throw new Error('Configurazione ingestione non valida')
  }
  const digest = (value: string) => crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  const expected = digest(`Bearer ${config.token}`)
  return async (request) => {
    if (request.method !== 'POST') {
      return json({ code: 'method_not_allowed' }, 405, { Allow: 'POST' })
    }
    const supplied = request.headers.get('authorization') ?? ''
    const actual = new Uint8Array(await digest(supplied))
    const reference = new Uint8Array(await expected)
    let difference = 0
    for (let i = 0; i < reference.length; i++) difference |= actual[i] ^ reference[i]
    if (difference !== 0) return json({ code: 'unauthorized' }, 401)
    if (
      request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json'
    ) {
      return json({ code: 'unsupported_media_type' }, 415)
    }
    try {
      const raw = await readBody(request)
      const parsed = parseMeasurementJson(raw)
      if (!parsed.ok) {
        const invalidJson = parsed.issues.some((issue) => issue.code === 'invalid_json')
        return json({
          code: invalidJson ? 'invalid_json' : 'invalid_measurement',
          issues: parsed.issues,
        }, invalidJson ? 400 : 422)
      }
      if (parsed.measurement.source_id !== config.source) {
        return json({ code: 'source_mismatch' }, 403)
      }
      const result = await config.store.save(parsed.measurement, parsed.quality_flags, raw)
      if (result.status === 'conflict') return json({ code: 'event_conflict' }, 409)
      return json({ ...result, code: result.status }, result.status === 'accepted' ? 201 : 200)
    } catch (error) {
      if (error instanceof BodyError) {
        return json(
          { code: error.code },
          error.code === 'payload_too_large' ? 413 : error.code === 'body_timeout' ? 408 : 400,
        )
      }
      return json({ code: 'temporarily_unavailable' }, 503, { 'Retry-After': '15' })
    }
  }
}
