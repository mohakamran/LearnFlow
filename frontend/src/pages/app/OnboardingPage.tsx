import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, ArrowRight, ArrowLeft, Target, Clock, Globe, BookOpen, Zap } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import { cn } from '@/lib/utils'

const schema = z.object({
  goal: z.string().min(5, 'Please describe what you want to learn').max(200),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced']),
  daily_hours: z.coerce.number().min(0.5).max(12),
  preferred_language: z.string().min(1),
  learning_style: z.enum(['visual', 'reading', 'hands_on', 'mixed']),
  deadline: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const steps = [
  { id: 'goal', title: 'What do you want to learn?', icon: Target },
  { id: 'experience', title: 'Your experience level', icon: BookOpen },
  { id: 'schedule', title: 'Your learning schedule', icon: Clock },
  { id: 'style', title: 'How do you learn best?', icon: Zap },
]

const goalSuggestions = [
  'Become a Full-Stack Developer',
  'Learn Machine Learning & AI',
  'Master React & TypeScript',
  'Build iOS Apps with Swift',
  'Learn Data Science with Python',
  'Become a DevOps Engineer',
  'Master UI/UX Design',
  'Learn Cybersecurity',
]

const languages = [
  'English', 'Spanish', 'French', 'German', 'Portuguese',
  'Chinese', 'Japanese', 'Arabic', 'Hindi', 'Russian',
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      experience_level: 'beginner',
      daily_hours: 1,
      preferred_language: 'English',
      learning_style: 'mixed',
    },
  })

  const generateMutation = useMutation({
    mutationFn: (data: FormData) => api.post('/roadmaps/generate', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
      navigate('/roadmap')
    },
    onError: (e) => setError(getErrorMessage(e)),
  })

  const onSubmit = (data: FormData) => {
    setError(null)
    generateMutation.mutate(data)
  }

  const goal = watch('goal')
  const experienceLevel = watch('experience_level')
  const learningStyle = watch('learning_style')

  return (
    <div className="min-h-screen bg-background dark:bg-dark-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI Roadmap Generator</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Let's build your learning path
          </h1>
          <p className="text-muted mt-2">Answer a few questions and your AI mentor will create a personalized roadmap</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex-1">
              <div className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                i <= step ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
              )} />
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 0: Goal */}
            {step === 0 && (
              <motion.div
                key="goal"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-6 space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                    What do you want to become or learn?
                  </h2>
                  <p className="text-sm text-muted">Be specific — the more detail, the better your roadmap</p>
                </div>

                <div>
                  <textarea
                    {...register('goal')}
                    className="input min-h-[100px] resize-none"
                    placeholder="e.g., I want to become a Full-Stack Developer using React and Node.js"
                  />
                  {errors.goal && <p className="mt-1 text-xs text-danger">{errors.goal.message}</p>}
                </div>

                <div>
                  <p className="text-xs font-medium text-muted mb-3 uppercase tracking-wide">Popular goals</p>
                  <div className="flex flex-wrap gap-2">
                    {goalSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setValue('goal', s)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-sm transition-all border',
                          goal === s
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-primary hover:text-primary'
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1: Experience */}
            {step === 1 && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-6 space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">What's your experience level?</h2>
                  <p className="text-sm text-muted">With {goal || 'this topic'}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'beginner', label: 'Beginner', desc: 'Just starting out', emoji: '🌱' },
                    { value: 'intermediate', label: 'Intermediate', desc: 'Some experience', emoji: '🌿' },
                    { value: 'advanced', label: 'Advanced', desc: 'Deep knowledge', emoji: '🌳' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('experience_level', opt.value as 'beginner' | 'intermediate' | 'advanced')}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        experienceLevel === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                      )}
                    >
                      <div className="text-2xl mb-2">{opt.emoji}</div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{opt.label}</div>
                      <div className="text-xs text-muted mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="label">Preferred Learning Language</label>
                  <select {...register('preferred_language')} className="input">
                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">Target Deadline (optional)</label>
                  <input
                    {...register('deadline')}
                    type="date"
                    className="input"
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Schedule */}
            {step === 2 && (
              <motion.div
                key="schedule"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-6 space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">How much time can you dedicate?</h2>
                  <p className="text-sm text-muted">Daily average — be realistic for consistency</p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { hours: 0.5, label: '30 min' },
                    { hours: 1, label: '1 hour' },
                    { hours: 2, label: '2 hours' },
                    { hours: 4, label: '4+ hours' },
                  ].map((opt) => (
                    <button
                      key={opt.hours}
                      type="button"
                      onClick={() => setValue('daily_hours', opt.hours)}
                      className={cn(
                        'p-4 rounded-xl border-2 text-center transition-all',
                        watch('daily_hours') === opt.hours
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                      )}
                    >
                      <div className="font-bold text-lg text-slate-900 dark:text-white">{opt.label}</div>
                      <div className="text-xs text-muted">per day</div>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="label">Custom hours per day</label>
                  <div className="flex items-center gap-3">
                    <input
                      {...register('daily_hours')}
                      type="number"
                      min="0.5"
                      max="12"
                      step="0.5"
                      className="input w-32"
                    />
                    <span className="text-sm text-muted">hours / day</span>
                  </div>
                  {errors.daily_hours && <p className="mt-1 text-xs text-danger">{errors.daily_hours.message}</p>}
                </div>
              </motion.div>
            )}

            {/* Step 3: Learning Style */}
            {step === 3 && (
              <motion.div
                key="style"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="card p-6 space-y-5"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">How do you learn best?</h2>
                  <p className="text-sm text-muted">Your AI mentor will adapt to your style</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'visual', label: 'Visual', desc: 'Videos, diagrams, infographics', emoji: '🎥' },
                    { value: 'reading', label: 'Reading', desc: 'Articles, docs, books', emoji: '📚' },
                    { value: 'hands_on', label: 'Hands-on', desc: 'Coding, projects, practice', emoji: '🛠️' },
                    { value: 'mixed', label: 'Mixed', desc: 'A bit of everything', emoji: '🎯' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue('learning_style', opt.value as 'visual' | 'reading' | 'hands_on' | 'mixed')}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        learningStyle === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 dark:border-slate-600 hover:border-primary/50'
                      )}
                    >
                      <div className="text-2xl mb-2">{opt.emoji}</div>
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{opt.label}</div>
                      <div className="text-xs text-muted mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* Error and loading — always visible below the step card */}
          {error && (
            <div className="mt-4">
              <Alert message={error} onClose={() => setError(null)} />
            </div>
          )}

          {generateMutation.isPending && (
            <div className="mt-4 card p-5 text-center">
              <Spinner size="lg" className="mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Building your personalized roadmap...
              </p>
              <p className="text-xs text-muted mt-1">This takes about 20–40 seconds</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={step === 0}
              className="btn-secondary disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="btn-primary"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="btn-primary"
              >
                {generateMutation.isPending ? <Spinner size="sm" /> : <Sparkles className="w-4 h-4" />}
                {generateMutation.isPending ? 'Generating...' : 'Generate My Roadmap'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
