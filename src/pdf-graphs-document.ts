import { buildPdfChart } from './pdf-chart.ts'
import { formatReportTime } from './pdf-export.ts'
import { metrics } from './weather.ts'
import type { ChartMode, Measurement } from './weather.ts'

const periodName = (period: ChartMode) => period === 'auto' ? 'Auto' : period === '24h' ? '24 ore' : period === '7g' ? '7 giorni' : period === '14g' ? '14 giorni' : '30 giorni'

export function buildGraphsDocument(rows: Measurement[], period: ChartMode, until: string, generatedAt: Date) {
  if (!Number.isFinite(generatedAt.getTime())) throw new Error('Data di generazione non valida')
  const charts = metrics.map(metric => buildPdfChart(rows, metric.key, period, until))
  const reportTime = formatReportTime(generatedAt.toISOString())
  const periodLabel = periodName(period)
  return {
    pageSize: 'A4',
    pageOrientation: 'landscape',
    pageMargins: [36, 42, 36, 42],
    defaultStyle: { font: 'Roboto', fontSize: 9, color: '#292622' },
    info: { title: `MeteOlivelli · Grafici · ${periodLabel}`, subject: 'Esportazione dei grafici delle misurazioni' },
    content: [
      { text: 'MeteOlivelli · Grafici delle misurazioni', style: 'title' },
      { text: `Periodo selezionato: ${periodLabel} · Generato il ${reportTime} · Ora visualizzata: Europe/Rome`, style: 'meta', margin: [0, 2, 0, 8] },
      ...charts.map(chart => ({
        stack: [
          { text: `${chart.metric.name} · ${chart.metric.unit}`, style: 'heading', margin: [0, 5, 0, 1] },
          { svg: chart.svg, width: 735, height: 296, margin: [0, 0, 0, 0] },
          { text: chart.pointCount ? `${chart.averaged ? `${chart.pointCount} ${period === 'auto' ? 'medie per fascia' : 'medie giornaliere'} da ${chart.sampleCount} campioni validi` : `${chart.pointCount} campioni validi`} · ${chart.minimum === null ? 'nessun valore' : `min ${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(chart.minimum)} ${chart.metric.unit} · max ${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 }).format(chart.maximum!)} ${chart.metric.unit}`}` : 'Nessun valore valido da tracciare nel periodo.', style: 'caption' },
          { text: `Provenienza dei campioni tracciati: ${chart.provenance}.`, style: 'caption' },
          ...(chart.note ? [{ text: chart.note, style: 'caption' }] : []),
        ],
        unbreakable: true,
        margin: [0, 0, 0, 7],
      })),
      { text: 'Per 7, 14 e 30 giorni il grafico mostra le medie giornaliere dei campioni validi acquisiti tra le 09:00 e le 18:00 (Europe/Rome). Auto adatta la rappresentazione alla disponibilità dei dati. Valori assenti o segnalati come probabili errati interrompono la linea; non vengono interpolati. I campioni originali restano consultabili nella cronologia del sito.', style: 'footnote', margin: [0, 4, 0, 0] },
    ],
    styles: {
      title: { fontSize: 17, bold: true },
      meta: { fontSize: 8, color: '#68625D' },
      heading: { fontSize: 10, bold: true },
      caption: { fontSize: 8, color: '#68625D' },
      footnote: { fontSize: 8, color: '#68625D' },
    },
    footer: (currentPage: number, pageCount: number) => ({ text: `MeteOlivelli · Grafici · Pagina ${currentPage} di ${pageCount}`, alignment: 'right', margin: [36, 0, 36, 16], fontSize: 8, color: '#68625D' }),
  }
}
