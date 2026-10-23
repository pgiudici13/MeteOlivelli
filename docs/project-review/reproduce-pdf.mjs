// Genera esclusivamente fixture di audit, mai misure della stazione.
// node docs/project-review/reproduce-pdf.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildHistoryDocument } from '../../src/pdf-history-document.ts'
import { buildGraphsDocument } from '../../src/pdf-graphs-document.ts'
import { createPdfBlob } from '../../src/pdf-runtime.ts'

const row = {
  acquisition_kind: 'synthetic', ingestion_id: '00000000-0000-4000-8000-000000000001',
  temperature_c: 19.4, humidity_pct: 64, pressure_hpa: 1015.8,
  captured_at: '2026-10-23T10:00:00.000Z', measured_at: null,
  received_at: '2026-10-23T10:00:01.123456Z', quality_flags: [],
}
const generatedAt = new Date('2026-10-23T12:00:00Z')
const directory = join(tmpdir(), 'meteolivelli-review-20261023')
await mkdir(directory, { recursive: true })
for (const [name, definition] of [
  ['history', buildHistoryDocument([row], generatedAt)],
  ['graphs', buildGraphsDocument([row], '24h', generatedAt.toISOString(), generatedAt)],
]) {
  const blob = await createPdfBlob(definition)
  const path = join(directory, `${name}.pdf`)
  await writeFile(path, new Uint8Array(await blob.arrayBuffer()))
  console.log(JSON.stringify({ path, size: blob.size, type: blob.type, fixture: 'synthetic' }))
}
