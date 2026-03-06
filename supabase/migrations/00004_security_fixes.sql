-- Security fixes from Supabase linter warnings

-- 1. Drop unused legacy views (SECURITY DEFINER - ERROR level)
DROP VIEW IF EXISTS public.weekly_leaderboard;
DROP VIEW IF EXISTS public.daily_stats;

-- 2. Drop old function overloads (replaced by 00003 with p_period_start param)
DROP FUNCTION IF EXISTS public.get_leaderboard(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.get_member_activity_summary(UUID, TEXT);

-- 3. Fix mutable search_path on all functions
-- Functions that reference auth.uid() need 'auth' in search_path
ALTER FUNCTION public.get_leaderboard(TEXT, UUID, UUID, TIMESTAMPTZ) SET search_path = 'public', 'auth';
ALTER FUNCTION public.get_member_activity_summary(UUID, TEXT, TIMESTAMPTZ) SET search_path = 'public', 'auth';
ALTER FUNCTION public.update_updated_at() SET search_path = 'public';
ALTER FUNCTION public.update_streak() SET search_path = 'public', 'auth';
ALTER FUNCTION public.handle_new_user() SET search_path = 'public', 'auth';
-- Note: get_user_role, get_user_team_id, get_user_brokerage_id are
-- recreated with SET search_path in 00005_rls_performance.sql
