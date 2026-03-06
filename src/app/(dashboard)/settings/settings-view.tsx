'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, LogOut, User, Target, Eye, Info } from 'lucide-react'
import { updateProfile, updateVisibility, signOut } from './actions'

interface SettingsViewProps {
  profile: {
    id: string
    full_name: string
    email: string
    role: string
    brokerage_visibility: string
  } | null
  dailyGoal: number
}

export function SettingsView({ profile, dailyGoal }: SettingsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(profile?.full_name ?? '')
  const [visibility, setVisibility] = useState(profile?.brokerage_visibility ?? 'public')

  function handleNameSave() {
    if (!name.trim()) return
    startTransition(async () => {
      await updateProfile({ fullName: name.trim() })
      setEditingName(false)
      router.refresh()
    })
  }

  function handleVisibilityToggle() {
    const newVis = visibility === 'public' ? 'private' : 'public'
    setVisibility(newVis)
    startTransition(async () => {
      await updateVisibility(newVis)
      router.refresh()
    })
  }

  function handleSignOut() {
    startTransition(async () => {
      await signOut()
      router.push('/login')
      router.refresh()
    })
  }

  const roleLabel = profile?.role === 'admin' ? 'Admin / Broker'
    : profile?.role === 'team_leader' ? 'Team Leader'
    : 'Agent'

  return (
    <div className="px-4 pb-28 space-y-6">
      {/* Profile section */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Profile</h3>
        </div>

        {/* Name */}
        <div className="px-4 py-3 flex items-center gap-3 border-b border-border">
          <User className="h-5 w-5 text-muted shrink-0" />
          {editingName ? (
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 h-10 px-3 bg-secondary rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <button
                type="button"
                onClick={handleNameSave}
                disabled={isPending}
                className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-medium"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="flex-1 flex items-center justify-between touch-manipulation"
              onClick={() => setEditingName(true)}
            >
              <div>
                <p className="text-sm font-medium text-foreground text-left">{name || profile?.full_name || 'Unknown'}</p>
                <p className="text-xs text-muted text-left">{profile?.email}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted" />
            </button>
          )}
        </div>

        {/* Role (read-only) */}
        <div className="px-4 py-3 flex items-center gap-3">
          <Info className="h-5 w-5 text-muted shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-foreground">{roleLabel}</p>
            <p className="text-xs text-muted">Role assigned by admin</p>
          </div>
        </div>
      </section>

      {/* Goals section */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Goals</h3>
        </div>

        <button
          type="button"
          className="w-full px-4 py-3 flex items-center gap-3 touch-manipulation"
          onClick={() => router.push('/goals')}
        >
          <Target className="h-5 w-5 text-muted shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium text-foreground">Daily Goal: {dailyGoal} pts</p>
            <p className="text-xs text-muted">Tap to edit your goals</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted" />
        </button>
      </section>

      {/* Privacy section */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Privacy</h3>
        </div>

        <div className="px-4 py-3 flex items-center gap-3">
          <Eye className="h-5 w-5 text-muted shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Brokerage Leaderboard</p>
            <p className="text-xs text-muted">
              {visibility === 'public'
                ? 'Your stats are visible to the brokerage'
                : 'Your stats are private (team only)'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleVisibilityToggle}
            disabled={isPending}
            className={`relative w-12 h-7 rounded-full transition-colors touch-manipulation ${
              visibility === 'public' ? 'bg-primary' : 'bg-secondary'
            }`}
          >
            <div
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                visibility === 'public' ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Sign out */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isPending}
          className="w-full px-4 py-3 flex items-center gap-3 touch-manipulation"
        >
          <LogOut className="h-5 w-5 text-fire shrink-0" />
          <p className="text-sm font-medium text-fire">Sign Out</p>
        </button>
      </section>

      {/* App info */}
      <p className="text-center text-xs text-muted py-2">
        Daily Prospect Tracker v1.0
      </p>
    </div>
  )
}
