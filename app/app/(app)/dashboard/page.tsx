// app/(app)/dashboard/page.tsx
// Placeholder — full dashboard built in Phase 1
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutDashboard } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch user profile
  const { data: profile } = await supabase
    .from('users')
    .select('name, currency')
    .eq('id', user.id)
    .single()

  return (
    <div className="page-container animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display text-text">
          Hello, {profile?.name || 'there'} 👋
        </h1>
        <p className="text-text-secondary mt-1">Your financial dashboard is coming in Phase 1.</p>
      </div>

      {/* Phase 0 success indicator */}
      <div className="card p-6 flex items-center gap-4 border-l-4 border-l-primary">
        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
          <LayoutDashboard className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold text-text">Phase 0 Complete ✅</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Authentication, database schema, RLS policies, and design system are live.
            You are signed in as <strong>{user.email}</strong>.
          </p>
        </div>
      </div>

      {/* Phase 1 modules preview */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Budget', emoji: '💰', phase: 'Phase 1' },
          { label: 'Transactions', emoji: '📋', phase: 'Phase 1' },
          { label: 'Bills', emoji: '🧾', phase: 'Phase 2' },
          { label: 'Goals', emoji: '🎯', phase: 'Phase 2' },
          { label: 'Analytics', emoji: '📊', phase: 'Phase 3' },
          { label: 'Debts', emoji: '📉', phase: 'Phase 3' },
        ].map(m => (
          <div key={m.label} className="card flex flex-col items-center text-center py-6 gap-2 opacity-60">
            <span className="text-3xl">{m.emoji}</span>
            <span className="font-semibold text-sm text-text">{m.label}</span>
            <span className="text-xs text-text-tertiary bg-surface-raised px-2 py-0.5 rounded-full">{m.phase}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
