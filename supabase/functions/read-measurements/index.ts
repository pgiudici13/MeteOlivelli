import { json } from '../_shared/http.ts'
import { runtimeConfig } from '../_shared/runtime.ts'
import { createReadHandler } from './handler.ts'

try {
  Deno.serve(createReadHandler(runtimeConfig()))
} catch {
  Deno.serve(() =>
    json({ code: 'temporarily_unavailable' }, 503, { 'Access-Control-Allow-Origin': '*' })
  )
}
