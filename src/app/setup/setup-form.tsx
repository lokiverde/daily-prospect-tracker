'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrokerage } from './actions'

const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'Pacific/Honolulu',
]

function guessTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'America/Los_Angeles'
  }
}

export function SetupForm({ userId, userEmail }: { userId: string; userEmail: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [brokerageName, setBrokerageName] = useState('')
  const [timezone, setTimezone] = useState(guessTimezone())
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brokerageName.trim()) {
      setError('Brokerage name is required')
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await createBrokerage({
        name: brokerageName.trim(),
        timezone,
        ownerId: userId,
      })
      if (result.error) {
        setError(result.error)
      } else {
        router.push('/goals')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Brokerage Name
        </label>
        <input
          type="text"
          value={brokerageName}
          onChange={(e) => setBrokerageName(e.target.value)}
          placeholder="e.g., Acme Realty"
          className="w-full h-12 px-4 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="w-full h-12 px-4 bg-white rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <optgroup label="Common">
            {COMMON_TIMEZONES.map((tz) => {
              const city = tz.split('/').pop()?.replace(/_/g, ' ') || tz
              return <option key={tz} value={tz}>{city}</option>
            })}
          </optgroup>
          <optgroup label="All Timezones">
            {Intl.supportedValuesOf('timeZone')
              .filter((tz) => !COMMON_TIMEZONES.includes(tz))
              .map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
          </optgroup>
        </select>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700">
        <strong>{userEmail}</strong> will be set as the admin for this brokerage.
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full h-12 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isPending ? 'Creating...' : 'Create Brokerage'}
      </button>
    </form>
  )
}
