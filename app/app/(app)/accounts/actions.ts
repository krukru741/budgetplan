'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addAccount(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const type = formData.get('type') as string
  const balance = parseFloat(formData.get('balance') as string) || 0
  
  if (!name || !type) throw new Error('Missing required fields')

  // Check if they have any accounts, if not, make this the default
  const { count } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const isDefault = count === 0

  const { error } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name,
      type,
      balance,
      is_default: isDefault
    })

  if (error) throw error

  revalidatePath('/accounts')
  revalidatePath('/dashboard')
  redirect('/accounts')
}
