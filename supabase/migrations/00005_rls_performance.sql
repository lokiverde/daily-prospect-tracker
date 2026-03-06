-- ============================================================
-- RLS Performance & Security Fixes
--
-- 1. auth_rls_initplan: wrap auth.uid() in (select ...) for per-query eval
-- 2. multiple_permissive_policies: consolidate overlapping policies
-- 3. Infinite recursion fix: use SECURITY DEFINER helpers instead of
--    cross-table subqueries to break circular policy dependencies
-- ============================================================


-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER = bypass RLS, no recursion)
-- ============================================================

-- Returns the team ID where the current user is the leader
CREATE OR REPLACE FUNCTION public.get_led_team_id()
RETURNS UUID AS $$
  SELECT id FROM public.teams WHERE leader_id = auth.uid() LIMIT 1
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = 'public', 'auth';

-- Fix existing helpers to include auth in search_path
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = 'public', 'auth';

CREATE OR REPLACE FUNCTION public.get_user_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = 'public', 'auth';

CREATE OR REPLACE FUNCTION public.get_user_brokerage_id()
RETURNS UUID AS $$
  SELECT brokerage_id FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = 'public', 'auth';


-- ============================================================
-- USERS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Team leaders can view team members" ON public.users;
DROP POLICY IF EXISTS "Broker can view all brokerage users" ON public.users;
DROP POLICY IF EXISTS "Admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Admin can update all users" ON public.users;
DROP POLICY IF EXISTS "Admin can insert users" ON public.users;
DROP POLICY IF EXISTS "Team leaders can update own team members" ON public.users;
DROP POLICY IF EXISTS "View users" ON public.users;
DROP POLICY IF EXISTS "Update users" ON public.users;
DROP POLICY IF EXISTS "Insert users" ON public.users;

-- SELECT: own OR team leader's team OR broker's brokerage OR admin
CREATE POLICY "View users" ON public.users FOR SELECT USING (
  (select auth.uid()) = id
  OR team_id = public.get_led_team_id()
  OR brokerage_id = public.get_user_brokerage_id()
  OR public.get_user_role() = 'admin'
);

-- UPDATE: own OR team leader's team OR admin/broker
CREATE POLICY "Update users" ON public.users FOR UPDATE USING (
  (select auth.uid()) = id
  OR team_id = public.get_led_team_id()
  OR public.get_user_role() IN ('admin', 'broker')
);

-- INSERT: admin/broker only
CREATE POLICY "Insert users" ON public.users FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'broker'));


-- ============================================================
-- ACTIVITIES TABLE
-- ============================================================

DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
DROP POLICY IF EXISTS "Users can delete own activities" ON public.activities;
DROP POLICY IF EXISTS "Team leaders can view team activities" ON public.activities;
DROP POLICY IF EXISTS "Broker can view brokerage activities" ON public.activities;
DROP POLICY IF EXISTS "Admin can view all activities" ON public.activities;
DROP POLICY IF EXISTS "View activities" ON public.activities;
DROP POLICY IF EXISTS "Insert activities" ON public.activities;
DROP POLICY IF EXISTS "Delete activities" ON public.activities;

-- SELECT: own OR team leader's team OR admin/broker
CREATE POLICY "View activities" ON public.activities FOR SELECT USING (
  (select auth.uid()) = user_id
  OR user_id IN (
    SELECT u.id FROM public.users u WHERE u.team_id = public.get_led_team_id()
  )
  OR public.get_user_role() IN ('admin', 'broker')
);

-- INSERT: own only
CREATE POLICY "Insert activities" ON public.activities FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: own only
CREATE POLICY "Delete activities" ON public.activities FOR DELETE
  USING ((select auth.uid()) = user_id);


-- ============================================================
-- GOALS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Users can view own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.goals;
DROP POLICY IF EXISTS "Admin can manage all goals" ON public.goals;
DROP POLICY IF EXISTS "Team leaders can view team goals" ON public.goals;
DROP POLICY IF EXISTS "View goals" ON public.goals;
DROP POLICY IF EXISTS "Insert goals" ON public.goals;
DROP POLICY IF EXISTS "Update goals" ON public.goals;

-- SELECT: own OR team leader's team OR admin/broker
CREATE POLICY "View goals" ON public.goals FOR SELECT USING (
  (select auth.uid()) = user_id
  OR user_id IN (
    SELECT u.id FROM public.users u WHERE u.team_id = public.get_led_team_id()
  )
  OR public.get_user_role() IN ('admin', 'broker')
);

-- INSERT: own OR admin/broker
CREATE POLICY "Insert goals" ON public.goals FOR INSERT
  WITH CHECK (
    (select auth.uid()) = user_id
    OR public.get_user_role() IN ('admin', 'broker')
  );

-- UPDATE: own OR admin/broker
CREATE POLICY "Update goals" ON public.goals FOR UPDATE USING (
  (select auth.uid()) = user_id
  OR public.get_user_role() IN ('admin', 'broker')
);


