'use client'

import { motion } from 'framer-motion'

interface StreakBadgeProps {
  days: number
  shieldsAvailable?: number
  size?: 'sm' | 'md'
}

export function StreakBadge({ days, shieldsAvailable = 0, size = 'md' }: StreakBadgeProps) {
  if (days <= 0) return null

  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const padding = size === 'sm' ? 'px-1.5 py-0.5' : 'px-2 py-1'

  return (
    <motion.div
      className={`inline-flex items-center gap-0.5 rounded-full bg-fire/10 ${padding}`}
      initial={false}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 0.3 }}
      key={days}
    >
      <span className={textSize}>🔥</span>
      <span className={`${textSize} font-bold text-fire`}>{days}</span>
      {shieldsAvailable > 0 && (
        <span className={`${textSize} ml-0.5`} title={`${shieldsAvailable} streak shield${shieldsAvailable > 1 ? 's' : ''}`}>
          🛡️
        </span>
      )}
    </motion.div>
  )
}
