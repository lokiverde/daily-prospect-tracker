/**
 * Demo mode utilities
 *
 * When NEXT_PUBLIC_DEMO_MODE is set to 'true', the app runs in demo mode:
 * - No login required
 * - Public leaderboard visible to everyone
 * - Activity logging works as "New Agent" without auth
 * - Data resets nightly via pg_cron
 */

export function isDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
}

export function getDemoCTAUrl(): string {
  return process.env.NEXT_PUBLIC_CONSULTING_CTA_URL || 'https://calendly.com/techtony/30min'
}

export const DEMO_AGENT_EMAIL = 'demo-agent@demo.com'
