import { test } from 'node:test'
import assert from 'node:assert/strict'
import { drawQuizQuestions, getQuizAnswerFeedback, quizQuestions, shuffleQuizAnswers } from '../src/quiz.ts'

test('il quiz contiene venti domande con tre opzioni e una risposta corretta valida', () => {
  assert.equal(quizQuestions.length, 20)
  for (const question of quizQuestions) {
    assert.equal(question.answers.length, 3)
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.answers.length)
    assert.ok(question.explanation.trim().length > 0)
  }
})

test('le venti chiavi di risposta corrispondono alle opzioni indicate dall’utente', () => {
  assert.deepEqual(quizQuestions.map(question => question.answers[question.correctIndex]), [
    'Perché l’atmosfera diffonde maggiormente la luce blu',
    'L’aria attraversata dal fulmine',
    'Perché la luce viaggia molto più velocemente del suono',
    'Da sostanze liberate dal terreno e da alcuni microrganismi',
    'No, possono sviluppare forme molto diverse',
    'Alle tue spalle',
    'Sono composte soprattutto da minuscole gocce d’acqua o cristalli di ghiaccio',
    'Perché l’acqua evapora e passa nell’aria',
    'Perché il sudore evapora più difficilmente',
    'Perché nei temporali possono esserci zone molto fredde anche quando al suolo fa caldo',
    'Perché l’Australia si trova nell’emisfero australe, dove le stagioni sono opposte',
    'Perché il vapore acqueo del respiro si raffredda e forma minuscole gocce',
    'Perché il vapore acqueo dell’aria si condensa sulle superfici fredde',
    'Perché in montagna la temperatura può essere molto più bassa',
    'L’asfalto scuro',
    'Che l’acqua raggiungerebbe un’altezza di 10 mm su una superficie piana, senza perdite',
    'Può svilupparsi in altezza fino a raggiungere dimensioni paragonabili a una montagna',
    'Una nube che si trova a contatto con il suolo o molto vicino ad esso',
    'Perché il vapore acqueo si condensa sulle superfici raffreddate durante la notte',
    'No, le gocce piccole sono quasi sferiche, mentre quelle più grandi possono appiattirsi',
  ])
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

test('le tre opzioni vengono mescolate e la risposta corretta resta associata al testo', () => {
  for (const question of quizQuestions) {
    const shuffled = shuffleQuizAnswers(question, () => 0)
    assert.notDeepEqual(shuffled.answers, question.answers)
    assert.deepEqual([...shuffled.answers].sort(), [...question.answers].sort())
    assert.equal(shuffled.answers[shuffled.correctIndex], question.answers[question.correctIndex])
  }
})

test('l’estrazione del quiz restituisce anche opzioni rimescolate senza perdere la risposta corretta', () => {
  const selected = drawQuizQuestions(() => 0)
  assert.equal(selected.length, 10)
  assert.equal(new Set(selected.map(question => question.question)).size, 10)
  for (const question of selected) {
    const original = quizQuestions.find(item => item.question === question.question)
    assert.ok(original)
    assert.equal(question.answers[question.correctIndex], original.answers[original.correctIndex])
  }
})

test('il feedback distingue la scelta corretta da quella errata e restituisce la spiegazione', () => {
  const question = quizQuestions[0]
  const correct = getQuizAnswerFeedback(question, question.correctIndex)
  const wrong = getQuizAnswerFeedback(question, (question.correctIndex + 1) % question.answers.length)
  assert.equal(correct.isCorrect, true)
  assert.equal(wrong.isCorrect, false)
  assert.equal(correct.correctAnswer, question.answers[question.correctIndex])
  assert.equal(wrong.correctAnswer, correct.correctAnswer)
  assert.equal(wrong.explanation, question.explanation)
})
