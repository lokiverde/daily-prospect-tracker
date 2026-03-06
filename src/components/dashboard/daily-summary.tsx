'use client'

import { PointsRing } from './points-ring'
import { getPointsToGoal } from '@/lib/calculations'

interface DailySummaryProps {
  todayPoints: number
  dailyGoal: number
  streak: number
  shieldsAvailable: number
  activitiesCount: number
}

export function DailySummary({
  todayPoints,
  dailyGoal,
  streak,
  shieldsAvailable,
  activitiesCount,
}: DailySummaryProps) {
  const progressText = getPointsToGoal(todayPoints, dailyGoal)

  return (
    <div className="flex flex-col items-center py-4">
      <PointsRing
        current={todayPoints}
        goal={dailyGoal}
        streak={streak}
        shieldsAvailable={shieldsAvailable}
        size="lg"
      />
      <p className="mt-2 text-sm font-medium text-muted">{progressText}</p>
      <p className="text-xs text-muted-foreground mt-1">
        {activitiesCount} {activitiesCount === 1 ? 'activity' : 'activities'} logged today
      </p>
    </div>
  )
}
