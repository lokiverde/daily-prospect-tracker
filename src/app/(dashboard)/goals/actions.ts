'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InsertTables } from '@/lib/supabase/types'

export async function saveGoals(data: {
  annualIncomeGoal: number
  avgCommissionPct: number
  avgSalePrice: number
  closingsGoal: number
  contractsGoal: number
  appointmentsGoal: number
  contactsGoal: number
  dailyPointsGoal: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const year = new Date().getFullYear()

  const goalData = {
    user_id: user.id,
    year,
    annual_income_goal: data.annualIncomeGoal,
    avg_commission_pct: data.avgCommissionPct,
    avg_sale_price: data.avgSalePrice,
    closings_goal: data.closingsGoal,
    contracts_goal: data.contractsGoal,
    appointments_goal: data.appointmentsGoal,
    contacts_goal: data.contactsGoal,
    daily_points_goal: data.dailyPointsGoal,
    set_by: 'self' as const,
  } satisfies InsertTables<'goals'>

  const { error } = await supabase
    .from('goals')
    .upsert(goalData, { onConflict: 'user_id,year' })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/goals')
  return { success: true }
}

export async function markOnboarded() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('users')
    .update({ is_onboarded: true })
    .eq('id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/')
  return { success: true }
}
