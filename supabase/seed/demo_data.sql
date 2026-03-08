-- ================================================
-- Demo Data Seed Script (8 Agents)
-- ================================================
-- Run this AFTER the main migrations to populate
-- the database with sample data for a live demo.
--
-- This creates:
-- - 1 demo brokerage ("Demo Realty")
-- - 8 demo users (1 admin/leader, 7 agents)
-- - 1 team
-- - Today's activities with target point totals
-- - Streak data
-- - Goal data
--
-- IMPORTANT: You must first create the demo users
-- via Supabase Auth (Dashboard > Authentication > Users)
-- with these emails and password: demo1234
--
-- Demo users to create in Supabase Auth:
--   beowulf@demo.com
--   sarah@demo.com
--   james@demo.com
--   priya@demo.com
--   marcus@demo.com
--   lisa@demo.com
--   derek@demo.com
--   demo-agent@demo.com
-- ================================================

DO $$
DECLARE
  v_beowulf_id UUID;
  v_sarah_id UUID;
  v_james_id UUID;
  v_priya_id UUID;
  v_marcus_id UUID;
  v_lisa_id UUID;
  v_derek_id UUID;
  v_newagent_id UUID;
  v_brokerage_id UUID;
  v_team_id UUID;
  v_current_year INT;
  -- Activity type IDs (looked up by name)
  v_at_listing UUID;
  v_at_offer UUID;
  v_at_appointment UUID;
  v_at_set_appt UUID;
  v_at_open_house UUID;
  v_at_show_home UUID;
  v_at_phone UUID;
  v_at_soi_call UUID;
  v_at_email UUID;
  v_at_text UUID;
  v_at_voicemail UUID;
  v_at_cma UUID;
  v_at_video UUID;
  v_at_review UUID;
  v_at_coffee UUID;
  v_at_escrow UUID;
  v_at_door_knock UUID;
  v_at_huddle UUID;
  v_at_meeting UUID;
