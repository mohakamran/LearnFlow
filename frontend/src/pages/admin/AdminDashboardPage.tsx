import { useQuery } from '@tanstack/react-query'
import { Users, Map, Brain, DollarSign } from 'lucide-react'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const stats = data?.stats ?? {}

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: 'Total Users', value: stats.total_users ?? 0, sub: `${stats.new_users_week ?? 0} new this week`, color: 'bg-blue-100 text-blue-600' },
          { icon: Map, label: 'Active Roadmaps', value: stats.active_roadmaps ?? 0, sub: `${stats.total_roadmaps ?? 0} total`, color: 'bg-green-100 text-green-600' },
          { icon: Brain, label: 'AI Requests Today', value: stats.ai_requests_today ?? 0, sub: 'Today', color: 'bg-purple-100 text-purple-600' },
          { icon: DollarSign, label: 'AI Cost (Month)', value: `$${(stats.ai_cost_month ?? 0).toFixed(4)}`, sub: `$${(stats.ai_cost_today ?? 0).toFixed(4)} today`, color: 'bg-amber-100 text-amber-600' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
            <div className="text-sm text-slate-500 dark:text-slate-400">{label}</div>
            <div className="text-xs text-slate-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Users</h3>
          <div className="space-y-3">
            {(data?.recentUsers ?? []).map((u: { id: string; name: string; email: string; created_at: string }) => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {u.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </div>
                <span className="ml-auto text-xs text-slate-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {(data?.recentLogs ?? []).map((log: { id: string; action: string; user?: { name: string }; created_at: string }) => (
              <div key={log.id} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    <span className="font-medium">{log.user?.name ?? 'System'}</span> — {log.action.replace(/_/g, ' ')}
                  </p>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
