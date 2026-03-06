-- ===========================================
-- Daily Prospect Tracker - Initial Schema
-- Run this in the Supabase SQL Editor
-- ===========================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- 2. TABLES (without circular foreign keys)
-- ===========================================

-- Brokerages (top-level organization)
CREATE TABLE public.brokerages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL, -- FK added later (circular ref)
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users (extended profile linked to Supabase Auth)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  team_id UUID, -- FK added later (circular ref)
  brokerage_id UUID REFERENCES public.brokerages(id),
  role TEXT NOT NULL DEFAULT 'agent'
    CHECK (role IN ('agent', 'team_leader', 'broker', 'admin')),
  brokerage_visibility TEXT DEFAULT 'public'
    CHECK (brokerage_visibility IN ('public', 'private')),
  is_onboarded BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  leader_id UUID NOT NULL REFERENCES public.users(id),
  brokerage_id UUID REFERENCES public.brokerages(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add deferred circular foreign keys
ALTER TABLE public.users
  ADD CONSTRAINT fk_users_team
  FOREIGN KEY (team_id) REFERENCES public.teams(id)
  ON DELETE SET NULL;

ALTER TABLE public.brokerages
  ADD CONSTRAINT fk_brokerages_owner
  FOREIGN KEY (owner_id) REFERENCES public.users(id);

-- Activity Types (definitions for trackable activities)
CREATE TABLE public.activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  points NUMERIC(5,1) NOT NULL DEFAULT 1,
  category TEXT NOT NULL
    CHECK (category IN ('closing', 'contract', 'lead_mgmt',
      'appointment', 'contact', 'marketing', 'nurture')),
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  max_daily INTEGER, -- null = no cap
  team_id UUID REFERENCES public.teams(id),
  brokerage_id UUID REFERENCES public.brokerages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities (logged instances)
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type_id UUID NOT NULL REFERENCES public.activity_types(id),
  points NUMERIC(5,1) NOT NULL, -- denormalized from activity_type at time of logging
  contact_name TEXT,
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals (annual targets per user)
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  annual_income_goal NUMERIC(12,2),
  avg_commission_pct NUMERIC(5,4), -- e.g. 0.025 for 2.5%
  avg_sale_price NUMERIC(12,2),
  closings_goal INTEGER,
  contracts_goal INTEGER,
  appointments_goal INTEGER,
  contacts_goal INTEGER,
  daily_points_goal INTEGER DEFAULT 80,
  set_by TEXT DEFAULT 'self' CHECK (set_by IN ('self', 'admin')),
  set_by_user_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- Streaks (current and longest streak per user)
CREATE TABLE public.streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_goal_date DATE,
  shields_earned INTEGER DEFAULT 0,
  shields_available INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotes (motivational quotes for dashboard)
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  author TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================================
-- 3. INDEXES
-- ===========================================
CREATE INDEX idx_activities_user_date ON public.activities(user_id, logged_at DESC);
CREATE INDEX idx_activities_type ON public.activities(activity_type_id);
CREATE INDEX idx_users_brokerage ON public.users(brokerage_id);
CREATE INDEX idx_users_team ON public.users(team_id);
CREATE INDEX idx_activity_types_team ON public.activity_types(team_id);
CREATE INDEX idx_goals_user_year ON public.goals(user_id, year);

-- ===========================================
-- 4. VIEWS
-- ===========================================
CREATE VIEW public.daily_stats AS
SELECT
  user_id,
  logged_at::date AS date,
  SUM(points) AS total_points,
  COUNT(*) AS activity_count,
  COUNT(DISTINCT activity_type_id) AS unique_activities
FROM public.activities
GROUP BY user_id, logged_at::date;

CREATE VIEW public.weekly_leaderboard AS
SELECT
  u.id AS user_id,
  u.full_name,
  u.avatar_url,
  u.team_id,
  u.brokerage_id,
  COALESCE(SUM(a.points), 0) AS total_points,
  COALESCE(COUNT(a.id), 0) AS activity_count,
  s.current_streak
FROM public.users u
LEFT JOIN public.activities a
  ON a.user_id = u.id
  AND a.logged_at >= date_trunc('week', NOW())
LEFT JOIN public.streaks s ON s.user_id = u.id
WHERE u.brokerage_visibility = 'public'
GROUP BY u.id, u.full_name, u.avatar_url, u.team_id,
         u.brokerage_id, s.current_streak
ORDER BY total_points DESC;

-- ===========================================
-- 5. FUNCTIONS & TRIGGERS
-- ===========================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_goals_updated_at
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_brokerages_updated_at
  BEFORE UPDATE ON public.brokerages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_streaks_updated_at
  BEFORE UPDATE ON public.streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Streak calculation trigger (fires after activity insert)
CREATE OR REPLACE FUNCTION public.update_streak()
RETURNS TRIGGER AS $$
DECLARE
  user_goal INTEGER;
  today_points NUMERIC;
  last_date DATE;
  current_val INTEGER;
  prev_shields INTEGER;
  new_shields INTEGER;
BEGIN
  -- Get user's daily goal (default 80)
  SELECT daily_points_goal INTO user_goal
  FROM public.goals
  WHERE user_id = NEW.user_id
    AND year = EXTRACT(YEAR FROM NOW())::INTEGER;

  IF user_goal IS NULL THEN
    user_goal := 80;
  END IF;

  -- Get today's total
  SELECT COALESCE(SUM(points), 0) INTO today_points
  FROM public.activities
  WHERE user_id = NEW.user_id
    AND logged_at::date = CURRENT_DATE;

  -- Only update streak if goal met today
  IF today_points >= user_goal THEN
    -- Ensure streak record exists
    INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_goal_date, shields_earned, shields_available)
    VALUES (NEW.user_id, 0, 0, NULL, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT last_goal_date, current_streak, shields_earned
    INTO last_date, current_val, prev_shields
    FROM public.streaks
    WHERE user_id = NEW.user_id;

    IF last_date IS NULL OR last_date < CURRENT_DATE - 2 THEN
      -- Streak broken (missed more than 1 day), check for shield
      SELECT shields_available INTO new_shields
      FROM public.streaks WHERE user_id = NEW.user_id;

      IF new_shields > 0 AND last_date = CURRENT_DATE - 2 THEN
        -- Use a shield to save the streak (missed exactly 1 day)
        UPDATE public.streaks
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_goal_date = CURRENT_DATE,
            shields_available = shields_available - 1
        WHERE user_id = NEW.user_id;
      ELSE
        -- Start fresh
        UPDATE public.streaks
        SET current_streak = 1,
            longest_streak = GREATEST(longest_streak, 1),
            last_goal_date = CURRENT_DATE
        WHERE user_id = NEW.user_id;
      END IF;
    ELSIF last_date = CURRENT_DATE - 1 THEN
      -- Consecutive day: increment streak
      UPDATE public.streaks
      SET current_streak = current_streak + 1,
          longest_streak = GREATEST(longest_streak, current_streak + 1),
          last_goal_date = CURRENT_DATE
      WHERE user_id = NEW.user_id;

      -- Award shield every 7-day streak milestone
      SELECT current_streak INTO current_val
      FROM public.streaks WHERE user_id = NEW.user_id;

      IF current_val > 0 AND current_val % 7 = 0 THEN
        UPDATE public.streaks
        SET shields_earned = shields_earned + 1,
            shields_available = shields_available + 1
        WHERE user_id = NEW.user_id;
      END IF;
    ELSIF last_date = CURRENT_DATE THEN
      -- Already counted today, do nothing
      NULL;
    ELSE
      -- Gap of exactly 1 day: check shield
      SELECT shields_available INTO new_shields
      FROM public.streaks WHERE user_id = NEW.user_id;

      IF new_shields > 0 THEN
        UPDATE public.streaks
        SET current_streak = current_streak + 1,
            longest_streak = GREATEST(longest_streak, current_streak + 1),
            last_goal_date = CURRENT_DATE,
            shields_available = shields_available - 1
        WHERE user_id = NEW.user_id;
      ELSE
        UPDATE public.streaks
        SET current_streak = 1,
            longest_streak = GREATEST(longest_streak, 1),
            last_goal_date = CURRENT_DATE
        WHERE user_id = NEW.user_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_activity_logged
  AFTER INSERT ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.update_streak();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  -- Create streak record
  INSERT INTO public.streaks (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- 6. ROW LEVEL SECURITY
-- ===========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brokerages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's role (bypasses RLS, prevents infinite recursion)
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- USERS policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Team leaders can view team members"
  ON public.users FOR SELECT
  USING (
    team_id IN (
      SELECT t.id FROM public.teams t WHERE t.leader_id = auth.uid()
    )
  );

CREATE POLICY "Broker can view all brokerage users"
  ON public.users FOR SELECT
  USING (
    brokerage_id IN (
      SELECT b.id FROM public.brokerages b WHERE b.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all users"
  ON public.users FOR SELECT
  USING (public.get_user_role() = 'admin');

CREATE POLICY "Admin can update all users"
  ON public.users FOR UPDATE
  USING (public.get_user_role() IN ('admin', 'broker'));

-- ACTIVITIES policies
CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Team leaders can view team activities"
  ON public.activities FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM public.users u
      WHERE u.team_id IN (
        SELECT t.id FROM public.teams t WHERE t.leader_id = auth.uid()
      )
    )
  );

CREATE POLICY "Broker can view brokerage activities"
  ON public.activities FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM public.users u
      WHERE u.brokerage_id IN (
        SELECT b.id FROM public.brokerages b WHERE b.owner_id = auth.uid()
      )
    )
  );

