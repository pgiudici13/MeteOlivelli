import { animate } from 'motion/mini'
import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { animateOnEntrance, entranceFrames, entranceTiming } from '../motion.ts'

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const cleanups: (() => void)[] = []
    // Evita due trasformazioni sovrapposte su sezione e figli.
    const items = element.querySelectorAll('.intro > :not(h1), .section-heading, section > h2, section > .eyebrow, .metric-card, .forecast-card, .chart-grid > .chart')
    if (!items.length) cleanups.push(animateOnEntrance(element, () => [animate(element, entranceFrames, entranceTiming)]))
    // Ogni scheda aspetta il proprio ingresso: essenziale nelle colonne mobile.
    items.forEach((item, index) => {
      cleanups.push(animateOnEntrance(item, () => [animate(item, entranceFrames, {
        ...entranceTiming, delay: Math.min(index % 3 * 0.06, 0.12),
      })]))
    })
    return () => cleanups.forEach(cleanup => cleanup())
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}
