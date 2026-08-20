'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addBill(data: {
  name: string
  original_amount: number
  due_date: string
  category_id?: string
  recurring: boolean
  frequency?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (data.original_amount <= 0) throw new Error('Amount must be greater than zero')

  const { error } = await supabase.from('bills').insert({
    user_id: user.id,
    name: data.name,
    original_amount: data.original_amount,
    due_date: data.due_date,
    category_id: data.category_id || null,
    recurring: data.recurring,
    frequency: data.recurring ? data.frequency : null
  })

  if (error) throw new Error(error.message)

  revalidatePath('/bills')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function payBill(billId: string, accountId: string, amount: number, date: string, note?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (amount <= 0) throw new Error('Payment amount must be greater than zero')

  const { data, error } = await supabase.rpc('pay_bill', {
    p_bill_id: billId,
    p_account_id: accountId,
    p_amount: amount,
    p_date: date,
    p_note: note
  })

  if (error) throw new Error(error.message)

  revalidatePath('/bills')
  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  return data
}

export async function deleteBill(billId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('bills')
    .delete()
    .eq('id', billId)
    .eq('user_id', user.id)

  if (error) throw new Error(error.message)

  revalidatePath('/bills')
  revalidatePath('/dashboard')
  return { success: true }
}
