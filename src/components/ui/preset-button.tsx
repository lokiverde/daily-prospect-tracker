'use client'

import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

interface PresetButtonProps {
  label: string
  selected: boolean
  onSelect: () => void
}

export function PresetButton({ label, selected, onSelect }: PresetButtonProps) {
  return (
    <motion.button
      type="button"
      className={cn(
        'h-12 px-4 rounded-xl font-medium text-sm transition-colors touch-manipulation',
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-secondary text-secondary-foreground'
      )}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
    >
      {label}
    </motion.button>
  )
}
