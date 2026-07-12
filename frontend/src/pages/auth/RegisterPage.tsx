import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/lib/api'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[a-zA-Z]/, 'Must contain a letter')
    .regex(/[0-9]/, 'Must contain a number'),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, {
  message: "Passwords don't match",
  path: ['password_confirmation'],
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: signup } = useAuth()
  const navigate = useNavigate()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    try {
      await signup(data.name, data.email, data.password, data.password_confirmation)
      navigate('/onboarding')
    } catch (e) {
      setError(getErrorMessage(e))
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Start learning today</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Create your free account</p>
      </div>

      {error && <Alert message={error} onClose={() => setError(null)} className="mb-4" />}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Full Name</label>
          <input {...register('name')} className="input" placeholder="Alex Johnson" autoComplete="name" />
          {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Email</label>
          <input {...register('email')} type="email" className="input" placeholder="you@example.com" autoComplete="email" />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPass ? 'text' : 'password'}
              className="input pr-10"
              placeholder="Min 8 chars, include letters & numbers"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <input
            {...register('password_confirmation')}
            type={showPass ? 'text' : 'password'}
            className="input"
            placeholder="Repeat password"
            autoComplete="new-password"
          />
          {errors.password_confirmation && <p className="mt-1 text-xs text-danger">{errors.password_confirmation.message}</p>}
        </div>

        <p className="text-xs text-slate-400">
          By creating an account you agree to our{' '}
          <a href="#" className="text-primary hover:underline">Terms of Service</a> and{' '}
          <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
        </p>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? <Spinner size="sm" /> : <UserPlus className="w-4 h-4" />}
          {isSubmitting ? 'Creating account...' : 'Create free account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
