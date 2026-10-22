import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { animateOnEntrance, entranceFrames, entranceTiming } from '../motion.ts'

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const cleanups = [animateOnEntrance(element, () => [element.animate(entranceFrames, entranceTiming)])]
    // Ogni scheda aspetta il proprio ingresso: essenziale nelle colonne mobile.
    element.querySelectorAll('.intro > *, .metric-card, .forecast-card, .chart-grid > .chart').forEach((item, index) => {
      cleanups.push(animateOnEntrance(item, () => [item.animate(entranceFrames, {
        ...entranceTiming, delay: Math.min(index % 3 * 80, 160),
      })]))
    })
    return () => cleanups.forEach(cleanup => cleanup())
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}
