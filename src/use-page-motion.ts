import { useLayoutEffect } from 'react'
import { animate } from 'motion/mini'
import type { AnimationPlaybackControls } from 'motion'
import { animateOnEntrance, entranceTiming } from './motion.ts'
import { useBorderLight } from './use-border-light.ts'

/** Un solo insieme di listener, anche per i controlli creati dopo una lettura. */
export function usePageMotion() {
  useBorderLight()
  useLayoutEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const running = new Map<Element, AnimationPlaybackControls>()
    const touched = new Set<HTMLElement>()
    const cleanups: (() => void)[] = []
    const header = document.querySelector('.site-header')
    if (header) cleanups.push(animateOnEntrance(header, () => [animate(header,
      { opacity: [0, 1], transform: ['translateY(-8px)', 'translateY(0px)'] }, entranceTiming)]))
    // Le pagine editoriali usano sezioni autonome; la Home usa Reveal.
    document.querySelectorAll('.info-block, .privacy-block').forEach(section => {
      cleanups.push(animateOnEntrance(section, () => [animate(section,
        { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0px)'] }, entranceTiming)]))
    })
    const target = (event: Event) => event.target instanceof Element
      ? event.target.closest<HTMLElement>('button:not(:disabled), .hero-link, .back-to-top, .section-jump-nav a') : null
    function feedback(element: HTMLElement, filter: string) {
      touched.add(element)
      running.get(element)?.stop()
      if (media.matches) { element.style.removeProperty('filter'); return }
      const animation = animate(element, { filter }, { duration: 0.14, ease: 'easeOut' })
      running.set(element, animation)
      void animation.then(() => {
        if (running.get(element) === animation) {
          running.delete(element)
          if (filter === 'brightness(1)') { element.style.removeProperty('filter'); touched.delete(element) }
        }
      })
    }
    let pressed: HTMLElement | null = null
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return
      pressed = target(event)
      if (pressed) feedback(pressed, 'brightness(0.88)')
    }
    const up = () => { if (pressed) feedback(pressed, 'brightness(1)'); pressed = null }
    const reset = () => {
      pressed = null
      running.forEach(animation => animation.cancel())
      running.clear()
      touched.forEach(element => element.style.removeProperty('filter'))
      touched.clear()
    }
    document.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    window.addEventListener('blur', reset)
    media.addEventListener('change', reset)
    return () => {
      reset()
      cleanups.forEach(cleanup => cleanup())
      document.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      window.removeEventListener('blur', reset)
      media.removeEventListener('change', reset)
    }
  }, [])
}
