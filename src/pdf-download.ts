import { reportFilename } from './pdf-export.ts'

export interface PdfDownloadEnvironment {
  createObjectURL(blob: Blob): string
  revokeObjectURL(url: string): void
  createLink(): { href: string; download: string; click(): void }
  schedule(callback: () => void, delay: number): void
}

const browserEnvironment: PdfDownloadEnvironment = {
  createObjectURL: blob => URL.createObjectURL(blob),
  revokeObjectURL: url => URL.revokeObjectURL(url),
  createLink: () => document.createElement('a'),
  schedule: (callback, delay) => { window.setTimeout(callback, delay) },
}

export function downloadPdfBlob(blob: Blob, kind: 'grafici' | 'cronologia', generatedAt: Date, environment: PdfDownloadEnvironment = browserEnvironment): string {
  if (blob.type !== 'application/pdf' || blob.size === 0) throw new Error('Documento PDF non valido')
  const filename = reportFilename(kind, generatedAt)
  const url = environment.createObjectURL(blob)
  try {
    const link = environment.createLink()
    link.href = url
    link.download = filename
    link.click()
  } finally {
    environment.schedule(() => environment.revokeObjectURL(url), 1000)
  }
  return filename
}