BEGIN
  -- Look up users by email (they must exist in auth.users first)
  SELECT id INTO v_beowulf_id FROM auth.users WHERE email = 'beowulf@demo.com';
  SELECT id INTO v_sarah_id FROM auth.users WHERE email = 'sarah@demo.com';
  SELECT id INTO v_james_id FROM auth.users WHERE email = 'james@demo.com';
  SELECT id INTO v_priya_id FROM auth.users WHERE email = 'priya@demo.com';
  SELECT id INTO v_marcus_id FROM auth.users WHERE email = 'marcus@demo.com';
  SELECT id INTO v_lisa_id FROM auth.users WHERE email = 'lisa@demo.com';
  SELECT id INTO v_derek_id FROM auth.users WHERE email = 'derek@demo.com';
  SELECT id INTO v_newagent_id FROM auth.users WHERE email = 'demo-agent@demo.com';

  IF v_beowulf_id IS NULL THEN
    RAISE EXCEPTION 'Demo users not found. Create them in Supabase Auth first (see comments above).';
  END IF;

  v_current_year := EXTRACT(YEAR FROM NOW())::INT;

  -- Look up activity type IDs by name (must match names from migrations)
  SELECT id INTO v_at_listing FROM public.activity_types WHERE name = 'Take Listing / Write Offer' LIMIT 1;
  SELECT id INTO v_at_offer FROM public.activity_types WHERE name = 'Take Listing / Write Offer' LIMIT 1;
  SELECT id INTO v_at_appointment FROM public.activity_types WHERE name = 'Client Appointment / Video' LIMIT 1;
  SELECT id INTO v_at_set_appt FROM public.activity_types WHERE name = 'Set First Appointment' LIMIT 1;
  SELECT id INTO v_at_open_house FROM public.activity_types WHERE name = 'Hold Open House' LIMIT 1;
  SELECT id INTO v_at_show_home FROM public.activity_types WHERE name = 'Show Home' LIMIT 1;
  SELECT id INTO v_at_phone FROM public.activity_types WHERE name = 'Phone Call (Client/Prospect)' LIMIT 1;
  SELECT id INTO v_at_soi_call FROM public.activity_types WHERE name = 'Phone Call (SOI/Past Client)' LIMIT 1;
  SELECT id INTO v_at_email FROM public.activity_types WHERE name = 'Email / DM Message' LIMIT 1;
  SELECT id INTO v_at_text FROM public.activity_types WHERE name = 'Text Message' LIMIT 1;
  SELECT id INTO v_at_voicemail FROM public.activity_types WHERE name = 'Voicemail Left' LIMIT 1;
  SELECT id INTO v_at_cma FROM public.activity_types WHERE name = 'CMA Sent to Client' LIMIT 1;
  SELECT id INTO v_at_video FROM public.activity_types WHERE name = 'Post Video to Social Media' LIMIT 1;
  SELECT id INTO v_at_review FROM public.activity_types WHERE name = 'Send Google Review Request' LIMIT 1;
  SELECT id INTO v_at_coffee FROM public.activity_types WHERE name = 'Coffee Appointment' LIMIT 1;
  SELECT id INTO v_at_escrow FROM public.activity_types WHERE name = 'Open an Escrow' LIMIT 1;
  SELECT id INTO v_at_door_knock FROM public.activity_types WHERE name = 'Add Missing Info to CRM' LIMIT 1;
  SELECT id INTO v_at_huddle FROM public.activity_types WHERE name = 'Daily Huddle' LIMIT 1;
  SELECT id INTO v_at_meeting FROM public.activity_types WHERE name = 'Weekly Sales Meeting' LIMIT 1;

  -- Clean any existing demo data
  DELETE FROM public.activities WHERE user_id IN (v_beowulf_id, v_sarah_id, v_james_id, v_priya_id, v_marcus_id, v_lisa_id, v_derek_id, v_newagent_id);
  DELETE FROM public.streaks WHERE user_id IN (v_beowulf_id, v_sarah_id, v_james_id, v_priya_id, v_marcus_id, v_lisa_id, v_derek_id, v_newagent_id);
  DELETE FROM public.goals WHERE user_id IN (v_beowulf_id, v_sarah_id, v_james_id, v_priya_id, v_marcus_id, v_lisa_id, v_derek_id, v_newagent_id);
  DELETE FROM public.teams WHERE leader_id IN (v_beowulf_id, v_sarah_id);
  DELETE FROM public.brokerages WHERE owner_id = v_beowulf_id;

  -- Create brokerage
  INSERT INTO public.brokerages (name, owner_id, settings)
  VALUES ('Demo Realty', v_beowulf_id, '{"timezone": "America/Los_Angeles", "default_daily_goal": 80}')
  RETURNING id INTO v_brokerage_id;

  -- Create team
  INSERT INTO public.teams (name, leader_id, brokerage_id)
  VALUES ('Demo Team', v_beowulf_id, v_brokerage_id)
  RETURNING id INTO v_team_id;

  -- Update user profiles
  UPDATE public.users SET role = 'admin', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'Beowulf', is_onboarded = true, brokerage_visibility = 'public' WHERE id = v_beowulf_id;
  UPDATE public.users SET role = 'agent', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'Sarah M.', is_onboarded = true, brokerage_visibility = 'public' WHERE id = v_sarah_id;
  UPDATE public.users SET role = 'agent', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'James K.', is_onboarded = true, brokerage_visibility = 'public' WHERE id = v_james_id;
  UPDATE public.users SET role = 'agent', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'Priya R.', is_onboarded = true, brokerage_visibility = 'public' WHERE id = v_priya_id;
  UPDATE public.users SET role = 'agent', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'Marcus T.', is_onboarded = true, brokerage_visibility = 'public' WHERE id = v_marcus_id;
  UPDATE public.users SET role = 'agent', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'Lisa C.', is_onboarded = true, brokerage_visibility = 'public' WHERE id = v_lisa_id;
  UPDATE public.users SET role = 'agent', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'Derek W.', is_onboarded = true, brokerage_visibility = 'public' WHERE id = v_derek_id;
  UPDATE public.users SET role = 'agent', brokerage_id = v_brokerage_id, team_id = v_team_id, full_name = 'New Agent', is_onboarded = true, brokerage_visibility = 'public' WHERE id = v_newagent_id;

  -- Create goals for all users
  INSERT INTO public.goals (user_id, year, annual_income_goal, avg_commission_pct, avg_sale_price, closings_goal, contracts_goal, appointments_goal, contacts_goal, daily_points_goal)
  VALUES
    (v_beowulf_id, v_current_year, 250000, 0.025, 800000, 13, 16, 32, 107, 80),
    (v_sarah_id, v_current_year, 200000, 0.025, 600000, 14, 17, 34, 114, 80),
    (v_james_id, v_current_year, 180000, 0.025, 500000, 15, 18, 36, 120, 80),
    (v_priya_id, v_current_year, 160000, 0.025, 450000, 15, 18, 36, 120, 80),
    (v_marcus_id, v_current_year, 140000, 0.025, 400000, 14, 18, 35, 117, 80),
    (v_lisa_id, v_current_year, 120000, 0.025, 400000, 12, 15, 30, 100, 80),
    (v_derek_id, v_current_year, 100000, 0.025, 350000, 12, 14, 29, 96, 80),
    (v_newagent_id, v_current_year, 80000, 0.025, 350000, 10, 12, 24, 80, 80);

  -- Create streaks
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, shields_available)
  VALUES
    (v_beowulf_id, 12, 28, 1),
    (v_sarah_id, 7, 14, 1),
    (v_james_id, 5, 11, 0),
    (v_priya_id, 4, 9, 0),
    (v_marcus_id, 3, 7, 0),
    (v_lisa_id, 2, 5, 0),
    (v_derek_id, 1, 3, 0),
    (v_newagent_id, 0, 0, 0);

  -- ================================================
  -- Seed today's activities with realistic combos
  -- Target points: Beowulf=94, Sarah=87, James=71,
  -- Priya=68, Marcus=52, Lisa=41, Derek=23, New Agent=0
  -- ================================================

  -- Beowulf: 94 points
  -- Listing (25) + Appointment (20) + CMA (10) + Show Home (8) + Coffee (10) + 3 Calls (12) + Huddle (5) + 4 Texts (4) = 94
  INSERT INTO public.activities (user_id, activity_type_id, points, logged_at) VALUES
    (v_beowulf_id, v_at_listing, 25, NOW() - INTERVAL '6 hours'),
    (v_beowulf_id, v_at_appointment, 20, NOW() - INTERVAL '5 hours'),
    (v_beowulf_id, v_at_cma, 10, NOW() - INTERVAL '4 hours'),
    (v_beowulf_id, v_at_show_home, 8, NOW() - INTERVAL '3 hours'),
    (v_beowulf_id, v_at_coffee, 10, NOW() - INTERVAL '2.5 hours'),
    (v_beowulf_id, v_at_phone, 4, NOW() - INTERVAL '2 hours'),
    (v_beowulf_id, v_at_phone, 4, NOW() - INTERVAL '1.5 hours'),
    (v_beowulf_id, v_at_phone, 4, NOW() - INTERVAL '1 hour'),
    (v_beowulf_id, v_at_huddle, 5, NOW() - INTERVAL '7 hours'),
    (v_beowulf_id, v_at_text, 1, NOW() - INTERVAL '45 minutes'),
    (v_beowulf_id, v_at_text, 1, NOW() - INTERVAL '40 minutes'),
    (v_beowulf_id, v_at_text, 1, NOW() - INTERVAL '35 minutes'),
    (v_beowulf_id, v_at_text, 1, NOW() - INTERVAL '30 minutes');

  -- Sarah M.: 87 points
  -- Offer (25) + Set Appt (15) + Open House (12) + Video (10) + Show Home (8) + 2 Calls (8) + Huddle (5) + 2 Emails (4) = 87
  INSERT INTO public.activities (user_id, activity_type_id, points, logged_at) VALUES
    (v_sarah_id, v_at_offer, 25, NOW() - INTERVAL '5 hours'),
    (v_sarah_id, v_at_set_appt, 15, NOW() - INTERVAL '4 hours'),
    (v_sarah_id, v_at_open_house, 12, NOW() - INTERVAL '3 hours'),
    (v_sarah_id, v_at_video, 10, NOW() - INTERVAL '6 hours'),
    (v_sarah_id, v_at_show_home, 8, NOW() - INTERVAL '2 hours'),
    (v_sarah_id, v_at_phone, 4, NOW() - INTERVAL '1.5 hours'),
    (v_sarah_id, v_at_soi_call, 4, NOW() - INTERVAL '1 hour'),
    (v_sarah_id, v_at_huddle, 5, NOW() - INTERVAL '7 hours'),
    (v_sarah_id, v_at_email, 2, NOW() - INTERVAL '45 minutes'),
    (v_sarah_id, v_at_email, 2, NOW() - INTERVAL '30 minutes');

  -- James K.: 71 points
  -- Appointment (20) + Set Appt (15) + CMA (10) + Show Home (8) + 2 Calls (8) + Meeting (10) = 71
  INSERT INTO public.activities (user_id, activity_type_id, points, logged_at) VALUES
    (v_james_id, v_at_appointment, 20, NOW() - INTERVAL '4 hours'),
    (v_james_id, v_at_set_appt, 15, NOW() - INTERVAL '3 hours'),
    (v_james_id, v_at_cma, 10, NOW() - INTERVAL '5 hours'),
    (v_james_id, v_at_show_home, 8, NOW() - INTERVAL '2 hours'),
    (v_james_id, v_at_phone, 4, NOW() - INTERVAL '1.5 hours'),
    (v_james_id, v_at_phone, 4, NOW() - INTERVAL '1 hour'),
    (v_james_id, v_at_meeting, 10, NOW() - INTERVAL '6 hours');

  -- Priya R.: 68 points
  -- Appointment (20) + Coffee (10) + Video (10) + Show Home (8) + Review (8) + 3 Calls (12) = 68
  INSERT INTO public.activities (user_id, activity_type_id, points, logged_at) VALUES
    (v_priya_id, v_at_appointment, 20, NOW() - INTERVAL '4 hours'),
    (v_priya_id, v_at_coffee, 10, NOW() - INTERVAL '3 hours'),
    (v_priya_id, v_at_video, 10, NOW() - INTERVAL '5 hours'),
    (v_priya_id, v_at_show_home, 8, NOW() - INTERVAL '2 hours'),
    (v_priya_id, v_at_review, 8, NOW() - INTERVAL '1.5 hours'),
    (v_priya_id, v_at_phone, 4, NOW() - INTERVAL '1 hour'),
    (v_priya_id, v_at_soi_call, 4, NOW() - INTERVAL '45 minutes'),
    (v_priya_id, v_at_phone, 4, NOW() - INTERVAL '30 minutes');

  -- Marcus T.: 52 points
  -- Set Appt (15) + Show Home (8) + Video (10) + Huddle (5) + 2 Calls (8) + 3 Emails (6) = 52
  INSERT INTO public.activities (user_id, activity_type_id, points, logged_at) VALUES
    (v_marcus_id, v_at_set_appt, 15, NOW() - INTERVAL '4 hours'),
    (v_marcus_id, v_at_show_home, 8, NOW() - INTERVAL '3 hours'),
    (v_marcus_id, v_at_video, 10, NOW() - INTERVAL '5 hours'),
    (v_marcus_id, v_at_huddle, 5, NOW() - INTERVAL '7 hours'),
    (v_marcus_id, v_at_phone, 4, NOW() - INTERVAL '2 hours'),
    (v_marcus_id, v_at_phone, 4, NOW() - INTERVAL '1.5 hours'),
    (v_marcus_id, v_at_email, 2, NOW() - INTERVAL '1 hour'),
    (v_marcus_id, v_at_email, 2, NOW() - INTERVAL '45 minutes'),
    (v_marcus_id, v_at_email, 2, NOW() - INTERVAL '30 minutes');

  -- Lisa C.: 41 points
  -- Coffee (10) + CMA (10) + Huddle (5) + 2 Calls (8) + 3 Texts (3) + Door Knock (5) = 41
  INSERT INTO public.activities (user_id, activity_type_id, points, logged_at) VALUES
    (v_lisa_id, v_at_coffee, 10, NOW() - INTERVAL '3 hours'),
    (v_lisa_id, v_at_cma, 10, NOW() - INTERVAL '4 hours'),
    (v_lisa_id, v_at_huddle, 5, NOW() - INTERVAL '7 hours'),
    (v_lisa_id, v_at_phone, 4, NOW() - INTERVAL '2 hours'),
    (v_lisa_id, v_at_soi_call, 4, NOW() - INTERVAL '1.5 hours'),
    (v_lisa_id, v_at_text, 1, NOW() - INTERVAL '1 hour'),
    (v_lisa_id, v_at_text, 1, NOW() - INTERVAL '45 minutes'),
    (v_lisa_id, v_at_text, 1, NOW() - INTERVAL '30 minutes'),
    (v_lisa_id, v_at_door_knock, 5, NOW() - INTERVAL '5 hours');

  -- Derek W.: 23 points
  -- Huddle (5) + 2 Calls (8) + Meeting (10) = 23
  INSERT INTO public.activities (user_id, activity_type_id, points, logged_at) VALUES
    (v_derek_id, v_at_huddle, 5, NOW() - INTERVAL '7 hours'),
    (v_derek_id, v_at_phone, 4, NOW() - INTERVAL '2 hours'),
    (v_derek_id, v_at_phone, 4, NOW() - INTERVAL '1.5 hours'),
    (v_derek_id, v_at_meeting, 10, NOW() - INTERVAL '6 hours');

  -- New Agent: 0 points (no activities)

  RAISE NOTICE 'Demo data seeded successfully with 8 agents!';
END $$;
