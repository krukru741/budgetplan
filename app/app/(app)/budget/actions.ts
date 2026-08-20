'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertBudget(categoryId: string, month: number, year: number, amount: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (amount < 0) throw new Error('Budget amount cannot be negative')

  // Check if a budget already exists for this category/month/year
  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .eq('month', month)
    .eq('year', year)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('budgets')
      .update({ amount })
      .eq('id', existing.id)
    
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('budgets')
      .insert({
        user_id: user.id,
        category_id: categoryId,
        month,
        year,
        amount
      })
      
    if (error) throw new Error(error.message)
  }

  revalidatePath('/budget')
  revalidatePath('/dashboard')
  return { success: true }
}
