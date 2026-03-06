'use server'

import { createClient, getBrokerageTimezone } from '@/lib/supabase/server'
import { getWeekStart, getMonthStart, getYearStart } from '@/lib/calculations'

export type LeaderboardEntry = {
  user_id: string
  full_name: string
  avatar_url: string | null
  team_id: string | null
  brokerage_id: string | null
  brokerage_visibility: string
  total_points: number
  activity_count: number
  current_streak: number
}

export type MemberActivityRow = {
  activity_name: string
  activity_icon: string | null
  activity_count: number
  total_points: number
}

export async function getLeaderboard(
  period: 'week' | 'month' | 'year',
  scope: 'team' | 'brokerage'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated', data: [] as LeaderboardEntry[] }

  const { data: profile } = await supabase
    .from('users')
    .select('role, team_id, brokerage_id')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found', data: [] as LeaderboardEntry[] }

  // Compute timezone-aware period start
  const tz = await getBrokerageTimezone()
  const periodStartMap = {
    week: () => getWeekStart(tz),
    month: () => getMonthStart(tz),
    year: () => getYearStart(tz),
  }
  const periodStart = periodStartMap[period]()

  const params: { p_period: string; p_team_id?: string; p_brokerage_id?: string; p_period_start: string } = {
    p_period: period,
    p_period_start: periodStart,
  }

  if (scope === 'team') {
    if (!profile.team_id) {
      return { data: [] as LeaderboardEntry[] }
    }
    params.p_team_id = profile.team_id
  } else {
    if (!profile.brokerage_id) {
      return { error: 'No brokerage configured', data: [] as LeaderboardEntry[] }
    }
    params.p_brokerage_id = profile.brokerage_id
  }

  const { data, error } = await supabase.rpc('get_leaderboard', params)

  if (error) return { error: error.message, data: [] as LeaderboardEntry[] }

  const entries = (data || []) as LeaderboardEntry[]

  // Admin/broker can see everyone; agents only see public members
  const isAdmin = ['admin', 'broker'].includes(profile.role)
  const filtered = (scope === 'brokerage' && !isAdmin)
    ? entries.filter((e) => e.brokerage_visibility === 'public')
    : entries

  return { data: filtered }
}

export async function getMemberDetail(userId: string, period: 'week' | 'month' | 'year') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  // Check that caller has permission (team_leader, broker, or admin)
  const { data: callerProfile } = await supabase
    .from('users')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile) return { error: 'Profile not found' }

  const canView = ['admin', 'broker'].includes(callerProfile.role)

  if (!canView) {
    // Team leaders can only view their own team members
    if (callerProfile.role === 'team_leader') {
      const { data: target } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', userId)
        .single()

      if (!target || target.team_id !== callerProfile.team_id) {
        return { error: 'Not authorized to view this member' }
      }
    } else {
      return { error: 'Not authorized' }
    }
  }

  // Fetch member profile
  const { data: memberProfile } = await supabase
    .from('users')
    .select('full_name, email, role, avatar_url')
    .eq('id', userId)
    .single()

  // Compute timezone-aware period start
  const tz = await getBrokerageTimezone()
  const periodStartMap = {
    week: () => getWeekStart(tz),
    month: () => getMonthStart(tz),
    year: () => getYearStart(tz),
  }
  const periodStart = periodStartMap[period]()

  // Fetch activity summary via RPC
  const { data: activities, error } = await supabase.rpc('get_member_activity_summary', {
    p_user_id: userId,
    p_period: period,
    p_period_start: periodStart,
  })

  if (error) return { error: error.message }

  // Fetch streak
  const { data: streak } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single()

  return {
    data: {
      profile: memberProfile,
      activities: (activities || []) as MemberActivityRow[],
      streak: streak || { current_streak: 0, longest_streak: 0 },
    },
  }
}
