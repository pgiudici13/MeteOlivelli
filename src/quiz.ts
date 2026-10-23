export type QuizQuestion = {
  question: string
  answers: [string, string, string]
  correctIndex: number
  explanation: string
}

export const quizQuestions: QuizQuestion[] = [
  { question: 'Perché il cielo è azzurro?', answers: ['Perché riflette il colore degli oceani', 'Perché l’atmosfera diffonde maggiormente la luce blu', 'Perché il Sole emette soprattutto luce azzurra'], correctIndex: 1, explanation: 'Le molecole dell’aria diffondono con maggiore efficacia le lunghezze d’onda corte, come il blu; la luce rossa attraversa l’atmosfera più facilmente.' },
  { question: 'Durante un fulmine, cosa può diventare più caldo della superficie del Sole?', answers: ['La pioggia che lo accompagna', 'L’aria intorno alle nuvole', 'L’aria attraversata dal fulmine'], correctIndex: 2, explanation: 'Il canale attraversato dalla scarica può superare i 30.000 °C, più caldo della superficie visibile del Sole.' },
  { question: 'Perché vediamo il lampo prima di sentire il tuono?', answers: ['Perché il tuono si forma dopo il lampo', 'Perché il vento rallenta il suono', 'Perché la luce viaggia molto più velocemente del suono'], correctIndex: 2, explanation: 'La luce arriva quasi istantaneamente alle distanze del temporale, mentre il suono impiega molto più tempo.' },
  { question: 'Da dove arriva il tipico profumo dopo la pioggia?', answers: ['Dall’acqua che profuma il terreno', 'Dall’aria che diventa più fresca', 'Da sostanze liberate dal terreno e da alcuni microrganismi'], correctIndex: 2, explanation: 'La pioggia libera composti aromatici dal suolo; fra questi c’è la geosmina, prodotta da alcuni microrganismi.' },
  { question: 'I fiocchi di neve sono tutti uguali?', answers: ['Sì, se si formano alla stessa temperatura', 'Sì, ma cambiano forma quando cadono', 'No, possono sviluppare forme molto diverse'], correctIndex: 2, explanation: 'Temperatura, umidità e crescita dei cristalli cambiano durante la formazione: anche piccole differenze producono forme diverse.' },
  { question: 'Dove deve trovarsi il Sole per poter vedere un arcobaleno?', answers: ['Davanti a te', 'Sopra la tua testa', 'Alle tue spalle'], correctIndex: 2, explanation: 'La luce del Sole deve arrivare da dietro chi osserva e incontrare le gocce di pioggia davanti a lui.' },
  { question: 'Le nuvole sono fatte di vapore acqueo visibile?', answers: ['Sì, sono grandi masse di vapore', 'No, sono formate soltanto da polvere', 'Sono composte soprattutto da minuscole gocce d’acqua o cristalli di ghiaccio'], correctIndex: 2, explanation: 'Il vapore acqueo è invisibile: le nuvole diventano visibili quando l’acqua condensa in minuscole gocce o cristalli.' },
  { question: 'Perché le pozzanghere scompaiono anche quando non piove più?', answers: ['Perché l’acqua viene assorbita tutta dal terreno', 'Perché il vento la trasforma in pioggia', 'Perché l’acqua evapora e passa nell’aria'], correctIndex: 2, explanation: 'Con il calore, alcune molecole d’acqua passano dalla superficie liquida all’aria come vapore; vento e sole accelerano il processo.' },
  { question: 'Perché l’afa può farci sentire più caldo della temperatura indicata?', answers: ['Perché l’aria umida contiene più ossigeno', 'Perché il sudore evapora più difficilmente', 'Perché l’umidità aumenta sempre la temperatura reale'], correctIndex: 1, explanation: 'L’aria già umida rallenta l’evaporazione del sudore, che normalmente sottrae calore alla pelle.' },
  { question: 'Come può cadere la grandine anche in piena estate?', answers: ['Perché si forma soltanto durante le notti fredde', 'Perché arriva da nuvole provenienti dai poli', 'Perché nei temporali possono esserci zone molto fredde anche quando al suolo fa caldo'], correctIndex: 2, explanation: 'Le forti correnti ascensionali dei temporali portano le gocce in quota, dove l’acqua congela e può accumularsi in strati di ghiaccio.' },
  { question: 'Perché in Australia il Natale cade durante l’estate?', answers: ['Perché lì il Sole è più vicino alla Terra', 'Perché dicembre è il mese più caldo ovunque', 'Perché l’Australia si trova nell’emisfero australe, dove le stagioni sono opposte'], correctIndex: 2, explanation: 'L’inclinazione dell’asse terrestre fa sì che, quando l’emisfero australe è inclinato verso il Sole, lì sia estate e nell’emisfero boreale inverno.' },
  { question: 'Perché vediamo il nostro respiro nelle giornate fredde?', answers: ['Perché il freddo colora l’aria', 'Perché il corpo produce fumo', 'Perché il vapore acqueo del respiro si raffredda e forma minuscole gocce'], correctIndex: 2, explanation: 'L’aria calda e umida espirata si raffredda rapidamente e parte del vapore condensa in goccioline visibili.' },
  { question: 'Come può formarsi la rugiada sull’erba anche se non è piovuto?', answers: ['Perché le piante producono acqua durante la notte', 'Perché l’umidità cade sempre dal cielo', 'Perché il vapore acqueo dell’aria si condensa sulle superfici fredde'], correctIndex: 2, explanation: 'Durante la notte l’erba si raffredda; se la sua superficie scende al punto di rugiada, il vapore dell’aria condensa in acqua.' },
  { question: 'Perché in montagna può nevicare mentre in pianura piove?', answers: ['Perché le nuvole cambiano tipo passando sopra le montagne', 'Perché in pianura piove sempre più forte', 'Perché in montagna la temperatura può essere molto più bassa'], correctIndex: 2, explanation: 'Con l’altitudine la temperatura spesso diminuisce: la precipitazione può restare neve in quota e diventare pioggia nell’aria più mite in pianura.' },
  { question: 'Quale superficie tende ad assorbire più energia solare e a scaldarsi maggiormente?', answers: ['La neve fresca', 'L’asfalto scuro', 'La sabbia bianca'], correctIndex: 1, explanation: 'L’asfalto scuro riflette meno luce rispetto a superfici chiare e ne assorbe di più, trasformandola in calore.' },
  { question: 'Se il bollettino annuncia 10 mm di pioggia, che cosa significa?', answers: ['Che le gocce avranno un diametro di 10 mm', 'Che pioverà per 10 minuti', 'Che l’acqua raggiungerebbe un’altezza di 10 mm su una superficie piana, senza perdite'], correctIndex: 2, explanation: 'Il millimetro misura l’altezza dello strato d’acqua: 10 mm equivalgono a 10 litri per metro quadrato, se non ci sono infiltrazioni o ruscellamento.' },
  { question: 'Quanto può diventare grande una nube temporalesca?', answers: ['Non più grande di una collina', 'Al massimo quanto un palazzo', 'Può svilupparsi in altezza fino a raggiungere dimensioni paragonabili a una montagna'], correctIndex: 2, explanation: 'Le nubi temporalesche possono crescere verticalmente per molti chilometri, fino alla tropopausa, raggiungendo altezze paragonabili a quelle delle montagne.' },
  { question: 'Che cos’è la nebbia?', answers: ['Fumo prodotto dal terreno', 'Pioggia che non riesce a cadere', 'Una nube che si trova a contatto con il suolo o molto vicino ad esso'], correctIndex: 2, explanation: 'La nebbia è formata da minuscole gocce sospese nell’aria, come una nube, ma vicino o a contatto con il terreno.' },
  { question: 'Perché l’erba può essere bagnata al mattino dopo una notte serena?', answers: ['Perché le piante assorbono la pioggia dall’aria', 'Perché l’umidità si trasforma direttamente in ghiaccio', 'Perché il vapore acqueo si condensa sulle superfici raffreddate durante la notte'], correctIndex: 2, explanation: 'Nelle notti serene il terreno perde calore per irraggiamento; l’erba si raffredda e il vapore condensa sulla sua superficie.' },
  { question: 'Le gocce di pioggia hanno davvero la forma di una lacrima?', answers: ['Sì, tutte le gocce hanno la punta rivolta verso l’alto', 'Sì, ma soltanto quando piove forte', 'No, le gocce piccole sono quasi sferiche, mentre quelle più grandi possono appiattirsi'], correctIndex: 2, explanation: 'La tensione superficiale mantiene quasi sferiche le gocce piccole. Nelle più grandi la resistenza dell’aria le appiattisce mentre cadono.' },
]

export function shuffleQuizAnswers(question: QuizQuestion, random: () => number = Math.random): QuizQuestion {
  const answers = [...question.answers]
  for (let index = answers.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[answers[index], answers[target]] = [answers[target], answers[index]]
  }
  return {
    ...question,
    answers: answers as QuizQuestion['answers'],
    correctIndex: answers.indexOf(question.answers[question.correctIndex]),
  }
}

export function getQuizAnswerFeedback(question: QuizQuestion, answerIndex: number) {
  return {
    isCorrect: answerIndex === question.correctIndex,
    correctAnswer: question.answers[question.correctIndex],
    explanation: question.explanation,
  }
}

export function drawQuizQuestions(random: () => number = Math.random): QuizQuestion[] {
  const pool = [...quizQuestions]
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1))
    ;[pool[index], pool[target]] = [pool[target], pool[index]]
  }
  return pool.slice(0, 10).map(question => shuffleQuizAnswers(question, random))
}
