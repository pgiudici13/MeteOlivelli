import { useLayoutEffect, useRef } from 'react'

export function ScrollProgress() {
  const fillRef = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const max = document.documentElement.scrollHeight - window.innerHeight
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0
      if (fillRef.current) fillRef.current.style.transform = `scaleY(${progress})`
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    observer?.observe(document.body)
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => {
      if (frame) cancelAnimationFrame(frame)
      observer?.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])
  return <div className="scroll-progress" aria-hidden="true"><span ref={fillRef} /></div>
}
