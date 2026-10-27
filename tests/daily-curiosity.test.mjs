import assert from 'node:assert/strict'
import test from 'node:test'
import { dailyCuriosity } from '../src/daily-curiosity.ts'
import { quizQuestions } from '../src/quiz.ts'

test('la curiosità è stabile durante la giornata Europe/Rome', () => {
  assert.deepEqual(dailyCuriosity(new Date('2026-10-27T00:00:00Z')), dailyCuriosity(new Date('2026-10-27T21:00:00Z')))
})

test('le curiosità ruotano quotidianamente e rispettano le risposte verificate', () => {
  const start = Date.UTC(2026, 9, 1, 12)
  const items = Array.from({ length: quizQuestions.length }, (_, i) => dailyCuriosity(new Date(start + i * 86400000)))
  assert.equal(new Set(items.map(item => item.question)).size, quizQuestions.length)
  assert.ok(items.every(item => quizQuestions.some(question => question.question === item.question && question.answers[question.correctIndex] === item.answer)))
})

test('una data non valida non produce una curiosità arbitraria', () => {
  assert.throws(() => dailyCuriosity(new Date('invalid')), /Data non valida/)
})
