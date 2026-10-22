import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

export function Reveal({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const element = ref.current
    if (!element || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches || element.getBoundingClientRect().top < window.innerHeight) return
    // I contenuti restano sempre visibili: l'animazione parte solo quando osservati.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          if (element.getBoundingClientRect().top > 0 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            element.animate?.([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' })
            element.querySelectorAll('.chart, .forecast-card').forEach((card, index) => {
              card.animate?.([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, delay: Math.min(index * 40, 120), easing: 'ease-out' })
            })
          }
          observer.unobserve(element)
        }
      }
    }, { threshold: 0.1 })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return <div ref={ref} className={className}>{children}</div>
}
