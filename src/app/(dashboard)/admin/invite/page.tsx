import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InviteView } from './invite-view'

export default async function InvitePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('brokerage_id')
    .eq('id', user.id)
    .single()

  const brokerageId = (profile as { brokerage_id: string | null } | null)?.brokerage_id

  if (!brokerageId) redirect('/admin')

  // Fetch teams for optional team assignment
  const { data: teams } = await supabase
    .from('teams')
    .select('id, name')
    .eq('brokerage_id', brokerageId)
    .order('name')

  return (
    <InviteView
      teams={(teams || []) as { id: string; name: string }[]}
    />
  )
}
