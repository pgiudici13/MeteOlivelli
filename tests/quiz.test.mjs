import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drawQuizQuestions, quizQuestions } from '../src/quiz.ts'

test('il quiz contiene venti domande con tre opzioni e una risposta corretta valida', () => {
  assert.equal(quizQuestions.length, 20)
  for (const question of quizQuestions) {
    assert.equal(question.answers.length, 3)
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.answers.length)
  }
})

test('l’estrazione produce dieci domande distinte senza alterare la raccolta', () => {
  const originalQuestions = [...quizQuestions]
  const selected = drawQuizQuestions(() => 0.42)
  assert.equal(selected.length, 10)
  assert.equal(new Set(selected).size, 10)
  assert.deepEqual(quizQuestions, originalQuestions)
})

test('estrazioni casuali differenti possono selezionare domande diverse', () => {
  const first = drawQuizQuestions(() => 0)
  const second = drawQuizQuestions(() => 0.99)
  assert.notDeepEqual(first, second)
})
