import { translate } from '../i18n.ts'
import { usePreferences } from '../use-preferences.ts'
import { AnimatedHeading } from '../components/AnimatedHeading.tsx'
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { ThemeToggle } from '../components/ThemeToggle.tsx'
import { BrandMark } from '../components/BrandMark.tsx'
import { SchoolLogo } from '../components/SchoolLogo.tsx'
import { SchoolSiteLink } from '../components/SchoolSiteLink.tsx'
import { SiteFooter } from '../components/SiteFooter.tsx'
import { drawQuizQuestions, getQuizAnswerFeedback, type QuizQuestion } from '../quiz.ts'
import { getQuizRippleGeometry, type QuizRippleGeometry } from '../quiz-motion.ts'
import { trackAnalyticsEvent } from '../analytics.ts'
import './QuizPage.css'

type QuizState = 'intro' | 'playing' | 'complete'

function updateMetadata() {
  document.title = translate('Gioca con il meteo — MeteOlivelli')
  const description = document.querySelector<HTMLMetaElement>('meta[name="description"]')
  if (description) description.content = translate('Dieci domande casuali sulle curiosità del meteo. Mettiti alla prova con MeteOlivelli.')
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (canonical) canonical.href = 'https://meteolivelli.vercel.app/gioca'
}

export function QuizPage() {
  const preferences = usePreferences()
  const [state, setState] = useState<QuizState>('intro')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [ripple, setRipple] = useState<QuizRippleGeometry | null>(null)
  const questionRef = useRef<HTMLLegendElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)
  const resultRef = useRef<HTMLHeadingElement>(null)

  useEffect(updateMetadata, [preferences])
  useLayoutEffect(() => {
    if (state === 'playing') {
      (selectedAnswer === null ? questionRef.current : feedbackRef.current)?.focus()
    } else if (state === 'complete') resultRef.current?.focus()
  }, [state, questionIndex, selectedAnswer])

  const currentQuestion = questions[questionIndex]
  const answerFeedback = currentQuestion && selectedAnswer !== null
    ? getQuizAnswerFeedback(currentQuestion, selectedAnswer)
    : null

  function startQuiz() {
    setQuestions(drawQuizQuestions())
    setQuestionIndex(0)
    setSelectedAnswer(null)
    setScore(0)
    setRipple(null)
    setState('playing')
    trackAnalyticsEvent('quiz_start', { quiz_name: 'meteo_curiosita', question_count: 10 })
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
      trackAnalyticsEvent('quiz_complete', {
        quiz_name: 'meteo_curiosita',
        score,
        score_max: questions.length,
        score_percent: Math.round((score / questions.length) * 100),
      })
      setState('complete')
      return
    }
    setQuestionIndex(index => index + 1)
    setSelectedAnswer(null)
    setRipple(null)
  }

  return <div className="site-shell quiz-page">
    <a className="skip-link" href="#quiz-content">{translate("Vai al contenuto")}</a>
    <header className="site-header">
      <a className="brand" href="/home"><BrandMark />{translate("MeteOlivelli")}<span className="brand-index"> / 04</span></a>
      <SchoolSiteLink className="school-logo"><SchoolLogo /></SchoolSiteLink>
      <div className="header-actions">
        <nav aria-label={translate("Navigazione principale")}><a href="/home">{translate("Home")}</a><a href="/info">{translate("Informazioni")}</a><a href="/gioca" aria-current="page">{translate("Gioca")}</a></nav>
        <ThemeToggle />
      </div>
    </header>
    <main id="quiz-content" tabIndex={-1}>
      <section className="quiz-hero" aria-labelledby="quiz-title">
        <p className="eyebrow"><span className="signal-mark" aria-hidden="true" />{translate(" MeteOlivelli · Curiosità meteo")}</p>
        <AnimatedHeading id="quiz-title" lines={translate(["Gioca con", "il meteo"])} />
        <p className="quiz-lead">{translate("Dieci domande, venti curiosità e un cielo pieno di sorprese. Quante ne sai?")}</p>
      </section>

      <section className="quiz-card panel" aria-label={translate("Quiz meteo")}>
        {translate(state === 'intro' && <div className="quiz-intro">
          <p className="eyebrow section-index">{translate("01 / La sfida")}</p>
          <h2>{translate("Pronto a mettere alla prova la tua curiosità?")}</h2>
          <p>{translate("Pescheremo 10 domande diverse da una raccolta di 20 curiosità sul tempo atmosferico. Scegli una risposta per vedere subito com’è andata.")}</p>
          <button className="quiz-primary" onClick={startQuiz}>{translate("Inizia il quiz ")}<span aria-hidden="true">↗</span></button>
        </div>)}

        {translate(state === 'playing' && currentQuestion && <div className="quiz-playing" key={questionIndex}>
          <div className="quiz-progress-line"><p className="eyebrow section-index">{translate("02 / Domanda ")}{translate(questionIndex + 1)}{translate(" di ")}{translate(questions.length)}</p><p className="quiz-score-live">{translate("Punteggio ")}<strong>{translate(score)}</strong></p></div>
          <div className="quiz-progress" role="progressbar" aria-label={translate("Avanzamento quiz")} aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={questionIndex + 1}><span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} /></div>
          <fieldset className="quiz-question">
            <legend ref={questionRef} tabIndex={-1}>{translate(currentQuestion.question)}</legend>
            <div className="quiz-answers">{translate(currentQuestion.answers.map((answer, index) => {
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
                <span className="quiz-answer-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span><span>{translate(answer)}</span>
                {translate(answered && correct && <span className="quiz-answer-result"><span className="quiz-answer-result-mark" aria-hidden="true">✓</span>{translate(" Corretta")}</span>)}
                {translate(wrongSelected && <span className="quiz-answer-result"><span className="quiz-answer-result-mark" aria-hidden="true">{translate("×")}</span>{translate(" La tua risposta")}</span>)}
              </button>
            }))}</div>
          </fieldset>
          {translate(answerFeedback && <div ref={feedbackRef} tabIndex={-1} className={`quiz-feedback ${answerFeedback.isCorrect ? 'is-correct' : 'is-wrong'}`}>
            <div className="quiz-feedback-message">
              <p>{translate(answerFeedback.isCorrect ? 'Risposta corretta.' : `Risposta non corretta. La risposta giusta è: ${answerFeedback.correctAnswer}.`)}</p>
              <p className="quiz-explanation">{translate(answerFeedback.explanation)}</p>
            </div>
            <button className="quiz-primary" onClick={continueQuiz}>{translate(questionIndex === questions.length - 1 ? 'Vedi il risultato' : 'Prossima domanda')} <span aria-hidden="true">→</span></button>
          </div>)}
        </div>)}

        {translate(state === 'complete' && <div className="quiz-result">
          <p className="eyebrow section-index">{translate("03 / Il risultato")}</p>
          <p className="quiz-score"><strong>{translate(score)}</strong><span> / 10</span></p>
          <h2 ref={resultRef} tabIndex={-1} aria-describedby="quiz-result-summary">{translate(score === 10 ? 'Un vero esperto del meteo!' : score >= 7 ? 'Che bella conoscenza del cielo!' : score >= 4 ? 'La curiosità è già un ottimo inizio.' : 'C’è ancora tanto da scoprire!')}</h2>
          <p id="quiz-result-summary">{translate("Hai risposto correttamente a ")}<strong>{translate(score)} {translate(score === 1 ? 'domanda' : 'domande')}</strong>{translate(" su 10.")}</p>
          <button className="quiz-primary" onClick={startQuiz}>{translate("Gioca ancora ")}<span aria-hidden="true">↻</span></button>
        </div>)}
      </section>
    </main>
    <SiteFooter />
  </div>
}
