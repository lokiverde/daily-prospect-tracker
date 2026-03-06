'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { createTeam } from '../../actions'

interface CreateTeamViewProps {
  agents: { id: string; full_name: string; role: string }[]
}

export function CreateTeamView({ agents }: CreateTeamViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [name, setName] = useState('')
  const [leaderId, setLeaderId] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleCreate() {
    if (!name.trim()) {
      setError('Team name is required')
      return
    }
    if (!leaderId) {
      setError('Please select a team leader')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createTeam(name.trim(), leaderId)
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/admin/teams')
        router.refresh()
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
        Back to Teams
      </button>

      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Create Team</h3>
        </div>

        <div className="p-4 space-y-4">
          {/* Team name */}
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Squad"
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
              <option value="">Select a leader</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name || 'Unknown'}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-fire text-center">{error}</p>
          )}

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={handleCreate}
            disabled={isPending}
            className="w-full h-12 rounded-xl font-medium text-white bg-primary touch-manipulation"
          >
            {isPending ? 'Creating...' : 'Create Team'}
          </motion.button>
        </div>
      </section>
    </div>
  )
}
