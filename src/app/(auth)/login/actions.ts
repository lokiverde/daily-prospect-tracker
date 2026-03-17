'use server'

import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Determine where to send the user
  let redirectTo = '/'
  if (data.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_onboarded')
      .eq('id', data.user.id)
      .single()

    if (!profile?.is_onboarded) {
      redirectTo = '/goals'
    }
  }

  // Return redirectTo instead of calling redirect() so cookies are preserved
  return { redirectTo }
}

export async function loginWithMagicLink(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required.' }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: 'Check your email for a magic link to sign in.' }
}
