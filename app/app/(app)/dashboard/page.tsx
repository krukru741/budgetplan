import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wallet, CalendarDays, Target, Plus } from 'lucide-react'

export const metadata = {
  title: 'Dashboard | BudgetPlan',
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data, error } = await supabase.rpc('get_safe_to_spend').single()
  
  const safeToSpend = (data as any)?.current_safe_to_spend || 0
  const reservedBudget = (data as any)?.reserved_budget || 0
  const totalAvailable = (data as any)?.total_available_money || 0

  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

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

      {/* Safe-to-Spend Hero Card */}
      <div className="card bg-primary text-white p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative z-10">
          <h2 className="text-white/80 font-medium mb-2 text-sm uppercase tracking-wider">Safe to Spend</h2>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl text-white/80">₱</span>
            <span className="text-5xl font-display font-bold tabular-nums">
              {Number(safeToSpend).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="mt-6 flex flex-col md:flex-row gap-4 md:gap-8 pt-4 border-t border-white/20 text-sm">
            <div>
              <div className="text-white/70 mb-1">Total Available Cash</div>
              <div className="font-semibold">₱{Number(totalAvailable).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
            <div>
              <div className="text-white/70 mb-1">Reserved Budget</div>
              <div className="font-semibold">- ₱{Number(reservedBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
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
