import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Map, Lock, CheckCircle2, ArrowRight, BookOpen,
  Clock, Zap, Target, ExternalLink, Video, FileText, Play, Trash2
} from 'lucide-react'
import { useState } from 'react'
import api, { getErrorMessage } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { cn, formatDuration } from '@/lib/utils'
import type { Roadmap, Skill, Topic, Lesson, LearningResource } from '@/types'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'

const resourceIcon = (type: LearningResource['type']) => {
  if (type === 'video') return Video
  if (type === 'article' || type === 'documentation') return FileText
  if (type === 'course') return Play
  return ExternalLink
}

const resourceColor = (type: LearningResource['type']) => {
  if (type === 'video') return 'text-red-500 bg-red-50 dark:bg-red-500/10'
  if (type === 'article' || type === 'documentation') return 'text-blue-500 bg-blue-50 dark:bg-blue-500/10'
  return 'text-slate-500 bg-slate-100 dark:bg-slate-700'
}

interface FlatLesson {
  lesson: Lesson
  topic: Topic
  skill: Skill
  globalOrder: number
}

function flattenLessons(skills: Skill[]): FlatLesson[] {
  const result: FlatLesson[] = []
  let order = 1
  for (const skill of [...skills].sort((a, b) => a.order - b.order)) {
    for (const topic of [...(skill.topics ?? [])].sort((a, b) => a.order - b.order)) {
      for (const lesson of [...(topic.lessons ?? [])].sort((a, b) => a.order - b.order)) {
        result.push({ lesson, topic, skill, globalOrder: order++ })
      }
    }
  }
  return result
}

function ResourcePill({ resource }: { resource: LearningResource }) {
  const Icon = resourceIcon(resource.type)
  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-opacity', resourceColor(resource.type))}
      onClick={e => e.stopPropagation()}
    >
      <Icon className="w-3 h-3" />
      {resource.source ?? resource.title.slice(0, 24)}
      {resource.title.length > 24 && !resource.source ? '…' : ''}
    </a>
  )
}

function LessonStep({ item, isLast }: { item: FlatLesson; isLast: boolean }) {
  const navigate = useNavigate()
  const { lesson, topic, skill, globalOrder } = item
  const isCompleted = lesson.status === 'completed'
  const isCurrent = lesson.status === 'available' || lesson.status === 'in_progress'
  const isLocked = lesson.status === 'locked'

  return (
    <div className="flex gap-4">
      {/* Timeline line + circle */}
      <div className="flex flex-col items-center">
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold z-10',
          isCompleted ? 'bg-success text-white' :
          isCurrent ? 'bg-primary text-white ring-4 ring-primary/20' :
          'bg-slate-100 dark:bg-slate-700 text-slate-400'
        )}>
          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
           isLocked ? <Lock className="w-3.5 h-3.5" /> :
           globalOrder}
        </div>
        {!isLast && (
          <div className={cn('w-0.5 flex-1 mt-1', isCompleted ? 'bg-success/40' : 'bg-slate-100 dark:bg-slate-700')} style={{ minHeight: '2rem' }} />
        )}
      </div>

      {/* Card */}
      <div className={cn(
        'flex-1 mb-4 rounded-2xl border transition-all',
        isCompleted ? 'border-success/20 bg-success/5' :
        isCurrent ? 'border-primary/30 bg-primary/5 shadow-sm' :
        'border-slate-100 dark:border-slate-700 opacity-60'
      )}>
        <div className="p-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-muted mb-2">
            <span>{skill.name}</span>
            <span>›</span>
            <span>{topic.name}</span>
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className={cn(
                'font-semibold text-sm',
                isCompleted ? 'line-through text-muted' : 'text-slate-900 dark:text-white'
              )}>
                {lesson.title}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-muted flex items-center gap-1">
                  <Clock className="w-3 h-3" />{formatDuration(lesson.estimated_minutes)}
                </span>
                <span className="text-xs text-amber-500 flex items-center gap-1">
                  <Zap className="w-3 h-3" />+{lesson.xp_reward} XP
                </span>
                {isCompleted && (
                  <span className="text-xs text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />Done
                  </span>
                )}
                {isCurrent && (
                  <span className="badge badge-primary text-xs">Current</span>
                )}
              </div>
            </div>

            {isCurrent && (
              <button
                onClick={() => navigate(`/lessons/${lesson.id}`)}
                className="btn-primary text-sm shrink-0"
              >
                <BookOpen className="w-4 h-4" />
                Start
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Resources */}
          {(lesson.resources?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {lesson.resources!.map(r => (
                <ResourcePill key={r.id} resource={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const navigate = useNavigate()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data, isLoading } = useQuery<{ roadmap: Roadmap | null; needs_onboarding?: boolean }>({
    queryKey: ['roadmap', 'active'],
    queryFn: () => api.get('/roadmaps/active').then(r => r.data),
    refetchOnMount: 'always',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roadmaps/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      navigate('/dashboard')
    },
    onError: e => setDeleteError(getErrorMessage(e)),
  })

  if (isLoading) {
    return <div className="flex justify-center py-16"><Spinner size="lg" /></div>
  }

  if (!data?.roadmap || data.needs_onboarding) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <Map className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No Active Roadmap</h2>
        <p className="text-muted mb-6">Create your personalized learning roadmap to get started.</p>
        <button onClick={() => navigate('/onboarding')} className="btn-primary">
          <Target className="w-4 h-4" />
          Create Roadmap
        </button>
      </div>
    )
  }

  const roadmap = data.roadmap
  const flatLessons = flattenLessons(roadmap.skills ?? [])
  const completedCount = flatLessons.filter(fl => fl.lesson.status === 'completed').length
  const totalCount = flatLessons.length

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header card */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="card p-6 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <span className="badge badge-primary mb-2">Active Roadmap</span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{roadmap.title}</h1>
              <p className="text-muted text-sm">{roadmap.goal}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold text-primary">{roadmap.progress_percentage.toFixed(1)}%</div>
              <div className="text-xs text-muted">Complete</div>
            </div>
          </div>

          <div className="progress-bar mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${roadmap.progress_percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className="progress-fill"
            />
          </div>
          <div className="flex justify-between text-xs text-muted mb-4">
            <span>{completedCount} of {totalCount} lessons completed</span>
            <span>{(roadmap.skills?.length ?? 0)} skills</span>
          </div>

          {/* Delete button */}
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 text-xs text-danger hover:text-danger/80 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete this roadmap
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-danger/10 border border-danger/30 rounded-xl"
              >
                <p className="text-sm text-danger font-medium mb-2">Delete this roadmap and all progress?</p>
                {deleteError && <Alert message={deleteError} onClose={() => setDeleteError(null)} className="mb-2" />}
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteMutation.mutate(roadmap.id)}
                    disabled={deleteMutation.isPending}
                    className="btn-danger text-sm"
                  >
                    {deleteMutation.isPending ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Yes, delete
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="btn-secondary text-sm">
                    Cancel
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Sequential timeline */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Map className="w-4 h-4 text-primary" />
          Learning Timeline
        </h2>

        <div className="pl-2">
          {flatLessons.map((item, i) => (
            <motion.div
              key={item.lesson.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
            >
              <LessonStep item={item} isLast={i === flatLessons.length - 1} />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
