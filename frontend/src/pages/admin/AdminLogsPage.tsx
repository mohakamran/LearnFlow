import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FileText, Search, Filter } from 'lucide-react'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'

const ACTION_COLORS: Record<string, string> = {
  login: 'bg-blue-100 text-blue-700',
  register: 'bg-green-100 text-green-700',
  logout: 'bg-slate-100 text-slate-600',
  roadmap_generated: 'bg-purple-100 text-purple-700',
  lesson_completed: 'bg-success/10 text-success',
  quiz_completed: 'bg-amber-100 text-amber-700',
  ai_chat: 'bg-indigo-100 text-indigo-700',
}

export default function AdminLogsPage() {
  const [search, setSearch] = useState('')
  const [action, setAction] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'logs', search, action],
    queryFn: () =>
      api.get('/admin/logs', {
        params: { search: search || undefined, action: action || undefined },
      }).then(r => r.data),
  })

  const logs = data?.data ?? []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <FileText className="w-6 h-6 text-primary" />
        Activity Logs
      </h1>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input pl-9"
            placeholder="Search by user or action..."
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="input pl-9 pr-8 appearance-none min-w-[160px]"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="register">Register</option>
            <option value="roadmap_generated">Roadmap Generated</option>
            <option value="lesson_completed">Lesson Completed</option>
            <option value="quiz_completed">Quiz Completed</option>
            <option value="ai_chat">AI Chat</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted text-sm">No logs found</div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700">
            {logs.map((log: {
              id: string
              action: string
              user?: { name: string; email: string }
              entity_type?: string
              entity_id?: string
              ip_address?: string
              created_at: string
            }) => {
              const colorClass = ACTION_COLORS[log.action] ?? 'bg-slate-100 text-slate-600'
              return (
                <div key={log.id} className="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 flex items-center gap-4">
                  <span className={`badge text-xs shrink-0 ${colorClass}`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                      {log.user
                        ? <><span className="font-medium">{log.user.name}</span> <span className="text-muted">({log.user.email})</span></>
                        : <span className="text-muted italic">Anonymous</span>
                      }
                      {log.entity_type && (
                        <span className="text-muted"> — {log.entity_type}</span>
                      )}
                    </p>
                    {log.ip_address && (
                      <p className="text-xs text-muted font-mono mt-0.5">{log.ip_address}</p>
                    )}
                  </div>
                  <time className="text-xs text-muted shrink-0 tabular-nums">
                    {new Date(log.created_at).toLocaleString('en', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {data?.total != null && (
        <p className="text-sm text-muted text-center">Showing {logs.length} of {data.total} entries</p>
      )}
    </div>
  )
}
