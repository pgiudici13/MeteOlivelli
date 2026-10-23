export type QuizRippleRect = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>

export type QuizRippleGeometry = {
  x: number
  y: number
  radius: number
}

export function getQuizRippleGeometry(
  rect: QuizRippleRect,
  point?: { clientX: number; clientY: number },
): QuizRippleGeometry {
  const x = point ? Math.min(rect.width, Math.max(0, point.clientX - rect.left)) : rect.width / 2
  const y = point ? Math.min(rect.height, Math.max(0, point.clientY - rect.top)) : rect.height / 2
  const radius = Math.ceil(Math.max(
    Math.hypot(x, y),
    Math.hypot(rect.width - x, y),
    Math.hypot(x, rect.height - y),
    Math.hypot(rect.width - x, rect.height - y),
  ))
  return { x, y, radius }
}
