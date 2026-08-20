// app/(app)/layout.tsx
// Protected shell layout — middleware already guards this route group
// Will house BottomNavigation (mobile) and Sidebar (desktop) in Phase 1
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Dashboard',
    template: '%s | BudgetPlan',
  },
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* TODO Phase 1: Add <Sidebar /> for desktop + <Header /> here */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      {/* TODO Phase 1: Add <BottomNavigation /> for mobile here */}
    </div>
  )
}
