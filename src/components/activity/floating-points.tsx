'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface FloatingPointsProps {
  id: string
  points: number
  x: number
  y: number
  onComplete: () => void
}

export function FloatingPoints({ id, points, x, y, onComplete }: FloatingPointsProps) {
  const displayPoints = Number.isInteger(points)
    ? points.toString()
    : points.toFixed(1)

  return (
    <AnimatePresence onExitComplete={onComplete}>
      <motion.div
        key={id}
        className="pointer-events-none fixed z-50 text-lg font-bold text-primary"
        initial={{ x, y, opacity: 1, scale: 0.5 }}
        animate={{
          y: y - 80,
          opacity: 0,
          scale: 1.2,
        }}
        exit={{ opacity: 0 }}
        transition={{
          duration: 0.6,
          ease: 'easeOut',
        }}
      >
        +{displayPoints}
      </motion.div>
    </AnimatePresence>
  )
}
