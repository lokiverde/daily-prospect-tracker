'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, Eye, EyeOff, Save } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@/lib/activities'
import type { ActivityCategory } from '@/lib/supabase/types'
import {
  updateBrokerageDefaultGoal,
  updateBrokerageConversionRates,
  updateBrokerageTimezone,
  updateActivityType,
  createCustomActivity,
} from '../actions'

interface ActivityTypeRow {
  id: string
  name: string
  points: number
  category: string
  icon: string | null
  sort_order: number
  is_default: boolean
  is_active: boolean
}

interface ConversionRates {
  contactToAppointment: number
  appointmentToContract: number
  contractToClosing: number
}

// Common US timezones at top, then full IANA list
const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Pacific/Honolulu',
]

function formatTzLabel(tz: string): string {
  const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz
  try {
    const now = new Date()
    const offset = now.toLocaleString('en-US', { timeZone: tz, timeZoneName: 'short' }).split(' ').pop()
    return `${city} (${offset})`
  } catch {
    return tz
  }
}

interface SettingsViewProps {
  defaultDailyGoal: number
  conversionRates: ConversionRates
  activityTypes: ActivityTypeRow[]
  currentTimezone: string
}

export function SettingsView({ defaultDailyGoal, conversionRates, activityTypes, currentTimezone }: SettingsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Daily goal state
  const [goal, setGoal] = useState(defaultDailyGoal)
  const [goalSaved, setGoalSaved] = useState(false)

  // Timezone state
  const [timezone, setTimezone] = useState(currentTimezone)
  const [tzSaved, setTzSaved] = useState(false)

  function handleTimezoneSave() {
    setTzSaved(false)
    startTransition(async () => {
      const result = await updateBrokerageTimezone(timezone)
      if (result.error) {
        setError(result.error)
      } else {
        setTzSaved(true)
        setTimeout(() => setTzSaved(false), 2000)
        router.refresh()
      }
    })
  }

  // Conversion rates state
  const [rates, setRates] = useState(conversionRates)
  const [ratesSaved, setRatesSaved] = useState(false)
  const ratesChanged =
    rates.contactToAppointment !== conversionRates.contactToAppointment ||
    rates.appointmentToContract !== conversionRates.appointmentToContract ||
    rates.contractToClosing !== conversionRates.contractToClosing

  // Activity type edits: track local changes by id
  const [editedPoints, setEditedPoints] = useState<Record<string, number>>({})
  const [toggledActive, setToggledActive] = useState<Record<string, boolean>>({})

  // New custom activity form
  const [showNewForm, setShowNewForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPoints, setNewPoints] = useState(5)
  const [newCategory, setNewCategory] = useState<ActivityCategory>('contact')
  const [newIcon, setNewIcon] = useState('')

  const [error, setError] = useState<string | null>(null)

  function handleGoalSave() {
    if (goal < 1) return
    setGoalSaved(false)
    startTransition(async () => {
      const result = await updateBrokerageDefaultGoal(goal)
      if (result.error) {
        setError(result.error)
      } else {
        setGoalSaved(true)
        setTimeout(() => setGoalSaved(false), 2000)
      }
    })
  }

  function handleRatesSave() {
    setRatesSaved(false)
    startTransition(async () => {
      const result = await updateBrokerageConversionRates(rates)
      if (result.error) {
        setError(result.error)
      } else {
        setRatesSaved(true)
        setTimeout(() => setRatesSaved(false), 2000)
        router.refresh()
      }
    })
  }

  function handleActivityToggle(id: string, currentActive: boolean) {
    const newVal = !(toggledActive[id] ?? currentActive)
    setToggledActive((prev) => ({ ...prev, [id]: newVal }))

    startTransition(async () => {
      const result = await updateActivityType(id, { isActive: newVal })
      if (result.error) {
        // Revert on error
        setToggledActive((prev) => ({ ...prev, [id]: currentActive }))
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handlePointsSave(id: string) {
    const pts = editedPoints[id]
    if (pts === undefined || pts <= 0) return

    startTransition(async () => {
      const result = await updateActivityType(id, { points: pts })
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }

  function handleCreateActivity() {
    if (!newName.trim()) {
      setError('Activity name is required')
      return
    }
    if (newPoints <= 0) {
      setError('Points must be greater than 0')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createCustomActivity({
        name: newName.trim(),
        points: newPoints,
        category: newCategory,
        icon: newIcon || '📌',
      })
      if (result.error) {
        setError(result.error)
      } else {
        setNewName('')
        setNewPoints(5)
        setNewCategory('contact')
        setNewIcon('')
        setShowNewForm(false)
        router.refresh()
      }
    })
  }

  // Group activities by category
  const grouped = new Map<string, ActivityTypeRow[]>()
  for (const cat of CATEGORY_ORDER) {
    const items = activityTypes
      .filter((t) => t.category === cat)
      .sort((a, b) => a.sort_order - b.sort_order)
    if (items.length > 0) {
      grouped.set(cat, items)
    }
  }

  return (
    <div className="px-4 pb-28 space-y-4">
      {error && (
        <div className="rounded-lg border border-fire/20 bg-fire/10 px-4 py-2 text-sm text-fire text-center">
          {error}
          <button type="button" onClick={() => setError(null)} className="ml-2 underline">dismiss</button>
        </div>
      )}

      {/* Default Daily Goal */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Default Daily Goal</h3>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted mb-3">
            The default daily points goal for new agents. Agents can override this in their own settings.
          </p>
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setGoal((g) => Math.max(5, g - 5))}
              className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center touch-manipulation"
            >
              <Minus className="h-4 w-4" />
            </motion.button>
            <div className="flex-1 text-center">
              <span className="text-2xl font-bold text-primary">{goal}</span>
              <span className="text-sm text-muted ml-1">pts/day</span>
            </div>
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => setGoal((g) => g + 5)}
              className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center touch-manipulation"
            >
              <Plus className="h-4 w-4" />
            </motion.button>
          </div>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleGoalSave}
            disabled={isPending || goal === defaultDailyGoal}
            className={cn(
              'w-full h-10 rounded-lg text-sm font-medium mt-3 touch-manipulation transition-colors',
              goal !== defaultDailyGoal
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted'
            )}
          >
            {goalSaved ? 'Saved!' : isPending ? 'Saving...' : 'Save Goal'}
          </motion.button>
        </div>
      </section>

      {/* Timezone */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Timezone</h3>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted mb-3">
            All daily boundaries, streaks, and leaderboard periods use this timezone.
          </p>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full h-10 px-3 bg-secondary rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <optgroup label="Common">
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{formatTzLabel(tz)}</option>
              ))}
            </optgroup>
            <optgroup label="All Timezones">
              {Intl.supportedValuesOf('timeZone')
                .filter((tz) => !COMMON_TIMEZONES.includes(tz))
                .map((tz) => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
            </optgroup>
          </select>
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleTimezoneSave}
            disabled={isPending || timezone === currentTimezone}
            className={cn(
              'w-full h-10 rounded-lg text-sm font-medium mt-3 touch-manipulation transition-colors',
              timezone !== currentTimezone
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted'
            )}
          >
            {tzSaved ? 'Saved!' : isPending ? 'Saving...' : 'Save Timezone'}
          </motion.button>
        </div>
      </section>

      {/* Funnel Conversion Rates */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Funnel Conversion Rates</h3>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-xs text-muted">
            These rates determine how many contacts, appointments, and contracts agents need to hit their closings goal. Agents will see updated targets next time they run the Goal Setup wizard.
          </p>
          <RateInput
            label="Contacts to Appointments"
            value={rates.contactToAppointment}
            onChange={(v) => setRates((r) => ({ ...r, contactToAppointment: v }))}
          />
          <RateInput
            label="Appointments to Contracts"
            value={rates.appointmentToContract}
            onChange={(v) => setRates((r) => ({ ...r, appointmentToContract: v }))}
          />
          <RateInput
            label="Contracts to Closings"
            value={rates.contractToClosing}
            onChange={(v) => setRates((r) => ({ ...r, contractToClosing: v }))}
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleRatesSave}
            disabled={isPending || !ratesChanged}
            className={cn(
              'w-full h-10 rounded-lg text-sm font-medium touch-manipulation transition-colors',
              ratesChanged
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted'
            )}
          >
            {ratesSaved ? 'Saved!' : isPending ? 'Saving...' : 'Save Rates'}
          </motion.button>
        </div>
      </section>

      {/* Activity Types */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Activity Types</h3>
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewForm(!showNewForm)}
            className="text-xs font-medium text-primary flex items-center gap-1 touch-manipulation"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Custom
          </motion.button>
        </div>

        {/* New custom activity form */}
        {showNewForm && (
          <div className="p-4 border-b border-border bg-secondary/50 space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                placeholder="📌"
                maxLength={2}
                className="w-12 h-10 text-center bg-card rounded-lg text-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Activity name"
                className="flex-1 h-10 px-3 bg-card rounded-lg text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-medium text-muted mb-0.5 block">Points</label>
                <input
                  type="number"
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value))}
                  min={1}
                  className="w-full h-10 px-3 bg-card rounded-lg text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-medium text-muted mb-0.5 block">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ActivityCategory)}
                  className="w-full h-10 px-3 bg-card rounded-lg text-sm border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {CATEGORY_ORDER.map((cat) => (
                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewForm(false)}
                className="flex-1 h-10 rounded-lg text-sm font-medium bg-card text-foreground border border-border touch-manipulation"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={handleCreateActivity}
                disabled={isPending}
                className="flex-1 h-10 rounded-lg text-sm font-medium bg-primary text-white touch-manipulation"
              >
                {isPending ? 'Adding...' : 'Add Activity'}
              </motion.button>
            </div>
          </div>
        )}

        {/* Activity list by category */}
        <div className="divide-y divide-border">
          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat)
            if (!items) return null
            return (
              <div key={cat}>
                <div className="px-4 py-2 bg-secondary/30">
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wider">
                    {CATEGORY_LABELS[cat]}
                  </p>
                </div>
                {items.map((activity) => {
                  const isActive = toggledActive[activity.id] ?? activity.is_active
                  const pts = editedPoints[activity.id] ?? activity.points
                  const ptsChanged = editedPoints[activity.id] !== undefined && editedPoints[activity.id] !== activity.points

                  return (
                    <div
                      key={activity.id}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5',
                        !isActive && 'opacity-50'
                      )}
                    >
                      <span className="text-lg shrink-0" role="img" aria-hidden="true">
                        {activity.icon || '📌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{activity.name}</p>
                      </div>
                      {/* Points editor */}
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={pts}
                          onChange={(e) =>
                            setEditedPoints((prev) => ({ ...prev, [activity.id]: Number(e.target.value) }))
                          }
                          className="w-14 h-8 text-center text-sm font-medium bg-secondary rounded border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                          min={0.5}
                          step={0.5}
                        />
                        {ptsChanged && (
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handlePointsSave(activity.id)}
                            className="w-8 h-8 rounded bg-primary flex items-center justify-center touch-manipulation"
                          >
                            <Save className="h-3.5 w-3.5 text-white" />
                          </motion.button>
                        )}
                      </div>
                      {/* Active toggle */}
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleActivityToggle(activity.id, activity.is_active)}
                        className="w-8 h-8 rounded flex items-center justify-center touch-manipulation"
                      >
                        {isActive ? (
                          <Eye className="h-4 w-4 text-accent" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted" />
                        )}
                      </motion.button>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function RateInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const pct = Math.round(value * 100)
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-foreground flex-1">{label}</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={pct}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10)
            if (!isNaN(n) && n >= 1 && n <= 100) {
              onChange(n / 100)
            }
          }}
          min={1}
          max={100}
          className="w-16 h-8 text-center text-sm font-medium bg-secondary rounded border-0 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <span className="text-sm text-muted">%</span>
      </div>
    </div>
  )
}
