// components/feedback/ErrorState.tsx
// User-friendly error display — NEVER exposes raw DB/server errors
// Rule: 12-DESIGN-SYSTEM.md + 18-ANTIGRAVITY-INSTRUCTIONS.md
import { AlertCircle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-16 px-6', className)}>
      <div className="w-16 h-16 rounded-2xl bg-danger-light flex items-center justify-center mb-4">
        <AlertCircle className="w-7 h-7 text-danger" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-6">{message}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 border border-border hover:border-text-secondary text-text text-sm font-medium rounded-xl px-5 py-2.5 transition-all duration-200 active:scale-[0.98]"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
      )}
    </div>
  )
}
