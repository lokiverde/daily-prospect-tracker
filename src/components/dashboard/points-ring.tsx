'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { StreakBadge } from './streak-badge'

interface PointsRingProps {
  current: number
  goal: number
  streak?: number
  shieldsAvailable?: number
  size?: 'sm' | 'md' | 'lg'
  onGoalHit?: () => void
}

const SIZES = {
  sm: { width: 120, stroke: 8, fontSize: 24, subSize: 12 },
  md: { width: 160, stroke: 10, fontSize: 32, subSize: 14 },
  lg: { width: 200, stroke: 12, fontSize: 40, subSize: 16 },
}

function getColor(pct: number): string {
  if (pct >= 1) return 'var(--points-fire)'
  if (pct >= 0.8) return 'var(--points-high)'
  if (pct >= 0.4) return 'var(--points-mid)'
  return 'var(--points-low)'
}

export function PointsRing({
  current,
  goal,
  streak = 0,
  shieldsAvailable = 0,
  size = 'md',
  onGoalHit,
}: PointsRingProps) {
  const { width, stroke, fontSize, subSize } = SIZES[size]
  const radius = (width - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const center = width / 2

  const pct = goal > 0 ? Math.min(current / goal, 1.5) : 0
  const prevPctRef = useRef(0)
  const [justHitGoal, setJustHitGoal] = useState(false)

  const springPct = useSpring(0, {
    stiffness: 80,
    damping: 15,
    mass: 0.5,
  })

  const dashOffset = useTransform(springPct, (v: number) => {
    const clampedPct = Math.min(v, 1)
    return circumference * (1 - clampedPct)
  })

  useEffect(() => {
    springPct.set(pct)

    // Detect goal hit
    if (pct >= 1 && prevPctRef.current < 1) {
      setJustHitGoal(true)
      onGoalHit?.()
      setTimeout(() => setJustHitGoal(false), 2000)
    }
    prevPctRef.current = pct
  }, [pct, springPct, onGoalHit])

  const color = getColor(pct)
  const shouldPulse = pct >= 0.9 && pct < 1

  const displayPoints = Number.isInteger(current)
    ? current.toString()
    : current.toFixed(1)

  return (
    <div className="relative inline-flex flex-col items-center">
      <motion.div
        className="relative"
        animate={
          justHitGoal
            ? { scale: [1, 1.05, 1] }
            : shouldPulse
              ? { scale: [1, 1.02, 1] }
              : {}
        }
        transition={
          justHitGoal
            ? { duration: 0.5 }
            : shouldPulse
              ? { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              : {}
        }
      >
        <svg
          width={width}
          height={width}
          viewBox={`0 0 ${width} ${width}`}
          className="-rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
          />
          {/* Progress ring */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none"
            style={{ fontSize, color }}
          >
            {displayPoints}
          </span>
          <span
            className="text-muted-foreground leading-none mt-1"
            style={{ fontSize: subSize }}
          >
            / {goal}
          </span>
        </div>
      </motion.div>

      {/* Streak badge */}
      {streak > 0 && (
        <div className="absolute -top-1 -right-1">
          <StreakBadge days={streak} shieldsAvailable={shieldsAvailable} size={size === 'sm' ? 'sm' : 'md'} />
        </div>
      )}
    </div>
  )
}
