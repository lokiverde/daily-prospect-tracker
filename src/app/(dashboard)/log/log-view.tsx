'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import type { Tables } from '@/lib/supabase/types'
import { Header } from '@/components/layout/header'
import { PointsRing } from '@/components/dashboard/points-ring'
import { Confetti } from '@/components/dashboard/confetti'
import { ActivityGrid } from '@/components/activity/activity-grid'
import { BatchStepper } from '@/components/activity/batch-stepper'
import { QuickUndo } from '@/components/activity/quick-undo'
import { FloatingPoints } from '@/components/activity/floating-points'
import { EmptyState } from '@/components/activity/empty-state'
import { getPointsToGoal } from '@/lib/calculations'
import { logActivity, logBatchActivity, undoActivity, getDayActivities } from './actions'
import { logDemoActivity, undoDemoActivity } from './demo-actions'

interface LogViewProps {
  activityTypes: Tables<'activity_types'>[]
  todayActivities: (Tables<'activities'> & {
    activity_types: { name: string; icon: string | null } | null
  })[]
  todayPoints: number
  dailyGoal: number
  streak: number
  shieldsAvailable: number
  recentTypeIds: string[]
  isDemo?: boolean
}

interface FloatingPoint {
  id: string
  points: number
  x: number
  y: number
}

interface UndoItem {
  id: string
  name: string
  points: number
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
}

