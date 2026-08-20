'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Wallet, Plus, Target, User } from 'lucide-react'

const navItems = [
  { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Budget', href: '/budget', icon: Wallet },
  { name: 'Add', href: '/transactions?add=true', icon: Plus, isFab: true },
  { name: 'Goals', href: '/goals', icon: Target },
  { name: 'Profile', href: '/settings', icon: User },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border pb-safe z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          if (item.isFab) {
            return (
              <div key="fab" className="relative -top-5">
                <Link
                  href={item.href}
                  className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-hover active:scale-95 transition-transform"
                >
                  <Icon className="w-7 h-7" />
                </Link>
              </div>
            )
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${
                isActive ? 'text-primary' : 'text-text-secondary hover:text-text'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
