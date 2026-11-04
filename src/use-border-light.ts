import { useEffect } from 'react'

const targets = '.hero-instrument, .panel:not(.history-section):not(.chronology-section):not(.forecast-section), .chart, .forecast-card, .daily-stat-card, .comparison-card, .info-flow, .info-periods article, .info-trust-grid article, .info-people article, .data-admin-login, .data-admin-form, .sky-caption, button:not(:disabled):not(.privacy-settings):not(.privacy-inline-settings), .hero-link, .back-to-top, .section-jump-nav a, .route-not-found-link'

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
      // I campi nativi e le azioni testuali mantengono il proprio hover/focus.
      if (event.target instanceof Element && event.target.closest('input, select, textarea, button:disabled, .privacy-settings, .privacy-inline-settings')) return clear()
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

    const leaveTarget = (event: PointerEvent) => {
      if (!(event.relatedTarget instanceof Node) || !active?.contains(event.relatedTarget)) clear()
    }

    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerout', leaveTarget)
    document.addEventListener('scroll', clear, { capture: true, passive: true })
    window.addEventListener('blur', clear)
    window.addEventListener('resize', clear)
    pointer.addEventListener('change', clear)
    return () => {
      clear()
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerout', leaveTarget)
      document.removeEventListener('scroll', clear, true)
      window.removeEventListener('blur', clear)
      window.removeEventListener('resize', clear)
      pointer.removeEventListener('change', clear)
    }
  }, [])
}
