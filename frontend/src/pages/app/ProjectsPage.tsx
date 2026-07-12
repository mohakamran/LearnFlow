import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { FolderOpen, Clock, Zap, ExternalLink, Brain, CheckCircle2, Send } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import { cn } from '@/lib/utils'
import type { Project } from '@/types'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'

const statusColors: Record<string, string> = {
  pending: 'bg-slate-100 text-slate-500',
  in_progress: 'badge-primary',
  submitted: 'badge-warning',
  reviewed: 'badge-warning',
  completed: 'badge-success',
}

export default function ProjectsPage() {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [submissionUrl, setSubmissionUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ roadmap: { projects: Project[] } | null }>({
    queryKey: ['roadmap', 'projects'],
    queryFn: () => api.get('/roadmaps/active').then(r => r.data),
    refetchOnMount: 'always',
  })

  const reviewMutation = useMutation({
    mutationFn: (projectId: string) => api.post(`/ai/review-project/${projectId}`, {
      submission_url: submissionUrl,
      notes,
    }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roadmap', 'projects'] })
      setSelectedProject(null)
      setSubmissionUrl('')
      setNotes('')
      setError(null)
    },
    onError: (e) => setError(getErrorMessage(e)),
  })

  const projects = data?.roadmap?.projects ?? []

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-primary" />
          Projects
        </h1>
        <p className="text-muted text-sm">Build real-world projects to solidify your learning</p>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-primary/30 mx-auto mb-4" />
          <p className="text-muted">Projects will appear here as you progress through your roadmap</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project, i) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <span className={cn('badge text-xs', statusColors[project.status] ?? 'bg-slate-100 text-slate-500')}>
                  {project.status === 'in_progress' ? 'In Progress' :
                   project.status === 'completed' ? '✓ Completed' :
                   project.status}
                </span>
                <span className={cn('badge text-xs', {
                  'badge-success': project.difficulty === 'beginner',
                  'badge-warning': project.difficulty === 'intermediate',
                  'badge-danger': project.difficulty === 'advanced',
                })}>
                  {project.difficulty}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white mb-2">{project.title}</h3>
              <p className="text-sm text-muted mb-3 line-clamp-2">{project.description}</p>

              {project.technologies?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {project.technologies.slice(0, 4).map(tech => (
                    <span key={tech} className="px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300">
                      {tech}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted mb-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{project.estimated_hours}h</span>
                <span className="flex items-center gap-1 text-amber-500"><Zap className="w-3 h-3" />{project.xp_reward} XP</span>
              </div>

              {project.ai_feedback && (
                <div className="mb-3 p-3 bg-success/5 border border-success/20 rounded-xl text-xs">
                  <p className="font-medium text-success mb-1">AI Score: {project.score}/100</p>
                  {Array.isArray((project.ai_feedback as {strengths?: string[]}).strengths) && (
                    <ul className="text-muted space-y-0.5">
                      {((project.ai_feedback as {strengths: string[]}).strengths).slice(0, 2).map((s, i) => (
                        <li key={i}>✓ {s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {project.status !== 'completed' && (
                <button
                  onClick={() => setSelectedProject(project)}
                  className="btn-primary w-full text-sm"
                >
                  <Send className="w-4 h-4" />
                  Submit for AI Review
                </button>
              )}

              {project.status === 'completed' && (
                <div className="flex items-center gap-2 text-success text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" />
                  Project Completed!
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Submit modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 w-full max-w-lg"
          >
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">Submit Project</h3>
            <p className="text-sm text-muted mb-4">{selectedProject.title}</p>

            <div className="space-y-4">
              <div>
                <label className="label">Project URL *</label>
                <input
                  value={submissionUrl}
                  onChange={e => setSubmissionUrl(e.target.value)}
                  className="input"
                  type="url"
                  placeholder="https://github.com/your-username/project"
                />
              </div>
              <div>
                <label className="label">Notes for reviewer (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input min-h-[80px] resize-none"
                  placeholder="Any context about your implementation..."
                />
              </div>

              {error && <Alert message={error} onClose={() => setError(null)} />}

              <div className="flex gap-3">
                <button onClick={() => { setSelectedProject(null); setError(null) }} className="btn-secondary flex-1">
                  Cancel
                </button>
                <button
                  onClick={() => reviewMutation.mutate(selectedProject.id)}
                  disabled={!submissionUrl || reviewMutation.isPending}
                  className="btn-primary flex-1"
                >
                  {reviewMutation.isPending ? <Spinner size="sm" /> : <Brain className="w-4 h-4" />}
                  {reviewMutation.isPending ? 'AI Reviewing...' : 'Submit & Get AI Review'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
