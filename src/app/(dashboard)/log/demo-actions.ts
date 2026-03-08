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

export async function logDemoActivity(activityTypeId: string, points: number) {
  const userId = await getDemoUserId()
  if (!userId) return { error: 'Demo user not found' }

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      activity_type_id: activityTypeId,
      points,
      logged_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/log')
  revalidatePath('/team')
  revalidatePath('/')
  return { data }
}

export async function undoDemoActivity(activityId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)

  if (error) return { error: error.message }

  revalidatePath('/log')
  revalidatePath('/team')
  revalidatePath('/')
  return { success: true }
}
