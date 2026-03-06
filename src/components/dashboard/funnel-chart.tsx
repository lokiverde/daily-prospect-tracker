'use client'

import { motion } from 'framer-motion'

interface FunnelStage {
  label: string
  actual: number
  goal: number
}

interface FunnelChartProps {
  stages: FunnelStage[]
}

const COLORS = [
  'bg-primary',
  'bg-primary/80',
  'bg-accent/80',
  'bg-accent',
]

export function FunnelChart({ stages }: FunnelChartProps) {
  return (
    <div className="px-4 py-3">
      <h3 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        Annual Funnel
      </h3>
      <div className="space-y-3">
        {stages.map((stage, i) => {
          const pct = stage.goal > 0 ? Math.min((stage.actual / stage.goal) * 100, 100) : 0
          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{stage.label}</span>
                <span className="text-xs text-muted">
                  {stage.actual} / {stage.goal}
                </span>
              </div>
              <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${COLORS[i] || COLORS[0]}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
