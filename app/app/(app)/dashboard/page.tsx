import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wallet, Receipt, CalendarDays, Target, Plus } from 'lucide-react'

export const metadata = {
  title: 'Dashboard | BudgetPlan',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  const { data: accounts } = await supabase
    .from('accounts')
    .select('balance')
    .eq('user_id', user.id)

  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">
            Hello, {profile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-text-secondary mt-1">Here&apos;s your financial overview</p>
        </div>
      </div>

      {/* Main Stats Card (Safe-to-Spend placeholder for now, using Total Balance) */}
      <div className="card bg-gradient-to-br from-primary to-primary-hover p-6 text-white mb-8 border-transparent">
        <h2 className="text-white/80 text-sm font-medium mb-1">Total Available Balance</h2>
        <div className="text-4xl font-display font-bold tabular-nums">
          <span className="text-white/60 text-2xl mr-1">₱</span>
          {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
        <p className="text-white/70 text-xs mt-4">
          Phase 1: Safe-to-Spend calculations will replace this in the Budget module.
        </p>
      </div>

      {/* Quick Links */}
      <h2 className="font-semibold text-text mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { name: 'Add Transaction', icon: Plus, href: '/transactions/add', color: 'text-primary' },
          { name: 'Budget', icon: Wallet, href: '/budget', color: 'text-info' },
          { name: 'Bills', icon: CalendarDays, href: '/bills', color: 'text-warning' },
          { name: 'Goals', icon: Target, href: '/goals', color: 'text-success' },
        ].map(item => (
          <Link key={item.name} href={item.href} className="card p-4 flex flex-col items-center justify-center text-center hover:border-primary/50 transition-colors group">
            <div className={`w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-text">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
