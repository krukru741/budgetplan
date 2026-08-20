'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const currency = formData.get('currency') as string
  const timezone = formData.get('timezone') as string

  const { error } = await supabase
    .from('users')
    .update({
      currency,
      timezone
    })
    .eq('id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
  // We might want to revalidate the whole app if currency changes
  revalidatePath('/dashboard')
  revalidatePath('/budget')
}

export async function updatePreferences(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const theme = formData.get('theme') as string
  const dateFormat = formData.get('date_format') as string
  const firstDayOfMonth = parseInt(formData.get('first_day_of_month') as string, 10)
  const budgetRollover = formData.get('budget_rollover') === 'true'
  const defaultBudgetMethod = formData.get('default_budget_method') as string

  // Upsert preferences just in case they don't exist yet
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      theme,
      date_format: dateFormat,
      first_day_of_month: firstDayOfMonth,
      budget_rollover: budgetRollover,
      default_budget_method: defaultBudgetMethod
    }, { onConflict: 'user_id' })

  if (error) throw new Error(error.message)

  revalidatePath('/settings')
}
