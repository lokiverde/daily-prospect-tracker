import { createClient, getBrokerageTimezone, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTodayRange } from '@/lib/calculations'
import { LogView } from './log-view'
import { isDemoMode, DEMO_AGENT_EMAIL } from '@/lib/demo'
import type { Tables } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

type ActivityWithType = Tables<'activities'> & {
  activity_types: { name: string; icon: string | null } | null
}

export default async function LogPage() {
  // Demo mode: use admin client and demo user
  if (isDemoMode()) {
    const supabase = createAdminClient()

    // Look up demo user
    const { data: demoUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', DEMO_AGENT_EMAIL)
      .single()

    const demoUserId = demoUser?.id || ''

    // Get brokerage timezone
    const { data: brokerage } = await supabase
      .from('brokerages')
      .select('settings')
      .limit(1)
      .single()
    const tz = (brokerage?.settings as { timezone?: string } | null)?.timezone || 'America/Los_Angeles'
    const { start, end } = getTodayRange(tz)

    const [activityTypesResult, todayActivitiesResult] = await Promise.all([
      supabase.from('activity_types').select('*').eq('is_active', true).order('sort_order'),
      demoUserId
        ? supabase
            .from('activities')
            .select('*, activity_types(name, icon)')
            .eq('user_id', demoUserId)
            .gte('logged_at', start)
            .lt('logged_at', end)
            .order('logged_at', { ascending: false })
        : Promise.resolve({ data: [] }),
    ])

    const activityTypes = (activityTypesResult.data || []) as Tables<'activity_types'>[]
    const todayActivities = (todayActivitiesResult.data || []) as ActivityWithType[]
    const todayPoints = todayActivities.reduce((sum, a) => sum + Number(a.points), 0)

    return (
      <LogView
        activityTypes={activityTypes}
        todayActivities={todayActivities}
        todayPoints={todayPoints}
        dailyGoal={80}
        streak={0}
        shieldsAvailable={0}
        recentTypeIds={[]}
        isDemo
      />
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tz = await getBrokerageTimezone()
  const { start, end } = getTodayRange(tz)

  // Fetch all needed data in parallel
  const [
    activityTypesResult,
    todayActivitiesResult,
    goalsResult,
    streakResult,
    frequentResult,
  ] = await Promise.all([
    // Active activity types
    supabase
      .from('activity_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order'),

    // Today's activities
    supabase
      .from('activities')
      .select('*, activity_types(name, icon)')
      .eq('user_id', user.id)
      .gte('logged_at', start)
      .lt('logged_at', end)
      .order('logged_at', { ascending: false }),

    // Current year goals
    supabase
      .from('goals')
      .select('daily_points_goal')
      .eq('user_id', user.id)
      .eq('year', new Date().getFullYear())
      .single(),

    // Streak
    supabase
      .from('streaks')
      .select('current_streak, shields_available')
      .eq('user_id', user.id)
      .single(),

    // Most frequently used activity types (last 30 days)
    supabase
      .from('activities')
      .select('activity_type_id')
      .eq('user_id', user.id)
      .gte('logged_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('logged_at', { ascending: false })
      .limit(100),
  ])

  const activityTypes = (activityTypesResult.data || []) as Tables<'activity_types'>[]
  const todayActivities = (todayActivitiesResult.data || []) as ActivityWithType[]
  const dailyGoal = goalsResult.data?.daily_points_goal || 80
  const streak = streakResult.data?.current_streak || 0
  const shieldsAvailable = streakResult.data?.shields_available || 0
  const frequentData = frequentResult.data || []

  // Calculate today's total points
  const todayPoints = todayActivities.reduce((sum, a) => sum + Number(a.points), 0)

  // Calculate most frequent activity type IDs
  const frequencyMap = new Map<string, number>()
  for (const a of frequentData) {
    frequencyMap.set(a.activity_type_id, (frequencyMap.get(a.activity_type_id) || 0) + 1)
  }
  const recentTypeIds = [...frequencyMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id)

  return (
    <LogView
      activityTypes={activityTypes}
      todayActivities={todayActivities}
      todayPoints={todayPoints}
      dailyGoal={dailyGoal}
      streak={streak}
      shieldsAvailable={shieldsAvailable}
      recentTypeIds={recentTypeIds}
    />
  )
}
