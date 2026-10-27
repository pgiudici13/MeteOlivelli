import { readAllHistory, readPage, stationMeasurements } from './weather.ts'
import type { Measurement, PageReader } from './weather.ts'
import { buildHistoryDocument } from './pdf-history-document.ts'
import { createPdfBlob } from './pdf-runtime.ts'

export interface HistoryPdfResult {
  blob: Blob
  rows: Measurement[]
  generatedAt: Date
}

export async function createFreshHistoryPdf(
  signal: AbortSignal,
  reader: PageReader = readPage,
  generate: typeof createPdfBlob = createPdfBlob,
  now: () => Date = () => new Date(),
): Promise<HistoryPdfResult> {
  const rows = stationMeasurements(await readAllHistory(signal, reader))
  const generatedAt = now()
  const blob = await generate(buildHistoryDocument(rows, generatedAt))
  return { blob, rows, generatedAt }
}
