import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Wallet, CalendarDays, Target, Plus, ArrowRightLeft, TrendingDown, TrendingUp } from 'lucide-react'
import Icon from '@/components/ui/Icon'

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

  // Fetch recent transactions (top 3)
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select(`
      id, type, amount, date, description, transfer_id, created_at,
      category:categories(name, icon),
      account:accounts(name)
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)

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
      <div className="grid grid-cols-4 gap-2 mb-8">
        {[
          { name: 'Add', icon: Plus, href: '/transactions/add', color: 'text-primary' },
          { name: 'Budget', icon: Wallet, href: '/budget', color: 'text-info' },
          { name: 'Bills', icon: CalendarDays, href: '/bills', color: 'text-warning' },
          { name: 'Goals', icon: Target, href: '/goals', color: 'text-success' },
        ].map(item => (
          <Link key={item.name} href={item.href} className="card p-3 flex flex-col items-center justify-center text-center hover:bg-surface-raised transition-colors group border-transparent shadow-sm">
            <div className={`w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${item.color}`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-text-secondary">{item.name}</span>
          </Link>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-text">Recent Transactions</h2>
        <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      
      <div className="space-y-3 mb-24">
        {!recentTransactions || recentTransactions.length === 0 ? (
          <div className="card p-4 text-center text-text-secondary text-sm border-dashed">
            No recent transactions.
          </div>
        ) : (
          recentTransactions.map((item: any) => {
            if (item.type === 'transfer') {
              return (
                <div key={item.id} className="card p-4 flex items-center justify-between hover:bg-surface-raised transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-info-light text-info flex items-center justify-center shrink-0">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-text leading-tight mb-1">Transfer</div>
                      <div className="text-xs text-text-secondary">{item.account?.name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-text tabular-nums">
                      ₱{Math.abs(Number(item.amount)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              )
            }

            const isExpense = item.type === 'expense'
            return (
              <div key={item.id} className="card p-4 flex items-center justify-between hover:bg-surface-raised transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    isExpense ? 'bg-danger-light text-danger' : 'bg-success-light text-success'
                  }`}>
                    {item.category?.icon ? <Icon name={item.category.icon} className="w-5 h-5" /> : (isExpense ? <TrendingDown className="w-5 h-5"/> : <TrendingUp className="w-5 h-5"/>)}
                  </div>
                  <div>
                    <div className="font-semibold text-text leading-tight mb-1">
                      {item.category?.name || 'Uncategorized'}
                    </div>
                    <div className="text-xs text-text-secondary">{item.account?.name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold tabular-nums ${isExpense ? 'amount-negative' : 'text-success'}`}>
                    {isExpense ? '-' : '+'}₱{Number(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
