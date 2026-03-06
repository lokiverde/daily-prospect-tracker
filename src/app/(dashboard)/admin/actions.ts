'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { UserRole, ActivityCategory } from '@/lib/supabase/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' as const, supabase: null, adminDb: null, user: null }

  const { data: profile } = await supabase
    .from('users')
    .select('role, brokerage_id')
    .eq('id', user.id)
    .single()

  const typedProfile = profile as { role: string; brokerage_id: string | null } | null

  if (!typedProfile || !['admin', 'broker'].includes(typedProfile.role)) {
    return { error: 'Not authorized' as const, supabase: null, adminDb: null, user: null }
  }

  // Use admin client (service role) for all admin operations to bypass RLS
  const adminDb = createAdminClient()

  return { error: null, supabase, adminDb, user, brokerageId: typedProfile.brokerage_id }
}

// ── Agent Management ──

export async function updateAgentRole(userId: string, newRole: UserRole) {
  const { error, adminDb, user } = await requireAdmin()
  if (error || !adminDb || !user) return { error: error || 'Failed' }

  // Cannot change your own role
  if (userId === user.id) return { error: 'Cannot change your own role' }

  const { error: updateError } = await adminDb
    .from('users')
    .update({ role: newRole })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function assignAgentToTeam(userId: string, teamId: string | null) {
  const { error, adminDb } = await requireAdmin()
  if (error || !adminDb) return { error: error || 'Failed' }

  const { error: updateError } = await adminDb
    .from('users')
    .update({ team_id: teamId })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin')
  revalidatePath('/admin/teams')
  return { success: true }
}

export async function removeAgentFromBrokerage(userId: string) {
  const { error, adminDb, user } = await requireAdmin()
  if (error || !adminDb || !user) return { error: error || 'Failed' }

  if (userId === user.id) return { error: 'Cannot remove yourself' }

  const { error: updateError } = await adminDb
    .from('users')
    .update({ brokerage_id: null, team_id: null })
    .eq('id', userId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin')
  return { success: true }
}

// ── Team Management ──

export async function createTeam(name: string, leaderId: string) {
  const { error, adminDb, brokerageId } = await requireAdmin()
  if (error || !adminDb) return { error: error || 'Failed' }

  if (!name.trim()) return { error: 'Team name is required' }

  const { data: team, error: insertError } = await adminDb
    .from('teams')
    .insert({
      name: name.trim(),
      leader_id: leaderId,
      brokerage_id: brokerageId,
    })
    .select()
    .single()

  if (insertError) return { error: insertError.message }

  // Promote leader to team_leader role if they are an agent
  const { data: leader } = await adminDb
    .from('users')
    .select('role')
    .eq('id', leaderId)
    .single()

  if (leader && (leader as { role: string }).role === 'agent') {
    await adminDb
      .from('users')
      .update({ role: 'team_leader', team_id: team.id })
      .eq('id', leaderId)
  } else {
    // Just assign team
    await adminDb
      .from('users')
      .update({ team_id: team.id })
      .eq('id', leaderId)
  }

  revalidatePath('/admin')
  revalidatePath('/admin/teams')
  return { data: team }
}

export async function updateTeam(
  teamId: string,
  data: { name?: string; leaderId?: string }
) {
  const { error, adminDb } = await requireAdmin()
  if (error || !adminDb) return { error: error || 'Failed' }

  const updates: Record<string, string> = {}
  if (data.name) updates.name = data.name.trim()
  if (data.leaderId) updates.leader_id = data.leaderId

  if (Object.keys(updates).length === 0) return { error: 'Nothing to update' }

  const { error: updateError } = await adminDb
    .from('teams')
    .update(updates)
    .eq('id', teamId)

  if (updateError) return { error: updateError.message }

  // If leader changed, promote new leader to team_leader if agent
  if (data.leaderId) {
    const { data: leader } = await adminDb
      .from('users')
      .select('role')
      .eq('id', data.leaderId)
      .single()

    if (leader && (leader as { role: string }).role === 'agent') {
      await adminDb
        .from('users')
        .update({ role: 'team_leader', team_id: teamId })
        .eq('id', data.leaderId)
    }
  }

  revalidatePath('/admin/teams')
  return { success: true }
}

export async function deleteTeam(teamId: string) {
  const { error, adminDb } = await requireAdmin()
  if (error || !adminDb) return { error: error || 'Failed' }

  // Unassign all team members
  await adminDb
    .from('users')
    .update({ team_id: null })
    .eq('team_id', teamId)

  // Delete the team
  const { error: deleteError } = await adminDb
    .from('teams')
    .delete()
    .eq('id', teamId)

  if (deleteError) return { error: deleteError.message }

  revalidatePath('/admin')
  revalidatePath('/admin/teams')
  return { success: true }
}

// ── Activity Type Management ──

export async function updateActivityType(
  activityTypeId: string,
  data: { points?: number; isActive?: boolean; name?: string }
) {
  const { error, adminDb } = await requireAdmin()
  if (error || !adminDb) return { error: error || 'Failed' }

  const updates: Record<string, unknown> = {}
  if (data.points !== undefined) updates.points = data.points
  if (data.isActive !== undefined) updates.is_active = data.isActive
  if (data.name !== undefined) updates.name = data.name.trim()

  const { error: updateError } = await adminDb
    .from('activity_types')
    .update(updates)
    .eq('id', activityTypeId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/settings')
  revalidatePath('/log')
  return { success: true }
}

export async function createCustomActivity(data: {
  name: string
  points: number
  category: ActivityCategory
  icon: string
}) {
  const { error, adminDb, brokerageId } = await requireAdmin()
  if (error || !adminDb) return { error: error || 'Failed' }

  if (!data.name.trim()) return { error: 'Activity name is required' }
  if (data.points <= 0) return { error: 'Points must be greater than 0' }

  // Get current max sort_order
  const { data: maxSort } = await adminDb
    .from('activity_types')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const nextSort = ((maxSort as { sort_order: number } | null)?.sort_order || 0) + 1

  const { data: activity, error: insertError } = await adminDb
    .from('activity_types')
    .insert({
      name: data.name.trim(),
      points: data.points,
      category: data.category,
      icon: data.icon,
      sort_order: nextSort,
      is_default: false,
      is_active: true,
      brokerage_id: brokerageId,
    })
    .select()
    .single()

  if (insertError) return { error: insertError.message }

  revalidatePath('/admin/settings')
  revalidatePath('/log')
  return { data: activity }
}

export async function updateBrokerageDefaultGoal(dailyPointsGoal: number) {
  const { error, adminDb, brokerageId } = await requireAdmin()
  if (error || !adminDb) return { error: error || 'Failed' }

  if (!brokerageId) return { error: 'No brokerage found' }

  // Get current settings and merge
  const { data: brokerage } = await adminDb
    .from('brokerages')
    .select('settings')
    .eq('id', brokerageId)
    .single()

  const currentSettings = (brokerage as { settings: Record<string, unknown> } | null)?.settings || {}

  const { error: updateError } = await adminDb
    .from('brokerages')
    .update({
      settings: { ...currentSettings, default_daily_goal: dailyPointsGoal },
    })
    .eq('id', brokerageId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/settings')
  return { success: true }
}

// ── Conversion Rates ──

export async function updateBrokerageConversionRates(rates: {
  contactToAppointment: number
  appointmentToContract: number
  contractToClosing: number
}) {
  const { error, adminDb, brokerageId } = await requireAdmin()
  if (error || !adminDb) return { error: error || 'Failed' }

  if (!brokerageId) return { error: 'No brokerage found' }

  // Validate rates are between 0 and 1
  for (const [, val] of Object.entries(rates)) {
    if (val <= 0 || val > 1) {
      return { error: 'Rates must be between 1% and 100%' }
    }
  }

  const { data: brokerage } = await adminDb
    .from('brokerages')
    .select('settings')
    .eq('id', brokerageId)
    .single()

  const currentSettings = (brokerage as { settings: Record<string, unknown> } | null)?.settings || {}

  const { error: updateError } = await adminDb
    .from('brokerages')
    .update({
      settings: {
        ...currentSettings,
        conversion_rates: rates,
      },
    })
    .eq('id', brokerageId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/settings')
  return { success: true }
}

// ── Timezone ──

export async function updateBrokerageTimezone(timezone: string) {
  const { error, adminDb, brokerageId } = await requireAdmin()
  if (error || !adminDb) return { error: error || 'Failed' }

  if (!brokerageId) return { error: 'No brokerage found' }

  // Validate the timezone is a real IANA timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
  } catch {
    return { error: 'Invalid timezone' }
  }

  const { data: brokerage } = await adminDb
    .from('brokerages')
    .select('settings')
    .eq('id', brokerageId)
    .single()

  const currentSettings = (brokerage as { settings: Record<string, unknown> } | null)?.settings || {}

  const { error: updateError } = await adminDb
    .from('brokerages')
    .update({
      settings: { ...currentSettings, timezone },
    })
    .eq('id', brokerageId)

  if (updateError) return { error: updateError.message }

  revalidatePath('/admin/settings')
  return { success: true }
}

// ── Invite ──

export async function generateInviteLink(teamId?: string) {
  const { error, brokerageId } = await requireAdmin()
  if (error) return { error }

  if (!brokerageId) return { error: 'No brokerage found' }

  // Get the origin from request headers so the link matches the current domain
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const host = headersList.get('host') || 'localhost:3000'
  const proto = headersList.get('x-forwarded-proto') || 'https'
  const baseUrl = `${proto}://${host}`

  const params = new URLSearchParams({ brokerage: brokerageId })
  if (teamId) params.set('team', teamId)

  const inviteUrl = `${baseUrl}/signup?${params.toString()}`

  return { data: { inviteUrl } }
}
