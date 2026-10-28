import { useEffect, useRef } from 'react'

export function CursorRing() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const ring = ref.current
    if (!ring) return
    const desktop = matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)')
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, x = 0, y = 0, targetX = 0, targetY = 0, visible = false
    const hide = () => { visible = false; ring.style.opacity = '0'; if (frame) cancelAnimationFrame(frame); frame = 0 }
    const draw = () => {
      frame = 0
      const blend = reduced.matches ? 1 : .36
      x += (targetX - x) * blend
      y += (targetY - y) * blend
      ring.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      if (Math.abs(targetX - x) + Math.abs(targetY - y) > .2) frame = requestAnimationFrame(draw)
    }
    const move = (event: PointerEvent) => {
      if (!desktop.matches || event.pointerType !== 'mouse' || (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]'))) return hide()
      targetX = event.clientX; targetY = event.clientY
      if (!visible) { x = targetX; y = targetY; visible = true; ring.style.opacity = '1' }
      ring.classList.toggle('is-interactive', event.target instanceof Element && !!event.target.closest('a[href], button:not(:disabled), summary, select'))
      if (!frame) frame = requestAnimationFrame(draw)
    }
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide() }
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerout', leave)
    window.addEventListener('blur', hide)
    desktop.addEventListener('change', hide)
    return () => { hide(); document.removeEventListener('pointermove', move); document.removeEventListener('pointerout', leave); window.removeEventListener('blur', hide); desktop.removeEventListener('change', hide) }
  }, [])
  return <div ref={ref} className="cursor-ring" aria-hidden="true" />
}
