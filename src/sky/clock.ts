/** Aggiorna la scena solo quando è visibile e riallinea l'ora al ritorno. */
export function startSkyClock(update: () => void, page: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'> = document, timers: Pick<Window, 'setInterval' | 'clearInterval'> = window): () => void {
  const tick = () => { if (page.visibilityState === 'visible') update() }
  const timer = timers.setInterval(tick, 60000)
  page.addEventListener('visibilitychange', tick)
  return () => { timers.clearInterval(timer); page.removeEventListener('visibilitychange', tick) }
}
