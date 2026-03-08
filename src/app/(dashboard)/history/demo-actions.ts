'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { DEMO_AGENT_EMAIL } from '@/lib/demo'
import { revalidatePath } from 'next/cache'

async function getDemoUserId(): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('email', DEMO_AGENT_EMAIL)
    .single()

  return data?.id || null
}

export async function deleteDemoActivity(activityId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)

  if (error) return { error: error.message }

  revalidatePath('/history')
  revalidatePath('/log')
  revalidatePath('/team')
  revalidatePath('/')
  return { success: true }
}

export async function loadMoreDemoActivities(beforeDate: string) {
  const userId = await getDemoUserId()
  if (!userId) return { error: 'Demo user not found' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('activities')
    .select('id, activity_type_id, points, contact_name, notes, logged_at, activity_types(name, icon, category)')
    .eq('user_id', userId)
    .lt('logged_at', beforeDate)
    .order('logged_at', { ascending: false })
    .limit(200)

  if (error) return { error: error.message }

  return { data }
}
