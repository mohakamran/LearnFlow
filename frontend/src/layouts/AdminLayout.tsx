import { Outlet, NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, Settings, BarChart3,
  FileText, ChevronLeft, Zap
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { Sun, Moon } from 'lucide-react'

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/settings', icon: Settings, label: 'AI Settings' },
  { to: '/admin/ai-usage', icon: BarChart3, label: 'AI Usage' },
  { to: '/admin/logs', icon: FileText, label: 'Audit Logs' },
]

export default function AdminLayout() {
  const { logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen bg-background dark:bg-dark-background">
      <aside className="w-64 bg-slate-900 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Admin Panel</span>
          </div>
          <p className="text-xs text-slate-400">LearnFlow AI</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {adminNav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to App
          </NavLink>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white text-sm rounded-lg hover:bg-slate-800 transition-colors w-full"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  )
}
