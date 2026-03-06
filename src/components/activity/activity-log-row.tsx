'use client'

import { format, parseISO } from 'date-fns'

interface ActivityLogRowProps {
  activity: {
    id: string
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
}

export function ActivityLogRow({ activity }: ActivityLogRowProps) {
  const type = activity.activity_types
  const time = format(parseISO(activity.logged_at), 'h:mm a')
  const points = Number(activity.points)

  return (
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
      <div className="text-right shrink-0">
        <p className="text-sm font-bold">
          +{Number.isInteger(points) ? points : points.toFixed(1)}
        </p>
        <p className="text-xs text-muted">{time}</p>
      </div>
    </div>
  )
}
