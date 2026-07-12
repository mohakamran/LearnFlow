import { useQuery, useMutation } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BookOpen, CheckCircle2, ExternalLink, Video, FileText,
  ArrowLeft, Zap, Clock, Brain, ChevronRight, Play, Lock
} from 'lucide-react'
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { cn, formatDuration } from '@/lib/utils'
import type { Lesson, LearningResource } from '@/types'
import Spinner from '@/components/ui/Spinner'

const resourceConfig: Record<string, { icon: typeof Video; color: string; bg: string }> = {
  video:         { icon: Video,       color: 'text-red-500',   bg: 'bg-red-50 dark:bg-red-500/10' },
  article:       { icon: FileText,    color: 'text-blue-500',  bg: 'bg-blue-50 dark:bg-blue-500/10' },
  documentation: { icon: BookOpen,    color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-500/10' },
  course:        { icon: Play,        color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
  book:          { icon: BookOpen,    color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
}

function ResourceCard({ resource, index }: { resource: LearningResource; index: number }) {
  const cfg = resourceConfig[resource.type] ?? { icon: ExternalLink, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' }
  const Icon = cfg.icon
  return (
    <motion.a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-start gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-primary/30 hover:bg-primary/5 transition-all group"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', cfg.bg, cfg.color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-slate-900 dark:text-white group-hover:text-primary transition-colors">
          {resource.title}
        </p>
        {resource.description && (
          <p className="text-xs text-muted mt-0.5 line-clamp-2">{resource.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {resource.source && (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{resource.source}</span>
          )}
          <span className={cn('text-xs font-medium capitalize', cfg.color)}>{resource.type}</span>
          {resource.is_free && <span className="text-xs text-success font-medium">Free</span>}
          {resource.duration_minutes && (
            <span className="text-xs text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" />{formatDuration(resource.duration_minutes)}
            </span>
          )}
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary shrink-0 mt-0.5 transition-colors" />
    </motion.a>
  )
}

export default function LessonPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [explanation, setExplanation] = useState<string | null>(null)
  const [xpEarned, setXpEarned] = useState<number | null>(null)

  const { data, isLoading } = useQuery<{ lesson: Lesson }>({
    queryKey: ['lesson', id],
    queryFn: () => api.get(`/lessons/${id}`).then(r => r.data),
  })

  const completeMutation = useMutation({
    mutationFn: () => api.post(`/lessons/${id}/complete`),
    onSuccess: (res) => {
      setXpEarned(res.data.xp_earned)
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
      queryClient.invalidateQueries({ queryKey: ['lesson', id] })
    },
  })

  const explainMutation = useMutation({
    mutationFn: () => api.post(`/lessons/${id}/explain`).then(r => r.data),
    onSuccess: (data) => setExplanation(data.explanation),
  })

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  const lesson = data?.lesson
  if (!lesson) return null

  const isCompleted = !!lesson.completed_at
  const isLocked = lesson.status === 'locked'
  const resources: LearningResource[] = lesson.resources ?? []

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        {lesson.topic?.skill && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span>{lesson.topic.skill.name}</span>
            <ChevronRight className="w-3 h-3" />
            <span>{lesson.topic.name}</span>
          </>
        )}
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {isCompleted && (
              <span className="badge badge-success flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            )}
            {isLocked && (
              <span className="badge bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Locked
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{lesson.title}</h1>
          {lesson.description && <p className="text-muted text-sm mb-3">{lesson.description}</p>}

          <div className="flex items-center gap-4">
            <span className="text-xs text-muted flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />{formatDuration(lesson.estimated_minutes)}
            </span>
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />+{lesson.xp_reward} XP
            </span>
            {resources.length > 0 && (
              <span className="text-xs text-muted">{resources.length} resource{resources.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {xpEarned !== null && xpEarned > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl border border-primary/20 text-center"
            >
              <div className="text-2xl mb-1">🎉</div>
              <p className="font-semibold text-primary">Lesson complete! +{xpEarned} XP earned!</p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Learning objectives */}
      {lesson.topic?.learning_objectives && (
        <div className="card p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Learning Objectives</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300">{lesson.topic.learning_objectives}</p>
        </div>
      )}

      {/* Resources — the core learning material */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Study Materials
        </h2>

        {resources.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No resources for this lesson yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((resource, i) => (
              <ResourceCard key={resource.id} resource={resource} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* AI explain */}
      <div className="card p-5">
        <h2 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-primary" />
          Need a quick explanation?
        </h2>
        <p className="text-xs text-muted mb-3">Ask the AI to summarize this topic before you dive in.</p>
        <button
          onClick={() => explainMutation.mutate()}
          disabled={explainMutation.isPending}
          className="btn-secondary text-sm"
        >
          {explainMutation.isPending ? <Spinner size="sm" /> : <Brain className="w-4 h-4" />}
          {explainMutation.isPending ? 'Thinking...' : 'Explain this topic'}
        </button>

        {explanation && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10 text-sm prose-custom"
          >
            <ReactMarkdown>{explanation}</ReactMarkdown>
          </motion.div>
        )}
      </div>

      {/* Complete button */}
      {!isLocked && !isCompleted && (
        <button
          onClick={() => completeMutation.mutate()}
          disabled={completeMutation.isPending}
          className="btn-primary w-full py-3 text-base"
        >
          {completeMutation.isPending ? <Spinner size="sm" /> : <CheckCircle2 className="w-5 h-5" />}
          {completeMutation.isPending ? 'Saving...' : "I've finished — Mark as Complete"}
        </button>
      )}

      {isCompleted && (
        <button onClick={() => navigate(-1)} className="btn-secondary w-full py-3">
          <ArrowLeft className="w-4 h-4" />
          Back to Roadmap
        </button>
      )}
    </div>
  )
}
