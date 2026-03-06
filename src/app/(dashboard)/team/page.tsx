import { createClient, getBrokerageTimezone } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWeekStart } from '@/lib/calculations'
import { Header } from '@/components/layout/header'
import { TeamView } from './team-view'
import type { LeaderboardEntry } from './actions'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, team_id, brokerage_id')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as {
    role: string
    team_id: string | null
    brokerage_id: string | null
  } | null

  // Default scope: show team if user has one, otherwise brokerage
  const defaultScope = typedProfile?.team_id ? 'team' : 'brokerage'

  // Fetch initial leaderboard with timezone-aware week start
  const tz = await getBrokerageTimezone()
  const rpcParams: { p_period: string; p_team_id?: string; p_brokerage_id?: string; p_period_start: string } = {
    p_period: 'week',
    p_period_start: getWeekStart(tz),
  }

  if (defaultScope === 'team' && typedProfile?.team_id) {
    rpcParams.p_team_id = typedProfile.team_id
  } else if (typedProfile?.brokerage_id) {
    rpcParams.p_brokerage_id = typedProfile.brokerage_id
  }

  const { data: leaderboardData } = await supabase.rpc('get_leaderboard', rpcParams)

  let initialLeaderboard = (leaderboardData || []) as LeaderboardEntry[]

  // For brokerage scope, agents only see public users; admin/broker sees everyone
  const isAdmin = ['admin', 'broker'].includes(typedProfile?.role || '')
  if (defaultScope === 'brokerage' && !isAdmin) {
    initialLeaderboard = initialLeaderboard.filter((e) => e.brokerage_visibility === 'public')
  }

  return (
    <>
      <Header title="Team" subtitle="Leaderboard" />
      <TeamView
        userId={user.id}
        userRole={typedProfile?.role || 'agent'}
        userTeamId={typedProfile?.team_id || null}
        userBrokerageId={typedProfile?.brokerage_id || null}
        initialLeaderboard={initialLeaderboard}
        initialPeriod="week"
        initialScope={defaultScope as 'team' | 'brokerage'}
      />
    </>
  )
}
