'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getMemberDetail, type MemberActivityRow } from '../actions'

type Period = 'week' | 'month' | 'year'

interface MemberDetailViewProps {
  memberId: string
  memberName: string
  memberRole: string
  activities: MemberActivityRow[]
  currentStreak: number
  longestStreak: number
  initialPeriod: Period
}

const PERIODS: { label: string; value: Period }[] = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
]

export function MemberDetailView({
  memberId,
  memberName,
  memberRole,
  activities: initialActivities,
  currentStreak,
  longestStreak,
  initialPeriod,
}: MemberDetailViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [activities, setActivities] = useState(initialActivities)

  function handlePeriodChange(newPeriod: Period) {
    setPeriod(newPeriod)
    startTransition(async () => {
      const result = await getMemberDetail(memberId, newPeriod)
      if (result.data) {
        setActivities(result.data.activities)
      }
    })
  }

  const totalPoints = activities.reduce((sum, a) => sum + Number(a.total_points), 0)
  const totalActivities = activities.reduce((sum, a) => sum + Number(a.activity_count), 0)

  const roleLabel = memberRole === 'admin' ? 'Admin'
    : memberRole === 'broker' ? 'Broker'
    : memberRole === 'team_leader' ? 'Team Leader'
    : 'Agent'

  return (
    <div className="px-4 pb-28 space-y-4">
      {/* Back button */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-primary font-medium py-2 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Leaderboard
      </button>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-primary">{Math.round(totalPoints)}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">Points</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{totalActivities}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">Activities</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-2xl font-bold">{currentStreak > 0 ? `🔥 ${currentStreak}` : '0'}</p>
          <p className="text-[10px] text-muted uppercase tracking-wider">Streak</p>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex justify-center">
        <div className="inline-flex bg-secondary rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => handlePeriodChange(p.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors touch-manipulation ${
                period === p.value
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isPending && (
        <p className="text-center text-xs text-muted py-2">Loading...</p>
      )}

      {/* Activity breakdown */}
      {!isPending && activities.length > 0 && (
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
              Activity Breakdown
            </h3>
          </div>
          <div className="divide-y divide-border">
            {activities.map((a) => {
              const pts = Number(a.total_points)
              const displayPts = Number.isInteger(pts) ? pts.toString() : pts.toFixed(1)
              return (
                <div key={a.activity_name} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="text-lg shrink-0" role="img" aria-hidden="true">
                    {a.activity_icon || '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {a.activity_name}
                    </p>
                    <p className="text-xs text-muted">{a.activity_count}x logged</p>
                  </div>
                  <span className="text-sm font-bold text-primary">{displayPts} pts</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {!isPending && activities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="text-3xl">📭</span>
          <p className="mt-3 text-sm text-muted">No activity for this period</p>
        </div>
      )}

      {/* Streak info */}
      {longestStreak > 0 && (
        <div className="bg-card border border-border rounded-xl px-4 py-3">
          <p className="text-xs text-muted">
            Longest streak: <span className="font-semibold text-foreground">{longestStreak} days</span>
          </p>
        </div>
      )}
    </div>
  )
}
