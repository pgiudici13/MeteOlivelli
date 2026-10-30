/** Disegna una curva monotona che passa per ogni campione senza overshoot. */
export function smoothPath(points: Array<{ x: number; y: number }>) {
  if (points.length < 2) return ''
  const widths: number[] = []
  const slopes: number[] = []
  for (let index = 0; index < points.length - 1; index++) {
    const width = points[index + 1].x - points[index].x
    if (width <= 0) return points.map((point, i) => `${i ? 'L' : 'M'}${point.x},${point.y}`).join(' ')
    widths.push(width)
    slopes.push((points[index + 1].y - points[index].y) / width)
  }
  const tangents = Array(points.length).fill(0) as number[]
  tangents[0] = slopes[0]
  tangents[tangents.length - 1] = slopes.at(-1)!
  for (let index = 1; index < points.length - 1; index++) {
    const before = slopes[index - 1]
    const after = slopes[index]
    if (before * after <= 0) continue
    const priorWidth = widths[index - 1]
    const nextWidth = widths[index]
    const w1 = 2 * nextWidth + priorWidth
    const w2 = nextWidth + 2 * priorWidth
    tangents[index] = (w1 + w2) / (w1 / before + w2 / after)
  }
  return points.slice(0, -1).map((point, index) => {
    const next = points[index + 1]
    const width = widths[index]
    const firstControl = { x: point.x + width / 3, y: point.y + tangents[index] * width / 3 }
    const secondControl = { x: next.x - width / 3, y: next.y - tangents[index + 1] * width / 3 }
    return `${index ? 'C' : `M${point.x},${point.y} C`}${firstControl.x},${firstControl.y} ${secondControl.x},${secondControl.y} ${next.x},${next.y}`
  }).join(' ')
}
