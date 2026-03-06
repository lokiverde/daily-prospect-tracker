'use client'

import type { Tables } from '@/lib/supabase/types'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/activities'
import { ActivityButton } from './activity-button'

interface ActivityGridProps {
  activityTypes: Tables<'activity_types'>[]
  recentTypeIds: string[]
  onActivityTap: (typeId: string, points: number, name: string, icon: string) => void
  onActivityLongPress: (type: Tables<'activity_types'>) => void
}

export function ActivityGrid({
  activityTypes,
  recentTypeIds,
  onActivityTap,
  onActivityLongPress,
}: ActivityGridProps) {
  // Build "Recently Used" list
  const recentTypes = recentTypeIds
    .map((id) => activityTypes.find((t) => t.id === id))
    .filter(Boolean) as Tables<'activity_types'>[]

  // Group remaining by category
  const grouped = new Map<string, Tables<'activity_types'>[]>()
  for (const cat of CATEGORY_ORDER) {
    const items = activityTypes
      .filter((t) => t.category === cat)
      .sort((a, b) => a.sort_order - b.sort_order)
    if (items.length > 0) {
      grouped.set(cat, items)
    }
  }

  return (
    <div className="space-y-4">
      {/* Recently Used */}
      {recentTypes.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">
            Recently Used
          </h3>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {recentTypes.map((type) => (
              <ActivityButton
                key={`recent-${type.id}`}
                name={type.name}
                points={type.points}
                icon={type.icon || '📌'}
                onTap={() => onActivityTap(type.id, type.points, type.name, type.icon || '📌')}
                onLongPress={() => onActivityLongPress(type)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Categorized grid */}
      {CATEGORY_ORDER.map((cat) => {
        const items = grouped.get(cat)
        if (!items) return null
        return (
          <section key={cat}>
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2 px-1">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {items.map((type) => (
                <ActivityButton
                  key={type.id}
                  name={type.name}
                  points={type.points}
                  icon={type.icon || '📌'}
                  onTap={() => onActivityTap(type.id, type.points, type.name, type.icon || '📌')}
                  onLongPress={() => onActivityLongPress(type)}
                />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
