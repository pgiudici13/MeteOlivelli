import type { Metric } from './weather.ts'

export const metricExplanations: Record<Metric, string> = {
  temperature_c: 'È la temperatura dell’aria rilevata dal sensore, registrata in gradi Celsius (°C), visualizzabile anche in Fahrenheit (°F). Il dato descrive il punto in cui è installata la stazione e non tutta la città.',
  humidity_pct: 'È l’umidità relativa: indica quanto il vapore acqueo presente nell’aria si avvicina alla saturazione alla temperatura osservata. Il 70% non significa che l’aria contenga il 70% di acqua.',
  pressure_hpa: 'È la pressione esercitata dall’atmosfera, espressa in ettopascal (hPa). Può cambiare con le condizioni meteorologiche e con la quota: una singola lettura non basta per prevedere il tempo.',
}
