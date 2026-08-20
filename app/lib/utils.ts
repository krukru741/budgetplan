// lib/utils.ts
// Shared utilities for className merging (shadcn/ui convention)
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatter — respects user currency setting (Decision Log #11)
export function formatCurrency(
  amount: number,
  currency: string = 'PHP',
  locale: string = 'en-PH'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

// Percentage formatter
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Date formatter — respects user date format preference
export function formatDate(date: Date | string, format = 'MM/DD/YYYY'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day   = String(d.getDate()).padStart(2, '0')
  const year  = String(d.getFullYear())

  return format
    .replace('MM', month)
    .replace('DD', day)
    .replace('YYYY', year)
}
