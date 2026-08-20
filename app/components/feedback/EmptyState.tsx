// components/feedback/EmptyState.tsx
// Reusable empty state — always explains what happened + provides a next action
// Rule: 12-DESIGN-SYSTEM.md — "Always explain what happened and provide the next action"
import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center text-center py-16 px-6', className)}>
      <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-text-tertiary" strokeWidth={1.5} />
      </div>
      <h3 className="font-semibold text-text mb-2">{title}</h3>
      <p className="text-sm text-text-secondary max-w-xs leading-relaxed mb-6">{description}</p>

      {action && (
        action.href ? (
          <a
            href={action.href}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-all duration-200 active:scale-[0.98]"
          >
            {action.label}
          </a>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-all duration-200 active:scale-[0.98]"
          >
            {action.label}
          </button>
        )
      )}
    </div>
  )
}
