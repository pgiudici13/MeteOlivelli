import { buildForecast } from './forecast.ts'
import type { Measurement } from './weather.ts'

self.onmessage = (event: MessageEvent<{ rows: Measurement[]; now: number }>) => {
  try { self.postMessage({ run: buildForecast(event.data.rows, event.data.now) }) }
  catch { self.postMessage({ error: true }) }
}
