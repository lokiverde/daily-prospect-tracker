import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentsView } from './agents-view'

export default async function AdminAgentsPage() {
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

  // Use admin client to bypass RLS for admin operations
  const adminDb = createAdminClient()

  // Fetch all agents in the brokerage with team info (using admin client to see all)
  const { data: agents } = await adminDb
    .from('users')
    .select('id, full_name, email, role, team_id, teams!team_id(name)')
    .eq('brokerage_id', brokerageId)
    .order('full_name')


  // Fetch teams for the team assignment picker
  const { data: teams } = await adminDb
    .from('teams')
    .select('id, name')
    .eq('brokerage_id', brokerageId)
    .order('name')

  type AgentRow = {
    id: string
    full_name: string
    email: string
    role: string
    team_id: string | null
    teams: { name: string } | null
  }

  return (
    <AgentsView
      agents={(agents || []) as AgentRow[]}
      teams={(teams || []) as { id: string; name: string }[]}
    />
  )
}
