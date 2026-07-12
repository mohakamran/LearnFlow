import { useQuery } from '@tanstack/react-query'
import { BarChart3, DollarSign, Brain, Clock } from 'lucide-react'
import api from '@/lib/api'
import Spinner from '@/components/ui/Spinner'

export default function AdminAIUsagePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'ai-usage'],
    queryFn: () => api.get('/admin/ai-usage').then(r => r.data),
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const usage = data?.usage ?? []
  const daily = data?.dailyUsage ?? []

  const totalRequests = usage.reduce((s: number, r: { requests: number }) => s + r.requests, 0)
  const totalCost = usage.reduce((s: number, r: { total_cost: number }) => s + r.total_cost, 0)
  const totalTokens = usage.reduce((s: number, r: { total_tokens: number }) => s + r.total_tokens, 0)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        AI Usage Analytics
      </h1>

      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Brain, label: 'Total Requests', value: totalRequests.toLocaleString(), color: 'bg-primary/10 text-primary' },
          { icon: DollarSign, label: 'Total Cost', value: `$${totalCost.toFixed(4)}`, color: 'bg-amber-100 text-amber-600' },
          { icon: Clock, label: 'Total Tokens', value: totalTokens.toLocaleString(), color: 'bg-blue-100 text-blue-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-5">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
            <div className="text-sm text-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Usage breakdown table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700">
          <h3 className="font-semibold text-slate-900 dark:text-white">Usage by Action</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-slate-700 text-xs text-muted uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Model</th>
                <th className="px-4 py-3 text-right">Requests</th>
                <th className="px-4 py-3 text-right">Tokens</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-right">Avg Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {usage.map((row: { action: string; model: string; requests: number; total_tokens: number; total_cost: number; avg_response_ms: number }) => (
                <tr key={`${row.action}-${row.model}`} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white capitalize">
                    {row.action.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">{row.model}</td>
                  <td className="px-4 py-3 text-right">{row.requests.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">{row.total_tokens.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">${Number(row.total_cost).toFixed(4)}</td>
                  <td className="px-4 py-3 text-right text-muted">{Math.round(row.avg_response_ms)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Daily chart */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Daily Usage (Last 30 Days)</h3>
        {daily.length === 0 ? (
          <p className="text-muted text-sm text-center py-4">No usage data yet</p>
        ) : (
          <div className="space-y-2">
            {daily.slice(-10).map((d: { date: string; requests: number; cost: number }) => (
              <div key={d.date} className="flex items-center gap-3 text-sm">
                <span className="text-muted w-24 shrink-0">{new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                <div className="flex-1 progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${(d.requests / Math.max(...daily.map((x: { requests: number }) => x.requests), 1)) * 100}%` }}
                  />
                </div>
                <span className="text-muted w-12 text-right shrink-0">{d.requests}</span>
                <span className="text-muted w-16 text-right shrink-0">${Number(d.cost).toFixed(4)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
