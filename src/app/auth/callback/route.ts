import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Assign brokerage (and optionally team) to new user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const meta = user.user_metadata
        const updates: Record<string, string | null> = {}

        // Use invite params if present, otherwise auto-assign the brokerage
        if (meta?.brokerage_id) {
          updates.brokerage_id = meta.brokerage_id
        } else {
          // Check if user already has a brokerage
          const { data: profile } = await supabase
            .from('users')
            .select('brokerage_id')
            .eq('id', user.id)
            .single()

          if (!profile?.brokerage_id) {
            // Auto-assign to the first (and only) brokerage
            const { data: brokerage } = await supabase
              .from('brokerages')
              .select('id')
              .limit(1)
              .single()

            if (brokerage) {
              updates.brokerage_id = brokerage.id
            }
          }
        }

        if (meta?.team_id) updates.team_id = meta.team_id

        if (Object.keys(updates).length > 0) {
          await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }

    // Exchange failed
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'Could not verify your email. Please try again.')
    return NextResponse.redirect(loginUrl)
  }

  // No code provided
  const loginUrl = new URL('/login', origin)
  loginUrl.searchParams.set('error', 'Invalid callback. Please try signing in again.')
  return NextResponse.redirect(loginUrl)
}
