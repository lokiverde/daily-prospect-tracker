import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEFAULT_CONVERSION_RATES } from '@/lib/calculations'
import { GoalWizard } from './goal-wizard'
import type { Tables } from '@/lib/supabase/types'

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const currentYear = new Date().getFullYear()

  // Fetch goals and brokerage settings in parallel
  const [goalsResult, profileResult] = await Promise.all([
    supabase.from('goals').select('*').eq('user_id', user.id).eq('year', currentYear).single(),
    supabase.from('users').select('brokerage_id').eq('id', user.id).single(),
  ])

  const existingGoals = goalsResult.data as Tables<'goals'> | null

  // Load brokerage conversion rates
  let conversionRates = DEFAULT_CONVERSION_RATES
  const brokerageId = (profileResult.data as { brokerage_id: string | null } | null)?.brokerage_id
  if (brokerageId) {
    const adminDb = createAdminClient()
    const { data: brokerage } = await adminDb
      .from('brokerages')
      .select('settings')
      .eq('id', brokerageId)
      .single()
    const settings = (brokerage as { settings: Record<string, unknown> } | null)?.settings
    const saved = settings?.conversion_rates as {
      contactToAppointment?: number
      appointmentToContract?: number
      contractToClosing?: number
    } | undefined
    if (saved) {
      conversionRates = {
        contactToAppointment: saved.contactToAppointment ?? DEFAULT_CONVERSION_RATES.contactToAppointment,
        appointmentToContract: saved.appointmentToContract ?? DEFAULT_CONVERSION_RATES.appointmentToContract,
        contractToClosing: saved.contractToClosing ?? DEFAULT_CONVERSION_RATES.contractToClosing,
      }
    }
  }

  return <GoalWizard existingGoals={existingGoals} conversionRates={conversionRates} />
}
