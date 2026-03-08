'use server'

import { createAdminClient, getDemoBrokerageTimezone } from '@/lib/supabase/server'
import { DEMO_AGENT_EMAIL } from '@/lib/demo'
import { getDayRange } from '@/lib/calculations'
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

export async function logDemoActivity(activityTypeId: string, points: number, logDate?: string) {
  const userId = await getDemoUserId()
  if (!userId) return { error: 'Demo user not found' }

  const supabase = createAdminClient()

  // If backdating, set logged_at to noon of that day to land solidly within the date range
  let loggedAt: string
  if (logDate) {
    const [year, month, day] = logDate.split('-').map(Number)
    loggedAt = new Date(year, month - 1, day, 12, 0, 0).toISOString()
  } else {
    loggedAt = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: userId,
      activity_type_id: activityTypeId,
      points,
      logged_at: loggedAt,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath('/log')
  revalidatePath('/team')
  revalidatePath('/')
  return { data }
}

export async function getDemoDayActivities(dateStr: string) {
  const userId = await getDemoUserId()
  if (!userId) return { activities: [], points: 0 }

  const supabase = createAdminClient()
  const tz = await getDemoBrokerageTimezone()
  const [year, month, day] = dateStr.split('-').map(Number)
  const { start, end } = getDayRange(year, month - 1, day, tz)

  const { data, error } = await supabase
    .from('activities')
    .select('*, activity_types(name, icon)')
    .eq('user_id', userId)
    .gte('logged_at', start)
    .lt('logged_at', end)
    .order('logged_at', { ascending: false })

  if (error) return { activities: [], points: 0 }

  const activities = data || []
  const points = activities.reduce((sum, a) => sum + Number(a.points), 0)
  return { activities, points }
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
