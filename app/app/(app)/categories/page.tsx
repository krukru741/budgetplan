import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Tag, Archive } from 'lucide-react'
import Icon from '@/components/ui/Icon'

export const metadata = { title: 'Categories | BudgetPlan' }

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  const activeCategories = categories?.filter(c => !c.archived_at) || []
  const archivedCategories = categories?.filter(c => c.archived_at) || []

  const expenseCategories = activeCategories.filter(c => c.type === 'expense')
  const incomeCategories = activeCategories.filter(c => c.type === 'income')

  return (
    <div className="page-container animate-fade-in max-w-5xl mx-auto">
      <div className="section-header">
        <div>
          <h1 className="text-2xl font-display font-bold text-text">Categories</h1>
          <p className="text-text-secondary mt-1">Manage your income and expense buckets</p>
        </div>
        <Link 
          href="/categories/add"
          className="hidden md:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Category
        </Link>
      </div>

      <div className="mt-8 space-y-8">
        {/* Expenses */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Expenses</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {expenseCategories.map(cat => (
              <div key={cat.id} className="card p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center text-text shrink-0">
                      <Icon name={cat.icon} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text leading-tight">{cat.name}</h3>
                      <span className="text-xs text-text-secondary capitalize">{cat.group_name || 'Uncategorized'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Income */}
        <section>
          <h2 className="text-lg font-semibold text-text mb-4">Income</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {incomeCategories.map(cat => (
              <div key={cat.id} className="card p-4 flex flex-col justify-between hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-raised flex items-center justify-center text-text shrink-0">
                    <Icon name={cat.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-text leading-tight">{cat.name}</h3>
                    <span className="text-xs text-text-secondary capitalize">Income</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Archived */}
        {archivedCategories.length > 0 && (
          <section className="pt-8 border-t border-border">
            <h2 className="text-lg font-semibold text-text-tertiary mb-4 flex items-center gap-2">
              <Archive className="w-5 h-5" /> Archived Categories
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 opacity-60">
              {archivedCategories.map(cat => (
                <div key={cat.id} className="card p-4 flex items-center gap-3 bg-surface-raised">
                   <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-text-tertiary shrink-0">
                    <Icon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-text-secondary line-through">{cat.name}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-text-tertiary mt-4">
              Archived categories cannot be used for new transactions, but historical data is preserved.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
