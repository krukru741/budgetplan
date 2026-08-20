'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addDebt(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const original_amount = parseFloat(formData.get('original_amount') as string)
  const minimum_payment = formData.get('minimum_payment') ? parseFloat(formData.get('minimum_payment') as string) : null
  const due_date = formData.get('due_date') as string || null
  const interest_rate = formData.get('interest_rate') ? parseFloat(formData.get('interest_rate') as string) / 100 : null

  if (!name || !original_amount || original_amount <= 0) {
    throw new Error('Name and a valid Original Amount are required')
  }

  const { error } = await supabase
    .from('debts')
    .insert({
      user_id: user.id,
      name,
      original_amount,
      remaining_amount: original_amount,
      minimum_payment,
      due_date,
      interest_rate,
      status: 'active'
    })

  if (error) throw new Error(error.message)

  revalidatePath('/debts')
  redirect('/debts')
}

export async function payDebt(debtId: string, accountId: string, amount: number, date: string, note?: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.rpc('pay_debt', {
    p_debt_id: debtId,
    p_account_id: accountId,
    p_amount: amount,
    p_date: date,
    p_note: note || null
  })

  if (error) {
    console.error('pay_debt RPC Error:', error)
    throw new Error(error.message || 'Failed to pay debt')
  }

  revalidatePath('/debts')
  revalidatePath('/dashboard')
  revalidatePath('/budget')
  revalidatePath('/accounts')
  revalidatePath('/analytics')
}

export async function deleteDebt(debtId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('debts')
    .delete()
    .eq('id', debtId)

  if (error) throw new Error(error.message)

  revalidatePath('/debts')
}
