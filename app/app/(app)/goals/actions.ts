'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addGoal(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const targetDateStr = formData.get('target_date') as string
  const targetDate = targetDateStr ? new Date(targetDateStr).toISOString() : null

  const { error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      name: formData.get('name'),
      icon: formData.get('icon') || 'Target',
      target_amount: parseFloat(formData.get('target_amount') as string),
      current_amount: 0,
      target_date: targetDate,
      status: 'active'
    })

  if (error) throw new Error(error.message)

  revalidatePath('/goals')
}

export async function addContribution(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  const goalId = formData.get('goal_id') as string
  const accountId = formData.get('account_id') as string
  const amount = parseFloat(formData.get('amount') as string)
  const date = formData.get('date') as string
  const note = formData.get('note') as string

  if (amount <= 0) throw new Error('Amount must be greater than 0')

  // 1. Fetch the goal to get its name for the note
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('name, current_amount, target_amount')
    .eq('id', goalId)
    .single()

  if (goalError || !goal) throw new Error('Goal not found')

  // 2. Find the "Savings" category for this user
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', '%saving%') // matches "Savings"
    .limit(1)
    .single()

  const categoryId = category?.id || null

  const transactionNote = note ? `Goal: ${goal.name} - ${note}` : `Contribution to ${goal.name}`

  // 3. Create the expense transaction
  const { data: transaction, error: txError } = await supabase
    .from('transactions')
    .insert({
      user_id: user.id,
      account_id: accountId,
      category_id: categoryId,
      type: 'expense',
      amount: amount,
      date: date,
      description: transactionNote
    })
    .select('id')
    .single()

  if (txError) throw new Error(txError.message)

  // 4. Create the goal contribution
  const { error: contribError } = await supabase
    .from('goal_contributions')
    .insert({
      goal_id: goalId,
      account_id: accountId,
      transaction_id: transaction.id,
      amount: amount,
      date: date,
      note: note
    })

  if (contribError) throw new Error(contribError.message)

  // 5. Update the goal's current amount and check if completed
  const newAmount = parseFloat(goal.current_amount as any) + amount
  const isCompleted = newAmount >= parseFloat(goal.target_amount as any)

  const { error: updateError } = await supabase
    .from('goals')
    .update({
      current_amount: newAmount,
      status: isCompleted ? 'completed' : 'active',
      completed_at: isCompleted ? new Date().toISOString() : null
    })
    .eq('id', goalId)

  if (updateError) throw new Error(updateError.message)

  revalidatePath('/goals')
  revalidatePath('/dashboard')
  revalidatePath('/budget')
}
