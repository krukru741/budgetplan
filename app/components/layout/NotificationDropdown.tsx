'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, CalendarClock } from 'lucide-react'
import Link from 'next/link'
import { getNotifications, AppNotification } from '@/actions/notifications'

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const data = await getNotifications()
        setNotifications(data)
      } catch (error) {
        console.error('Failed to fetch notifications', error)
      } finally {
        setLoading(false)
      }
    }
    
    // Fetch on mount
    fetchNotifications()

    // Poll every 5 minutes just in case they leave the tab open
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const hasUnread = notifications.length > 0
  const overdueCount = notifications.filter(n => n.isOverdue).length

  return (
    <div className="relative" ref={dropdownRef}>
      
      {/* Bell Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-primary/70 hover:bg-primary-light/50 hover:text-primary rounded-xl transition-colors"
      >
        <Bell className="w-6 h-6" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
            {overdueCount > 0 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 border-2 border-surface ${overdueCount > 0 ? 'bg-danger' : 'bg-primary'}`}></span>
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-border shadow-2xl rounded-2xl overflow-hidden z-50 animate-fade-in origin-top-right">
          <div className="p-4 border-b border-border bg-surface-raised flex items-center justify-between">
            <h3 className="font-display font-bold text-primary">Notifications</h3>
            <span className="text-xs font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {notifications.length} Pending
            </span>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-primary/40 flex justify-center">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 text-success" />
                </div>
                <p className="text-sm font-semibold text-primary">You're all caught up!</p>
                <p className="text-xs text-primary/60 mt-1">No upcoming bills or debts.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map(notification => (
                  <Link 
                    href={notification.link} 
                    key={notification.id}
                    onClick={() => setIsOpen(false)}
                    className={`block p-4 transition-colors hover:bg-black/5 ${
                      notification.isOverdue ? 'bg-[#FFFBE8]' : 'bg-surface'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 shrink-0 ${notification.isOverdue ? 'text-danger' : 'text-primary/60'}`}>
                        {notification.isOverdue ? (
                          <AlertTriangle className="w-5 h-5" />
                        ) : (
                          <CalendarClock className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-sm font-bold text-primary leading-tight">
                            {notification.title}
                          </p>
                          <p className="text-sm font-bold text-primary tabular-nums shrink-0">
                            ₱{notification.amount.toLocaleString()}
                          </p>
                        </div>
                        <p className={`text-xs mt-1 font-medium ${
                          notification.isOverdue ? 'text-danger' : 'text-primary/70'
                        }`}>
                          {notification.isOverdue 
                            ? `Overdue by ${Math.abs(notification.daysUntilDue)} day(s)` 
                            : notification.daysUntilDue === 0 
                              ? 'Due Today'
                              : `Due in ${notification.daysUntilDue} day(s)`
                          }
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
