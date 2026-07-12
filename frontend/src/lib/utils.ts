import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(date))
}

export function formatRelativeTime(date: string | null | undefined): string {
  if (!date) return '—'
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = (new Date(date).getTime() - Date.now()) / 1000
  const absDiff = Math.abs(diff)

  if (absDiff < 60) return rtf.format(Math.round(diff), 'second')
  if (absDiff < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (absDiff < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  return rtf.format(Math.round(diff / 86400), 'day')
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getLevelName(level: number): string {
  if (level <= 5) return 'Beginner'
  if (level <= 15) return 'Learner'
  if (level <= 30) return 'Practitioner'
  if (level <= 50) return 'Expert'
  if (level <= 75) return 'Master'
  return 'Grandmaster'
}

export function getDifficultyLabel(difficulty: number): string {
  if (difficulty <= 1.5) return 'Easy'
  if (difficulty <= 2.5) return 'Medium'
  if (difficulty <= 3.5) return 'Hard'
  return 'Expert'
}

export function getDifficultyColor(difficulty: number): string {
  if (difficulty <= 1.5) return 'text-success'
  if (difficulty <= 2.5) return 'text-warning'
  if (difficulty <= 3.5) return 'text-orange-500'
  return 'text-danger'
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    completed: 'badge-success',
    in_progress: 'badge-primary',
    active: 'badge-primary',
    locked: 'bg-slate-100 text-slate-500',
    pending: 'bg-slate-100 text-slate-500',
    paused: 'badge-warning',
    available: 'badge-primary',
  }
  return colors[status] ?? 'bg-slate-100 text-slate-500'
}
