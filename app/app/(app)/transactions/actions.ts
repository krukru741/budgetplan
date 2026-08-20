'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addTransaction(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const type = formData.get('type') as string // 'income' or 'expense'
  const amount = parseFloat(formData.get('amount') as string)
  const category_id = formData.get('category_id') as string
  const account_id = formData.get('account_id') as string
  const date = formData.get('date') as string
  const description = formData.get('description') as string
  const payment_method = formData.get('payment_method') as string

  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0')
  if (!category_id || !account_id || !date) throw new Error('Missing required fields')

  // Call the Postgres RPC to safely insert and update balances atomically
  const { data: txId, error } = await supabase.rpc('insert_transaction_v1', {
    p_user_id: user.id,
    p_account_id: account_id,
    p_category_id: category_id,
    p_type: type,
    p_amount: amount,
    p_date: date,
    p_description: description || null,
    p_payment_method: payment_method || null
  })

  if (error) {
    console.error('Transaction RPC Error:', error)
    throw new Error(error.message || 'Failed to insert transaction')
  }

  // Handle Recurring Transaction Setup
  const is_recurring = formData.get('is_recurring') === 'on'
  if (is_recurring) {
    const frequency = formData.get('frequency') as string
    const end_date = formData.get('end_date') as string || null

    // Calculate the next date based on the chosen frequency
    const nextDateObj = new Date(date)
    if (frequency === 'daily') nextDateObj.setDate(nextDateObj.getDate() + 1)
    if (frequency === 'weekly') nextDateObj.setDate(nextDateObj.getDate() + 7)
    if (frequency === 'monthly') nextDateObj.setMonth(nextDateObj.getMonth() + 1)
    if (frequency === 'yearly') nextDateObj.setFullYear(nextDateObj.getFullYear() + 1)
    
    const next_date = nextDateObj.toISOString().split('T')[0]

    const { error: recError } = await supabase.from('recurring_transactions').insert({
      user_id: user.id,
      account_id,
      category_id,
      type,
      amount,
      description: description || null,
      frequency,
      next_date,
      end_date,
      status: 'active'
    })

    if (recError) {
      console.error('Failed to setup recurring transaction:', recError)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/accounts')
  revalidatePath('/budget')
  redirect('/transactions')
}

export async function addTransfer(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const amount = parseFloat(formData.get('amount') as string)
  const from_account_id = formData.get('from_account_id') as string
  const to_account_id = formData.get('to_account_id') as string
  const date = formData.get('date') as string
  const description = formData.get('description') as string

  if (!amount || amount <= 0) throw new Error('Amount must be greater than 0')
  if (!from_account_id || !to_account_id || !date) throw new Error('Missing required fields')
  if (from_account_id === to_account_id) throw new Error('Cannot transfer to the same account')

  // Call the Postgres RPC for atomic transfer (2 legs + balance updates)
  const { data, error } = await supabase.rpc('insert_transfer_v1', {
    p_user_id: user.id,
    p_from_account_id: from_account_id,
    p_to_account_id: to_account_id,
    p_amount: amount,
    p_date: date,
    p_description: description || null
  })

  if (error) {
    console.error('Transfer RPC Error:', error)
    throw new Error(error.message || 'Failed to process transfer')
  }

  revalidatePath('/dashboard')
  revalidatePath('/transactions')
  revalidatePath('/accounts')
  redirect('/transactions')
}
