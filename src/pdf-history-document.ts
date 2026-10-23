import { formatReportTime, formatReportValue } from './pdf-export.ts'
import { metrics } from './weather.ts'
import type { Measurement } from './weather.ts'

const text = (value: string, options: Record<string, unknown> = {}) => ({ text: value, ...options })
const time = (value: string | null) => value ? formatReportTime(value) : '—'

function valueCell(row: Measurement, key: typeof metrics[number]['key'], unit: string): string {
  const value = formatReportValue(row[key], unit)
  return row.quality_flags.some(flag => flag.field === key && flag.label === 'probabile errato') ? `${value} †` : value
}

export function buildHistoryDocument(rows: Measurement[], generatedAt: Date) {
  if (!Number.isFinite(generatedAt.getTime())) throw new Error('Data di generazione non valida')
  const ordered = [...rows].sort((a, b) => Date.parse(a.captured_at ?? a.received_at) - Date.parse(b.captured_at ?? b.received_at) || a.ingestion_id.localeCompare(b.ingestion_id))
  const body = [
    [text('N.', { style: 'tableHeader' }), text('Acquisizione · PC', { style: 'tableHeader' }), text('Misura fisica', { style: 'tableHeader' }), text('Ricezione', { style: 'tableHeader' }), ...metrics.map(metric => text(`${metric.name} · ${metric.unit}`, { style: 'tableHeader' }))],
    ...ordered.map((row, index) => [
      String(index + 1),
      row.captured_at ? `${time(row.captured_at)}${row.acquisition_kind === 'synthetic' ? ' · SINTETICO' : ''}` : `Senza acquisizione\nRicevuto: ${time(row.received_at)}`,
      time(row.measured_at),
      time(row.received_at),
      valueCell(row, metrics[0].key, metrics[0].unit),
      valueCell(row, metrics[1].key, metrics[1].unit),
      valueCell(row, metrics[2].key, metrics[2].unit),
    ]),
  ]
  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [28, 38, 28, 38],
    defaultStyle: { font: 'Roboto', fontSize: 7, color: '#292622' },
    info: { title: 'MeteOlivelli · Cronologia completa', subject: 'Tutti i campioni registrati' },
    content: [
      { text: 'MeteOlivelli · Cronologia completa', style: 'title' },
      { text: `${ordered.length} campioni · Generato il ${formatReportTime(generatedAt.toISOString())} · Orari in Europe/Rome`, style: 'meta', margin: [0, 2, 0, 9] },
      {
        table: { headerRows: 1, dontBreakRows: true, widths: [34, 170, 130, 130, 104, 104, 104], body },
        layout: {
          fillColor: (rowIndex: number) => rowIndex === 0 ? '#EEEAE4' : rowIndex % 2 ? '#FFFFFF' : '#F8F6F3',
          hLineColor: () => '#D5D0CA',
          vLineColor: () => '#E8E4DE',
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },
      { text: 'Gli orari di acquisizione sul PC, della misura fisica e della ricezione server sono distinti. “—” indica un orario o valore assente. † indica un valore segnalato dal controllo qualità come probabile errato. I campioni senza ora di acquisizione sono ordinati per ricezione, riportata separatamente. SINTETICO identifica dati dimostrativi e non osservazioni della stazione.', style: 'footnote', margin: [0, 8, 0, 0] },
    ],
    styles: {
      title: { fontSize: 16, bold: true },
      meta: { fontSize: 8, color: '#68625D' },
      tableHeader: { bold: true, fontSize: 7 },
      footnote: { fontSize: 7, color: '#68625D' },
    },
    footer: (currentPage: number, pageCount: number) => ({ text: `MeteOlivelli · Cronologia · Pagina ${currentPage} di ${pageCount}`, alignment: 'right', margin: [28, 0, 28, 14], fontSize: 7, color: '#68625D' }),
  }
}
