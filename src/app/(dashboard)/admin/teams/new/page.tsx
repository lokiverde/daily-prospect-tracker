import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateTeamView } from './create-team-view'

export default async function CreateTeamPage() {
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

  // Fetch agents for leader picker
  const { data: agents } = await adminDb
    .from('users')
    .select('id, full_name, role')
    .eq('brokerage_id', brokerageId)
    .order('full_name')

  type AgentOption = { id: string; full_name: string; role: string }

  return <CreateTeamView agents={(agents || []) as AgentOption[]} />
}
