import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen, CheckCircle2, Flame, Star, TrendingUp,
  ArrowRight, Clock, Zap, Target, Brain, Calendar, Plus
} from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { getGreeting, formatDuration, getLevelName } from '@/lib/utils'
import type { DashboardData } from '@/types'
import Spinner from '@/components/ui/Spinner'

function StatCard({ icon: Icon, label, value, color }: {
  icon: typeof BookOpen; label: string; value: string | number; color: string
}) {
  return (
    <div className="card p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">{value}</div>
      <div className="text-sm text-muted">{label}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data),
    refetchOnMount: 'always',
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data?.active_roadmap) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
            Ready to start learning?
          </h2>
          <p className="text-muted mb-8">
            Tell your AI mentor what you want to learn and get a personalized roadmap in seconds.
          </p>
          <button onClick={() => navigate('/onboarding')} className="btn-primary text-base px-6 py-3">
            <Plus className="w-5 h-5" />
            Create My Roadmap
          </button>
        </motion.div>
      </div>
    )
  }

  const stats = data.stats
  const profile = user?.profile
  const completionRate = stats.tasks_today.total > 0
    ? Math.round((stats.tasks_today.completed / stats.tasks_today.total) * 100)
    : 0

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-muted mt-1">
          {stats.tasks_today.completed > 0
            ? `You've completed ${stats.tasks_today.completed} of ${stats.tasks_today.total} tasks today. Keep it up!`
            : 'You have tasks waiting for you today.'}
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard icon={Flame} label="Day Streak" value={stats.streak_days} color="bg-orange-100 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400" />
        <StatCard icon={Zap} label="XP Points" value={stats.xp_points.toLocaleString()} color="bg-primary/10 text-primary" />
        <StatCard icon={BookOpen} label="Lessons Done" value={stats.total_lessons_completed} color="bg-success/10 text-success" />
        <StatCard icon={Star} label="Level" value={`${stats.level} · ${getLevelName(stats.level)}`} color="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" />
      </motion.div>

      {/* Level progress */}
      {data.level_progress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">Level {stats.level}</span>
              <span className="text-muted text-sm ml-2">{getLevelName(stats.level)}</span>
            </div>
            <span className="text-sm text-muted">
              {data.level_progress.current} / {data.level_progress.required} XP to Level {stats.level + 1}
            </span>
          </div>
          <div className="progress-bar">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${data.level_progress.percentage}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              className="progress-fill"
            />
          </div>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's tasks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="card">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Today's Tasks
                </h2>
                <p className="text-xs text-muted mt-0.5">{completionRate}% complete</p>
              </div>
              <div className="text-sm font-medium text-primary">
                {stats.tasks_today.completed}/{stats.tasks_today.total}
              </div>
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {data.today_tasks.length === 0 ? (
                <div className="p-8 text-center text-muted">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-success" />
                  <p className="text-sm">All done for today! Come back tomorrow.</p>
                </div>
              ) : (
                data.today_tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer"
                    onClick={() => task.lesson_id && navigate(`/lessons/${task.lesson_id}`)}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      task.status === 'completed'
                        ? 'bg-success/10 text-success'
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {task.status === 'completed'
                        ? <CheckCircle2 className="w-4 h-4" />
                        : <BookOpen className="w-4 h-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        task.status === 'completed'
                          ? 'line-through text-muted'
                          : 'text-slate-900 dark:text-white'
                      }`}>{task.title}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(task.estimated_minutes)}
                        </span>
                        <span className="text-xs text-amber-500 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          +{task.xp_reward} XP
                        </span>
                      </div>
                    </div>
                    {task.status !== 'completed' && (
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Current roadmap */}
          {data.active_roadmap && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Current Roadmap</h3>
                <button
                  onClick={() => navigate('/roadmap')}
                  className="text-xs text-primary hover:underline"
                >
                  View
                </button>
              </div>
              <p className="text-sm text-muted mb-3 truncate">{data.active_roadmap.goal}</p>
              <div className="progress-bar mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.active_roadmap.progress_percentage}%` }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="progress-fill"
                />
              </div>
              <div className="flex justify-between text-xs text-muted">
                <span>{data.active_roadmap.progress_percentage.toFixed(1)}% complete</span>
                <span>{data.active_roadmap.completed_lessons}/{data.active_roadmap.total_lessons} lessons</span>
              </div>
            </motion.div>
          )}

          {/* Continue learning */}
          {data.current_lesson && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card p-5 bg-gradient-to-br from-primary/5 to-secondary/5"
            >
              <p className="text-xs text-muted mb-1 uppercase tracking-wide font-medium">Continue Learning</p>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1 line-clamp-2">
                {data.current_lesson.title}
              </h3>
              <p className="text-xs text-muted mb-4">
                {data.current_lesson.topic?.name}
              </p>
              <button
                onClick={() => navigate(`/lessons/${data.current_lesson!.id}`)}
                className="btn-primary w-full text-sm"
              >
                <ArrowRight className="w-4 h-4" />
                Continue
              </button>
            </motion.div>
          )}

          {/* Reviews due */}
          {stats.due_reviews > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="card p-4 border-warning/30 bg-warning/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {stats.due_reviews} review{stats.due_reviews > 1 ? 's' : ''} due
                  </p>
                  <p className="text-xs text-muted">Spaced repetition</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
