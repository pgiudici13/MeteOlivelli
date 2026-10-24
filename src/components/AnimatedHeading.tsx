import { useLayoutEffect, useRef } from 'react'
import { animate } from 'motion/mini'
import { animateOnEntrance, entranceFrames, entranceTiming } from '../motion.ts'

/** Parole intere, spazi e a-capo conservati; un solo titolo nell'albero accessibile. */
export function AnimatedHeading({ id, lines }: { id: string; lines: string[] }) {
  const ref = useRef<HTMLHeadingElement>(null)
  useLayoutEffect(() => {
    const heading = ref.current
    if (!heading) return
    return animateOnEntrance(heading, () => Array.from(heading.querySelectorAll('.title-word'), (word, index) =>
      animate(word, entranceFrames, { ...entranceTiming, duration: 0.48, delay: Math.min(index * 0.045, 0.2) })))
  }, [])
  return <h1 id={id} ref={ref}>{lines.map((line, lineIndex) => <span key={line}>
    {lineIndex > 0 && <br />}
    {line.split(' ').map((word, index, words) => <span key={`${word}-${index}`}>
      <span className="title-word">{word}{lineIndex === lines.length - 1 && index === words.length - 1 && <span className="title-stop">.</span>}</span>{index < words.length - 1 ? ' ' : ''}
    </span>)}
  </span>)}</h1>
}
