import type { AnimationPlaybackControls } from 'motion'

// Preparazione prima del paint; senza supporto o con movimento ridotto resta tutto visibile.
export function animateOnEntrance(element: Element, play: () => AnimationPlaybackControls[], restore?: () => void) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
  let animations: AnimationPlaybackControls[] = []
  let observer: IntersectionObserver | undefined
  const cancel = () => {
    animations.forEach(animation => animation.cancel())
    restore?.()
  }
  const show = () => element.removeAttribute('data-entrance-pending')
  const revealForFocus = () => {
    show()
    cancel()
    observer?.disconnect()
  }
  const onPreference = () => {
    if (preference.matches) {
      show()
      cancel()
      observer?.disconnect()
    }
  }
  if (!preference.matches && 'IntersectionObserver' in window && 'animate' in Element.prototype) {
    element.setAttribute('data-entrance-pending', '')
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        observer?.disconnect()
        try {
          if (!preference.matches) animations = play()
        } finally {
          show()
        }
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' })
    observer.observe(element)
  }
  element.addEventListener('focusin', revealForFocus)
  preference.addEventListener('change', onPreference)
  return () => {
    show()
    observer?.disconnect()
    element.removeEventListener('focusin', revealForFocus)
    preference.removeEventListener('change', onPreference)
    cancel()
  }
}

export const entranceFrames = { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0px)'] }
export const entranceTiming = {
  duration: 0.42, ease: [0.22, 1, 0.36, 1] as const,
}
