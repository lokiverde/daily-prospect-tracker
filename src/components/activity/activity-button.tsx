'use client'

import { motion } from 'framer-motion'
import { useState, useRef, useCallback } from 'react'

interface ActivityButtonProps {
  name: string
  points: number
  icon: string
  onTap: () => void
  onLongPress: () => void
  disabled?: boolean
}

export function ActivityButton({
  name,
  points,
  icon,
  onTap,
  onLongPress,
  disabled = false,
}: ActivityButtonProps) {
  const [tapped, setTapped] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPress = useRef(false)

  const handlePointerDown = useCallback(() => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress()
    }, 500)
  }, [onLongPress])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (!isLongPress.current && !disabled) {
      setTapped(true)
      onTap()
      setTimeout(() => setTapped(false), 300)
    }
  }, [onTap, disabled])

  const handlePointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const displayPoints = Number.isInteger(points)
    ? points.toString()
    : points.toFixed(1)

  return (
    <motion.button
      className="relative flex flex-col items-center justify-center rounded-xl bg-secondary p-2 min-w-[100px] min-h-[100px] select-none touch-manipulation"
      whileTap={{ scale: 0.95 }}
      animate={tapped ? { scale: 1.05 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 12 }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      disabled={disabled}
      aria-label={`Log ${name} for ${displayPoints} points`}
    >
      {/* Points badge */}
      <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-0.5">
        +{displayPoints}
      </span>

      {/* Icon */}
      <span className="text-2xl mb-1" role="img" aria-hidden="true">
        {icon}
      </span>

      {/* Label */}
      <span className="text-[11px] font-medium text-foreground text-center leading-tight line-clamp-2 px-1">
        {name}
      </span>

      {/* Tap overlay */}
      {tapped && (
        <motion.div
          className="absolute inset-0 rounded-xl bg-primary/10"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.button>
  )
}
