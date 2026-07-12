import { Menu, Sun, Moon, Bell, CheckCheck, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { queryClient } from '@/lib/queryClient'
import type { Notification } from '@/types'
import { cn } from '@/lib/utils'

interface HeaderProps {
  onMenuClick: () => void
}

function NotificationIcon(type: string) {
  const icons: Record<string, string> = {
    lesson_completed: '✅',
    lesson_unlocked: '🔓',
    level_up: '🎉',
    streak: '🔥',
  }
  return icons[type] ?? '🔔'
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const markAllMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOneMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const { data } = useQuery<{ notifications: Notification[]; unread_count: number }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
  })

  const notifications = data?.notifications ?? []

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-lg z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
        <div className="flex items-center gap-2">
          {(data?.unread_count ?? 0) > 0 && (
            <button
              onClick={() => markAllMutation.mutate()}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-10 text-center text-muted text-sm">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
            No notifications yet
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markOneMutation.mutate(n.id)}
              className={cn(
                'flex gap-3 px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors',
                !n.is_read && 'bg-primary/5'
              )}
            >
              <span className="text-lg shrink-0 mt-0.5">{NotificationIcon(n.type)}</span>
              <div className="flex-1 min-w-0">
                <p className={cn('text-sm font-medium truncate', n.is_read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white')}>
                  {n.title}
                </p>
                <p className="text-xs text-muted mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-muted/60 mt-1">
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {!n.is_read && (
                <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const { data: notifData } = useQuery<{ notifications: Notification[]; unread_count: number }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000, // poll every 30 seconds
    staleTime: 20000,
  })

  const unreadCount = notifData?.unread_count ?? 0

  // Close panel when clicking outside
  useEffect(() => {
    if (!showNotifications) return
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showNotifications])

  return (
    <header className="h-16 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-4 px-4 lg:px-6 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      </button>

      {/* Streak badge */}
      {(user?.profile?.streak_days ?? 0) > 0 && (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 dark:bg-orange-500/10 rounded-full">
          <span className="text-sm">🔥</span>
          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
            {user?.profile?.streak_days} day streak
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* XP */}
      {user?.profile && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
          <span className="text-xs font-bold text-primary">⚡ {user.profile.xp_points} XP</span>
        </div>
      )}

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark'
          ? <Sun className="w-5 h-5 text-slate-400" />
          : <Moon className="w-5 h-5 text-slate-400" />
        }
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={() => setShowNotifications(p => !p)}
          className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-danger rounded-full flex items-center justify-center text-white text-[10px] font-bold px-0.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        <AnimatePresence>
          {showNotifications && (
            <NotificationPanel onClose={() => setShowNotifications(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* Avatar */}
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2"
      >
        <img
          src={user?.avatar_url}
          alt={user?.name}
          className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 hover:ring-primary/40 transition-all"
        />
      </button>
    </header>
  )
}
