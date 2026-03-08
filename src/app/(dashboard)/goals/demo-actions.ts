'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { DEMO_AGENT_EMAIL } from '@/lib/demo'
import { revalidatePath } from 'next/cache'

export async function saveDemoGoals(data: {
  annualIncomeGoal: number
  avgCommissionPct: number
  avgSalePrice: number
  closingsGoal: number
  contractsGoal: number
  appointmentsGoal: number
  contactsGoal: number
  dailyPointsGoal: number
}) {
  const supabase = createAdminClient()

  const { data: demoUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', DEMO_AGENT_EMAIL)
    .single()

  if (!demoUser) return { error: 'Demo user not found' }

  const year = new Date().getFullYear()

  const { error } = await supabase
    .from('goals')
    .upsert({
      user_id: demoUser.id,
      year,
      annual_income_goal: data.annualIncomeGoal,
      avg_commission_pct: data.avgCommissionPct,
      avg_sale_price: data.avgSalePrice,
      closings_goal: data.closingsGoal,
      contracts_goal: data.contractsGoal,
      appointments_goal: data.appointmentsGoal,
      contacts_goal: data.contactsGoal,
      daily_points_goal: data.dailyPointsGoal,
      set_by: 'self',
    }, { onConflict: 'user_id,year' })

  if (error) return { error: error.message }

  revalidatePath('/')
  revalidatePath('/goals')
  return { success: true }
}
