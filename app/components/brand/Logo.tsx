// components/brand/Logo.tsx
// BudgetPlan wordmark — used across auth screens and nav
import { TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  href?: string
  className?: string
}

const sizes = {
  sm: { icon: 'w-6 h-6', text: 'text-lg',  iconBox: 'w-8 h-8 rounded-lg',  gap: 'gap-2' },
  md: { icon: 'w-6 h-6', text: 'text-xl',  iconBox: 'w-9 h-9 rounded-xl',  gap: 'gap-2.5' },
  lg: { icon: 'w-7 h-7', text: 'text-2xl', iconBox: 'w-12 h-12 rounded-xl', gap: 'gap-3' },
}

export function Logo({ size = 'md', href = '/', className }: LogoProps) {
  const s = sizes[size]

  const content = (
    <div className={cn('flex items-center', s.gap, className)}>
      {/* Icon mark */}
      <div
        className={cn(
          'flex items-center justify-center shrink-0',
          'bg-primary text-white shadow-md',
          s.iconBox
        )}
        style={{ boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}
      >
        <TrendingUp className={s.icon} strokeWidth={2.5} />
      </div>

      {/* Wordmark */}
      <span className={cn('font-display font-bold text-text leading-none', s.text)}>
        Budget<span className="text-primary">Plan</span>
      </span>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex min-h-0 min-w-0" aria-label="BudgetPlan home">
        {content}
      </Link>
    )
  }

  return content
}
