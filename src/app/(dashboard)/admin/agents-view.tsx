'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, ChevronRight, RotateCcw } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { assignAgentToTeam, restoreAgent } from './actions'

interface AgentRow {
  id: string
  full_name: string
  email: string
  role: string
  team_id: string | null
  is_active: boolean
  teams: { name: string } | null
}

interface AgentsViewProps {
  agents: AgentRow[]
  teams: { id: string; name: string }[]
}

const ROLE_STYLES: Record<string, { label: string; className: string }> = {
  admin: { label: 'Admin', className: 'bg-fire/10 text-fire' },
  broker: { label: 'Broker', className: 'bg-accent/10 text-accent' },
  team_leader: { label: 'Team Lead', className: 'bg-primary/10 text-primary' },
  agent: { label: 'Agent', className: 'bg-secondary text-muted' },
}

export function AgentsView({ agents: initialAgents, teams }: AgentsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [showArchived, setShowArchived] = useState(false)
  const [agents, setAgents] = useState(initialAgents)
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null)

  const activeAgents = agents.filter((a) => a.is_active !== false)
  const archivedAgents = agents.filter((a) => a.is_active === false)

  function handleTeamChange(agentId: string, newTeamId: string) {
    setPendingAgentId(agentId)

    // Optimistic update
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id !== agentId) return a
        const newTeam = teams.find((t) => t.id === newTeamId)
        return {
          ...a,
          team_id: newTeamId || null,
          teams: newTeam ? { name: newTeam.name } : null,
        }
      })
    )

    startTransition(async () => {
      const result = await assignAgentToTeam(agentId, newTeamId || null)
      if (result.error) {
        // Revert on error
        setAgents(initialAgents)
      }
      setPendingAgentId(null)
    })
  }

  function handleRestore(agentId: string) {
    setPendingAgentId(agentId)
    // Optimistic update
    setAgents((prev) =>
      prev.map((a) => a.id === agentId ? { ...a, is_active: true } : a)
    )
    startTransition(async () => {
      const result = await restoreAgent(agentId)
      if (result.error) {
        setAgents(initialAgents)
      }
      setPendingAgentId(null)
    })
  }

  // Choose active or archived list
  const baseList = showArchived ? archivedAgents : activeAgents

  // Apply search filter
  let filtered = search.trim()
    ? baseList.filter(
        (a) =>
          a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          a.email?.toLowerCase().includes(search.toLowerCase())
      )
    : baseList

  // Apply team filter (only for active agents)
  if (!showArchived) {
    if (teamFilter === 'none') {
      filtered = filtered.filter((a) => !a.team_id)
    } else if (teamFilter !== 'all') {
      filtered = filtered.filter((a) => a.team_id === teamFilter)
    }
  }

  return (
    <div className="px-4 pb-28 space-y-4">
      {/* Search + invite */}
      <div className="flex gap-2 pt-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search agents..."
            className="w-full h-10 pl-9 pr-3 bg-secondary rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/admin/invite')}
          className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-1.5 touch-manipulation"
        >
          <UserPlus className="h-4 w-4" />
          Invite
        </motion.button>
      </div>

      {/* Active / Archived toggle */}
      <div className="flex gap-1.5 -mx-4 px-4">
        <button
          type="button"
          onClick={() => { setShowArchived(false); setTeamFilter('all') }}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors touch-manipulation',
            !showArchived
              ? 'bg-primary text-white'
              : 'bg-secondary text-muted'
          )}
        >
          Active ({activeAgents.length})
        </button>
        {archivedAgents.length > 0 && (
          <button
            type="button"
            onClick={() => setShowArchived(true)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors touch-manipulation',
              showArchived
                ? 'bg-fire/80 text-white'
                : 'bg-secondary text-muted'
            )}
          >
            Archived ({archivedAgents.length})
          </button>
        )}
      </div>

      {/* Team filter (only for active agents) */}
      {!showArchived && teams.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4">
          <button
            type="button"
            onClick={() => setTeamFilter('all')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors touch-manipulation',
              teamFilter === 'all'
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted'
            )}
          >
            All ({activeAgents.length})
          </button>
          {teams.map((t) => {
            const count = activeAgents.filter((a) => a.team_id === t.id).length
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTeamFilter(t.id)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors touch-manipulation',
                  teamFilter === t.id
                    ? 'bg-primary text-white'
                    : 'bg-secondary text-muted'
                )}
              >
                {t.name} ({count})
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setTeamFilter('none')}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors touch-manipulation',
              teamFilter === 'none'
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted'
            )}
          >
            Unassigned ({activeAgents.filter((a) => !a.team_id).length})
          </button>
        </div>
      )}

      {/* Agent count */}
      <p className="text-xs text-muted">{filtered.length} agent{filtered.length !== 1 ? 's' : ''}</p>

      {/* Agent list */}
      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {filtered.map((agent) => {
          const roleStyle = ROLE_STYLES[agent.role] || ROLE_STYLES.agent
          const isLoading = pendingAgentId === agent.id
          return (
            <div key={agent.id} className="flex items-center gap-3 px-4 py-3">
              {/* Avatar - tappable to edit agent details */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/admin/agents/${agent.id}`)}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0 touch-manipulation"
              >
                <span className="text-sm font-bold text-muted">
                  {(agent.full_name || '?').charAt(0).toUpperCase()}
                </span>
              </motion.button>

              {/* Info + team selector or restore */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn('text-sm font-medium truncate', showArchived ? 'text-muted' : 'text-foreground')}>
                    {agent.full_name || 'Unknown'}
                  </p>
                  <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0', roleStyle.className)}>
                    {roleStyle.label}
                  </span>
                </div>

                {showArchived ? (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRestore(agent.id)}
                    disabled={isLoading}
                    className="mt-1 h-7 px-3 rounded-md text-xs font-medium bg-accent/10 text-accent flex items-center gap-1 touch-manipulation"
                  >
                    <RotateCcw className="h-3 w-3" />
                    {isLoading ? 'Restoring...' : 'Restore'}
                  </motion.button>
                ) : (
                  <select
                    value={agent.team_id || ''}
                    onChange={(e) => handleTeamChange(agent.id, e.target.value)}
                    disabled={isLoading}
                    className={cn(
                      'mt-1 h-7 px-2 rounded-md text-xs border-0 focus:outline-none focus:ring-1 focus:ring-primary',
                      agent.team_id ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted'
                    )}
                  >
                    <option value="">No team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Edit chevron */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(`/admin/agents/${agent.id}`)}
                className="p-2 touch-manipulation"
              >
                <ChevronRight className="h-4 w-4 text-muted" />
              </motion.button>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted">
            {search ? 'No agents match your search' : 'No agents in this brokerage'}
          </div>
        )}
      </div>
    </div>
  )
}
