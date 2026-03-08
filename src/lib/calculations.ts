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

/** Get the current date components (year, month, day, dayOfWeek) in a given timezone.
 *  Uses Intl.DateTimeFormat which correctly handles DST transitions. */
function getLocalDateParts(tz: string, date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parts.find(p => p.type === type)?.value || ''
  return {
    year: parseInt(get('year'), 10),
    month: parseInt(get('month'), 10) - 1, // 0-indexed to match Date convention
    day: parseInt(get('day'), 10),
    dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
  }
}

/** Convert a local midnight to a UTC ISO string.
 *  Two-pass approach: first estimates midnight using noon offset, then
 *  recalculates using the offset from several hours before midnight
 *  to correctly handle DST spring-forward/fall-back transitions. */
function localMidnightToUTC(tz: string, year: number, month: number, day: number): string {
  function getOffsetAt(date: Date): number {
    const u = date.toLocaleString('en-US', { timeZone: 'UTC' })
    const t = date.toLocaleString('en-US', { timeZone: tz })
    return new Date(t).getTime() - new Date(u).getTime()
  }

  // Pass 1: rough estimate using noon offset
  const noon = new Date(Date.UTC(year, month, day, 12))
  const roughOffset = getOffsetAt(noon)
  const roughMidnight = Date.UTC(year, month, day) - roughOffset

  // Pass 2: get the actual offset several hours before estimated midnight
  // This lands in the evening of the previous day (local), well before any
  // 2 AM DST transition, giving us the correct pre-midnight offset
  const beforeMidnight = new Date(roughMidnight - 6 * 3600000)
  const exactOffset = getOffsetAt(beforeMidnight)

  return new Date(Date.UTC(year, month, day) - exactOffset).toISOString()
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
