import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { Brain, Clock, CheckCircle2, XCircle, Trophy, ArrowRight, ArrowLeft } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { Quiz, QuizQuestion } from '@/types'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'

interface QuizResult {
  score: number
  total_points: number
  percentage: number
  passed: boolean
  passing_score: number
  xp_earned: number
  answers: Record<number, { answer: number | string; correct: boolean; correct_answer: number | string; explanation: string }>
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'preview' | 'quiz' | 'result'>('preview')
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<number, number | string>>({})
  const [currentQ, setCurrentQ] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [result, setResult] = useState<QuizResult | null>(null)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data, isLoading } = useQuery<{ quiz: Quiz }>({
    queryKey: ['quiz', id],
    queryFn: () => api.get(`/quizzes/${id}`).then(r => r.data),
  })

  const startMutation = useMutation({
    mutationFn: () => api.post(`/quizzes/${id}/start`).then(r => r.data),
    onSuccess: (data) => {
      setAttemptId(data.attempt_id)
      setStartedAt(Date.now())
      if (quiz?.time_limit_minutes) {
        setTimeLeft(quiz.time_limit_minutes * 60)
      }
      setPhase('quiz')
    },
    onError: (e) => setError(getErrorMessage(e)),
  })

  const submitMutation = useMutation({
    mutationFn: () => api.post(`/quizzes/${id}/submit`, {
      attempt_id: attemptId,
      answers,
      time_taken_seconds: startedAt ? Math.round((Date.now() - startedAt) / 1000) : null,
    }).then(r => r.data),
    onSuccess: (data) => {
      setResult(data)
      setPhase('result')
      if (timerRef.current) clearInterval(timerRef.current)
    },
    onError: (e) => setError(getErrorMessage(e)),
  })

  useEffect(() => {
    if (timeLeft === null || phase !== 'quiz') return
    if (timeLeft <= 0) {
      submitMutation.mutate()
      return
    }
    timerRef.current = setInterval(() => setTimeLeft(t => (t ?? 0) - 1), 1000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timeLeft, phase])

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const quiz = data?.quiz
  if (!quiz) return null

  const questions = quiz.questions
  const currentQuestion = questions[currentQ]
  const answeredCount = Object.keys(answers).length

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (phase === 'preview') {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-8 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{quiz.title}</h1>
          {quiz.description && <p className="text-muted text-sm mb-6">{quiz.description}</p>}

          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            {[
              { label: 'Questions', value: quiz.questions_count },
              { label: 'Time Limit', value: quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : 'No limit' },
              { label: 'Passing Score', value: `${quiz.passing_score}%` },
              { label: 'Attempts Left', value: quiz.attempts_remaining },
            ].map(stat => (
              <div key={stat.label} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
                <div className="font-bold text-slate-900 dark:text-white">{stat.value}</div>
                <div className="text-muted text-xs">{stat.label}</div>
              </div>
            ))}
          </div>

          {quiz.best_score > 0 && (
            <p className="text-sm text-muted mb-4">Your best score: <span className="font-bold text-slate-900 dark:text-white">{quiz.best_score}%</span></p>
          )}

          {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}

          {!quiz.can_attempt ? (
            <div className="text-center text-muted">
              <p className="mb-4">You've used all your attempts for this quiz.</p>
              <button onClick={() => navigate(-1)} className="btn-secondary">Go Back</button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={() => navigate(-1)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="btn-primary flex-1"
              >
                {startMutation.isPending ? <Spinner size="sm" /> : <ArrowRight className="w-4 h-4" />}
                Start Quiz
              </button>
            </div>
          )}
        </motion.div>
      </div>
    )
  }

  if (phase === 'result' && result) {
    return (
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card p-8 text-center">
          <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
            result.passed ? 'bg-success/10' : 'bg-danger/10'
          )}>
            {result.passed
              ? <Trophy className="w-10 h-10 text-success" />
              : <XCircle className="w-10 h-10 text-danger" />
            }
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            {result.passed ? 'Quiz Passed! 🎉' : 'Not Quite Yet'}
          </h2>
          <p className="text-muted text-sm mb-6">
            {result.passed ? `Excellent work! You earned ${result.xp_earned} XP!` : `You need ${result.passing_score}% to pass. Keep practicing!`}
          </p>

          <div className="text-6xl font-bold mb-2">
            <span className={result.passed ? 'text-success' : 'text-danger'}>{result.percentage.toFixed(0)}%</span>
          </div>
          <p className="text-muted text-sm mb-8">{result.score}/{result.total_points} points</p>

          {/* Answer review */}
          <div className="space-y-3 text-left mb-6">
            {questions.map((q, i) => {
              const answerData = result.answers[q.id]
              if (!answerData) return null
              return (
                <div key={q.id} className={cn('p-3 rounded-xl border text-sm',
                  answerData.correct ? 'border-success/20 bg-success/5' : 'border-danger/20 bg-danger/5'
                )}>
                  <div className="flex items-start gap-2">
                    {answerData.correct
                      ? <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      : <XCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                    }
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{q.question}</p>
                      {!answerData.correct && answerData.explanation && (
                        <p className="text-muted mt-1 text-xs">{answerData.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex gap-3">
            <button onClick={() => navigate(-1)} className="btn-secondary flex-1">Back to Lesson</button>
            {!result.passed && quiz.attempts_remaining > 0 && (
              <button onClick={() => { setPhase('preview'); setAnswers({}); setCurrentQ(0) }} className="btn-primary flex-1">
                Try Again
              </button>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  // Quiz phase
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">Question {currentQ + 1} of {questions.length}</span>
        {timeLeft !== null && (
          <span className={cn('flex items-center gap-1.5 text-sm font-mono font-bold', timeLeft < 60 ? 'text-danger' : 'text-muted')}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </span>
        )}
        <span className="text-sm text-muted">{answeredCount}/{questions.length} answered</span>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="card p-6"
        >
          <p className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
            {currentQuestion?.question}
          </p>

          {currentQuestion?.type === 'multiple_choice' && currentQuestion.options && (
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setAnswers(a => ({ ...a, [currentQuestion.id]: idx }))}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all',
                    answers[currentQuestion.id] === idx
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary/50'
                  )}
                >
                  <span className="mr-3 w-6 h-6 inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {currentQuestion?.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-3">
              {['True', 'False'].map((opt, idx) => (
                <button
                  key={opt}
                  onClick={() => setAnswers(a => ({ ...a, [currentQuestion.id]: idx }))}
                  className={cn(
                    'py-4 rounded-xl border-2 font-semibold transition-all',
                    answers[currentQuestion.id] === idx
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary/50'
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQ(q => q - 1)}
          disabled={currentQ === 0}
          className="btn-secondary disabled:opacity-30"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {currentQ < questions.length - 1 ? (
          <button
            onClick={() => setCurrentQ(q => q + 1)}
            className="btn-primary"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || answeredCount < questions.length}
            className="btn-primary"
          >
            {submitMutation.isPending ? <Spinner size="sm" /> : <CheckCircle2 className="w-4 h-4" />}
            {submitMutation.isPending ? 'Submitting...' : `Submit (${answeredCount}/${questions.length})`}
          </button>
        )}
      </div>

      {error && <Alert message={error} onClose={() => setError(null)} />}
    </div>
  )
}
