-- Phase 1C: Team & Admin
-- Run this in Supabase SQL Editor after the initial schema is in place.

-- ============================================================
-- 1. Parameterized leaderboard function
--    Replaces the rigid weekly_leaderboard view with a flexible
--    function that supports week/month/year and team/brokerage scope.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_period TEXT DEFAULT 'week',
  p_team_id UUID DEFAULT NULL,
  p_brokerage_id UUID DEFAULT NULL
)
RETURNS TABLE(
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  team_id UUID,
  brokerage_id UUID,
  brokerage_visibility TEXT,
  total_points NUMERIC,
  activity_count BIGINT,
  current_streak INTEGER
)
AS $$
DECLARE
  period_start TIMESTAMPTZ;
BEGIN
  IF p_period = 'month' THEN
    period_start := date_trunc('month', NOW());
  ELSIF p_period = 'year' THEN
    period_start := date_trunc('year', NOW());
  ELSE
    period_start := date_trunc('week', NOW());
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.full_name,
    u.avatar_url,
    u.team_id,
    u.brokerage_id,
    u.brokerage_visibility::TEXT,
    COALESCE(SUM(a.points), 0) AS total_points,
    COUNT(a.id) AS activity_count,
    COALESCE(s.current_streak, 0) AS current_streak
  FROM public.users u
  LEFT JOIN public.activities a
    ON a.user_id = u.id
    AND a.logged_at >= period_start
  LEFT JOIN public.streaks s
    ON s.user_id = u.id
  WHERE
    (p_team_id IS NULL OR u.team_id = p_team_id)
    AND (p_brokerage_id IS NULL OR u.brokerage_id = p_brokerage_id)
  GROUP BY u.id, u.full_name, u.avatar_url, u.team_id,
           u.brokerage_id, u.brokerage_visibility, s.current_streak
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================
-- 2. Member activity summary function
--    Returns activity breakdown for a given user over a period.
--    Used when team leaders/admin tap a member row.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_member_activity_summary(
  p_user_id UUID,
  p_period TEXT DEFAULT 'week'
)
RETURNS TABLE(
  activity_name TEXT,
  activity_icon TEXT,
  activity_count BIGINT,
  total_points NUMERIC
)
AS $$
DECLARE
  period_start TIMESTAMPTZ;
BEGIN
  IF p_period = 'month' THEN
    period_start := date_trunc('month', NOW());
  ELSIF p_period = 'year' THEN
    period_start := date_trunc('year', NOW());
  ELSE
    period_start := date_trunc('week', NOW());
  END IF;

  RETURN QUERY
  SELECT
    at.name AS activity_name,
    at.icon AS activity_icon,
    COUNT(a.id) AS activity_count,
    COALESCE(SUM(a.points), 0) AS total_points
  FROM public.activities a
  JOIN public.activity_types at ON at.id = a.activity_type_id
  WHERE a.user_id = p_user_id
    AND a.logged_at >= period_start
  GROUP BY at.name, at.icon
  ORDER BY total_points DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================
-- 3. Additional RLS policies for Phase 1C
-- ============================================================

-- Admin can insert users (for invite flow where profile is created)
CREATE POLICY "Admin can insert users"
  ON public.users FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'broker'));

-- Team leaders can update their own team members (for team assignment changes)
CREATE POLICY "Team leaders can update own team members"
  ON public.users FOR UPDATE
  USING (
    team_id IN (
      SELECT t.id FROM public.teams t WHERE t.leader_id = auth.uid()
    )
  );

-- Broker can insert teams
CREATE POLICY "Broker can insert teams"
  ON public.teams FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'broker'));

-- Admin can delete teams
CREATE POLICY "Broker can delete teams"
  ON public.teams FOR DELETE
  USING (public.get_user_role() IN ('admin', 'broker'));

-- Admin can view all activities (for member detail view)
CREATE POLICY "Admin can view all activities"
  ON public.activities FOR SELECT
  USING (public.get_user_role() IN ('admin', 'broker'));

-- Admin can manage all streaks (for viewing member streaks)
CREATE POLICY "Admin can view all streaks"
  ON public.streaks FOR SELECT
  USING (public.get_user_role() IN ('admin', 'broker'));
