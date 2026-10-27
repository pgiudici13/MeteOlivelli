import { quizQuestions } from './quiz.ts'

const dayMs = 86400000
const dayParts = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit' })

/** Stessa curiosità per tutti i visitatori nella giornata civile italiana. */
export function dailyCuriosity(now: Date) {
  if (!Number.isFinite(now.getTime())) throw new Error('Data non valida')
  const parts = Object.fromEntries(dayParts.formatToParts(now).map(part => [part.type, part.value]))
  const day = Math.floor(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)) / dayMs)
  const question = quizQuestions[day % quizQuestions.length]
  return { question: question.question, answer: question.answers[question.correctIndex], explanation: question.explanation }
}
