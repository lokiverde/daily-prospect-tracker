'use client'

import { Suspense, useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { login, loginWithMagicLink } from './actions'

type ActionState = {
  error?: string
  success?: string
} | null

function SubmitButton({ children }: { children: React.ReactNode }) {
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
      {pending ? '...' : children}
    </button>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-96 skeleton rounded-xl" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const callbackError = searchParams.get('error')
  const [mode, setMode] = useState<'password' | 'magic'>('password')

  const [passwordState, passwordAction] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await login(formData)
      return result ?? null
    },
    null
  )

  const [magicState, magicAction] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      const result = await loginWithMagicLink(formData)
      return result ?? null
    },
    null
  )

  const state = mode === 'password' ? passwordState : magicState
  const action = mode === 'password' ? passwordAction : magicAction

  return (
    <div className="space-y-6">
      {/* Mode toggle */}
      <div className="flex rounded-lg bg-secondary p-1">
        <button
          type="button"
          onClick={() => setMode('password')}
          className={cn(
            'flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
            mode === 'password'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          )}
        >
          Email & Password
        </button>
        <button
          type="button"
          onClick={() => setMode('magic')}
          className={cn(
            'flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
            mode === 'magic'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted hover:text-foreground'
          )}
        >
          Magic Link
        </button>
      </div>

      {/* Error from callback */}
      {callbackError && (
        <div className="rounded-lg border border-fire/20 bg-fire/10 px-4 py-3 text-sm text-fire">
          {callbackError}
        </div>
      )}

      {/* Server action error */}
      {state?.error && (
        <div className="rounded-lg border border-fire/20 bg-fire/10 px-4 py-3 text-sm text-fire">
          {state.error}
        </div>
      )}

      {/* Success message (magic link) */}
      {state?.success && (
        <div className="rounded-lg border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent">
          {state.success}
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

        {mode === 'password' && (
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Your password"
              className={cn(
                'block h-12 w-full rounded-lg border border-border bg-card px-4 text-base text-foreground placeholder:text-muted-foreground',
                'focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20',
                'transition-colors'
              )}
            />
          </div>
        )}

        <SubmitButton>
          {mode === 'password' ? 'Sign In' : 'Send Magic Link'}
        </SubmitButton>
      </form>

      <div className="space-y-3 text-center text-sm">
        {mode === 'password' && (
          <p>
            <Link href="/reset" className="font-medium text-primary hover:text-primary/80">
              Forgot your password?
            </Link>
          </p>
        )}
        <p className="text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:text-primary/80">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
