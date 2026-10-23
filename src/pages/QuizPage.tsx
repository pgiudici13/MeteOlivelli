import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react'
import { ThemeToggle } from '../components/ThemeToggle.tsx'
import { drawQuizQuestions, type QuizQuestion } from '../quiz.ts'
import { getQuizRippleGeometry, type QuizRippleGeometry } from '../quiz-motion.ts'
import './QuizPage.css'

type QuizState = 'intro' | 'playing' | 'complete'

function updateMetadata() {
  document.title = 'Gioca con il meteo — MeteOlivelli'
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (description) description.content = 'Dieci domande casuali sulle curiosità del meteo. Mettiti alla prova con MeteOlivelli.'
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (canonical) canonical.href = 'https://meteolivelli.vercel.app/gioca'
}

export function QuizPage() {
  const [state, setState] = useState<QuizState>('intro')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [ripple, setRipple] = useState<QuizRippleGeometry | null>(null)

  useEffect(updateMetadata, [])

  const currentQuestion = questions[questionIndex]

  function startQuiz() {
    setQuestions(drawQuizQuestions())
    setQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setRipple(null)
    setState('playing')
  }

  function chooseAnswer(answerIndex: number, event: MouseEvent<HTMLButtonElement>) {
    if (selectedAnswer !== null || !currentQuestion) return
    setSelectedAnswer(answerIndex)
    const point = event.detail === 0 ? undefined : { clientX: event.clientX, clientY: event.clientY }
    setRipple(getQuizRippleGeometry(event.currentTarget.getBoundingClientRect(), point))
    if (answerIndex === currentQuestion.correctIndex) setScore(value => value + 1)
  }

  function continueQuiz() {
    if (selectedAnswer === null) return
    if (questionIndex === questions.length - 1) {
      setState('complete')
      return
    }
    setQuestionIndex(index => index + 1)
    setSelectedAnswer(null)
    setRipple(null)
  }

  return <div className="site-shell quiz-page">
    <a className="skip-link" href="#quiz-content">Vai al contenuto</a>
    <header className="site-header">
      <a className="brand" href="/home"><span className="brand-symbol" aria-hidden="true">MO.</span>MeteOlivelli<span className="brand-index"> / 04</span></a>
      <a className="school-logo" href="/info"><img src="/logo-liceo-scientifico-stem-olivelli-pavia.png" alt="Liceo Olivelli — Scientifico + STEM" /></a>
      <div className="header-actions">
        <nav aria-label="Navigazione principale"><a href="/home">Home</a><a href="/info">Informazioni</a><a href="/gioca" aria-current="page">Gioca</a></nav>
        <ThemeToggle />
      </div>
    </header>
    <main id="quiz-content" tabIndex={-1}>
      <section className="quiz-hero" aria-labelledby="quiz-title">
        <p className="eyebrow"><span className="signal-mark" aria-hidden="true" /> MeteOlivelli · Curiosità meteo</p>
        <h1 id="quiz-title">Gioca con<br />il meteo<span className="title-stop">.</span></h1>
        <p className="quiz-lead">Dieci domande, venti curiosità e un cielo pieno di sorprese. Quante ne sai?</p>
      </section>

      <section className="quiz-card panel" aria-live="polite" aria-atomic="true">
        {state === 'intro' && <div className="quiz-intro">
          <p className="eyebrow section-index">01 / La sfida</p>
          <h2>Pronto a mettere alla prova la tua curiosità?</h2>
          <p>Pescheremo 10 domande diverse da una raccolta di 20 curiosità sul tempo atmosferico. Scegli una risposta per vedere subito com’è andata.</p>
          <button className="quiz-primary" onClick={startQuiz}>Inizia il quiz <span aria-hidden="true">↗</span></button>
        </div>}

        {state === 'playing' && currentQuestion && <div className="quiz-playing" key={questionIndex}>
          <div className="quiz-progress-line"><p className="eyebrow section-index">02 / Domanda {questionIndex + 1} di {questions.length}</p><p className="quiz-score-live">Punteggio <strong>{score}</strong></p></div>
          <div className="quiz-progress" role="progressbar" aria-label="Avanzamento quiz" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={questionIndex + 1}><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
          <fieldset className="quiz-question">
            <legend>{currentQuestion.question}</legend>
            <div className="quiz-answers">{currentQuestion.answers.map((answer, index) => {
              const answered = selectedAnswer !== null
              const correct = index === currentQuestion.correctIndex
              const wrongSelected = selectedAnswer === index && !correct
              const answerClass = answered && correct ? 'is-correct' : wrongSelected ? 'is-wrong' : ''
              const answerStyle = ripple && selectedAnswer === index ? {
                '--quiz-ripple-x': `${ripple.x}px`,
                '--quiz-ripple-y': `${ripple.y}px`,
                '--quiz-ripple-radius': `${ripple.radius}px`,
              } as CSSProperties : undefined
              return <button key={answer} type="button" className={`quiz-answer ${answerClass}`} style={answerStyle} aria-pressed={selectedAnswer === index} disabled={answered} onClick={event => chooseAnswer(index, event)}>
                <span className="quiz-answer-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span><span>{answer}</span>
                {answered && correct && <span className="quiz-answer-result">Corretta</span>}
                {wrongSelected && <span className="quiz-answer-result">La tua risposta</span>}
              </button>
            })}</div>
          </fieldset>
          {selectedAnswer !== null && <div className={`quiz-feedback ${selectedAnswer === currentQuestion.correctIndex ? 'is-correct' : 'is-wrong'}`} role="status">
            <p>{selectedAnswer === currentQuestion.correctIndex ? 'Esatto! Bella intuizione.' : 'Non proprio: la risposta giusta è evidenziata in verde.'}</p>
            <button className="quiz-primary" onClick={continueQuiz}>{questionIndex === questions.length - 1 ? 'Vedi il risultato' : 'Prossima domanda'} <span aria-hidden="true">→</span></button>
          </div>}
        </div>}

        {state === 'complete' && <div className="quiz-result">
          <p className="eyebrow section-index">03 / Il risultato</p>
          <p className="quiz-score"><strong>{score}</strong><span> / 10</span></p>
          <h2>{score === 10 ? 'Un vero esperto del meteo!' : score >= 7 ? 'Che bella conoscenza del cielo!' : score >= 4 ? 'La curiosità è già un ottimo inizio.' : 'C’è ancora tanto da scoprire!'}</h2>
          <p>Hai risposto correttamente a <strong>{score} {score === 1 ? 'domanda' : 'domande'}</strong> su 10.</p>
          <button className="quiz-primary" onClick={startQuiz}>Gioca ancora <span aria-hidden="true">↻</span></button>
        </div>}
      </section>
    </main>
    <footer className="site-footer"><a className="school-logo footer-school-logo" href="/info"><img src="/logo-liceo-scientifico-stem-olivelli-pavia.png" alt="Liceo Olivelli — Scientifico + STEM" /></a><p>MeteOlivelli · Il meteo, visto da scuola.</p><p><a href="/home">Home</a> · <a href="/info">Informazioni</a> · <a href="/privacy">Privacy</a></p></footer>
  </div>
}
