'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeOnboarding(data: {
  currency: string
  budgetMethod: string
  accountName: string
  accountType: string
  startingBalance: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // 1. Update user currency
  const { error: userError } = await supabase
    .from('users')
    .update({ 
      currency: data.currency,
      onboarding_completed_at: new Date().toISOString()
    })
    .eq('id', user.id)

  if (userError) throw userError

  // 2. Update default budget method
  const { error: prefError } = await supabase
    .from('user_preferences')
    .update({ default_budget_method: data.budgetMethod })
    .eq('user_id', user.id)

  if (prefError) throw prefError

  // 3. Create initial account
  const { error: accountError } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name: data.accountName,
      type: data.accountType,
      balance: data.startingBalance,
      is_default: true
    })

  if (accountError) throw accountError

  // Revalidate layout to pick up onboarding completion
  revalidatePath('/', 'layout')
  
  return { success: true }
}
