import { useQuery, useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Shield, CheckCircle2, XCircle, Eye, EyeOff, Loader2, Key } from 'lucide-react'
import api, { getErrorMessage } from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'

export default function AdminSettingsPage() {
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data),
  })

  const { data: validationData, refetch: validateKey, isFetching: isValidating } = useQuery({
    queryKey: ['admin', 'validate-openai'],
    queryFn: () => api.get('/admin/settings/validate-openai').then(r => r.data),
    enabled: false,
  })

  const updateKeyMutation = useMutation({
    mutationFn: (key: string) => api.post('/admin/settings/openai-key', { api_key: key }).then(r => r.data),
    onSuccess: (data) => {
      setSuccess(data.message)
      setError(null)
      setApiKey('')
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] })
      setTimeout(() => setSuccess(null), 4000)
    },
    onError: (e) => {
      setError(getErrorMessage(e))
      setSuccess(null)
    },
  })

  if (isLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>

  const aiStatus = data?.ai_status ?? {}
  const statusColor = aiStatus.openai_configured
    ? validationData?.status === 'connected' ? 'text-success' : 'text-warning'
    : 'text-slate-400'
  const StatusIcon = validationData?.status === 'connected' ? CheckCircle2
    : validationData?.status === 'invalid' ? XCircle
    : Shield

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Settings</h1>

      {/* Current status */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          OpenAI API Status
        </h3>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              validationData?.status === 'connected' ? 'bg-success/10' :
              validationData?.status === 'invalid' ? 'bg-danger/10' :
              'bg-slate-100 dark:bg-slate-700'
            }`}>
              <StatusIcon className={`w-5 h-5 ${statusColor}`} />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {aiStatus.openai_configured ? 'API Key Configured' : 'No API Key Set'}
              </p>
              <p className="text-xs text-muted">
                {validationData?.message ?? (aiStatus.openai_configured ? 'Click Validate to check status' : 'Add your OpenAI API key below')}
              </p>
            </div>
          </div>
          <button
            onClick={() => validateKey()}
            disabled={isValidating || !aiStatus.openai_configured}
            className="btn-secondary text-sm"
          >
            {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Validate
          </button>
        </div>

        {aiStatus.openai_configured && (
          <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm">
            <span className="text-muted">Model: </span>
            <span className="font-mono font-medium text-slate-800 dark:text-slate-200">{aiStatus.model}</span>
          </div>
        )}
      </div>

      {/* Update API key */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-2">
          <Key className="w-4 h-4 text-primary" />
          Update OpenAI API Key
        </h3>
        <p className="text-sm text-muted mb-4">
          Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">OpenAI Platform</a>.
          The key will be validated and stored securely.
        </p>

        <div className="space-y-4">
          <div className="relative">
            <input
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              type={showKey ? 'text' : 'password'}
              className="input pr-10 font-mono"
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowKey(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && <Alert message={error} onClose={() => setError(null)} />}
          {success && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-success/10 text-success text-sm rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {success}
            </motion.div>
          )}

          <button
            onClick={() => updateKeyMutation.mutate(apiKey)}
            disabled={!apiKey || updateKeyMutation.isPending}
            className="btn-primary"
          >
            {updateKeyMutation.isPending ? <Spinner size="sm" /> : <Shield className="w-4 h-4" />}
            {updateKeyMutation.isPending ? 'Validating & Saving...' : 'Save & Validate API Key'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-xs text-muted">
          <p className="font-medium text-slate-700 dark:text-slate-300 mb-1">Security Notice</p>
          <p>The API key is stored encrypted and never exposed to the frontend. All AI requests are proxied through the backend.</p>
        </div>
      </div>

      {/* AI Provider info */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Supported AI Providers</h3>
        <div className="space-y-2">
          {[
            { name: 'OpenAI GPT-4o', status: 'active', badge: 'Current' },
            { name: 'Anthropic Claude', status: 'planned', badge: 'Coming Soon' },
            { name: 'Google Gemini', status: 'planned', badge: 'Coming Soon' },
            { name: 'DeepSeek', status: 'planned', badge: 'Coming Soon' },
          ].map(p => (
            <div key={p.name} className="flex items-center justify-between py-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">{p.name}</span>
              <span className={`badge text-xs ${p.status === 'active' ? 'badge-success' : 'bg-slate-100 text-slate-500'}`}>
                {p.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
