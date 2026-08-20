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

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check onboarding status from the users table (we'll fetch this from public.users)
  const { data: profile } = await supabase
    .from('users')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .single()

  // If the user hasn't completed onboarding, force them to the wizard.
  // (Assuming Phase 1 uses onboarding_completed_at. If it fails due to missing column, 
  // it gracefully redirects to onboarding where they can finish it).
  if (!profile?.onboarding_completed_at) {
    redirect('/onboarding')
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pb-32 md:pb-0">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
    </div>
  )
}
