import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, Brain, Zap, Flame, CheckCircle2, BarChart3, Trash2, Plus } from 'lucide-react'
import { useState } from 'react'
import api, { getErrorMessage } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { useAuth } from '@/contexts/AuthContext'
import { getLevelName, formatDate } from '@/lib/utils'
import type { DashboardData } from '@/types'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'

export default function ProgressPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchOnMount: 'always',
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/roadmaps/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['roadmap'] })
      setConfirmDelete(false)
    },
    onError: e => setDeleteError(getErrorMessage(e)),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const profile = user?.profile
  const weeklyStats = data?.weekly_stats ?? []
  const maxCompleted = Math.max(...weeklyStats.map(w => w.completed), 1)

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-primary" />
        Your Progress
      </h1>

      {/* Key stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Zap, label: 'Total XP', value: profile?.xp_points?.toLocaleString() ?? '0', color: 'text-primary bg-primary/10' },
          { icon: Brain, label: `Level ${profile?.level}`, value: getLevelName(profile?.level ?? 1), color: 'text-amber-500 bg-amber-100 dark:bg-amber-500/10' },
          { icon: Flame, label: 'Streak', value: `${profile?.streak_days ?? 0} days`, color: 'text-orange-500 bg-orange-100 dark:bg-orange-500/10' },
          { icon: CheckCircle2, label: 'Lessons Done', value: profile?.total_lessons_completed ?? 0, color: 'text-success bg-success/10' },
        ].map(({ icon: Icon, label, value, color }) => (
          <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white">{value}</div>
            <div className="text-sm text-muted">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Level progress */}
      {data?.level_progress && profile && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Level {profile.level} → Level {profile.level + 1}
            </h3>
            <span className="text-sm text-muted">
              {data.level_progress.current}/{data.level_progress.required} XP
            </span>
          </div>
          <div className="progress-bar mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.level_progress.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
              className="progress-fill"
            />
          </div>
          <p className="text-xs text-muted">{data.level_progress.percentage}% to next level</p>
        </div>
      )}

      {/* Active roadmap progress + delete */}
      {data?.active_roadmap ? (
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{data.active_roadmap.title}</h3>
              <p className="text-sm text-muted">{data.active_roadmap.goal}</p>
            </div>
            <button
              onClick={() => navigate('/roadmap')}
              className="btn-secondary text-sm shrink-0"
            >
              View
            </button>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 progress-bar">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${data.active_roadmap.progress_percentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="progress-fill"
              />
            </div>
            <span className="text-sm font-bold text-primary shrink-0">
              {data.active_roadmap.progress_percentage.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm text-muted">
              <span>{data.active_roadmap.completed_lessons} lessons done</span>
              <span>{data.active_roadmap.total_lessons} total</span>
            </div>

            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 text-xs text-danger hover:opacity-80 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete project
              </button>
            ) : null}
          </div>

          {/* Confirm delete */}
          <AnimatePresence>
            {confirmDelete && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl"
              >
                <p className="text-sm text-danger font-medium mb-2">
                  Delete this roadmap and all progress? This cannot be undone.
                </p>
                {deleteError && <Alert message={deleteError} onClose={() => setDeleteError(null)} className="mb-2" />}
                <div className="flex gap-2">
                  <button
                    onClick={() => deleteMutation.mutate(data.active_roadmap!.id)}
                    disabled={deleteMutation.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-danger text-white text-sm rounded-lg hover:bg-danger/90 disabled:opacity-50 transition-colors"
                  >
                    {deleteMutation.isPending ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="card p-6 text-center">
          <p className="text-muted text-sm mb-3">No active roadmap. Ready to start a new learning journey?</p>
          <button onClick={() => navigate('/onboarding')} className="btn-primary">
            <Plus className="w-4 h-4" />
            Create Roadmap
          </button>
        </div>
      )}

      {/* Weekly activity */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Last 7 Days Activity
        </h3>
        {weeklyStats.length === 0 ? (
          <div className="text-center py-8 text-muted text-sm">No activity yet — start learning!</div>
        ) : (
          <div className="flex items-end gap-2 h-40">
            {weeklyStats.map((day) => {
              const height = maxCompleted > 0 ? (day.completed / maxCompleted) * 100 : 0
              const date = new Date(day.scheduled_date)
              const label = date.toLocaleDateString('en', { weekday: 'short' })
              return (
                <div key={day.scheduled_date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="flex-1 flex items-end w-full">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 4)}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                      className="w-full bg-primary/20 hover:bg-primary/30 rounded-t-lg transition-colors relative group"
                    >
                      {day.completed > 0 && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          {day.completed}
                        </div>
                      )}
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all"
                        style={{ height: `${day.total > 0 ? (day.completed / day.total) * 100 : 0}%` }}
                      />
                    </motion.div>
                  </div>
                  <span className="text-xs text-muted">{label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats overview */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Stats Overview</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            { label: 'Quizzes Passed', value: profile?.total_quizzes_passed ?? 0 },
            { label: 'Projects Completed', value: profile?.total_projects_completed ?? 0 },
            { label: 'Daily Goal', value: `${profile?.daily_goal_minutes ?? 60} min/day` },
            { label: 'Member Since', value: formatDate(user?.created_at) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-700/50 last:border-b-0">
              <span className="text-muted">{label}</span>
              <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
