import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AgentEditView } from './agent-edit-view'

interface PageProps {
  params: Promise<{ userId: string }>
}

export default async function AgentEditPage({ params }: PageProps) {
  const { userId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const adminDb = createAdminClient()

  // Fetch the agent's profile
  const { data: agent } = await adminDb
    .from('users')
    .select('id, full_name, email, role, team_id, brokerage_id, is_active')
    .eq('id', userId)
    .single()

  if (!agent) redirect('/admin')

  const typedAgent = agent as {
    id: string
    full_name: string
    email: string
    role: string
    team_id: string | null
    brokerage_id: string | null
    is_active: boolean
  }

  // Fetch available teams in the brokerage
  const { data: teams } = await adminDb
    .from('teams')
    .select('id, name')
    .eq('brokerage_id', typedAgent.brokerage_id || '')
    .order('name')

  return (
    <AgentEditView
      agent={typedAgent}
      teams={(teams || []) as { id: string; name: string }[]}
      isCurrentUser={user.id === userId}
    />
  )
}
