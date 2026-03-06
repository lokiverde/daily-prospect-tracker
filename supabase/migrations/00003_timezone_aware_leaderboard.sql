-- Fix: Accept explicit period_start from the application layer
-- so date boundaries use Pacific time instead of UTC.

-- 1. Update get_leaderboard to accept p_period_start
CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_period TEXT DEFAULT 'week',
  p_team_id UUID DEFAULT NULL,
  p_brokerage_id UUID DEFAULT NULL,
  p_period_start TIMESTAMPTZ DEFAULT NULL
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
  -- Use the provided start time (timezone-aware) or fall back to UTC date_trunc
  IF p_period_start IS NOT NULL THEN
    period_start := p_period_start;
  ELSIF p_period = 'month' THEN
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


-- 2. Update get_member_activity_summary to accept p_period_start
CREATE OR REPLACE FUNCTION public.get_member_activity_summary(
  p_user_id UUID,
  p_period TEXT DEFAULT 'week',
  p_period_start TIMESTAMPTZ DEFAULT NULL
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
  IF p_period_start IS NOT NULL THEN
    period_start := p_period_start;
  ELSIF p_period = 'month' THEN
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
