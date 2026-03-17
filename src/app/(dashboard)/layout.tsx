import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MobileNav } from '@/components/layout/mobile-nav'
import { Logo } from '@/components/layout/logo'
import { isDemoMode } from '@/lib/demo'
import { DemoBanner } from '@/components/demo/demo-banner'
import { CTAStrip } from '@/components/demo/cta-strip'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // In demo mode, skip all auth and onboarding checks
  if (isDemoMode()) {
    return (
      <div className="min-h-dvh bg-background">
        <DemoBanner />
        <div className="flex h-12 items-center justify-center border-b border-border bg-white">
          <Logo />
        </div>
        <main className="pb-36">
          {children}
        </main>
        <CTAStrip />
        <MobileNav isDemo />
      </div>
    )
  }

  const supabase = await createClient()

  // Verify authentication (getUser() is secure, unlike getSession())
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user profile from public.users table
  const { data: profile } = await supabase
    .from('users')
    .select('role, brokerage_id')
    .eq('id', user.id)
    .single()

  // If no brokerage exists yet, redirect to the first-run setup page
  if (!profile?.brokerage_id) {
    const { count } = await supabase
      .from('brokerages')
      .select('*', { count: 'exact', head: true })

    if (!count || count === 0) {
      redirect('/setup')
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="flex h-12 items-center justify-center border-b border-border bg-white">
        <Logo />
      </div>
      <main className="pb-20">
        {children}
      </main>
      <MobileNav userRole={profile?.role} />
    </div>
  )
}
