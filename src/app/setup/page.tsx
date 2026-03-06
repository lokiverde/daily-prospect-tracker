import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SetupForm } from './setup-form'

export default async function SetupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If a brokerage already exists, no setup needed
  const { count } = await supabase
    .from('brokerages')
    .select('*', { count: 'exact', head: true })

  if (count && count > 0) {
    redirect('/')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome
          </h1>
          <p className="mt-2 text-sm text-muted">
            Set up your brokerage to get started
          </p>
        </div>
        <SetupForm userId={user.id} userEmail={user.email || ''} />
      </div>
    </div>
  )
}
