'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, TrendingUp, PiggyBank, Target, Wallet, PieChart as PieChartIcon, Download } from 'lucide-react'
import { 
  LineChart, Line, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'

export default function AnalyticsClient({
  month,
  year,
  transactions,
  budgets,
  safeToSpend
}: {
  month: number
  year: number
  transactions: any[]
  budgets: any[]
  safeToSpend: number
}) {
  const router = useRouter()

  // Date Navigation
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const navigateTo = (m: number, y: number) => {
    router.push(`/analytics?month=${m}&year=${y}`)
  }

  const downloadCSV = () => {
    const rows = transactions.map(t => {
      const date = new Date(t.date).toLocaleDateString('en-US')
      const type = t.type.toUpperCase()
      const category = t.category?.name || 'Uncategorized'
      const amount = Number(t.amount).toFixed(2)
      return `"${date}","${type}","${category}","${amount}"`
    })
    
    const csvContent = "data:text/csv;charset=utf-8," + ['"Date","Type","Category","Amount"'].concat(rows).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `budgetplan_report_${year}_${month}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // --- 1. Top Level Metrics ---
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0
  const totalBudgeted = budgets.reduce((sum, b) => sum + Number(b.budget_amount), 0)

  // --- 2. Cash Flow Trend Data (Daily) ---
  const daysInMonth = new Date(year, month, 0).getDate()
  const cashFlowData = useMemo(() => {
    const data = Array.from({ length: daysInMonth }, (_, i) => ({
      date: i + 1,
      income: 0,
      expense: 0
    }))
    transactions.forEach(t => {
      const day = new Date(t.date).getDate()
      if (t.type === 'income') data[day - 1].income += Number(t.amount)
      if (t.type === 'expense') data[day - 1].expense += Number(t.amount)
    })
    return data
  }, [transactions, daysInMonth])

  // --- 3. Category Breakdown Data (Donut Chart) ---
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const grouped = expenses.reduce((acc, t) => {
      const catName = t.category?.name || 'Uncategorized'
      const catColor = t.category?.color || '#D4A373'
      if (!acc[catName]) acc[catName] = { name: catName, value: 0, color: catColor }
      acc[catName].value += Number(t.amount)
      return acc
    }, {} as Record<string, { name: string, value: number, color: string }>)
    
    return Object.values(grouped).sort((a: any, b: any) => b.value - a.value)
  }, [transactions])

  // Custom Recharts Components (60-30-10 UI styling)
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface border-2 border-primary/20 p-3 rounded-xl shadow-lg">
          <p className="text-primary font-bold mb-2">Day {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-primary/80 capitalize">{entry.name}:</span>
              <span className="font-semibold" style={{ color: entry.color }}>
                ₱{Number(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  const CategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-surface border-2 border-primary/20 p-3 rounded-xl shadow-lg flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: data.color }} />
          <span className="text-primary/80 font-medium">{data.name}:</span>
          <span className="font-bold text-primary">₱{Number(data.value).toLocaleString()}</span>
        </div>
      )
    }
    return null
  }

  return (
    <div className="page-container animate-fade-in w-full max-w-7xl mx-auto pb-28 md:pb-8 flex flex-col gap-8">
      
      {/* Header & Date Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Analytics & Reports</h1>
          <p className="text-text-secondary mt-1">Track your cash flow and spending habits</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={downloadCSV}
            className="flex items-center justify-center gap-2 bg-surface hover:bg-primary-light/30 border-2 border-primary/20 hover:border-primary text-primary px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm flex-1 sm:flex-none"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Export CSV</span>
          </button>
          
          <div className="flex flex-1 sm:flex-none items-center justify-between sm:justify-center gap-2 sm:gap-4 bg-surface-raised p-2 rounded-xl shadow-sm border border-border">
            <button onClick={() => navigateTo(prevMonth, prevYear)} className="p-1.5 rounded-lg text-primary/70 hover:bg-primary-light/50 hover:text-primary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-28 sm:w-32 text-center font-display font-bold text-primary text-sm sm:text-base">
              {new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </div>
            <button onClick={() => navigateTo(nextMonth, nextYear)} className="p-1.5 rounded-lg text-primary/70 hover:bg-primary-light/50 hover:text-primary transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top Level Metric Cards (60-30-10) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 sm:p-5 flex flex-col justify-between gap-3 border-l-4 border-l-success">
          <div className="flex items-center gap-2 text-primary/70 text-xs font-semibold uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-success" /> Total Income
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-primary tabular-nums">
            ₱{totalIncome.toLocaleString()}
          </div>
        </div>
        <div className="card p-4 sm:p-5 flex flex-col justify-between gap-3 border-l-4 border-l-danger">
          <div className="flex items-center gap-2 text-primary/70 text-xs font-semibold uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-danger" /> Total Expenses
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-primary tabular-nums">
            ₱{totalExpense.toLocaleString()}
          </div>
        </div>
        <div className="card p-4 sm:p-5 flex flex-col justify-between gap-3 border-l-4 border-l-primary-light bg-primary-light/10">
          <div className="flex items-center gap-2 text-primary/70 text-xs font-semibold uppercase tracking-wider">
            <Target className="w-4 h-4 text-primary" /> Safe to Spend
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-primary tabular-nums">
            ₱{safeToSpend.toLocaleString()}
          </div>
        </div>
        <div className="card p-4 sm:p-5 flex flex-col justify-between gap-3 border-l-4 border-l-[#10B981]">
          <div className="flex items-center gap-2 text-primary/70 text-xs font-semibold uppercase tracking-wider">
            <PiggyBank className="w-4 h-4 text-[#10B981]" /> Savings Rate
          </div>
          <div className="text-2xl sm:text-3xl font-display font-bold text-primary tabular-nums">
            {savingsRate.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow Trend (Line Chart) */}
        <div className="card p-5 lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary font-display">Cash Flow Trend</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B352A', opacity: 0.7 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B352A', opacity: 0.7 }} tickFormatter={(val) => `₱${val/1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: '#6B352A' }} />
                <Line type="monotone" dataKey="income" name="Income" stroke="#16A34A" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="expense" name="Expense" stroke="#EF4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown (Donut Chart) */}
        <div className="card p-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-primary font-display">Spending by Category</h2>
          </div>
          <div className="h-[300px] w-full relative">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CategoryTooltip />} />
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/50">
                <PieChartIcon className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-sm font-semibold">No expenses this month</p>
              </div>
            )}
            
            {/* Center Text */}
            {categoryData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-semibold text-primary/60 uppercase tracking-wider">Total</span>
                <span className="text-xl font-bold text-primary">₱{totalExpense.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Budget Performance */}
      <div className="card p-5 flex flex-col gap-6">
        <h2 className="text-lg font-bold text-primary font-display">Budget Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.length > 0 ? budgets.map((b: any) => {
            const spent = Number(b.spent_amount)
            const limit = Number(b.budget_amount)
            const percent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
            const isOver = spent > limit

            return (
              <div key={b.category_id} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="font-semibold text-primary">{b.category_name}</span>
                  <span className="text-sm text-primary/70">
                    <span className={isOver ? 'text-danger font-bold' : ''}>₱{spent.toLocaleString()}</span> / ₱{limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-3 w-full bg-surface-raised rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-danger' : 'bg-primary'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          }) : (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-stone-200/60 rounded-xl">
              <p className="text-primary/50 font-semibold">No budgets set for this month.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
