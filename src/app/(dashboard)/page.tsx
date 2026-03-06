import { createClient, getBrokerageTimezone } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getWeekStart, getMonthStart, getYearStart, getTodayRange } from '@/lib/calculations'
import { Header } from '@/components/layout/header'
import { DashboardView } from './dashboard-view'
import type { Tables } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const tz = await getBrokerageTimezone()
  const weekStart = getWeekStart(tz)
  const monthStart = getMonthStart(tz)
  const { start: todayStart, end: todayEnd } = getTodayRange(tz)
  const currentYear = new Date().getFullYear()
  const yearStart = getYearStart(tz)

  // Fetch all data in parallel
  const [
    profileResult,
    weekResult,
    monthResult,
    goalsResult,
    streakResult,
    quoteResult,
    weekDailyResult,
    todayResult,
    funnelResult,
  ] = await Promise.all([
    supabase.from('users').select('full_name').eq('id', user.id).single(),
    supabase.from('activities').select('points').eq('user_id', user.id).gte('logged_at', weekStart),
    supabase.from('activities').select('points').eq('user_id', user.id).gte('logged_at', monthStart),
    supabase.from('goals').select('*').eq('user_id', user.id).eq('year', currentYear).single(),
    supabase.from('streaks').select('current_streak, shields_available').eq('user_id', user.id).single(),
    supabase.from('quotes').select('text, author').eq('is_active', true).limit(10),
    supabase.from('activities').select('points, logged_at').eq('user_id', user.id).gte('logged_at', weekStart),
    // Today's activities using precise boundaries (same as log page)
    supabase
      .from('activities')
      .select('points')
      .eq('user_id', user.id)
      .gte('logged_at', todayStart)
      .lt('logged_at', todayEnd),
    // Year-to-date activities with category and name for funnel counts
    supabase
      .from('activities')
      .select('activity_type_id, activity_types!inner(category, name)')
      .eq('user_id', user.id)
      .gte('logged_at', yearStart),
  ])

  const userName = (profileResult.data as { full_name: string } | null)?.full_name || 'there'
  const weekTotal = ((weekResult.data || []) as { points: number }[]).reduce((sum, a) => sum + Number(a.points), 0)
  const monthTotal = ((monthResult.data || []) as { points: number }[]).reduce((sum, a) => sum + Number(a.points), 0)

  // Calculate today's points from precise server-side query (matches log page)
  const todayActivities = (todayResult.data || []) as { points: number }[]
  const todayPoints = todayActivities.reduce((sum, a) => sum + Number(a.points), 0)
  const todayActivitiesCount = todayActivities.length

  const goals = goalsResult.data as Tables<'goals'> | null
  const dailyGoal = goals?.daily_points_goal || 80
  const streakData = streakResult.data as { current_streak: number; shields_available: number } | null
  const streak = streakData?.current_streak || 0
  const shieldsAvailable = streakData?.shields_available || 0

  // Pick a random quote
  const quotes = (quoteResult.data || []) as { text: string; author: string | null }[]
  const quote = quotes.length > 0 ? quotes[Math.floor(Math.random() * quotes.length)] : null

  // Count funnel actuals from year-to-date activities
  // "Contacts" in the funnel = only "Add Client to CRM" (new leads added to pipeline)
  // Phone calls, texts, emails, voicemails are prospecting activities, not funnel contacts
  const funnelActivities = (funnelResult.data || []) as { activity_type_id: string; activity_types: { category: string; name: string } }[]
  const funnelCounts = { contact: 0, appointment: 0, contract: 0, closing: 0 }
  for (const a of funnelActivities) {
    const cat = a.activity_types?.category
    const name = a.activity_types?.name
    if (name === 'Add Client to CRM') {
      funnelCounts.contact++
    } else if (cat === 'appointment') {
      funnelCounts.appointment++
    } else if (cat === 'contract') {
      funnelCounts.contract++
    } else if (cat === 'closing') {
      funnelCounts.closing++
    }
  }

  // Pass raw week activities to client for local-timezone date grouping
  const weekActivities = (weekDailyResult.data || []) as { points: number; logged_at: string }[]

  return (
    <>
      <Header title="Dashboard" />
      <DashboardView
        userName={userName}
        dailyGoal={dailyGoal}
        streak={streak}
        shieldsAvailable={shieldsAvailable}
        todayPoints={todayPoints}
        todayActivitiesCount={todayActivitiesCount}
        weekActivities={weekActivities}
        weekTotal={weekTotal}
        monthTotal={monthTotal}
        funnel={{
          contacts: { actual: funnelCounts.contact, goal: goals?.contacts_goal || 0 },
          appointments: { actual: funnelCounts.appointment, goal: goals?.appointments_goal || 0 },
          contracts: { actual: funnelCounts.contract, goal: goals?.contracts_goal || 0 },
          closings: { actual: funnelCounts.closing, goal: goals?.closings_goal || 0 },
        }}
        quote={quote}
      />
    </>
  )
}
