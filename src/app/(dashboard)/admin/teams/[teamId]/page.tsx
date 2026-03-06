import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { TeamEditView } from './team-edit-view'

interface Props {
  params: Promise<{ teamId: string }>
}

export default async function TeamEditPage({ params }: Props) {
  const { teamId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('brokerage_id')
    .eq('id', user.id)
    .single()

  const brokerageId = (profile as { brokerage_id: string | null } | null)?.brokerage_id
  if (!brokerageId) redirect('/admin/teams')

  const adminDb = createAdminClient()

  // Fetch team
  const { data: team } = await adminDb
    .from('teams')
    .select('id, name, leader_id')
    .eq('id', teamId)
    .single()

  if (!team) notFound()

  // Fetch team members
  const { data: members } = await adminDb
    .from('users')
    .select('id, full_name, email, role')
    .eq('team_id', teamId)
    .order('full_name')

  // Fetch all brokerage agents with their team info
  const { data: agents } = await adminDb
    .from('users')
    .select('id, full_name, role, team_id, teams!team_id(name)')
    .eq('brokerage_id', brokerageId)
    .order('full_name')

  type MemberRow = { id: string; full_name: string; email: string; role: string }
  type AgentOption = {
    id: string
    full_name: string
    role: string
    team_id: string | null
    teamName: string | null
  }

  const agentRows: AgentOption[] = ((agents || []) as {
    id: string
    full_name: string
    role: string
    team_id: string | null
    teams: { name: string } | null
  }[]).map((a) => ({
    id: a.id,
    full_name: a.full_name,
    role: a.role,
    team_id: a.team_id,
    teamName: a.teams?.name || null,
  }))

  return (
    <TeamEditView
      team={team as { id: string; name: string; leader_id: string | null }}
      members={(members || []) as MemberRow[]}
      agents={agentRows}
    />
  )
}
