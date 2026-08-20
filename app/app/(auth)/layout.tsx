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
    <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4 md:px-6 py-12 relative">
      {/* Background gradient */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(37,99,235,0.08) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative z-10 flex flex-col items-center">
        {/* Header */}
        <header className="mb-8">
          <Logo size="lg" />
        </header>

        {/* Card */}
        <main className="w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center text-xs text-text-secondary">
          &copy; {new Date().getFullYear()} BudgetPlan. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
