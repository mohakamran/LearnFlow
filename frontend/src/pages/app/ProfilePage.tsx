import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, LogOut, Star, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import api, { getErrorMessage } from '@/lib/api'
import { getLevelName } from '@/lib/utils'
import Spinner from '@/components/ui/Spinner'
import Alert from '@/components/ui/Alert'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  bio: z.string().max(500).optional(),
  daily_goal_minutes: z.coerce.number().min(15).max(480),
  preferred_language: z.string(),
  learning_style: z.enum(['visual', 'reading', 'hands_on', 'mixed']),
})
type ProfileData = z.infer<typeof profileSchema>

const passwordSchema = z.object({
  current_password: z.string().min(1),
  password: z.string().min(8),
  password_confirmation: z.string(),
}).refine(d => d.password === d.password_confirmation, { message: "Passwords don't match", path: ['password_confirmation'] })
type PasswordData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [deleteStep, setDeleteStep] = useState<'idle' | 'confirm' | 'password'>('idle')
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      bio: user?.profile?.bio ?? '',
      daily_goal_minutes: user?.profile?.daily_goal_minutes ?? 60,
      preferred_language: user?.profile?.preferred_language ?? 'English',
      learning_style: user?.profile?.learning_style ?? 'mixed',
    },
  })

  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) })

  const profileMutation = useMutation({
    mutationFn: (data: ProfileData) => api.put('/auth/profile', data).then(r => r.data),
    onSuccess: () => { setProfileSuccess(true); setProfileError(null); refreshUser(); setTimeout(() => setProfileSuccess(false), 3000) },
    onError: (e) => setProfileError(getErrorMessage(e)),
  })

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordData) => api.put('/auth/password', data).then(r => r.data),
    onSuccess: () => { setPasswordSuccess(true); setPasswordError(null); passwordForm.reset(); setTimeout(() => setPasswordSuccess(false), 3000) },
    onError: (e) => setPasswordError(getErrorMessage(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: (password: string) => api.delete('/auth/account', { data: { password } }),
    onSuccess: async () => {
      await logout()
      navigate('/login')
    },
    onError: (e) => setDeleteError(getErrorMessage(e)),
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>

      {/* Avatar + stats */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <img src={user.avatar_url} alt={user.name} className="w-16 h-16 rounded-2xl object-cover" />
            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user.profile?.level ?? 1}
            </div>
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-muted">{user.email}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs text-muted">Level {user.profile?.level} · {getLevelName(user.profile?.level ?? 1)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'XP', value: user.profile?.xp_points?.toLocaleString() ?? '0' },
            { label: 'Streak', value: `${user.profile?.streak_days ?? 0} days` },
            { label: 'Lessons', value: user.profile?.total_lessons_completed ?? 0 },
          ].map(stat => (
            <div key={stat.label} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-3">
              <div className="font-bold text-slate-900 dark:text-white">{stat.value}</div>
              <div className="text-xs text-muted">{stat.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Profile form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          Personal Info
        </h3>
        <form onSubmit={profileForm.handleSubmit(d => profileMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input {...profileForm.register('name')} className="input" />
            {profileForm.formState.errors.name && <p className="mt-1 text-xs text-danger">{profileForm.formState.errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea {...profileForm.register('bio')} className="input min-h-[80px] resize-none" placeholder="Tell us about yourself..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Daily Goal (minutes)</label>
              <input {...profileForm.register('daily_goal_minutes')} type="number" min="15" max="480" className="input" />
            </div>
            <div>
              <label className="label">Learning Style</label>
              <select {...profileForm.register('learning_style')} className="input">
                <option value="visual">Visual</option>
                <option value="reading">Reading</option>
                <option value="hands_on">Hands-on</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          {profileError && <Alert message={profileError} onClose={() => setProfileError(null)} />}
          {profileSuccess && <div className="p-3 bg-success/10 text-success text-sm rounded-xl">Profile updated successfully!</div>}

          <button type="submit" disabled={profileMutation.isPending} className="btn-primary">
            {profileMutation.isPending ? <Spinner size="sm" /> : null}
            Save Changes
          </button>
        </form>
      </motion.div>

      {/* Password form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          Change Password
        </h3>
        <form onSubmit={passwordForm.handleSubmit(d => passwordMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input {...passwordForm.register('current_password')} type="password" className="input" />
          </div>
          <div>
            <label className="label">New Password</label>
            <input {...passwordForm.register('password')} type="password" className="input" />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input {...passwordForm.register('password_confirmation')} type="password" className="input" />
            {passwordForm.formState.errors.password_confirmation && (
              <p className="mt-1 text-xs text-danger">{passwordForm.formState.errors.password_confirmation.message}</p>
            )}
          </div>

          {passwordError && <Alert message={passwordError} onClose={() => setPasswordError(null)} />}
          {passwordSuccess && <div className="p-3 bg-success/10 text-success text-sm rounded-xl">Password changed successfully!</div>}

          <button type="submit" disabled={passwordMutation.isPending} className="btn-primary">
            {passwordMutation.isPending ? <Spinner size="sm" /> : null}
            Update Password
          </button>
        </form>
      </motion.div>

      {/* Delete account */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card overflow-hidden border-danger/20">
        <div className="p-6">
          <h3 className="font-semibold text-danger mb-1 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Danger Zone
          </h3>
          <p className="text-sm text-muted mb-4">
            Permanently delete your account and all associated data.
          </p>

          <AnimatePresence mode="wait">
            {deleteStep === 'idle' && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <button
                  onClick={() => setDeleteStep('confirm')}
                  className="flex items-center gap-2 px-4 py-2 border border-danger/30 text-danger text-sm rounded-xl hover:bg-danger/5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete My Account
                </button>
              </motion.div>
            )}

            {deleteStep === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Disclaimer */}
                <div className="flex gap-3 p-4 bg-danger/5 border border-danger/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-danger">This action is permanent and cannot be undone.</p>
                    <ul className="text-muted space-y-0.5 list-disc list-inside">
                      <li>Your account and all personal data will be deleted</li>
                      <li>All roadmaps and learning progress will be lost</li>
                      <li>Your XP, streaks, and achievements will be gone</li>
                      <li>You cannot recover your account after deletion</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteStep('password')}
                    className="btn-danger text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Yes, I understand — continue
                  </button>
                  <button
                    onClick={() => setDeleteStep('idle')}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}

            {deleteStep === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="flex gap-3 p-3 bg-danger/5 border border-danger/20 rounded-xl text-sm">
                  <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  <p className="text-danger font-medium">Enter your password to permanently delete this account.</p>
                </div>

                <div>
                  <label className="label">Your Password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={e => { setDeletePassword(e.target.value); setDeleteError(null) }}
                    className="input border-danger/30 focus:ring-danger/30 focus:border-danger"
                    placeholder="Enter your current password"
                    autoFocus
                  />
                </div>

                {deleteError && <Alert message={deleteError} variant="error" onClose={() => setDeleteError(null)} />}

                <div className="flex gap-2">
                  <button
                    onClick={() => deleteMutation.mutate(deletePassword)}
                    disabled={!deletePassword || deleteMutation.isPending}
                    className="btn-danger text-sm"
                  >
                    {deleteMutation.isPending ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                    {deleteMutation.isPending ? 'Deleting...' : 'Delete Account Forever'}
                  </button>
                  <button
                    onClick={() => { setDeleteStep('idle'); setDeletePassword(''); setDeleteError(null) }}
                    disabled={deleteMutation.isPending}
                    className="btn-secondary text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Logout */}
      <button onClick={handleLogout} className="btn-secondary w-full text-danger hover:bg-danger/5 border-danger/20">
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    </div>
  )
}
