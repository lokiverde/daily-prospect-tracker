'use client'

import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface LeaderboardRowProps {
  rank: number
  name: string
  totalPoints: number
  streak: number
  canViewDetail: boolean
  onTap?: () => void
  isCurrentUser?: boolean
}

function getRankDisplay(rank: number) {
  if (rank === 1) return { label: '🥇', className: '' }
  if (rank === 2) return { label: '🥈', className: '' }
  if (rank === 3) return { label: '🥉', className: '' }
  return { label: String(rank), className: 'text-xs font-bold text-muted bg-secondary rounded-full w-7 h-7 flex items-center justify-center' }
}

export function LeaderboardRow({
  rank,
  name,
  totalPoints,
  streak,
  canViewDetail,
  onTap,
  isCurrentUser = false,
}: LeaderboardRowProps) {
  const rankDisplay = getRankDisplay(rank)
  const displayPoints = Number.isInteger(totalPoints)
    ? totalPoints.toString()
    : totalPoints.toFixed(1)

  const content = (
    <div className={`flex items-center gap-3 px-4 py-3 ${isCurrentUser ? 'bg-primary/5' : ''}`}>
      {/* Rank */}
      <div className="w-8 flex items-center justify-center shrink-0">
        {rank <= 3 ? (
          <span className="text-xl">{rankDisplay.label}</span>
        ) : (
          <div className={rankDisplay.className}>{rankDisplay.label}</div>
        )}
      </div>

      {/* Name + streak */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium text-foreground truncate ${isCurrentUser ? 'font-bold' : ''}`}>
          {name}
          {isCurrentUser && <span className="text-xs text-muted ml-1">(you)</span>}
        </p>
        {streak > 0 && (
          <p className="text-xs text-muted">
            🔥 {streak} day{streak !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-primary">{displayPoints}</p>
        <p className="text-[10px] text-muted">pts</p>
      </div>

      {/* Chevron for detail view */}
      {canViewDetail && (
        <ChevronRight className="h-4 w-4 text-muted shrink-0" />
      )}
    </div>
  )

  if (canViewDetail && onTap) {
    return (
      <motion.button
        type="button"
        className="w-full text-left touch-manipulation"
        whileTap={{ scale: 0.98 }}
        onClick={onTap}
      >
        {content}
      </motion.button>
    )
  }

  return content
}
