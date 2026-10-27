import type { ChartPoint } from './chart.ts'

/** La media dei punti aggregati pesa il numero di campioni di ogni fascia. */
export function summarizeChart(points: ChartPoint[]) {
  if (!points.length) return null
  const sorted = [...points].sort((a, b) => a.time - b.time)
  let total = 0
  let count = 0
  for (const point of sorted) {
    total += point.value * point.count
    count += point.count
  }
  return {
    minimum: Math.min(...sorted.map(point => point.value)),
    maximum: Math.max(...sorted.map(point => point.value)),
    average: total / count,
    change: sorted.length > 1 ? sorted.at(-1)!.value - sorted[sorted.length - 2].value : null,
    samples: count,
  }
}
