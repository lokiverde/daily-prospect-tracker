'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { signup } from './actions'

type ActionState = {
  error?: string
  success?: string
} | null

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'flex h-12 w-full items-center justify-center rounded-lg bg-primary text-base font-semibold text-primary-foreground transition-colors',
        'hover:bg-primary/90 active:bg-primary/80',
        'disabled:cursor-not-allowed disabled:opacity-60'
      )}
    >
      {pending ? '...' : 'Create Account'}
    </button>
  )
}

export function SignupForm() {
  const searchParams = useSearchParams()
  const brokerageId = searchParams.get('brokerage')
  const teamId = searchParams.get('team')

  const [state, action] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await signup(formData)
      return result ?? null
    },
    null
  )

  // Show success state after signup
  if (state?.success) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-6 text-center">
          <div className="mb-3 text-4xl">
            &#9993;
          </div>
          <p className="text-base font-medium text-accent">
            {state.success}
          </p>
          <p className="mt-2 text-sm text-muted">
            Click the link in your email to activate your account.
          </p>
        </div>
        <div className="text-center text-sm">
          <Link href="/login" className="font-medium text-primary hover:text-primary/80">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {state?.error && (
        <div className="rounded-lg border border-fire/20 bg-fire/10 px-4 py-3 text-sm text-fire">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        {brokerageId && <input type="hidden" name="brokerage_id" value={brokerageId} />}
        {teamId && <input type="hidden" name="team_id" value={teamId} />}
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-foreground">
            Full Name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            autoComplete="name"
            required
            placeholder="Your full name"
            className={cn(
              'block h-12 w-full rounded-lg border border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20',
              'transition-colors'
            )}
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            className={cn(
              'block h-12 w-full rounded-lg border border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20',
              'transition-colors'
            )}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            placeholder="At least 6 characters"
            className={cn(
              'block h-12 w-full rounded-lg border border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20',
              'transition-colors'
            )}
          />
        </div>

        <SubmitButton />
      </form>

      <div className="text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:text-primary/80">
          Sign in
        </Link>
      </div>
    </div>
  )
}
