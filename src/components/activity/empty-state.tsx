'use client'

import { getEmptyStateSuggestion } from '@/lib/activities'
import { useMemo } from 'react'

export function EmptyState() {
  const suggestion = useMemo(() => getEmptyStateSuggestion(), [])

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
      <div className="text-4xl mb-3">🎯</div>
      <p className="text-sm text-muted max-w-xs">
        {suggestion}
      </p>
    </div>
  )
}
