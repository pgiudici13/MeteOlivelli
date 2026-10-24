import { useLayoutEffect } from 'react'
import { animate } from 'motion/mini'
import type { AnimationPlaybackControls } from 'motion'
import { animateOnEntrance, entranceTiming } from './motion.ts'

/** Un solo insieme di listener, anche per i controlli creati dopo una lettura. */
export function usePageMotion() {
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
      ? event.target.closest<HTMLElement>('button:not(:disabled):not(.quiz-answer), .hero-link, .header-actions nav a') : null
    function move(element: HTMLElement, transform: string) {
      touched.add(element)
      running.get(element)?.stop()
      if (media.matches) { element.style.removeProperty('transform'); return }
      const animation = animate(element, { transform }, { duration: 0.16, ease: 'easeOut' })
      running.set(element, animation)
      void animation.then(() => { if (running.get(element) === animation) running.delete(element) })
    }
    const over = (event: PointerEvent) => {
      const element = target(event)
      if (element && event.pointerType === 'mouse' && !element.contains(event.relatedTarget as Node | null)) move(element, 'translateY(-2px) scale(1)')
    }
    const out = (event: PointerEvent) => {
      const element = target(event)
      if (element && !element.contains(event.relatedTarget as Node | null)) move(element, 'translateY(0px) scale(1)')
    }
    let pressed: HTMLElement | null = null
    const down = (event: PointerEvent) => {
      pressed = target(event)
      if (pressed) move(pressed, 'translateY(0px) scale(0.97)')
    }
    const up = () => { if (pressed) move(pressed, 'translateY(0px) scale(1)'); pressed = null }
    const reset = () => {
      running.forEach((animation, element) => { animation.cancel(); (element as HTMLElement).style.removeProperty('transform') })
      running.clear()
      touched.forEach(element => element.style.removeProperty('transform'))
      touched.clear()
    }
    document.addEventListener('pointerover', over)
    document.addEventListener('pointerout', out)
    document.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    media.addEventListener('change', reset)
    return () => {
      reset()
      cleanups.forEach(cleanup => cleanup())
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerout', out)
      document.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      media.removeEventListener('change', reset)
    }
  }, [])
}
