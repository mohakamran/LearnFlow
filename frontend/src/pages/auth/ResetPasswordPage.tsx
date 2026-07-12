import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { useState } from 'react'
import api, { getErrorMessage } from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
})
type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      await api.post('/auth/reset-password', {
        ...data,
        token: searchParams.get('token'),
        email: searchParams.get('email'),
      })
      navigate('/login?reset=success')
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Set new password</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Enter your new password below</p>
      </div>
      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">New Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              className="input pr-10"
              placeholder="Min 8 characters"
            />
            <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label">Confirm Password</label>
          <input {...register('password_confirmation')} type={showPass ? 'text' : 'password'} className="input" placeholder="Repeat password" />
          {errors.password_confirmation && <p className="mt-1 text-xs text-danger">{errors.password_confirmation.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <Spinner size="sm" /> : <Lock className="w-4 h-4" />}
          {isSubmitting ? 'Saving...' : 'Reset Password'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="text-primary hover:underline">Back to Sign In</Link>
      </p>
    </motion.div>
  )
}
