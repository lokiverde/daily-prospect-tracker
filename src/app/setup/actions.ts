'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBrokerage(data: {
  name: string
  timezone: string
  ownerId: string
}) {
  const adminDb = createAdminClient()

  // Verify no brokerage exists yet (first-run only)
  const { count } = await adminDb
    .from('brokerages')
    .select('*', { count: 'exact', head: true })

  if (count && count > 0) {
    return { error: 'A brokerage already exists. Refresh the page.' }
  }

  // Validate timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: data.timezone })
  } catch {
    return { error: 'Invalid timezone' }
  }

  // Create the brokerage
  const { data: brokerage, error: insertError } = await adminDb
    .from('brokerages')
    .insert({
      name: data.name,
      owner_id: data.ownerId,
      settings: { timezone: data.timezone },
    })
    .select()
    .single()

  if (insertError) return { error: insertError.message }

  // Set the user as admin and assign them to the brokerage
  const { error: updateError } = await adminDb
    .from('users')
    .update({
      role: 'admin',
      brokerage_id: brokerage.id,
    })
    .eq('id', data.ownerId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/')
  return { success: true }
}
