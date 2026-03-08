'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { getWeekStart, getMonthStart, getYearStart } from '@/lib/calculations'
import type { LeaderboardEntry } from './actions'

async function getDemoTimezone(): Promise<string> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('brokerages')
    .select('settings')
    .limit(1)
    .single()

  const settings = data?.settings as { timezone?: string } | null
  return settings?.timezone || 'America/Los_Angeles'
}

export async function getDemoLeaderboard(
  period: 'week' | 'month' | 'year'
): Promise<{ data: LeaderboardEntry[] }> {
  const supabase = createAdminClient()
  const tz = await getDemoTimezone()

  const periodStartMap = {
    week: () => getWeekStart(tz),
    month: () => getMonthStart(tz),
    year: () => getYearStart(tz),
  }
  const periodStart = periodStartMap[period]()

  // Get the single demo brokerage
  const { data: brokerage } = await supabase
    .from('brokerages')
    .select('id')
    .limit(1)
    .single()

  if (!brokerage) return { data: [] }

  const { data, error } = await supabase.rpc('get_leaderboard', {
    p_period: period,
    p_brokerage_id: brokerage.id,
    p_period_start: periodStart,
  })

  if (error) return { data: [] }

  return { data: (data || []) as LeaderboardEntry[] }
}
