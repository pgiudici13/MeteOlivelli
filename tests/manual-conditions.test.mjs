import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readManualConditions } from '../src/manual-conditions.ts'
const at = '2026-11-24T12:00:00.000Z'
test('lettura delle osservazioni convalida contenuto e segnala errore', async () => {
  const item = { observed_at: at, cloud: 'sereno', rain: 'assente', wind: 'calmo' }
  assert.deepEqual(await readManualConditions(new AbortController().signal, async () => Response.json({ items: [item], next_offset: null })), [item])
  await assert.rejects(() => readManualConditions(new AbortController().signal, async () => Response.json({ items: [{ ...item, rain: 'sconosciuta' }], next_offset: null })))
  const custom = { ...item, phenomenon: 'altro', phenomenon_detail: 'Nevischio' }
  assert.deepEqual(await readManualConditions(new AbortController().signal, async () => Response.json({ items: [custom], next_offset: null })), [custom])
  await assert.rejects(() => readManualConditions(new AbortController().signal, async () => Response.json({ items: [{ ...custom, phenomenon_detail: '' }], next_offset: null })))
  await assert.rejects(() => readManualConditions(new AbortController().signal, async () => new Response(null, { status: 503 })))
})
