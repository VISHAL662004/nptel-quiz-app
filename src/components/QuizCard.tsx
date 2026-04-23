import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Bookmark, BookmarkCheck, Flag } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuiz } from '../context/QuizContext'
import { formatDuration } from '../utils/quiz'

export function QuizCard() {
  const {
    currentQuestion,
    session,
    bookmarks,
    toggleBookmark,
    toggleFlag,
    answerQuestion,
    previousQuestion,
    nextQuestion,
    submitQuiz,
    resetQuiz,
    progress,
  } = useQuiz()
  const [autoAdvance, setAutoAdvance] = useState(false)
  const autoAdvanceTimer = useRef<number | null>(null)

  const question = currentQuestion
  const answer = question ? session.answers[question.id] : undefined
  const revealed = question ? session.revealed.includes(question.id) : false

  const instantState = useMemo(() => {
    if (!question || !answer || !revealed) {
      return null
    }
    return answer === question.correctAnswer ? 'correct' : 'incorrect'
  }, [answer, question, revealed])

  const isLast = session.index === session.questions.length - 1
  const canGoNextRapid = session.mode !== 'rapid' || Boolean(answer)

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        window.clearTimeout(autoAdvanceTimer.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!autoAdvance && autoAdvanceTimer.current) {
      window.clearTimeout(autoAdvanceTimer.current)
      autoAdvanceTimer.current = null
    }
  }, [autoAdvance])

  const handleOptionSelect = (optionKey: string) => {
    if (!question) {
      return
    }

    answerQuestion(question.id, optionKey)

    if (!autoAdvance || isLast) {
      return
    }

    const shouldAdvance =
      session.mode === 'standard' ||
      (session.mode === 'rapid' && optionKey === question.correctAnswer)

    if (!shouldAdvance) {
      return
    }

    if (autoAdvanceTimer.current) {
      window.clearTimeout(autoAdvanceTimer.current)
    }

    autoAdvanceTimer.current = window.setTimeout(() => {
      nextQuestion()
      autoAdvanceTimer.current = null
    }, 1000)
  }

  if (!question) {
    return (
      <section className="panel quiz-panel empty">
        <h2>No questions found for this combination</h2>
        <p>Adjust year/week/search filters or disable bookmarked-only mode.</p>
      </section>
    )
  }

  return (
    <section className="panel quiz-panel">
      <header className="quiz-header">
        <div>
          <p className="meta">
            {question.year} • Week {question.week} • Question {session.index + 1}/
            {session.questions.length}
          </p>
          <div className="bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="meta-actions">
          <span className="timer">{formatDuration(session.elapsedSeconds)}</span>
          <label className="auto-next-toggle" title="Auto move after 1 second">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(event) => setAutoAdvance(event.target.checked)}
            />
            <span>Auto Next</span>
          </label>
          <button onClick={() => toggleFlag(question.id)} className="ghost-btn">
            <Flag size={16} />
            {session.flagged.includes(question.id) ? 'Flagged' : 'Flag'}
          </button>
          <button onClick={() => toggleBookmark(question.id)} className="ghost-btn">
            {bookmarks.includes(question.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            Bookmark
          </button>
          <button onClick={resetQuiz} className="ghost-btn">
            Exit Quiz
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <h3>{question.prompt}</h3>
          <div className="options">
            {question.options.map((option) => {
              const isSelected = answer === option.key
              const isCorrect = option.key === question.correctAnswer
              const showCorrect = session.mode === 'rapid' && revealed && isCorrect
              const showWrong = session.mode === 'rapid' && revealed && isSelected && !isCorrect

              return (
                <button
                  key={`${question.id}-${option.key}`}
                  className={`option ${isSelected ? 'selected' : ''} ${showCorrect ? 'correct' : ''} ${showWrong ? 'wrong' : ''}`}
                  onClick={() => handleOptionSelect(option.key)}
                >
                  <span className="opt-key">{option.key.toUpperCase()}</span>
                  <span>{option.text}</span>
                </button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {session.mode === 'rapid' && revealed && (
        <div className={`feedback ${instantState === 'correct' ? 'ok' : 'bad'}`}>
          <AlertCircle size={18} />
          <span>
            {instantState === 'correct' ? 'Great hit.' : 'Not this one.'} Correct answer:{' '}
            <strong>
              {question.correctAnswer.toUpperCase()}. {question.correctText}
            </strong>
          </span>
        </div>
      )}

      {session.mode === 'rapid' && revealed && (
        <details className="solution-box" open>
          <summary>Detailed solution</summary>
          <p>{question.solution}</p>
        </details>
      )}

      <footer className="quiz-footer">
        <button className="ghost-btn" onClick={previousQuestion} disabled={session.index === 0}>
          Previous
        </button>
        {!isLast ? (
          <button className="action-btn" onClick={nextQuestion} disabled={!canGoNextRapid}>
            {session.mode === 'rapid' ? 'Next Shot' : 'Next'}
          </button>
        ) : (
          <button className="action-btn submit" onClick={submitQuiz}>
            Submit Quiz
          </button>
        )}
      </footer>
    </section>
  )
}
