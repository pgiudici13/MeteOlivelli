import { useEffect } from 'react'

const targets = '.panel, .metric-card, .chart, .forecast-card, .about-section, .weather-records, .meteorology-glossary, .range-statistics, button:not(:disabled), a[href], summary, input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'

export function useBorderLight() {
  useEffect(() => {
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let active: HTMLElement | null = null
    let frame = 0
    let x = 0
    let y = 0
    let targetX = 0
    let targetY = 0
    const clear = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      active?.removeAttribute('data-border-light')
      active = null
    }
    const draw = () => {
      frame = 0
      if (!active) return
      const blend = reduced.matches ? 1 : 0.18
      x += (targetX - x) * blend
      y += (targetY - y) * blend
      active.style.setProperty('--light-x', `${x}px`)
      active.style.setProperty('--light-y', `${y}px`)
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.2) frame = requestAnimationFrame(draw)
    }
    const move = (event: PointerEvent) => {
      if (!pointer.matches || event.pointerType === 'touch') return clear()
      const element = event.target instanceof Element ? event.target.closest<HTMLElement>(targets) : null
      if (!element) return clear()
      const box = element.getBoundingClientRect()
      targetX = event.clientX - box.left
      targetY = event.clientY - box.top
      if (element !== active) {
        clear()
        active = element
        x = targetX
        y = targetY
        active.setAttribute('data-border-light', '')
      }
      if (!frame) frame = requestAnimationFrame(draw)
    }
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', clear)
    window.addEventListener('blur', clear)
    pointer.addEventListener('change', clear)
    return () => {
      clear()
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', clear)
      window.removeEventListener('blur', clear)
      pointer.removeEventListener('change', clear)
    }
  }, [])
}
