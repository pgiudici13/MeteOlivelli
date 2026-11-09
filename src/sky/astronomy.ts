import { getPosition, getTimes, getMoonPosition, getMoonIllumination } from 'suncalc'
import { STATION } from './location.ts'
import type { SolarEvents } from './weather.ts'

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))
const stationDay = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', {
  timeZone: STATION.timezone, year: 'numeric', month: 'numeric', day: 'numeric',
})

/** Un mezzogiorno UTC nel giorno civile della stazione seleziona il transito corretto a Pavia. */
function civilDayAnchor(date: Date): Date {
  const parts = stationDay.formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(part => part.type === type)?.value)
  return new Date(Date.UTC(value('year'), value('month') - 1, value('day'), 12))
}
/** SunCalc 2 usa gradi e istanti UTC; la proiezione è illustrativa, non un panorama orientato. */
export function astronomy(date: Date, solarEvents?: SolarEvents | null) {
  const { latitude, longitude } = STATION
  const sun = getPosition(date, latitude, longitude)
  const times = getTimes(civilDayAnchor(date), latitude, longitude)
  const moon = getMoonPosition(date, latitude, longitude)
  const illumination = getMoonIllumination(date)
  const suppliedRise = solarEvents?.sunrise
  const suppliedSet = solarEvents?.sunset
  const suppliedEventsAreValid = suppliedRise !== null && suppliedRise !== undefined && suppliedSet !== null && suppliedSet !== undefined && suppliedRise < suppliedSet
  const rise = suppliedEventsAreValid ? suppliedRise : times.sunrise?.getTime() ?? times.solarNoon.getTime() - 6 * 3600000
  const set = suppliedEventsAreValid ? suppliedSet : times.sunset?.getTime() ?? times.solarNoon.getTime() + 6 * 3600000
  const x = clamp((date.getTime() - rise) / (set - rise), 0, 1)
  return { sun, times, moon, illumination, sunX: 8 + x * 84,
    sunY: 75 - clamp(sun.altitude / 75, 0, 1) * 58,
    moonX: clamp(moon.azimuth / 360 * 100, 5, 95), moonY: 75 - clamp(moon.altitude / 75, 0, 1) * 58 }
}

/** Visibilità illustrativa: mai sotto l'orizzonte, attenuata da luce e nuvole. */
export function moonVisibility(sunAltitude: number, moonAltitude: number, cloudCoverage: number): number {
  if (moonAltitude <= 0) return 0
  return clamp((-sunAltitude - 3) / 12, 0, 1) * (1 - clamp(cloudCoverage, 0, 1) * .8)
}
