'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Share2, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { generateInviteLink } from '../actions'

interface InviteViewProps {
  teams: { id: string; name: string }[]
}

export function InviteView({ teams }: InviteViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [teamId, setTeamId] = useState('')
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      const result = await generateInviteLink(teamId || undefined)
      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setInviteUrl(result.data.inviteUrl)
      }
    })
  }

  async function handleCopy() {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the text
    }
  }

  async function handleShare() {
    if (!inviteUrl) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Daily Prospect Tracker',
          text: 'Sign up to track your daily prospecting activities',
          url: inviteUrl,
        })
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy()
    }
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

      <section className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-xs font-semibold text-muted uppercase tracking-wider">Invite Agent</h3>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-muted">
            Generate a signup link to share with new agents. They will automatically be added to your brokerage.
          </p>

          {/* Team assignment (optional) */}
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">
              Assign to team (optional)
            </label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full h-10 px-3 bg-secondary rounded-lg text-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No team</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-fire text-center">{error}</p>
          )}

          {!inviteUrl && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={handleGenerate}
              disabled={isPending}
              className="w-full h-12 rounded-xl font-medium text-white bg-primary touch-manipulation"
            >
              {isPending ? 'Generating...' : 'Generate Invite Link'}
            </motion.button>
          )}

          {inviteUrl && (
            <div className="space-y-3">
              <div className="bg-secondary rounded-lg p-3">
                <p className="text-xs text-muted break-all font-mono">{inviteUrl}</p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCopy}
                  className="flex-1 h-10 rounded-lg text-sm font-medium bg-secondary text-foreground flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="flex-1 h-10 rounded-lg text-sm font-medium bg-primary text-white flex items-center justify-center gap-1.5 touch-manipulation"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
