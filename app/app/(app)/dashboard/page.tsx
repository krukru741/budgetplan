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

  // Fetch Current Month Income and Expenses for Cash Flow
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  
  const { data: cashFlowData } = await supabase
    .from('transactions')
    .select('type, amount')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`)
    .lt('date', `${currentMonth === 12 ? currentYear + 1 : currentYear}-${String(currentMonth === 12 ? 1 : currentMonth + 1).padStart(2, '0')}-01`)

  let totalIncome = 0
  let totalExpense = 0
  
  if (cashFlowData) {
    cashFlowData.forEach(tx => {
      if (tx.type === 'income') totalIncome += Number(tx.amount)
      else if (tx.type === 'expense') totalExpense += Number(tx.amount)
    })
  }

  // Calculate percentages for the bars
  const maxCashFlow = Math.max(totalIncome, totalExpense, 1) // avoid div by 0
  const incomeHeight = Math.max(10, Math.round((totalIncome / maxCashFlow) * 100))
  const expenseHeight = Math.max(10, Math.round((totalExpense / maxCashFlow) * 100))

  return (
    <div className="page-container animate-fade-in p-4 md:p-8 w-full max-w-[1600px] mx-auto">
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-display font-bold text-text leading-tight">
            Hello, {profile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-display font-bold text-lg shadow-sm shrink-0">
          {profile?.name?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-text">
            Hello, {profile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-text-secondary mt-1 text-lg">Here&apos;s your financial overview</p>
        </div>
        <div className="flex items-center gap-4 bg-surface-raised px-4 py-2 rounded-xl shadow-sm border border-border">
          <CalendarDays className="w-5 h-5 text-text-tertiary" />
          <span className="font-medium text-text">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 pb-32 md:pb-10">
        
        {/* Left Column (Safe to Spend, Transactions) */}
        <div className="space-y-6 md:space-y-8">
          
          {/* Safe-to-Spend Hero Card */}
          <div className="card bg-primary text-white p-6 md:p-8 relative overflow-hidden shadow-md flex flex-col justify-between" style={{ minHeight: '260px' }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="relative z-10 flex-1 flex flex-col justify-center">
              <h2 className="text-white/80 font-medium mb-2 text-sm uppercase tracking-wider">Safe to Spend</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl text-white/80">₱</span>
                <span className="text-5xl md:text-6xl font-display font-bold tabular-nums">
                  {Number(safeToSpend).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <div className="relative z-10 mt-6 grid grid-cols-2 gap-4 md:gap-8 pt-6 border-t border-white/20 text-sm">
              <div>
                <div className="text-white/70 mb-1">Total Available Cash</div>
                <div className="font-semibold text-lg">₱{Number(totalAvailable).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="text-white/70 mb-1">Reserved Budget</div>
                <div className="font-semibold text-lg">- ₱{Number(reservedBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>

          {/* Mobile-only Quick Actions (Hidden on Desktop, as Desktop has a side panel for it) */}
          <div className="md:hidden grid grid-cols-3 gap-3">
            {[
              { name: 'Budget', icon: Wallet, href: '/budget', color: 'text-info' },
              { name: 'Bills', icon: CalendarDays, href: '/bills', color: 'text-warning' },
              { name: 'Goals', icon: Target, href: '/goals', color: 'text-success' },
            ].map(item => (
              <Link key={item.name} href={item.href} className="card py-3 px-2 flex flex-col items-center justify-center text-center hover:bg-surface-raised transition-colors group shadow-sm">
                <div className={`w-10 h-10 rounded-full bg-surface-raised flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${item.color}`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-text-secondary">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text text-lg">Recent Transactions</h2>
              <Link href="/transactions" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </div>
            
            <div className="space-y-3">
              {!recentTransactions || recentTransactions.length === 0 ? (
                <div className="card p-6 text-center text-text-secondary text-sm border-dashed">
                  No recent transactions.
                </div>
              ) : (
                recentTransactions.map((item: any) => {
                  if (item.type === 'transfer') {
                    return (
                      <div key={item.id} className="card p-4 flex items-center justify-between hover:bg-surface-raised transition-colors shadow-sm">
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
                    <div key={item.id} className="card p-4 flex items-center justify-between hover:bg-surface-raised transition-colors shadow-sm">
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
        </div>

        {/* Right Column (Quick Actions, Cash Flow) */}
        <div className="space-y-6 md:space-y-8">
          
          {/* Desktop Quick Actions */}
          <div className="hidden md:block">
            <h2 className="font-semibold text-text text-lg mb-4 opacity-0 select-none">Quick Actions (Hidden Header)</h2>
            <div className="grid grid-cols-4 gap-4">
              {[
                { name: 'Add Transaction', icon: Plus, href: '/transactions/add', color: 'text-primary' },
                { name: 'Budget', icon: Wallet, href: '/budget', color: 'text-info' },
                { name: 'Bills', icon: CalendarDays, href: '/bills', color: 'text-warning' },
                { name: 'Goals', icon: Target, href: '/goals', color: 'text-success' },
              ].map(item => (
                <Link key={item.name} href={item.href} className="card p-4 aspect-square flex flex-col items-center justify-center text-center hover:border-primary/30 transition-colors group shadow-sm">
                  <div className={`w-12 h-12 rounded-full bg-surface-raised flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${item.color}`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium text-text-secondary group-hover:text-text transition-colors line-clamp-2">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Cash Flow Analytics */}
          <div>
            <div className="flex items-center justify-between mb-4 mt-2">
              <h2 className="font-semibold text-text text-lg">Cash Flow (This Month)</h2>
              <Link href="/analytics" className="text-sm font-medium text-primary hover:underline">
                Details
              </Link>
            </div>
            <div className="card p-6 shadow-sm flex flex-col justify-between relative overflow-hidden group min-h-[240px]">
              <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-raised opacity-50"></div>
              
              <div className="relative z-10 flex justify-between items-center mb-6 border-b border-border/50 pb-4">
                <div>
                  <div className="text-sm text-text-secondary mb-1">Income</div>
                  <div className="font-bold text-success text-xl">₱{totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-text-secondary mb-1">Expenses</div>
                  <div className="font-bold text-danger text-xl">₱{totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="relative z-10 flex gap-8 w-full h-32 items-end justify-center px-4 pb-6">
                <div className="flex flex-col items-center justify-end h-full w-16">
                  <div 
                    className="w-full bg-success-light rounded-t-md relative group-hover:bg-success/20 transition-all duration-1000 ease-out"
                    style={{ height: `${incomeHeight}%` }}
                  ></div>
                  <span className="text-[10px] font-bold text-success uppercase tracking-widest mt-2">In</span>
                </div>
                <div className="flex flex-col items-center justify-end h-full w-16">
                  <div 
                    className="w-full bg-danger-light rounded-t-md relative group-hover:bg-danger/20 transition-all duration-1000 ease-out"
                    style={{ height: `${expenseHeight}%` }}
                  ></div>
                  <span className="text-[10px] font-bold text-danger uppercase tracking-widest mt-2">Out</span>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
