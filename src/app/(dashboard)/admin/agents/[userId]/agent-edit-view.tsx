'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { updateAgentRole, assignAgentToTeam, removeAgentFromBrokerage, restoreAgent } from '../../actions'
import type { UserRole } from '@/lib/supabase/types'

interface AgentEditViewProps {
  agent: {
    id: string
    full_name: string
    email: string
    role: string
    team_id: string | null
    brokerage_id: string | null
    is_active: boolean
  }
  teams: { id: string; name: string }[]
  isCurrentUser: boolean
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'agent', label: 'Agent' },
  { value: 'team_leader', label: 'Team Leader' },
  { value: 'broker', label: 'Broker' },
]

export function AgentEditView({ agent, teams, isCurrentUser }: AgentEditViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [role, setRole] = useState(agent.role as UserRole)
  const [teamId, setTeamId] = useState(agent.team_id || '')
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)

  function handleRoleChange(newRole: UserRole) {
    setRole(newRole)
    setError(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const result = await updateAgentRole(agent.id, newRole)
      if (result.error) {
        setError(result.error)
        setRole(agent.role as UserRole)
      } else {
        setSuccessMsg('Role updated')
        setTimeout(() => setSuccessMsg(null), 2000)
      }
    })
  }

  function handleTeamChange(newTeamId: string) {
    setTeamId(newTeamId)
    setError(null)
    setSuccessMsg(null)
    startTransition(async () => {
      const result = await assignAgentToTeam(agent.id, newTeamId || null)
      if (result.error) {
        setError(result.error)
        setTeamId(agent.team_id || '')
      } else {
        setSuccessMsg('Team updated')
        setTimeout(() => setSuccessMsg(null), 2000)
      }
    })
  }

  function handleRemove() {
    setError(null)
    startTransition(async () => {
      const result = await removeAgentFromBrokerage(agent.id)
      if (result.error) {
        setError(result.error)
        setShowRemoveConfirm(false)
      } else {
        router.push('/admin')
      }
    })
  }

  function handleRestore() {
    setError(null)
    startTransition(async () => {
      const result = await restoreAgent(agent.id)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin')
      }
    })
  }

  return (
    <div className="px-4 pb-28 space-y-4">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-primary font-medium py-2 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Agents
      </button>

      {/* Profile info (read-only) */}
      <section className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-muted">
              {(agent.full_name || '?').charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{agent.full_name}</p>
            <p className="text-sm text-muted">{agent.email}</p>
          </div>
        </div>
      </section>

      {/* Status messages */}
      {error && (
        <div className="px-3 py-2 bg-fire/10 text-fire text-sm rounded-lg text-center">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="px-3 py-2 bg-accent/10 text-accent text-sm rounded-lg text-center">
          {successMsg}
        </div>
      )}

      {/* Role selector */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Role</h3>
        </div>
        <div className="p-4">
          {isCurrentUser ? (
            <p className="text-sm text-muted">You cannot change your own role</p>
          ) : (
            <div className="flex gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRoleChange(r.value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                    role === r.value
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-muted'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Team assignment */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Team</h3>
        </div>
        <div className="p-4">
          <select
            value={teamId}
            onChange={(e) => handleTeamChange(e.target.value)}
            disabled={isPending}
            className="w-full h-10 px-3 bg-secondary rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">No team (brokerage only)</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Archive / Restore */}
      {!isCurrentUser && (
        <section className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
              {agent.is_active === false ? 'Archived Agent' : 'Danger Zone'}
            </h3>
          </div>
          <div className="p-4">
            {agent.is_active === false ? (
              <div className="space-y-3">
                <p className="text-xs text-muted">
                  This agent is archived. They cannot log in or appear in leaderboards. Their activity history is preserved.
                </p>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRestore}
                  disabled={isPending}
                  className="w-full h-10 rounded-lg text-sm font-medium bg-accent text-white touch-manipulation"
                >
                  {isPending ? 'Restoring...' : 'Restore Agent'}
                </motion.button>
              </div>
            ) : showRemoveConfirm ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-fire">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-medium">Archive {agent.full_name}?</p>
                </div>
                <p className="text-xs text-muted">
                  Their activity history will be preserved but they will be blocked from logging in and hidden from leaderboards. You can restore them later.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRemoveConfirm(false)}
                    disabled={isPending}
                    className="flex-1 h-10 rounded-lg text-sm font-medium bg-secondary text-foreground touch-manipulation"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRemove}
                    disabled={isPending}
                    className="flex-1 h-10 rounded-lg text-sm font-medium bg-fire text-white touch-manipulation"
                  >
                    {isPending ? 'Archiving...' : 'Archive'}
                  </motion.button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowRemoveConfirm(true)}
                className="w-full h-10 rounded-lg text-sm font-medium text-fire border border-fire/30 touch-manipulation"
              >
                Archive Agent
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
