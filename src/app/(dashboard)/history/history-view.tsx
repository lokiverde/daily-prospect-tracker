'use client'

import { useState, useTransition, useCallback } from 'react'
import { format, isToday, isYesterday, parseISO } from 'date-fns'
import { loadMoreActivities, deleteActivity } from './actions'

interface Activity {
  id: string
  activity_type_id: string
  points: number
  contact_name: string | null
  notes: string | null
  logged_at: string
  activity_types: {
    name: string
    icon: string | null
    category: string
  } | null
}

interface HistoryViewProps {
  initialActivities: Activity[]
  userId: string
}

export function HistoryView({ initialActivities, userId }: HistoryViewProps) {
  const [activities, setActivities] = useState(initialActivities)
  const [hasMore, setHasMore] = useState(initialActivities.length >= 200)
  const [isPending, startTransition] = useTransition()
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Group activities by date
  const grouped = groupByDate(activities)

  function handleLoadMore() {
    if (activities.length === 0) return
    const oldest = activities[activities.length - 1].logged_at

    startTransition(async () => {
      const result = await loadMoreActivities(oldest)
      if (result.error || !result.data) return

      const newActivities = result.data as Activity[]
      if (newActivities.length < 200) setHasMore(false)
      setActivities((prev) => [...prev, ...newActivities])
    })
  }

  const handleDelete = useCallback(async (activityId: string) => {
    setDeletingId(activityId)
    const result = await deleteActivity(activityId)
    if (result.success) {
      setActivities((prev) => prev.filter((a) => a.id !== activityId))
    }
    setDeletingId(null)
    setConfirmDeleteId(null)
  }, [])

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <span className="text-2xl">📋</span>
        </div>
        <p className="mt-4 text-center text-sm font-medium text-foreground">
          No activities yet
        </p>
        <p className="mt-1 text-center text-sm text-muted">
          Start logging activities and they will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="pb-28">
      {grouped.map(({ dateLabel, dateActivities }) => (
        <div key={dateLabel}>
          <div className="sticky top-12 z-10 bg-background/95 backdrop-blur-sm px-4 py-2 border-b border-border">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
              {dateLabel}
            </h3>
          </div>
          <div className="divide-y divide-border">
            {dateActivities.map((activity) => {
              const type = activity.activity_types
              const time = format(parseISO(activity.logged_at), 'h:mm a')
              const points = Number(activity.points)
              const isConfirming = confirmDeleteId === activity.id
              const isDeleting = deletingId === activity.id

              return (
                <div key={activity.id} className="relative overflow-hidden">
                  {isConfirming ? (
                    <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-950/30">
                      <p className="text-sm text-red-700 dark:text-red-300">Delete this activity?</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="h-8 px-3 rounded-lg text-xs font-medium bg-secondary text-foreground touch-manipulation"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(activity.id)}
                          disabled={isDeleting}
                          className="h-8 px-3 rounded-lg text-xs font-medium bg-red-600 text-white touch-manipulation disabled:opacity-50"
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-lg shrink-0">
                        {type?.icon ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {type?.name ?? 'Unknown Activity'}
                        </p>
                        {activity.contact_name && (
                          <p className="text-xs text-muted truncate">{activity.contact_name}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 mr-2">
                        <p className="text-sm font-bold">
                          +{Number.isInteger(points) ? points : points.toFixed(1)}
                        </p>
                        <p className="text-xs text-muted">{time}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(activity.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 touch-manipulation shrink-0"
                        aria-label="Delete activity"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="px-4 py-6 flex justify-center">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={isPending}
            className="h-10 px-6 rounded-xl text-sm font-medium bg-secondary text-foreground touch-manipulation"
          >
            {isPending ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

function groupByDate(activities: Activity[]) {
  const groups: Map<string, Activity[]> = new Map()

  for (const activity of activities) {
    const date = format(parseISO(activity.logged_at), 'yyyy-MM-dd')
    const existing = groups.get(date) ?? []
    existing.push(activity)
    groups.set(date, existing)
  }

  return Array.from(groups.entries()).map(([date, dateActivities]) => {
    const parsed = parseISO(date)
    let dateLabel: string
    if (isToday(parsed)) {
      dateLabel = 'Today'
    } else if (isYesterday(parsed)) {
      dateLabel = 'Yesterday'
    } else {
      dateLabel = format(parsed, 'EEEE, MMM d')
    }
    return { dateLabel, dateActivities }
  })
}
