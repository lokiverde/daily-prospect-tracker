'use server'

import { createClient, getBrokerageTimezone } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getDayRange } from '@/lib/calculations'

// Parse 'YYYY-MM-DD' as local date (not UTC)
function parseLocalDate(dateStr: string): { year: number; month: number; day: number } {
  const [year, month, day] = dateStr.split('-').map(Number)
  return { year, month: month - 1, day }
}

export async function getDayActivities(dateStr: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', activities: [], points: 0 }

  const tz = await getBrokerageTimezone()
  const { year, month, day } = parseLocalDate(dateStr)
  const { start, end } = getDayRange(year, month, day, tz)

  const { data, error } = await supabase
    .from('activities')
    .select('*, activity_types(name, icon)')
    .eq('user_id', user.id)
    .gte('logged_at', start)
    .lt('logged_at', end)
    .order('logged_at', { ascending: false })

  if (error) return { error: error.message, activities: [], points: 0 }

  const activities = data || []
  const points = activities.reduce((sum, a) => sum + Number(a.points), 0)

  return { activities, points }
}

export async function logActivity(
  activityTypeId: string,
  points: number,
  contactName?: string,
  notes?: string,
  logDate?: string // ISO date string like '2026-02-26' for backdating
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Determine the target date (today or backdated)
  // Parse date string as local date to avoid UTC shift
  const now = new Date()
  let targetYear: number, targetMonth: number, targetDay: number
  if (logDate) {
    const parsed = parseLocalDate(logDate)
    targetYear = parsed.year
    targetMonth = parsed.month
    targetDay = parsed.day
  } else {
    targetYear = now.getFullYear()
    targetMonth = now.getMonth()
    targetDay = now.getDate()
  }
  const targetDate = new Date(targetYear, targetMonth, targetDay)

  // Only allow backdating up to 5 days
  const daysDiff = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24)
  if (daysDiff > 6) {
    return { error: 'Cannot log activities more than 5 days in the past' }
  }

  // Check daily activity cap (max 50) for the target date
  const tz = await getBrokerageTimezone()
  const { start: startOfDay, end: endOfDay } = getDayRange(targetYear, targetMonth, targetDay, tz)

  const { count } = await supabase
    .from('activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('logged_at', startOfDay)
    .lt('logged_at', endOfDay)

  if (count !== null && count >= 50) {
    return { error: 'Daily activity limit reached (50 max)' }
  }

  // Check per-type daily cap
  const { data: activityType } = await supabase
    .from('activity_types')
    .select('max_daily, name')
    .eq('id', activityTypeId)
    .single()

  if (activityType?.max_daily) {
    const { count: typeCount } = await supabase
      .from('activities')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_type_id', activityTypeId)
      .gte('logged_at', startOfDay)
      .lt('logged_at', endOfDay)

    if (typeCount !== null && typeCount >= activityType.max_daily) {
      return { error: `Daily limit for ${activityType.name} reached (${activityType.max_daily} max)` }
    }
  }

  // If backdating, set logged_at to noon of that day (local time)
  const loggedAt = logDate
    ? new Date(targetYear, targetMonth, targetDay, 12, 0, 0).toISOString()
    : new Date().toISOString()

  const { data, error } = await supabase
    .from('activities')
    .insert({
      user_id: user.id,
      activity_type_id: activityTypeId,
      points,
      contact_name: contactName || null,
      notes: notes || null,
      logged_at: loggedAt,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/log')
  revalidatePath('/')
  return { data }
}

export async function logBatchActivity(
  activityTypeId: string,
  points: number,
  count: number
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const rows = Array.from({ length: count }, () => ({
    user_id: user.id,
    activity_type_id: activityTypeId,
    points,
  }))

  const { data, error } = await supabase
    .from('activities')
    .insert(rows)
    .select()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/log')
  revalidatePath('/')
  return { data }
}

export async function undoActivity(activityId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Verify the activity belongs to the user and was created recently
  const { data: activity } = await supabase
    .from('activities')
    .select('created_at, user_id')
    .eq('id', activityId)
    .single()

  if (!activity || activity.user_id !== user.id) {
    return { error: 'Activity not found' }
  }

  const createdAt = new Date(activity.created_at).getTime()
  const now = Date.now()
  if (now - createdAt > 30000) {
    return { error: 'Undo window has expired (30 seconds)' }
  }

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/log')
  revalidatePath('/')
  return { success: true }
}
