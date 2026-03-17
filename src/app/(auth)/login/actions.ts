'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(_prevState: { error?: string } | null, formData: FormData) {
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

  // Check onboarding status to redirect directly to the right page
  // (avoids a double-redirect through / then /goals)
  if (data.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('is_onboarded')
      .eq('id', data.user.id)
      .single()

    if (!profile?.is_onboarded) {
      redirect('/goals')
    }
  }

  redirect('/')
}

export async function loginWithMagicLink(_prevState: { error?: string; success?: string } | null, formData: FormData) {
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
