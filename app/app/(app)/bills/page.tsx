import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BillsClient from './BillsClient'

export const metadata = {
  title: 'Bills | BudgetPlan',
}

export default async function BillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch all bills for the user
  const { data: bills, error } = await supabase
    .from('bills')
    .select(`
      *,
      category:categories(name, icon)
    `)
    .eq('user_id', user.id)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching bills:', error)
  }

  // Categorize bills
  const overdueBills = []
  const upcomingBills = []
  const paidBills = []

  const today = new Date().toISOString().split('T')[0]

  if (bills) {
    for (const bill of bills) {
      if (bill.status === 'PAID') {
        paidBills.push(bill)
      } else if (bill.status === 'OVERDUE' || (bill.due_date < today && bill.status !== 'PAID')) {
        // Just in case status hasn't updated yet but date has passed
        overdueBills.push(bill)
      } else {
        upcomingBills.push(bill)
      }
    }
  }

  return (
    <BillsClient 
      overdueBills={overdueBills}
      upcomingBills={upcomingBills}
      paidBills={paidBills}
    />
  )
}
