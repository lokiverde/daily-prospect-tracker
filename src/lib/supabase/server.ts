import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component -- middleware handles cookie persistence
          }
        },
      },
    }
  )
}

// Fetch the brokerage timezone from the database.
// Falls back to 'America/Los_Angeles' if not set.
export async function getBrokerageTimezone(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'America/Los_Angeles'

  const { data: profile } = await supabase
    .from('users')
    .select('brokerage_id')
    .eq('id', user.id)
    .single()

  if (!profile?.brokerage_id) return 'America/Los_Angeles'

  const { data: brokerage } = await supabase
    .from('brokerages')
    .select('settings')
    .eq('id', profile.brokerage_id)
    .single()

  const settings = brokerage?.settings as Record<string, unknown> | null
  return (settings?.timezone as string) || 'America/Los_Angeles'
}

// Admin client using service role key -- bypasses RLS
// Use ONLY in admin server components/actions after verifying the caller is admin/broker
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
