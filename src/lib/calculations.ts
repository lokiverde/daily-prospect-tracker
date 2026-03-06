// Default conversion funnel rates
export const DEFAULT_CONVERSION_RATES = {
  contactToAppointment: 0.30,
  appointmentToContract: 0.50,
  contractToClosing: 0.80,
}

export interface ConversionRates {
  contactToAppointment: number
  appointmentToContract: number
  contractToClosing: number
}

export interface GoalCalculation {
  closingsGoal: number
  contractsGoal: number
  appointmentsGoal: number
  contactsGoal: number
}

export function calculateGoals(
  annualIncome: number,
  commissionRate: number,
  avgSalePrice: number,
  rates?: Partial<ConversionRates>
): GoalCalculation {
  const r = { ...DEFAULT_CONVERSION_RATES, ...rates }
  const commissionPerSale = avgSalePrice * commissionRate
  const closingsGoal = commissionPerSale > 0 ? Math.ceil(annualIncome / commissionPerSale) : 0
  const contractsGoal = Math.ceil(closingsGoal / r.contractToClosing)
  const appointmentsGoal = Math.ceil(contractsGoal / r.appointmentToContract)
  const contactsGoal = Math.ceil(appointmentsGoal / r.contactToAppointment)

  return {
    closingsGoal,
    contractsGoal,
    appointmentsGoal,
    contactsGoal,
  }
}

export function getGreeting(hour?: number): string {
  const h = hour ?? new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getPointsToGoal(current: number, goal: number): string {
  const remaining = goal - current
  if (remaining <= 0) {
    const bonus = current - goal
    return bonus > 0 ? `Goal reached! +${formatPts(bonus)} bonus` : 'Goal reached!'
  }
  return `${formatPts(remaining)} pts to daily goal`
}

function formatPts(pts: number): string {
  return Number.isInteger(pts) ? pts.toString() : pts.toFixed(1)
}

// ── Timezone-aware date helpers ──
// Vercel runs in UTC but users may be in any timezone.
// All date boundaries must be computed in the brokerage timezone.

const DEFAULT_TIMEZONE = 'America/Los_Angeles'

/** Get the UTC offset in milliseconds for a timezone at a given moment. */
function getTimezoneOffsetMs(tz: string, date: Date = new Date()): number {
  const utcStr = date.toLocaleString('en-US', { timeZone: 'UTC' })
  const tzStr = date.toLocaleString('en-US', { timeZone: tz })
  return (new Date(tzStr).getTime() - new Date(utcStr).getTime())
}

/** Get the current date components (year, month, day, dayOfWeek) in a given timezone. */
function getLocalDateParts(tz: string, date: Date = new Date()) {
  const offsetMs = getTimezoneOffsetMs(tz, date)
  const local = new Date(date.getTime() + offsetMs)
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    dayOfWeek: local.getUTCDay(),
  }
}

/** Convert a local midnight to a UTC ISO string. */
function localMidnightToUTC(tz: string, year: number, month: number, day: number): string {
  const approx = new Date(Date.UTC(year, month, day, 12))
  const offsetMs = getTimezoneOffsetMs(tz, approx)
  const midnightUTC = new Date(Date.UTC(year, month, day) - offsetMs)
  return midnightUTC.toISOString()
}

/** Get start and end of a specific day in the brokerage timezone. */
export function getDayRange(year: number, month: number, day: number, timezone?: string): { start: string; end: string } {
  const tz = timezone || DEFAULT_TIMEZONE
  return {
    start: localMidnightToUTC(tz, year, month, day),
    end: localMidnightToUTC(tz, year, month, day + 1),
  }
}

/** Get start and end of today in the brokerage timezone as UTC ISO strings. */
export function getTodayRange(timezone?: string): { start: string; end: string } {
  const tz = timezone || DEFAULT_TIMEZONE
  const { year, month, day } = getLocalDateParts(tz)
  return {
    start: localMidnightToUTC(tz, year, month, day),
    end: localMidnightToUTC(tz, year, month, day + 1),
  }
}

/** Get start of current week (Monday) in the brokerage timezone. */
export function getWeekStart(timezone?: string): string {
  const tz = timezone || DEFAULT_TIMEZONE
  const { year, month, day, dayOfWeek } = getLocalDateParts(tz)
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  return localMidnightToUTC(tz, year, month, day + diff)
}

/** Get start of current month in the brokerage timezone. */
export function getMonthStart(timezone?: string): string {
  const tz = timezone || DEFAULT_TIMEZONE
  const { year, month } = getLocalDateParts(tz)
  return localMidnightToUTC(tz, year, month, 1)
}

/** Get start of current year in the brokerage timezone. */
export function getYearStart(timezone?: string): string {
  const tz = timezone || DEFAULT_TIMEZONE
  const { year } = getLocalDateParts(tz)
  return localMidnightToUTC(tz, year, 0, 1)
}
