import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { AdminTabs } from '@/components/admin/admin-tabs'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, brokerage_id')
    .eq('id', user.id)
    .single()

  const role = (profile as { role: string } | null)?.role

  if (!role || !['admin', 'broker'].includes(role)) {
    redirect('/')
  }

  // Auto-assign any users without a brokerage to this admin's brokerage
  const brokerageId = (profile as { brokerage_id: string | null } | null)?.brokerage_id
  if (brokerageId) {
    const adminDb = createAdminClient()
    await adminDb
      .from('users')
      .update({ brokerage_id: brokerageId })
      .is('brokerage_id', null)
  }

  return (
    <>
      <Header title="Admin" subtitle="Brokerage management" />
      <AdminTabs />
      {children}
    </>
  )
}
