'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Trash2, Check, Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { updateTeam, deleteTeam, assignAgentToTeam } from '../../actions'

interface TeamEditViewProps {
  team: { id: string; name: string; leader_id: string | null }
  members: { id: string; full_name: string; email: string; role: string }[]
  agents: { id: string; full_name: string; role: string; team_id: string | null; teamName: string | null }[]
}

const ROLE_STYLES: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-fire/10 text-fire' },
  broker: { label: 'Broker', className: 'bg-accent/10 text-accent' },
  team_leader: { label: 'Team Lead', className: 'bg-primary/10 text-primary' },
  agent: { label: 'Agent', className: 'bg-secondary text-muted' },
}

export function TeamEditView({ team, members, agents }: TeamEditViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState(team.name)
  const [leaderId, setLeaderId] = useState(team.leader_id || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [search, setSearch] = useState('')
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null)

  // Track which agents are on this team (local state for instant feedback)
  const [teamMemberIds, setTeamMemberIds] = useState<Set<string>>(
    new Set(members.map((m) => m.id))
  )

  function handleSave() {
    setError(null)
    setSuccess(null)
    const updates: { name?: string; leaderId?: string } = {}
    if (name.trim() !== team.name) updates.name = name.trim()
    if (leaderId !== (team.leader_id || '')) updates.leaderId = leaderId

    if (Object.keys(updates).length === 0) {
      setSuccess('No changes to save')
      return
    }

    startTransition(async () => {
      const result = await updateTeam(team.id, updates)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Team updated')
        router.refresh()
      }
    })
  }

  function handleToggleAgent(agentId: string, currentlyOnTeam: boolean) {
    setError(null)
    setPendingAgentId(agentId)

    // Optimistic update
    setTeamMemberIds((prev) => {
      const next = new Set(prev)
      if (currentlyOnTeam) {
        next.delete(agentId)
      } else {
        next.add(agentId)
      }
      return next
    })

    startTransition(async () => {
      const newTeamId = currentlyOnTeam ? null : team.id
      const result = await assignAgentToTeam(agentId, newTeamId)

      if (result.error) {
        // Revert on error
        setTeamMemberIds((prev) => {
          const next = new Set(prev)
          if (currentlyOnTeam) {
            next.add(agentId)
          } else {
            next.delete(agentId)
          }
          return next
        })
        setError(result.error)
      }
      setPendingAgentId(null)
    })
  }

  function handleDelete() {
    setError(null)
    startTransition(async () => {
      const result = await deleteTeam(team.id)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin/teams')
        router.refresh()
      }
    })
  }

  // Filter agents by search
  const filteredAgents = search.trim()
    ? agents.filter((a) =>
        a.full_name?.toLowerCase().includes(search.toLowerCase())
      )
    : agents

  // Sort: team members first, then others
  const sortedAgents = [...filteredAgents].sort((a, b) => {
    const aOn = teamMemberIds.has(a.id) ? 0 : 1
    const bOn = teamMemberIds.has(b.id) ? 0 : 1
    if (aOn !== bOn) return aOn - bOn
    return (a.full_name || '').localeCompare(b.full_name || '')
  })

  const memberCount = agents.filter((a) => teamMemberIds.has(a.id)).length

  return (
    <div className="px-4 pb-28 space-y-4">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-primary font-medium py-2 touch-manipulation"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Teams
      </button>

      {/* Edit form */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Edit Team</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Team name */}
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-secondary rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Leader picker */}
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Team Leader</label>
            <select
              value={leaderId}
              onChange={(e) => setLeaderId(e.target.value)}
              className="w-full h-10 px-3 bg-secondary rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No leader</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name || 'Unknown'}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-fire text-center">{error}</p>}
          {success && <p className="text-sm text-accent text-center">{success}</p>}

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleSave}
            disabled={isPending && !pendingAgentId}
            className="w-full h-12 rounded-xl font-medium text-white bg-primary touch-manipulation"
          >
            {isPending && !pendingAgentId ? 'Saving...' : 'Save Changes'}
          </motion.button>
        </div>
      </section>

      {/* Agent assignment with checkboxes */}
      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">
            Agents ({memberCount} on this team)
          </h3>
        </div>

        {/* Search */}
        <div className="px-4 pt-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search agents..."
              className="w-full h-10 pl-9 pr-3 bg-secondary rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Agent list with checkboxes */}
        <div className="divide-y divide-border mt-3">
          {sortedAgents.map((agent) => {
            const isOnTeam = teamMemberIds.has(agent.id)
            const isOnOtherTeam = !isOnTeam && agent.team_id && agent.team_id !== team.id
            const roleStyle = ROLE_STYLES[agent.role] || ROLE_STYLES.agent
            const isLoading = pendingAgentId === agent.id

            return (
              <button
                key={agent.id}
                type="button"
                disabled={isLoading}
                onClick={() => handleToggleAgent(agent.id, isOnTeam)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left touch-manipulation active:bg-secondary/50 transition-colors"
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    'w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                    isOnTeam
                      ? 'bg-primary border-primary'
                      : 'border-border bg-transparent'
                  )}
                >
                  {isOnTeam && <Check className="h-4 w-4 text-white" />}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-muted">
                    {(agent.full_name || '?').charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn(
                      'text-sm font-medium truncate',
                      isOnTeam ? 'text-foreground' : 'text-muted'
                    )}>
                      {agent.full_name || 'Unknown'}
                    </p>
                    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0', roleStyle.className)}>
                      {roleStyle.label}
                    </span>
                  </div>
                  {isOnOtherTeam && agent.teamName && (
                    <p className="text-xs text-warning">Currently on: {agent.teamName}</p>
                  )}
                </div>

                {/* Loading indicator */}
                {isLoading && (
                  <span className="text-xs text-muted animate-pulse">saving</span>
                )}
              </button>
            )
          })}

          {sortedAgents.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted">
              {search ? 'No agents match your search' : 'No agents in this brokerage'}
            </div>
          )}
        </div>
      </section>

      {/* Delete team */}
      <section className="bg-card border border-fire/20 rounded-xl overflow-hidden">
        <div className="p-4">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-fire py-2 touch-manipulation"
            >
              <Trash2 className="h-4 w-4" />
              Delete Team
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-center text-foreground">
                Delete <span className="font-semibold">{team.name}</span>? All members will be unassigned.
              </p>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 h-10 rounded-lg text-sm font-medium bg-secondary text-foreground touch-manipulation"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  disabled={isPending}
                  className="flex-1 h-10 rounded-lg text-sm font-medium bg-fire text-white touch-manipulation"
                >
                  {isPending && !pendingAgentId ? 'Deleting...' : 'Confirm Delete'}
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
