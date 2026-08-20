'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addCategory(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const type = formData.get('type') as string // 'income' or 'expense'
  const group = formData.get('group') as string // 'needs', 'wants', 'financial'
  const icon = formData.get('icon') as string
  const color = formData.get('color') as string

  if (!name || !type) throw new Error('Name and type are required')
  if (type === 'expense' && !group) throw new Error('Expense categories require a group')

  const { error } = await supabase
    .from('categories')
    .insert({
      user_id: user.id,
      name,
      type,
      group_name: type === 'expense' ? group : null,
      icon: icon || 'tag',
      color: color || '#2563EB',
      is_default: false
    })

  if (error) throw error
  revalidatePath('/categories')
  return { success: true }
}

export async function archiveCategory(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('categories')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/categories')
  return { success: true }
}
