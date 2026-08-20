import OnboardingWizard from './OnboardingWizard'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Welcome | BudgetPlan',
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if they already completed onboarding
  const { data: profile } = await supabase
    .from('users')
    .select('onboarding_completed_at')
    .eq('id', user.id)
    .single()

  if (profile?.onboarding_completed_at) {
    redirect('/dashboard') // Already done, don't let them repeat it
  }

  return <OnboardingWizard />
}
