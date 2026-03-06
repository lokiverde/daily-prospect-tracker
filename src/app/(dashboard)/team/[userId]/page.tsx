import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { MemberDetailView } from './member-detail-view'
import type { MemberActivityRow } from '../actions'

interface PageProps {
  params: Promise<{ userId: string }>
  searchParams: Promise<{ period?: string }>
}

export default async function MemberDetailPage({ params, searchParams }: PageProps) {
  const { userId } = await params
  const { period: periodParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check caller has permission
  const { data: callerProfile } = await supabase
    .from('users')
    .select('role, team_id')
    .eq('id', user.id)
    .single()

  if (!callerProfile) redirect('/team')

  const canView = ['admin', 'broker', 'team_leader'].includes(callerProfile.role)
  if (!canView) redirect('/team')

  // If team leader, verify target is on their team
  if (callerProfile.role === 'team_leader') {
    const { data: target } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', userId)
      .single()

    if (!target || target.team_id !== callerProfile.team_id) {
      redirect('/team')
    }
  }

  const period = (['week', 'month', 'year'].includes(periodParam || '') ? periodParam : 'week') as 'week' | 'month' | 'year'

  // Fetch member profile
  const { data: memberProfile } = await supabase
    .from('users')
    .select('full_name, email, role, avatar_url')
    .eq('id', userId)
    .single()

  // Fetch activity summary via RPC
  const { data: activities } = await supabase.rpc('get_member_activity_summary', {
    p_user_id: userId,
    p_period: period,
  })

  // Fetch streak
  const { data: streak } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak')
    .eq('user_id', userId)
    .single()

  const typedProfile = memberProfile as {
    full_name: string
    email: string
    role: string
    avatar_url: string | null
  } | null

  return (
    <>
      <Header
        title={typedProfile?.full_name || 'Member'}
        subtitle={typedProfile?.role === 'team_leader' ? 'Team Leader' : 'Agent'}
      />
      <MemberDetailView
        memberId={userId}
        memberName={typedProfile?.full_name || 'Unknown'}
        memberRole={typedProfile?.role || 'agent'}
        activities={(activities || []) as MemberActivityRow[]}
        currentStreak={streak?.current_streak || 0}
        longestStreak={streak?.longest_streak || 0}
        initialPeriod={period}
      />
    </>
  )
}
