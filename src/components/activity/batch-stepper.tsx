'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface BatchStepperProps {
  activityName: string
  activityIcon: string
  points: number
  maxDaily?: number | null
  onConfirm: (count: number) => void
  onCancel: () => void
}

export function BatchStepper({
  activityName,
  activityIcon,
  points,
  maxDaily,
  onConfirm,
  onCancel,
}: BatchStepperProps) {
  const [count, setCount] = useState(1)
  const max = maxDaily || 20

  const displayPoints = Number.isInteger(points)
    ? points.toString()
    : points.toFixed(1)

  const totalPoints = count * points
  const displayTotal = Number.isInteger(totalPoints)
    ? totalPoints.toString()
    : totalPoints.toFixed(1)

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="w-full max-w-md bg-card rounded-t-2xl p-6 pb-safe"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Activity info */}
          <div className="text-center mb-6">
            <span className="text-3xl mb-2 block">{activityIcon}</span>
            <h3 className="text-lg font-semibold">{activityName}</h3>
            <p className="text-sm text-muted">{displayPoints} pts each</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <motion.button
              className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold touch-manipulation"
              whileTap={{ scale: 0.9 }}
              onClick={() => setCount(Math.max(1, count - 1))}
              disabled={count <= 1}
            >
              -
            </motion.button>

            <motion.span
              className="text-4xl font-bold w-16 text-center"
              key={count}
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              {count}
            </motion.span>

            <motion.button
              className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-2xl font-bold touch-manipulation"
              whileTap={{ scale: 0.9 }}
              onClick={() => setCount(Math.min(max, count + 1))}
              disabled={count >= max}
            >
              +
            </motion.button>
          </div>

          {/* Total */}
          <p className="text-center text-lg mb-6">
            <span className="font-bold text-primary">+{displayTotal} pts</span>
            <span className="text-muted"> total</span>
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              className="flex-1 h-12 rounded-xl bg-secondary text-foreground font-medium touch-manipulation"
              onClick={onCancel}
            >
              Cancel
            </button>
            <motion.button
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-semibold touch-manipulation"
              whileTap={{ scale: 0.97 }}
              onClick={() => onConfirm(count)}
            >
              Log All
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
