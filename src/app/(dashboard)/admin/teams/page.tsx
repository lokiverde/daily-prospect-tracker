import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TeamsView } from './teams-view'

export default async function AdminTeamsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('brokerage_id')
    .eq('id', user.id)
    .single()

  const brokerageId = (profile as { brokerage_id: string | null } | null)?.brokerage_id

  if (!brokerageId) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <p className="text-sm text-muted">No brokerage configured</p>
      </div>
    )
  }

  const adminDb = createAdminClient()

  // Fetch teams with leader info and member count
  const { data: teams } = await adminDb
    .from('teams')
    .select('id, name, leader_id, users!teams_leader_id_fkey(full_name)')
    .eq('brokerage_id', brokerageId)
    .order('name')

  // Count members per team
  const { data: memberCounts } = await adminDb
    .from('users')
    .select('team_id')
    .eq('brokerage_id', brokerageId)
    .not('team_id', 'is', null)

  const countMap: Record<string, number> = {}
  for (const row of (memberCounts || []) as { team_id: string }[]) {
    countMap[row.team_id] = (countMap[row.team_id] || 0) + 1
  }

  type TeamRow = {
    id: string
    name: string
    leader_id: string | null
    leaderName: string | null
    memberCount: number
  }

  const teamRows: TeamRow[] = ((teams || []) as {
    id: string
    name: string
    leader_id: string | null
    users: { full_name: string } | null
  }[]).map((t) => ({
    id: t.id,
    name: t.name,
    leader_id: t.leader_id,
    leaderName: t.users?.full_name || null,
    memberCount: countMap[t.id] || 0,
  }))

  return <TeamsView teams={teamRows} />
}
