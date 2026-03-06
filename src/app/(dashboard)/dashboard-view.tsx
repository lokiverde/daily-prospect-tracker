'use client'

import { useMemo } from 'react'
import { DailySummary } from '@/components/dashboard/daily-summary'
import { WeeklyHeatmap } from '@/components/dashboard/weekly-heatmap'
import { WeekMonthStats } from '@/components/dashboard/week-month-stats'
import { FunnelChart } from '@/components/dashboard/funnel-chart'
import { QuoteCard } from '@/components/dashboard/quote-card'

function getLocalGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

interface DashboardViewProps {
  userName: string
  dailyGoal: number
  streak: number
  shieldsAvailable: number
  todayPoints: number
  todayActivitiesCount: number
  weekActivities: { points: number; logged_at: string }[]
  weekTotal: number
  monthTotal: number
  funnel: {
    contacts: { actual: number; goal: number }
    appointments: { actual: number; goal: number }
    contracts: { actual: number; goal: number }
    closings: { actual: number; goal: number }
  }
  quote: { text: string; author: string | null } | null
}

export function DashboardView({
  userName,
  dailyGoal,
  streak,
  shieldsAvailable,
  todayPoints,
  todayActivitiesCount,
  weekActivities,
  weekTotal,
  monthTotal,
  funnel,
  quote,
}: DashboardViewProps) {
  const firstName = userName.split(' ')[0]
  const greeting = getLocalGreeting()

  // Group week activities by LOCAL date for the heatmap only
  const weekData = useMemo(() => {
    const map = new Map<string, number>()
    for (const a of weekActivities) {
      const d = new Date(a.logged_at)
      const dateStr = toLocalDateStr(d)
      map.set(dateStr, (map.get(dateStr) || 0) + Number(a.points))
    }
    return [...map.entries()].map(([date, points]) => ({ date, points }))
  }, [weekActivities])

  return (
    <div className="space-y-4 pb-4">
      {/* Greeting */}
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold">
          {greeting}, {firstName}
        </h1>
      </div>

      {/* Today's progress */}
      <DailySummary
        todayPoints={todayPoints}
        dailyGoal={dailyGoal}
        streak={streak}
        shieldsAvailable={shieldsAvailable}
        activitiesCount={todayActivitiesCount}
      />

      {/* Weekly heatmap */}
      <WeeklyHeatmap weekData={weekData} dailyGoal={dailyGoal} />

      {/* Week / Month stats */}
      <WeekMonthStats weekTotal={weekTotal} monthTotal={monthTotal} />

      {/* Funnel chart */}
      <FunnelChart
        stages={[
          { label: 'Contacts', actual: funnel.contacts.actual, goal: funnel.contacts.goal },
          { label: 'Appointments', actual: funnel.appointments.actual, goal: funnel.appointments.goal },
          { label: 'Contracts', actual: funnel.contracts.actual, goal: funnel.contracts.goal },
          { label: 'Closings', actual: funnel.closings.actual, goal: funnel.closings.goal },
        ]}
      />

      {/* Quote */}
      {quote && <QuoteCard text={quote.text} author={quote.author} />}
    </div>
  )
}
