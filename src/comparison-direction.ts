export function comparisonDirection(delta: number): { symbol: string; label: string; tone: string } {
  const rounded = Math.round(delta * 10)
  if (rounded > 0) return { symbol: '↑', label: 'Media più alta', tone: 'higher' }
  if (rounded < 0) return { symbol: '↓', label: 'Media più bassa', tone: 'lower' }
  return { symbol: '→', label: 'Media invariata', tone: 'equal' }
}
