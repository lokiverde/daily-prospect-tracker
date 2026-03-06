'use client'

import { useRouter } from 'next/navigation'
import { Plus, Users, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

interface TeamRow {
  id: string
  name: string
  leader_id: string | null
  leaderName: string | null
  memberCount: number
}

interface TeamsViewProps {
  teams: TeamRow[]
}

export function TeamsView({ teams }: TeamsViewProps) {
  const router = useRouter()

  return (
    <div className="px-4 pb-28 space-y-4">
      {/* Create team button */}
      <div className="flex justify-end pt-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/admin/teams/new')}
          className="h-10 px-4 bg-primary text-white rounded-lg text-sm font-medium flex items-center gap-1.5 touch-manipulation"
        >
          <Plus className="h-4 w-4" />
          Create Team
        </motion.button>
      </div>

      {/* Team count */}
      <p className="text-xs text-muted">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>

      {/* Team list */}
      {teams.length > 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
          {teams.map((team) => (
            <motion.button
              key={team.id}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/admin/teams/${team.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left touch-manipulation"
            >
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Users className="h-5 w-5 text-primary" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                {team.leaderName && (
                  <p className="text-xs text-muted">Leader: {team.leaderName}</p>
                )}
                <p className="text-xs text-muted">
                  {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                </p>
              </div>

              <ChevronRight className="h-4 w-4 text-muted shrink-0" />
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Users className="h-8 w-8 text-muted mb-3" />
          <p className="text-sm text-muted">No teams yet</p>
          <p className="text-xs text-muted mt-1">Create a team to organize your agents</p>
        </div>
      )}
    </div>
  )
}
