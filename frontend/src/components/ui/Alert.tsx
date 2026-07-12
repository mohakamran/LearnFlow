import { X, AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  message: string
  variant?: AlertVariant
  onClose?: () => void
  className?: string
}

const config: Record<AlertVariant, { icon: typeof AlertCircle; classes: string }> = {
  error:   { icon: AlertCircle,    classes: 'bg-danger/10 border-danger/20 text-danger' },
  success: { icon: CheckCircle2,   classes: 'bg-success/10 border-success/20 text-success' },
  warning: { icon: AlertTriangle,  classes: 'bg-warning/10 border-warning/20 text-warning' },
  info:    { icon: Info,           classes: 'bg-primary/10 border-primary/20 text-primary' },
}

export default function Alert({ message, variant = 'error', onClose, className }: AlertProps) {
  const { icon: Icon, classes } = config[variant]

  return (
    <div className={cn('flex items-start gap-3 p-3 border rounded-xl text-sm', classes, className)}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