-- ============================================================
-- STREAKS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Users can view own streak" ON public.streaks;
DROP POLICY IF EXISTS "Anyone can view streaks for leaderboard" ON public.streaks;
DROP POLICY IF EXISTS "System can manage streaks" ON public.streaks;
DROP POLICY IF EXISTS "Admin can view all streaks" ON public.streaks;
DROP POLICY IF EXISTS "View streaks" ON public.streaks;
DROP POLICY IF EXISTS "Manage streaks" ON public.streaks;
DROP POLICY IF EXISTS "Insert streaks" ON public.streaks;
DROP POLICY IF EXISTS "Update streaks" ON public.streaks;
DROP POLICY IF EXISTS "Delete streaks" ON public.streaks;

-- SELECT: anyone (needed for leaderboard)
CREATE POLICY "View streaks" ON public.streaks FOR SELECT USING (true);

-- INSERT: own or admin
CREATE POLICY "Insert streaks" ON public.streaks FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id OR public.get_user_role() IN ('admin', 'broker'));

-- UPDATE: own or admin
CREATE POLICY "Update streaks" ON public.streaks FOR UPDATE
  USING ((select auth.uid()) = user_id OR public.get_user_role() IN ('admin', 'broker'));

-- DELETE: own or admin
CREATE POLICY "Delete streaks" ON public.streaks FOR DELETE
  USING ((select auth.uid()) = user_id OR public.get_user_role() IN ('admin', 'broker'));


-- ============================================================
-- TEAMS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Team members can view their team" ON public.teams;
DROP POLICY IF EXISTS "Broker can manage teams" ON public.teams;
DROP POLICY IF EXISTS "Broker can insert teams" ON public.teams;
DROP POLICY IF EXISTS "Broker can delete teams" ON public.teams;
DROP POLICY IF EXISTS "View teams" ON public.teams;
DROP POLICY IF EXISTS "Insert teams" ON public.teams;
DROP POLICY IF EXISTS "Update teams" ON public.teams;
DROP POLICY IF EXISTS "Delete teams" ON public.teams;

-- SELECT: own team OR leader OR admin/broker (uses helper, no users subquery)
CREATE POLICY "View teams" ON public.teams FOR SELECT USING (
  id = public.get_user_team_id()
  OR leader_id = (select auth.uid())
  OR public.get_user_role() IN ('admin', 'broker')
);

-- INSERT: admin/broker only
CREATE POLICY "Insert teams" ON public.teams FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'broker'));

-- UPDATE: admin/broker only
CREATE POLICY "Update teams" ON public.teams FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'broker'));

-- DELETE: admin/broker only
CREATE POLICY "Delete teams" ON public.teams FOR DELETE
  USING (public.get_user_role() IN ('admin', 'broker'));


-- ============================================================
-- BROKERAGES TABLE
-- ============================================================

DROP POLICY IF EXISTS "Brokerage members can view their brokerage" ON public.brokerages;
DROP POLICY IF EXISTS "Owner can manage brokerage" ON public.brokerages;
DROP POLICY IF EXISTS "View brokerages" ON public.brokerages;
DROP POLICY IF EXISTS "Manage brokerages" ON public.brokerages;
DROP POLICY IF EXISTS "Insert brokerages" ON public.brokerages;
DROP POLICY IF EXISTS "Update brokerages" ON public.brokerages;
DROP POLICY IF EXISTS "Delete brokerages" ON public.brokerages;

-- SELECT: member OR owner (uses helper, no users subquery)
CREATE POLICY "View brokerages" ON public.brokerages FOR SELECT USING (
  id = public.get_user_brokerage_id()
  OR owner_id = (select auth.uid())
);

-- INSERT: owner only
CREATE POLICY "Insert brokerages" ON public.brokerages FOR INSERT
  WITH CHECK (owner_id = (select auth.uid()));

-- UPDATE: owner only
CREATE POLICY "Update brokerages" ON public.brokerages FOR UPDATE
  USING (owner_id = (select auth.uid()));

-- DELETE: owner only
CREATE POLICY "Delete brokerages" ON public.brokerages FOR DELETE
  USING (owner_id = (select auth.uid()));


-- ============================================================
-- ACTIVITY_TYPES TABLE
-- ============================================================

DROP POLICY IF EXISTS "Authenticated users can view active activity types" ON public.activity_types;
DROP POLICY IF EXISTS "Admin can manage activity types" ON public.activity_types;
DROP POLICY IF EXISTS "View activity types" ON public.activity_types;
DROP POLICY IF EXISTS "Manage activity types" ON public.activity_types;
DROP POLICY IF EXISTS "Update activity types" ON public.activity_types;
DROP POLICY IF EXISTS "Delete activity types" ON public.activity_types;

-- SELECT: active types for everyone, all types for admin
CREATE POLICY "View activity types" ON public.activity_types FOR SELECT USING (
  is_active = true
  OR public.get_user_role() IN ('admin', 'broker', 'team_leader')
);

-- INSERT: admin/broker/team_leader
CREATE POLICY "Insert activity types" ON public.activity_types FOR INSERT
  WITH CHECK (public.get_user_role() IN ('admin', 'broker', 'team_leader'));

-- UPDATE: admin/broker/team_leader
CREATE POLICY "Update activity types" ON public.activity_types FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'broker', 'team_leader'));

-- DELETE: admin/broker/team_leader
CREATE POLICY "Delete activity types" ON public.activity_types FOR DELETE
  USING (public.get_user_role() IN ('admin', 'broker', 'team_leader'));
