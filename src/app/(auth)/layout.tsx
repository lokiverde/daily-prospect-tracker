export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Daily Prospect Tracker
          </h1>
          <p className="mt-2 text-sm text-muted">
            Track your daily prospecting activities
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
