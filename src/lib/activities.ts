import type { ActivityCategory } from '@/lib/supabase/types'

export const CATEGORY_ORDER: ActivityCategory[] = [
  'contact',
  'appointment',
  'marketing',
  'nurture',
  'lead_mgmt',
  'peak_performance',
  'contract',
  'closing',
]

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  closing: 'Closing',
  contract: 'Contract',
  lead_mgmt: 'Lead Management',
  peak_performance: 'Peak Performance',
  appointment: 'Appointments',
  nurture: 'Client Nurture',
  marketing: 'Marketing',
  contact: 'Contacts',
}

export type PointThreshold = 'minimal' | 'light' | 'half' | 'good' | 'great'

export function getPointThreshold(points: number, goal: number): PointThreshold {
  if (goal <= 0) return 'minimal'
  const pct = points / goal
  if (pct >= 1) return 'great'
  if (pct >= 0.75) return 'good'
  if (pct >= 0.5) return 'half'
  if (pct >= 0.25) return 'light'
  return 'minimal'
}

export function getPointColor(points: number, goal: number): string {
  const pct = goal > 0 ? points / goal : 0
  if (pct >= 1) return 'var(--points-fire)'
  if (pct >= 0.8) return 'var(--points-high)'
  if (pct >= 0.4) return 'var(--points-mid)'
  return 'var(--points-low)'
}

export function getPointColorClass(points: number, goal: number): string {
  const pct = goal > 0 ? points / goal : 0
  if (pct >= 1) return 'text-points-fire'
  if (pct >= 0.8) return 'text-points-high'
  if (pct >= 0.4) return 'text-points-mid'
  return 'text-points-low'
}

export function getHeatmapColorClass(points: number, goal: number): string {
  const pct = goal > 0 ? points / goal : 0
  if (pct >= 1) return 'bg-points-fire'
  if (pct >= 0.8) return 'bg-points-high'
  if (pct >= 0.4) return 'bg-points-mid'
  if (pct > 0) return 'bg-points-low'
  return 'bg-secondary'
}

// Contextual suggestions for empty state
const MORNING_SUGGESTIONS = [
  'Start your day with 3 phone calls to hit 12 points in under 15 minutes.',
  'A quick CMA takes 10 minutes and earns 10 points. Great way to start.',
  'Set a first appointment to kick off with 15 points.',
]

const AFTERNOON_SUGGESTIONS = [
  'Afternoon push! 3 phone calls gets you 12 points closer to your goal.',
  'Send a few emails or DMs to chip away at your daily target.',
  'A coffee appointment is worth 10 points and builds relationships.',
]

const EVENING_SUGGESTIONS = [
  'A few text messages can close the gap on your daily goal.',
  'Log any missed activities from today before they slip away.',
  'Even a voicemail counts. 2 points adds up.',
]

export function getEmptyStateSuggestion(): string {
  const hour = new Date().getHours()
  const suggestions =
    hour < 12 ? MORNING_SUGGESTIONS :
    hour < 17 ? AFTERNOON_SUGGESTIONS :
    EVENING_SUGGESTIONS
  return suggestions[Math.floor(Math.random() * suggestions.length)]
}
