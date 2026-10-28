import { useEffect } from 'react'

const targets = '.hero-instrument, .panel:not(.history-section):not(.chronology-section):not(.forecast-section), .metric-card, .chart, .forecast-card, .about-section, .weather-records, .range-statistics, button:not(:disabled), .hero-link, .back-to-top, .section-jump-nav a, input:not(:disabled), select:not(:disabled), textarea:not(:disabled)'

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
      active?.style.removeProperty('--light-x')
      active?.style.removeProperty('--light-y')
      active = null
    }

    const draw = () => {
      frame = 0
      if (!active) return
      const blend = reduced.matches ? 1 : 0.2
      x += (targetX - x) * blend
      y += (targetY - y) * blend
      active.style.setProperty('--light-x', `${x}px`)
      active.style.setProperty('--light-y', `${y}px`)
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > 0.25) frame = requestAnimationFrame(draw)
    }

    const move = (event: PointerEvent) => {
      if (!pointer.matches || event.pointerType === 'touch') return clear()
      let element = event.target instanceof Element ? event.target.closest<HTMLElement>(targets) : null
      if (element?.matches('.hero-instrument .chart')) element = element.closest<HTMLElement>('.hero-instrument')
      if (!element) return clear()
      const bounds = element.getBoundingClientRect()
      targetX = event.clientX - bounds.left
      targetY = event.clientY - bounds.top

      if (element !== active) {
        clear()
        active = element
        x = targetX
        y = targetY
        active.setAttribute('data-border-light', '')
        active.style.setProperty('--light-x', `${x}px`)
        active.style.setProperty('--light-y', `${y}px`)
      }
      if (!frame && (reduced.matches || Math.abs(targetX - x) + Math.abs(targetY - y) > 0.25)) frame = requestAnimationFrame(draw)
    }

    const leaveDocument = (event: PointerEvent) => {
      if (event.relatedTarget === null) clear()
    }

    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerout', leaveDocument)
    window.addEventListener('blur', clear)
    pointer.addEventListener('change', clear)
    return () => {
      clear()
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerout', leaveDocument)
      window.removeEventListener('blur', clear)
      pointer.removeEventListener('change', clear)
    }
  }, [])
}
