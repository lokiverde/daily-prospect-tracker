-- ================================================
-- Demo Data Seed Script
-- ================================================
-- Run this AFTER the main migrations to populate
-- the database with sample data for a live demo.
--
-- This creates:
-- - 1 demo brokerage
-- - 4 demo users (1 admin, 1 team leader, 2 agents)
-- - 1 team
-- - 30 days of sample activities
-- - Streak data
-- - Goal data
--
-- IMPORTANT: You must first create the demo users
-- via Supabase Auth (Dashboard > Authentication > Users)
-- with these emails, then paste their UUIDs below.
-- ================================================

-- Step 1: Replace these placeholder UUIDs with real user IDs
-- after creating the users in Supabase Auth.
--
-- Demo credentials (create these in Supabase Auth):
--   admin@demo.com / demo1234
--   leader@demo.com / demo1234
--   agent1@demo.com / demo1234
--   agent2@demo.com / demo1234

DO $$
DECLARE
  v_admin_id UUID;
  v_leader_id UUID;
  v_agent1_id UUID;
  v_agent2_id UUID;
  v_brokerage_id UUID;
  v_team_id UUID;
  v_day DATE;
  v_activity_ids UUID[];
  v_user_ids UUID[];
  v_i INT;
BEGIN

  -- Look up users by email (they must exist in auth.users first)
  SELECT id INTO v_admin_id FROM auth.users WHERE email = 'admin@demo.com';
  SELECT id INTO v_leader_id FROM auth.users WHERE email = 'leader@demo.com';
  SELECT id INTO v_agent1_id FROM auth.users WHERE email = 'agent1@demo.com';
  SELECT id INTO v_agent2_id FROM auth.users WHERE email = 'agent2@demo.com';

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Demo users not found. Create them in Supabase Auth first.';
  END IF;

  -- Create brokerage
  INSERT INTO public.brokerages (name, owner_id, settings)
  VALUES ('Demo Realty', v_admin_id, '{"timezone": "America/Los_Angeles", "default_daily_goal": 80}')
  RETURNING id INTO v_brokerage_id;

  -- Create team
  INSERT INTO public.teams (name, leader_id, brokerage_id)
  VALUES ('Demo Team', v_leader_id, v_brokerage_id)
  RETURNING id INTO v_team_id;

  -- Update user profiles
  UPDATE public.users SET role = 'admin', brokerage_id = v_brokerage_id, full_name = 'Admin User', is_onboarded = true WHERE id = v_admin_id;
  UPDATE public.users SET role = 'team_leader', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'Team Leader', is_onboarded = true WHERE id = v_leader_id;
  UPDATE public.users SET role = 'agent', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'Jane Agent', is_onboarded = true WHERE id = v_agent1_id;
  UPDATE public.users SET role = 'agent', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'John Agent', is_onboarded = true WHERE id = v_agent2_id;

  -- Create goals for all users
  INSERT INTO public.goals (user_id, year, annual_income_goal, commission_rate, avg_sale_price, closings_goal, contracts_goal, appointments_goal, contacts_goal, daily_points_goal)
  VALUES
    (v_admin_id, EXTRACT(YEAR FROM NOW())::INT, 200000, 0.025, 500000, 16, 20, 40, 134, 80),
    (v_leader_id, EXTRACT(YEAR FROM NOW())::INT, 150000, 0.025, 400000, 15, 19, 38, 127, 80),
    (v_agent1_id, EXTRACT(YEAR FROM NOW())::INT, 100000, 0.025, 350000, 12, 15, 30, 100, 80),
    (v_agent2_id, EXTRACT(YEAR FROM NOW())::INT, 120000, 0.03, 400000, 10, 13, 25, 84, 80);

  -- Collect activity type IDs for random selection
  SELECT ARRAY_AGG(id) INTO v_activity_ids FROM public.activity_types WHERE is_active = true;
  v_user_ids := ARRAY[v_admin_id, v_leader_id, v_agent1_id, v_agent2_id];

  -- Generate 30 days of activities for each user
  FOR v_day IN SELECT generate_series(CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '1 day')::DATE
  LOOP
    FOREACH v_i IN ARRAY ARRAY[1,2,3,4]
    LOOP
      -- Each user logs 5-12 random activities per day
      FOR v_i IN 1..5 + floor(random() * 8)::INT
      LOOP
        INSERT INTO public.activities (user_id, activity_type_id, points, logged_at)
        SELECT
          v_user_ids[1 + floor(random() * 4)::INT],
          at.id,
          at.points,
          v_day + (INTERVAL '8 hours' + random() * INTERVAL '10 hours')
        FROM public.activity_types at
        WHERE at.id = v_activity_ids[1 + floor(random() * array_length(v_activity_ids, 1))::INT];
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Demo data seeded successfully!';
END $$;
