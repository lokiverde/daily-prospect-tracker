'use client'

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6">
      <p className="text-muted">Something went wrong loading this page.</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        Try Again
      </button>
    </div>
  )
}
