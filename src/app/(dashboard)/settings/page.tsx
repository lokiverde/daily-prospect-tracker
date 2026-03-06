import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { SettingsView } from './settings-view'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('id, full_name, email, role, brokerage_visibility')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as {
    id: string
    full_name: string
    email: string
    role: string
    brokerage_visibility: string
  } | null

  const currentYear = new Date().getFullYear()
  const { data: goals } = await supabase
    .from('goals')
    .select('daily_points_goal')
    .eq('user_id', user.id)
    .eq('year', currentYear)
    .single()

  const typedGoals = goals as { daily_points_goal: number } | null

  return (
    <>
      <Header title="Settings" subtitle="Your profile and preferences" />
      <SettingsView
        profile={typedProfile}
        dailyGoal={typedGoals?.daily_points_goal ? Number(typedGoals.daily_points_goal) : 80}
      />
    </>
  )
}
