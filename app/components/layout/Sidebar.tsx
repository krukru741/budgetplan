'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Wallet, 
  Receipt, 
  CalendarDays, 
  Target, 
  Landmark, 
  CreditCard,
  LineChart,
  Settings,
  LogOut
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Budget', href: '/budget', icon: Wallet },
  { name: 'Transactions', href: '/transactions', icon: Receipt },
  { name: 'Bills', href: '/bills', icon: CalendarDays },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Analytics', href: '/analytics', icon: LineChart },
  { name: 'Debts', href: '/debts', icon: CreditCard },
  { name: 'Accounts', href: '/accounts', icon: Landmark },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-background border-r border-stone-200/60 h-screen sticky top-0">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-display font-bold text-xl">
            B
          </div>
          <div className="font-display font-bold text-xl">
            <span className="text-primary">Budget</span>
            <span className="text-primary/70">Plan</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-primary-light text-primary font-bold' 
                  : 'text-primary/70 font-medium hover:bg-primary-light/40 hover:text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-stone-200/60 mt-auto">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-primary/70 hover:bg-primary-light/40 hover:text-primary transition-colors"
        >
          <Settings className="w-5 h-5" />
          Settings
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-primary/70 hover:bg-danger/10 hover:text-danger transition-colors mt-1"
        >
          <LogOut className="w-5 h-5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
