// app/(auth)/layout.tsx
// Centered auth shell with BudgetPlan branding
import type { Metadata } from 'next'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.18) 0%, transparent 70%)',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex justify-center pt-10 pb-2">
        <Logo size="lg" />
      </header>

      {/* Card */}
      <main className="relative z-10 flex-1 flex items-start justify-center px-4 pt-6 pb-16">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-xs text-text-secondary py-4 pb-safe">
        <p>© {new Date().getFullYear()} BudgetPlan. All rights reserved.</p>
      </footer>
    </div>
  )
}
