import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import api, { getErrorMessage } from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'

const schema = z.object({ email: z.string().email('Please enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      await api.post('/auth/forgot-password', data)
      setSent(true)
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          We've sent a password reset link to your email address.
        </p>
        <Link to="/login" className="btn-primary">Back to Sign In</Link>
      </motion.div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Sign In
      </Link>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reset password</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Enter your email to receive a reset link</p>
      </div>
      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email address</label>
          <input {...register('email')} type="email" className="input" placeholder="you@example.com" />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <Spinner size="sm" /> : <Mail className="w-4 h-4" />}
          {isSubmitting ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </motion.div>
  )
}