-- GOALS policies
CREATE POLICY "Users can view own goals"
  ON public.goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON public.goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals"
  ON public.goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all goals"
  ON public.goals FOR ALL
  USING (public.get_user_role() IN ('admin', 'broker'));

CREATE POLICY "Team leaders can view team goals"
  ON public.goals FOR SELECT
  USING (
    user_id IN (
      SELECT u.id FROM public.users u
      WHERE u.team_id IN (
        SELECT t.id FROM public.teams t WHERE t.leader_id = auth.uid()
      )
    )
  );

-- STREAKS policies
CREATE POLICY "Users can view own streak"
  ON public.streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view streaks for leaderboard"
  ON public.streaks FOR SELECT
  USING (true);

CREATE POLICY "System can manage streaks"
  ON public.streaks FOR ALL
  USING (auth.uid() = user_id);

-- TEAMS policies
CREATE POLICY "Team members can view their team"
  ON public.teams FOR SELECT
  USING (
    id IN (SELECT team_id FROM public.users WHERE id = auth.uid())
    OR leader_id = auth.uid()
  );

CREATE POLICY "Broker can manage teams"
  ON public.teams FOR ALL
  USING (public.get_user_role() IN ('admin', 'broker'));

-- BROKERAGES policies
CREATE POLICY "Brokerage members can view their brokerage"
  ON public.brokerages FOR SELECT
  USING (
    id IN (SELECT brokerage_id FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Owner can manage brokerage"
  ON public.brokerages FOR ALL
  USING (owner_id = auth.uid());

-- ACTIVITY_TYPES policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can view active activity types"
  ON public.activity_types FOR SELECT
  USING (
    is_active = true
    AND (
      team_id IS NULL -- global defaults
      OR team_id IN (SELECT team_id FROM public.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Admin can manage activity types"
  ON public.activity_types FOR ALL
  USING (public.get_user_role() IN ('admin', 'broker', 'team_leader'));

-- QUOTES policies
CREATE POLICY "Anyone can read active quotes"
  ON public.quotes FOR SELECT
  USING (is_active = true);

-- ===========================================
-- 7. SEED DATA: 19 ACTIVITIES
-- ===========================================
INSERT INTO public.activity_types
  (name, description, points, category, icon, sort_order, is_default, max_daily)
VALUES
  ('Open an Escrow', 'Buyer or seller escrow opened', 50, 'closing', '🏠', 1, true, NULL),
  ('Take Listing / Write Offer', 'Signed listing or submitted offer', 25, 'contract', '📝', 2, true, NULL),
  ('Add Client to CRM', 'Full contact info added', 20, 'lead_mgmt', '📋', 3, true, NULL),
  ('Client Appointment / Video', 'In-person or video meeting', 20, 'appointment', '🤝', 4, true, NULL),
  ('Set First Appointment', 'Confirmed future meeting with date', 15, 'appointment', '📅', 5, true, NULL),
  ('CMA Sent to Client', 'Market analysis delivered', 10, 'nurture', '📊', 6, true, NULL),
  ('Add Missing Info to CRM', 'Updated existing contact record', 5, 'lead_mgmt', '📎', 7, true, NULL),
  ('Hold Open House', '3+ hours hosting open house', 12.5, 'marketing', '🏡', 8, true, NULL),
  ('Coffee Appointment', 'In-person meeting with client', 10, 'appointment', '☕', 9, true, NULL),
  ('Post Video to Social Media', 'Original video content posted', 10, 'marketing', '🎬', 10, true, NULL),
  ('Set Follow-up Appointment', 'Follow-up meeting set with date', 10, 'appointment', '🔄', 11, true, NULL),
  ('SOI Appointment', 'In-person sphere of influence meeting', 10, 'appointment', '👋', 12, true, NULL),
  ('Send Google Review Request', 'Review request sent to client', 10, 'marketing', '⭐', 13, true, NULL),
  ('Show Home', 'Per property shown to buyer', 7.5, 'appointment', '🚗', 14, true, NULL),
  ('Phone Call (Client/Prospect)', 'Call with active client or prospect', 4, 'contact', '📞', 15, true, NULL),
  ('Phone Call (SOI/Past Client)', 'Call with sphere or past client', 4, 'contact', '📱', 16, true, NULL),
  ('Email / DM Message', 'Personal email or direct message', 2, 'contact', '📧', 17, true, NULL),
  ('Voicemail Left', 'Meaningful voicemail left', 2, 'contact', '🎤', 18, true, NULL),
  ('Text Message', 'Personal text to prospect or client', 1, 'contact', '💬', 19, true, 20);

-- ===========================================
-- 8. SEED DATA: MOTIVATIONAL QUOTES
-- ===========================================
INSERT INTO public.quotes (text, author, category) VALUES
  ('The fortune is in the follow-up.', 'Jim Rohn', 'sales'),
  ('Success is the sum of small efforts repeated day in and day out.', 'Robert Collier', 'motivation'),
  ('Hustle beats talent when talent does not hustle.', 'Ross Simmonds', 'motivation'),
  ('Every sale has five basic obstacles: no need, no money, no hurry, no desire, no trust.', 'Zig Ziglar', 'sales'),
  ('Do not watch the clock; do what it does. Keep going.', 'Sam Levenson', 'motivation'),
  ('The secret of getting ahead is getting started.', 'Mark Twain', 'motivation'),
  ('Your income is directly related to your philosophy, not the economy.', 'Jim Rohn', 'sales'),
  ('The harder you work, the luckier you get.', 'Gary Player', 'motivation'),
  ('Stop selling. Start helping.', 'Zig Ziglar', 'sales'),
  ('Consistency is what transforms average into excellence.', 'Unknown', 'motivation');
