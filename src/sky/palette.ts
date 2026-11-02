type RGB = readonly [number, number, number]
const clamp = (n: number) => Math.max(0, Math.min(1, n))
const mix = (a: RGB, b: RGB, t: number): RGB => {
  const f = clamp(t)
  return [0, 1, 2].map(index => Math.round(a[index] + (b[index] - a[index]) * f)) as [number, number, number]
}
const cssColor = (color: RGB) => `rgb(${color.join(' ')})`

/** Palette illustrativa continua guidata dall'altezza solare, non da orari fissi. */
export function skyPalette(altitude: number, afternoon: boolean) {
  const daylight = clamp((altitude + 12) / 30)
  const twilight = clamp(1 - Math.abs(altitude + 1) / 13)
  const top = mix([9, 20, 42], [75, 146, 190], daylight)
  const base = mix([27, 39, 68], [187, 221, 228], daylight)
  const horizon = mix(base, afternoon ? [239, 139, 115] : [243, 170, 137], twilight * .72)
  return { top: cssColor(top), horizon: cssColor(horizon), daylight, twilight }
}

/** Toni artistici del disco: più ambra vicino all'orizzonte, senza dedurre misure atmosferiche. */
export function sunPalette(altitude: number) {
  const warmth = 1 - clamp(altitude / 15)
  return {
    warmth,
    core: cssColor(mix([255, 254, 240], [255, 226, 182], warmth)),
    middle: cssColor(mix([255, 237, 184], [255, 191, 137], warmth)),
    edge: cssColor(mix([255, 215, 160], [255, 135, 86], warmth)),
  }
}
