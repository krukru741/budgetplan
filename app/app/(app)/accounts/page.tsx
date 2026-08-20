import { createClient } from '@/lib/supabase/server'
import { Landmark, Plus, Wallet, Banknote, CreditCard, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Accounts | BudgetPlan',
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  cash: Banknote,
  bank: Landmark,
  'e-wallet': Wallet,
  credit_card: CreditCard,
}

export default async function AccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: true })

  // Calculate total balance
  const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0

  return (
    <div className="page-container animate-fade-in">
      <div className="section-header">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-text">Accounts</h1>
          <p className="text-text-secondary mt-1">Manage your bank accounts, cash, and credit cards</p>
        </div>
        <Link 
          href="/accounts/add"
          className="hidden md:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Account
        </Link>
      </div>

      <div className="mt-6 mb-8 card p-6 bg-gradient-to-br from-primary to-primary-hover text-white border-transparent">
        <h2 className="text-white/80 text-sm font-medium mb-1">Total Net Worth</h2>
        <div className="text-4xl font-display font-bold tabular-nums">
          <span className="text-white/60 text-2xl mr-1">₱</span>
          {totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts?.map(account => {
          const Icon = TYPE_ICONS[account.type] || Landmark
          return (
            <div key={account.id} className="card hover:border-primary/30 transition-colors flex flex-col relative group cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center text-primary group-hover:bg-primary-light group-hover:text-primary-hover transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <button className="text-text-tertiary hover:text-text-secondary p-1">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mt-auto">
                <h3 className="font-semibold text-text mb-1">{account.name}</h3>
                <div className="text-sm text-text-secondary capitalize mb-3">
                  {account.type.replace('_', ' ')}
                  {account.is_default && ' • Default'}
                </div>
                <div className={`text-xl font-display font-bold tabular-nums ${Number(account.balance) < 0 ? 'amount-negative' : 'text-text'}`}>
                  ₱{Number(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          )
        })}

        {/* Empty State / Add New */}
        {(!accounts || accounts.length === 0) && (
          <Link href="/accounts/add" className="card border-dashed hover:border-primary/50 flex flex-col items-center justify-center text-center p-8 min-h-[200px] transition-colors group">
            <div className="w-12 h-12 rounded-full bg-surface-raised text-text-secondary flex items-center justify-center mb-3 group-hover:bg-primary-light group-hover:text-primary transition-colors">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-text mb-1">Add an Account</h3>
            <p className="text-sm text-text-secondary max-w-[200px]">Track your cash, bank accounts, or e-wallets.</p>
          </Link>
        )}
      </div>
    </div>
  )
}
