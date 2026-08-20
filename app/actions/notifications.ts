'use server'

import { createClient } from '@/lib/supabase/server'

export type AppNotification = {
  id: string
  title: string
  type: 'bill' | 'debt'
  amount: number
  dueDate: string
  isOverdue: boolean
  daysUntilDue: number
  link: string
}

export async function getNotifications(): Promise<AppNotification[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Midnight today

  const next5Days = new Date(today)
  next5Days.setDate(today.getDate() + 5)
  const next5DaysStr = next5Days.toISOString().split('T')[0]

  const notifications: AppNotification[] = []

  // 1. Fetch upcoming / overdue Bills
  const { data: bills } = await supabase
    .from('bills')
    .select('id, name, amount, due_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .lte('due_date', next5DaysStr) // Due on or before 5 days from now

  if (bills) {
    bills.forEach(bill => {
      const dueDate = new Date(bill.due_date)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      notifications.push({
        id: `bill-${bill.id}`,
        title: bill.name,
        type: 'bill',
        amount: Number(bill.amount),
        dueDate: bill.due_date,
        isOverdue: diffDays < 0,
        daysUntilDue: diffDays,
        link: '/bills'
      })
    })
  }

  // 2. Fetch upcoming / overdue Debts
  const { data: debts } = await supabase
    .from('debts')
    .select('id, name, minimum_payment, remaining_amount, due_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .not('due_date', 'is', null)
    .lte('due_date', next5DaysStr)

  if (debts) {
    debts.forEach(debt => {
      const dueDate = new Date(debt.due_date)
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      notifications.push({
        id: `debt-${debt.id}`,
        title: debt.name,
        type: 'debt',
        amount: Number(debt.minimum_payment || debt.remaining_amount),
        dueDate: debt.due_date,
        isOverdue: diffDays < 0,
        daysUntilDue: diffDays,
        link: '/debts'
      })
    })
  }

  // 3. Sort: Overdue first, then closest due date
  notifications.sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1
    if (!a.isOverdue && b.isOverdue) return 1
    return a.daysUntilDue - b.daysUntilDue
  })

  return notifications
}
