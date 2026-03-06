'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { getHeatmapColorClass } from '@/lib/activities'
import { format, startOfWeek, addDays } from 'date-fns'

interface WeeklyHeatmapProps {
  weekData: { date: string; points: number }[]
  dailyGoal: number
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function WeeklyHeatmap({ weekData, dailyGoal }: WeeklyHeatmapProps) {
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const today = new Date()

  const days = DAY_LABELS.map((label, i) => {
    const date = addDays(monday, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayData = weekData.find((d) => d.date === dateStr)
    const points = dayData?.points || 0
    const isFuture = date > today
    const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')

    return {
      label,
      date: dateStr,
      points,
      isFuture,
      isToday,
      colorClass: isFuture ? 'bg-secondary/50' : getHeatmapColorClass(points, dailyGoal),
    }
  })

  return (
    <div className="px-4 py-3">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
        This Week
      </h3>
      <div className="flex gap-1.5">
        {days.map((day) => (
          <Link
            key={day.date}
            href={day.isFuture ? '#' : `/log?date=${day.date}`}
            className="flex-1 flex flex-col items-center gap-1 touch-manipulation"
            onClick={day.isFuture ? (e) => e.preventDefault() : undefined}
          >
            <span className="text-[10px] text-muted-foreground">{day.label}</span>
            <div
              className={cn(
                'w-full aspect-square rounded-md transition-colors',
                day.colorClass,
                day.isToday && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
              )}
              title={`${day.label}: ${day.points} pts`}
            />
            {!day.isFuture && day.points > 0 && (
              <span className="text-[9px] font-medium text-muted-foreground">
                {Math.round(day.points)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