export function LogView({
  activityTypes,
  todayActivities: initialActivities,
  todayPoints: initialPoints,
  dailyGoal,
  streak,
  shieldsAvailable,
  recentTypeIds,
  isDemo = false,
}: LogViewProps) {
  const [points, setPoints] = useState(initialPoints)
  const [activities, setActivities] = useState(initialActivities)
  const [floatingPoints, setFloatingPoints] = useState<FloatingPoint[]>([])
  const [undoItem, setUndoItem] = useState<UndoItem | null>(null)
  const [batchType, setBatchType] = useState<Tables<'activity_types'> | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDateLoading, setIsDateLoading] = useState(false)
  const searchParams = useSearchParams()
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didAutoSelectRef = useRef(false)

  // Date strings for today, yesterday, and oldest allowed (5 days back)
  const todayStr = toLocalDateStr(new Date())
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayStr = toLocalDateStr(yesterdayDate)
  const oldestDate = new Date()
  oldestDate.setDate(oldestDate.getDate() - 5)
  const oldestStr = toLocalDateStr(oldestDate)

  // Selected date as YYYY-MM-DD string (defaults to today)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const isToday = selectedDate === todayStr

  function getDateLabel(dateStr: string): string {
    if (dateStr === todayStr) return 'Today'
    if (dateStr === yesterdayStr) return 'Yesterday'
    return formatDateLabel(dateStr)
  }

  function navigateDay(offset: -1 | 1) {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const next = new Date(y, m - 1, d + offset)
    const nextStr = toLocalDateStr(next)
    // Clamp: never go past today or before oldest
    if (nextStr > todayStr || nextStr < oldestStr) return
    loadDate(nextStr)
  }

  // Store today's data so we can restore when switching back
  const todayDataRef = useRef({ points: initialPoints, activities: initialActivities })

  // Auto-load date from ?date= param on mount
  useEffect(() => {
    const dateParam = searchParams.get('date')
    if (dateParam && dateParam !== todayStr && !didAutoSelectRef.current) {
      didAutoSelectRef.current = true
      loadDate(dateParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadDate(dateStr: string) {
    if (dateStr === selectedDate) return

    // Save today's data before switching away
    if (selectedDate === todayStr) {
      todayDataRef.current = { points, activities }
    }

    setSelectedDate(dateStr)
    setUndoItem(null)

    if (dateStr === todayStr) {
      // Restore today's cached data
      setPoints(todayDataRef.current.points)
      setActivities(todayDataRef.current.activities)
    } else {
      setIsDateLoading(true)
      const result = await getDayActivities(dateStr)
      setPoints(result.points)
      setActivities(result.activities as typeof activities)
      setIsDateLoading(false)
    }
  }

  const handleActivityTap = useCallback(
    async (typeId: string, pts: number, name: string, icon: string) => {
      void icon // used for display in the activity list
      const prevPoints = points
      setPoints((p) => p + pts)
      setError(null)

      // Floating points animation
      const id = `${Date.now()}-${Math.random()}`
      setFloatingPoints((prev) => [
        ...prev,
        { id, points: pts, x: window.innerWidth / 2 - 20, y: window.innerHeight / 3 },
      ])

      // Check goal hit
      if (prevPoints < dailyGoal && prevPoints + pts >= dailyGoal) {
        setShowConfetti(true)
      }

      const result = isDemo
        ? await logDemoActivity(typeId, pts)
        : await logActivity(
            typeId,
            pts,
            undefined,
            undefined,
            !isToday ? selectedDate : undefined
          )

      if (result.error) {
        setPoints(prevPoints)
        setError(result.error)
        return
      }

      if (result.data) {
        const newActivity = result.data as Tables<'activities'>
        const newEntry = { ...newActivity, activity_types: { name, icon: icon || null } }
        setActivities((prev) => {
          const updated = [newEntry, ...prev]
          // Keep today's ref in sync
          if (isToday) {
            todayDataRef.current = { points: prevPoints + pts, activities: updated }
          }
          return updated
        })

        // Undo timer
        if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
        setUndoItem({ id: newActivity.id, name, points: pts })
        undoTimerRef.current = setTimeout(() => setUndoItem(null), 30000)
      }
    },
    [points, dailyGoal, isToday, selectedDate, isDemo]
  )

  const handleBatchConfirm = useCallback(
    async (count: number) => {
      if (!batchType) return

      const totalPts = count * batchType.points
      const prevPoints = points

      setPoints((p) => p + totalPts)
      setBatchType(null)

      if (prevPoints < dailyGoal && prevPoints + totalPts >= dailyGoal) {
        setShowConfetti(true)
      }

      const result = await logBatchActivity(batchType.id, batchType.points, count)

      if (result.error) {
        setPoints(prevPoints)
        setError(result.error)
      }
    },
    [batchType, points, dailyGoal]
  )

  const handleUndo = useCallback(async () => {
    if (!undoItem) return

    const prevPoints = points
    setPoints((p) => p - undoItem.points)

    const result = isDemo
      ? await undoDemoActivity(undoItem.id)
      : await undoActivity(undoItem.id)

    if (result.error) {
      setPoints(prevPoints)
      setError(result.error)
    } else {
      setActivities((prev) => prev.filter((a) => a.id !== undoItem.id))
    }

    setUndoItem(null)
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
  }, [undoItem, points, isDemo])

  const removeFloatingPoint = useCallback((id: string) => {
    setFloatingPoints((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const progressText = getPointsToGoal(points, dailyGoal)

  return (
    <>
      <Header title="Log Activity" subtitle={`${Math.round(points)} / ${dailyGoal} pts`} />
      <div className="flex flex-col min-h-full">
        <Confetti active={showConfetti} />

        {/* Floating point animations */}
        {floatingPoints.map((fp) => (
          <FloatingPoints
            key={fp.id}
            id={fp.id}
            points={fp.points}
            x={fp.x}
            y={fp.y}
            onComplete={() => removeFloatingPoint(fp.id)}
          />
        ))}

        {/* Date navigator (hidden in demo mode) */}
        {!isDemo && <div className="flex items-center justify-center gap-2 pt-3 pb-1">
          <button
            type="button"
            onClick={() => navigateDay(-1)}
            disabled={isDateLoading || selectedDate <= oldestStr}
            className="p-2 rounded-full text-muted hover:text-foreground hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent touch-manipulation"
            aria-label="Previous day"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4l-6 6 6 6" /></svg>
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[120px] text-center">
            {getDateLabel(selectedDate)}
          </span>
          {!isToday ? (
            <button
              type="button"
              onClick={() => navigateDay(1)}
              disabled={isDateLoading}
              className="p-2 rounded-full text-muted hover:text-foreground hover:bg-secondary touch-manipulation"
              aria-label="Next day"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 4l6 6-6 6" /></svg>
            </button>
          ) : (
            <div className="w-9" />
          )}
          {!isToday && (
            <button
              type="button"
              onClick={() => loadDate(todayStr)}
              disabled={isDateLoading}
              className="text-xs font-medium text-primary touch-manipulation ml-1"
            >
              Today
            </button>
          )}
        </div>}

        {!isDemo && !isToday && (
          <p className="text-center text-xs text-warning font-medium">
            Logging for {getDateLabel(selectedDate)}
          </p>
        )}

        {/* Points ring section */}
        <div className="flex flex-col items-center pt-4 pb-3">
          <PointsRing
            current={points}
            goal={dailyGoal}
            streak={streak}
            shieldsAvailable={shieldsAvailable}
            size="lg"
            onGoalHit={() => setShowConfetti(true)}
          />
          <p className="mt-2 text-sm text-muted">{progressText}</p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mx-4 mb-3 px-3 py-2 bg-fire/10 text-fire text-sm rounded-lg text-center">
            {error}
          </div>
        )}

        {/* Empty state or activity grid */}
        <div className="flex-1 px-4 pb-4 overflow-y-auto">
          {points === 0 && activities.length === 0 && <EmptyState />}
          <ActivityGrid
            activityTypes={activityTypes}
            recentTypeIds={recentTypeIds}
            onActivityTap={handleActivityTap}
            onActivityLongPress={(type) => setBatchType(type)}
          />

          {/* Today's logged activities */}
          {activities.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
                {isToday ? "Today's" : `${getDateLabel(selectedDate)}'s`} Activity ({activities.length})
              </h3>
              <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                {activities.map((a) => {
                  const pts = Number(a.points)
                  const displayPts = Number.isInteger(pts) ? pts.toString() : pts.toFixed(1)
                  const time = new Date(a.logged_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  return (
                    <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="text-lg" role="img" aria-hidden="true">
                        {a.activity_types?.icon || '📌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {a.activity_types?.name || 'Activity'}
                        </p>
                        <p className="text-xs text-muted">{time}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">+{displayPts}</span>
                    </div>
                  )
                })}
              </div>
              {!isDemo && (
                <Link
                  href="/history"
                  className="block text-center text-sm text-primary font-medium py-3 touch-manipulation"
                >
                  View All History
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Batch stepper */}
        {batchType && (
          <BatchStepper
            activityName={batchType.name}
            activityIcon={batchType.icon || '📌'}
            points={batchType.points}
            maxDaily={batchType.max_daily}
            onConfirm={handleBatchConfirm}
            onCancel={() => setBatchType(null)}
          />
        )}

        {/* Undo toast */}
        {undoItem && (
          <QuickUndo
            activityName={undoItem.name}
            points={undoItem.points}
            onUndo={handleUndo}
            duration={30}
          />
        )}
      </div>
    </>
  )
}
