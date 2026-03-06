import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { HistoryView } from './history-view'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch last 7 days of activities with type info
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: activities } = await supabase
    .from('activities')
    .select('id, activity_type_id, points, contact_name, notes, logged_at, activity_types(name, icon, category)')
    .eq('user_id', user.id)
    .gte('logged_at', sevenDaysAgo.toISOString())
    .order('logged_at', { ascending: false })
    .limit(200)

  const typedActivities = (activities ?? []) as Array<{
    id: string
    activity_type_id: string
    points: number
    contact_name: string | null
    notes: string | null
    logged_at: string
    activity_types: {
      name: string
      icon: string
      category: string
    } | null
  }>

  return (
    <>
      <Header title="Activity History" subtitle="Your recent activities" />
      <HistoryView initialActivities={typedActivities} userId={user.id} />
    </>
  )
}
