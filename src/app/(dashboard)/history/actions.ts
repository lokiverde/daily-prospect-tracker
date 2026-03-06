'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function loadMoreActivities(beforeDate: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('activities')
    .select('id, activity_type_id, points, contact_name, notes, logged_at, activity_types(name, icon, category)')
    .eq('user_id', user.id)
    .lt('logged_at', beforeDate)
    .order('logged_at', { ascending: false })
    .limit(200)

  if (error) return { error: error.message }

  return { data }
}

export async function deleteActivity(activityId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Verify the activity belongs to the user
  const { data: activity } = await supabase
    .from('activities')
    .select('user_id')
    .eq('id', activityId)
    .single()

  if (!activity || activity.user_id !== user.id) {
    return { error: 'Activity not found' }
  }

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)

  if (error) return { error: error.message }

  revalidatePath('/history')
  revalidatePath('/log')
  revalidatePath('/')
  return { success: true }
}
