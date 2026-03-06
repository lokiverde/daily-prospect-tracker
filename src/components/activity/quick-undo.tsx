'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface QuickUndoProps {
  activityName: string
  points: number
  onUndo: () => void
  duration?: number
}

export function QuickUndo({
  activityName,
  points,
  onUndo,
  duration = 5,
}: QuickUndoProps) {
  const [timeLeft, setTimeLeft] = useState(duration)

  useEffect(() => {
    setTimeLeft(duration)
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [duration, activityName])

  const displayPoints = Number.isInteger(points)
    ? points.toString()
    : points.toFixed(1)

  if (timeLeft <= 0) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-20 left-4 right-4 z-40 mx-auto max-w-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 shadow-lg">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {activityName}{' '}
              <span className="text-primary">+{displayPoints} pts</span>
            </p>
            <div className="w-full bg-secondary rounded-full h-1 mt-1.5">
              <motion.div
                className="h-1 bg-muted rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration, ease: 'linear' }}
              />
            </div>
          </div>
          <motion.button
            className="ml-3 px-3 py-1.5 text-sm font-semibold text-fire bg-fire/10 rounded-lg touch-manipulation"
            whileTap={{ scale: 0.95 }}
            onClick={onUndo}
          >
            Undo
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
