'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type ActionState = {
  error?: string
  success?: string
} | null

async function resetPassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required.' }
  }

  // Dynamic import to avoid bundling server code in client
  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email for a password reset link.' }
}

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
      {pending ? '...' : 'Send Reset Link'}
    </button>
  )
}

export default function ResetPage() {
  const [state, action] = useActionState<ActionState, FormData>(resetPassword, null)

  // Show success state
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
            If you have an account, you will receive an email with a link to reset your password.
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
      <div className="text-center">
        <h2 className="text-xl font-semibold text-foreground">Reset your password</h2>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we will send you a link to reset your password.
        </p>
      </div>

      {state?.error && (
        <div className="rounded-lg border border-fire/20 bg-fire/10 px-4 py-3 text-sm text-fire">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
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

        <SubmitButton />
      </form>

      <div className="text-center text-sm text-muted">
        Remember your password?{' '}
        <Link href="/login" className="font-medium text-primary hover:text-primary/80">
          Sign in
        </Link>
      </div>
    </div>
  )
}
