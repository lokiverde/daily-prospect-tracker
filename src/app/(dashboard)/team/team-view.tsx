'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LeaderboardRow } from '@/components/team/leaderboard-row'
import { getLeaderboard, type LeaderboardEntry } from './actions'
import { getDemoLeaderboard } from './demo-actions'

type Period = 'week' | 'month' | 'year'
type Scope = 'team' | 'brokerage'

interface TeamViewProps {
  userId: string
  userRole: string
  userTeamId: string | null
  userBrokerageId: string | null
  initialLeaderboard: LeaderboardEntry[]
  initialPeriod: Period
  initialScope: Scope
  isDemo?: boolean
}

const PERIODS: { label: string; value: Period }[] = [
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
]

export function TeamView({
  userId,
  userRole,
  userTeamId,
  userBrokerageId,
  initialLeaderboard,
  initialPeriod,
  initialScope,
  isDemo = false,
}: TeamViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [scope, setScope] = useState<Scope>(initialScope)
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard)

  const [error, setError] = useState<string | null>(null)
  const canViewDetail = isDemo ? false : ['admin', 'broker', 'team_leader'].includes(userRole)

  function handlePeriodChange(newPeriod: Period) {
    setPeriod(newPeriod)
    fetchLeaderboard(newPeriod, scope)
  }

  function handleScopeChange(newScope: Scope) {
    setScope(newScope)
    fetchLeaderboard(period, newScope)
  }

  function fetchLeaderboard(p: Period, s: Scope) {
    setError(null)
    startTransition(async () => {
      if (isDemo) {
        const result = await getDemoLeaderboard(p)
        setLeaderboard(result.data)
      } else {
        const result = await getLeaderboard(p, s)
        if (result.error) {
          setError(result.error)
        }
        setLeaderboard(result.data)
      }
    })
  }

  function handleMemberTap(memberId: string) {
    router.push(`/team/${memberId}?period=${period}`)
  }

  const hasTeam = !!userTeamId
  const hasBrokerage = !!userBrokerageId

  function getPeriodLabel() {
    const now = new Date()
    if (period === 'week') {
      // Show week range: "Feb 24 - Mar 2, 2026"
      const day = now.getDay()
      const monday = new Date(now)
      monday.setDate(now.getDate() - ((day + 6) % 7))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const fmt = (d: Date) => d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      return `${fmt(monday)} - ${fmt(sunday)}, ${sunday.getFullYear()}`
    }
    if (period === 'month') {
      return now.toLocaleDateString([], { month: 'long', year: 'numeric' })
    }
    return now.getFullYear().toString()
  }

  return (
    <div className="px-4 pb-28 space-y-4">
      {/* Period selector */}
      <div className="flex justify-center pt-3">
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

      {/* Scope tabs - only show when user has both a team and a brokerage (hidden in demo) */}
      {!isDemo && hasTeam && hasBrokerage && (
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => handleScopeChange('team')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors touch-manipulation ${
              scope === 'team'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted'
            }`}
          >
            My Team
          </button>
          <button
            type="button"
            onClick={() => handleScopeChange('brokerage')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors touch-manipulation ${
              scope === 'brokerage'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted'
            }`}
          >
            Brokerage
          </button>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-fire/20 bg-fire/10 px-4 py-2 text-sm text-fire text-center">
          {error}
        </div>
      )}

      {/* Loading indicator */}
      {isPending && (
        <p className="text-center text-xs text-muted py-2">Loading...</p>
      )}

      {/* Empty states */}
      {!isPending && leaderboard.length === 0 && scope === 'team' && !hasTeam && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <span className="text-2xl">👥</span>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-foreground">
            Not on a team yet
          </p>
          <p className="mt-1 text-center text-sm text-muted">
            Ask your broker to assign you to a team
          </p>
        </div>
      )}

      {!isPending && leaderboard.length === 0 && (scope === 'brokerage' || hasTeam) && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <span className="text-2xl">📊</span>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-foreground">
            No activity yet
          </p>
          <p className="mt-1 text-center text-sm text-muted">
            Start logging activities to appear on the leaderboard
          </p>
        </div>
      )}

      {/* Period label + Leaderboard list */}
      {!isPending && leaderboard.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted text-center mb-2">{getPeriodLabel()}</p>
          <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
            {leaderboard.map((entry, index) => (
              <LeaderboardRow
                key={entry.user_id}
                rank={index + 1}
                name={entry.full_name || 'Unknown'}
                totalPoints={Number(entry.total_points)}
                streak={entry.current_streak || 0}
                canViewDetail={canViewDetail}
                onTap={() => handleMemberTap(entry.user_id)}
                isCurrentUser={entry.user_id === userId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
