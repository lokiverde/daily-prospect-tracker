import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DEFAULT_CONVERSION_RATES } from '@/lib/calculations'
import { SettingsView } from './settings-view'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('brokerage_id')
    .eq('id', user.id)
    .single()

  const brokerageId = (profile as { brokerage_id: string | null } | null)?.brokerage_id

  if (!brokerageId) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16">
        <p className="text-sm text-muted">No brokerage configured</p>
      </div>
    )
  }

  const adminDb = createAdminClient()

  // Fetch brokerage settings
  const { data: brokerage } = await adminDb
    .from('brokerages')
    .select('id, name, settings')
    .eq('id', brokerageId)
    .single()

  const brokerageSettings = (brokerage as { settings: Record<string, unknown> } | null)?.settings || {}
  const defaultDailyGoal = (brokerageSettings.default_daily_goal as number) || 80
  const savedRates = brokerageSettings.conversion_rates as {
    contactToAppointment?: number
    appointmentToContract?: number
    contractToClosing?: number
  } | undefined
  const conversionRates = {
    contactToAppointment: savedRates?.contactToAppointment ?? DEFAULT_CONVERSION_RATES.contactToAppointment,
    appointmentToContract: savedRates?.appointmentToContract ?? DEFAULT_CONVERSION_RATES.appointmentToContract,
    contractToClosing: savedRates?.contractToClosing ?? DEFAULT_CONVERSION_RATES.contractToClosing,
  }

  // Fetch all activity types
  const { data: activityTypes } = await adminDb
    .from('activity_types')
    .select('id, name, points, category, icon, sort_order, is_default, is_active')
    .order('sort_order')

  type ActivityTypeRow = {
    id: string
    name: string
    points: number
    category: string
    icon: string | null
    sort_order: number
    is_default: boolean
    is_active: boolean
  }

  const currentTimezone = (brokerageSettings.timezone as string) || 'America/Los_Angeles'

  return (
    <SettingsView
      defaultDailyGoal={defaultDailyGoal}
      conversionRates={conversionRates}
      activityTypes={(activityTypes || []) as ActivityTypeRow[]}
      currentTimezone={currentTimezone}
    />
  )
}
