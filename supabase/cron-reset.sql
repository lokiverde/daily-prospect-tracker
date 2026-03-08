-- ================================================
-- Demo Data Nightly Reset (pg_cron)
-- ================================================
-- This creates a function and cron job that resets
-- demo data every day at 3am UTC.
--
-- Prerequisites:
-- - pg_cron extension enabled (Supabase Pro plan)
-- - Demo users already created in auth.users
-- - Activity types already seeded via migrations
--
-- To enable pg_cron in Supabase:
-- Go to Dashboard > Database > Extensions > search "pg_cron" > Enable
--
-- FALLBACK: If pg_cron is not available (free tier),
-- use a Vercel CRON job instead. See README for details.
-- ================================================

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create the reset function
CREATE OR REPLACE FUNCTION public.reset_demo_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE
  v_beowulf_id UUID;
  v_sarah_id UUID;
  v_james_id UUID;
  v_priya_id UUID;
  v_marcus_id UUID;
  v_lisa_id UUID;
  v_derek_id UUID;
  v_newagent_id UUID;
  -- Activity type IDs
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
  v_at_cma UUID;
  v_at_video UUID;
  v_at_review UUID;
  v_at_coffee UUID;
  v_at_door_knock UUID;
  v_at_huddle UUID;
  v_at_meeting UUID;
BEGIN
  -- Look up user IDs
  SELECT id INTO v_beowulf_id FROM auth.users WHERE email = 'beowulf@demo.com';
  SELECT id INTO v_sarah_id FROM auth.users WHERE email = 'sarah@demo.com';
  SELECT id INTO v_james_id FROM auth.users WHERE email = 'james@demo.com';
  SELECT id INTO v_priya_id FROM auth.users WHERE email = 'priya@demo.com';
  SELECT id INTO v_marcus_id FROM auth.users WHERE email = 'marcus@demo.com';
  SELECT id INTO v_lisa_id FROM auth.users WHERE email = 'lisa@demo.com';
  SELECT id INTO v_derek_id FROM auth.users WHERE email = 'derek@demo.com';
  SELECT id INTO v_newagent_id FROM auth.users WHERE email = 'demo-agent@demo.com';

  IF v_beowulf_id IS NULL THEN
    RAISE WARNING 'Demo users not found. Skipping reset.';
    RETURN;
  END IF;

  -- Look up activity type IDs
  SELECT id INTO v_at_listing FROM public.activity_types WHERE name = 'Take Listing' LIMIT 1;
  SELECT id INTO v_at_offer FROM public.activity_types WHERE name = 'Write Offer' LIMIT 1;
  SELECT id INTO v_at_appointment FROM public.activity_types WHERE name = 'Client Appointment' LIMIT 1;
  SELECT id INTO v_at_set_appt FROM public.activity_types WHERE name = 'Set Appointment' LIMIT 1;
  SELECT id INTO v_at_open_house FROM public.activity_types WHERE name = 'Hold Open House' LIMIT 1;
  SELECT id INTO v_at_show_home FROM public.activity_types WHERE name = 'Show Home' LIMIT 1;
  SELECT id INTO v_at_phone FROM public.activity_types WHERE name = 'Phone Call' LIMIT 1;
  SELECT id INTO v_at_soi_call FROM public.activity_types WHERE name = 'SOI Call' LIMIT 1;
  SELECT id INTO v_at_email FROM public.activity_types WHERE name = 'Email/DM' LIMIT 1;
  SELECT id INTO v_at_text FROM public.activity_types WHERE name = 'Text Message' LIMIT 1;
  SELECT id INTO v_at_cma FROM public.activity_types WHERE name = 'CMA Sent' LIMIT 1;
  SELECT id INTO v_at_video FROM public.activity_types WHERE name = 'Post Video' LIMIT 1;
  SELECT id INTO v_at_review FROM public.activity_types WHERE name = 'Request Client Review' LIMIT 1;
  SELECT id INTO v_at_coffee FROM public.activity_types WHERE name = 'Coffee Appointment' LIMIT 1;
  SELECT id INTO v_at_door_knock FROM public.activity_types WHERE name = 'Door Knock' LIMIT 1;
  SELECT id INTO v_at_huddle FROM public.activity_types WHERE name = 'Daily Huddle' LIMIT 1;
  SELECT id INTO v_at_meeting FROM public.activity_types WHERE name = 'Weekly Sales Meeting' LIMIT 1;

  -- Delete all activities for demo users
  DELETE FROM public.activities
  WHERE user_id IN (v_beowulf_id, v_sarah_id, v_james_id, v_priya_id, v_marcus_id, v_lisa_id, v_derek_id, v_newagent_id);

  -- Reset streaks
  UPDATE public.streaks SET current_streak = 12, longest_streak = 28, shields_available = 1 WHERE user_id = v_beowulf_id;
  UPDATE public.streaks SET current_streak = 7, longest_streak = 14, shields_available = 1 WHERE user_id = v_sarah_id;
  UPDATE public.streaks SET current_streak = 5, longest_streak = 11, shields_available = 0 WHERE user_id = v_james_id;
  UPDATE public.streaks SET current_streak = 4, longest_streak = 9, shields_available = 0 WHERE user_id = v_priya_id;
  UPDATE public.streaks SET current_streak = 3, longest_streak = 7, shields_available = 0 WHERE user_id = v_marcus_id;
  UPDATE public.streaks SET current_streak = 2, longest_streak = 5, shields_available = 0 WHERE user_id = v_lisa_id;
  UPDATE public.streaks SET current_streak = 1, longest_streak = 3, shields_available = 0 WHERE user_id = v_derek_id;
  UPDATE public.streaks SET current_streak = 0, longest_streak = 0, shields_available = 0 WHERE user_id = v_newagent_id;

  -- Re-insert today's activities with target point totals
  -- Beowulf: 94 points
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
  INSERT INTO public.activities (user_id, activity_type_id, points, logged_at) VALUES
    (v_james_id, v_at_appointment, 20, NOW() - INTERVAL '4 hours'),
    (v_james_id, v_at_set_appt, 15, NOW() - INTERVAL '3 hours'),
    (v_james_id, v_at_cma, 10, NOW() - INTERVAL '5 hours'),
    (v_james_id, v_at_show_home, 8, NOW() - INTERVAL '2 hours'),
    (v_james_id, v_at_phone, 4, NOW() - INTERVAL '1.5 hours'),
    (v_james_id, v_at_phone, 4, NOW() - INTERVAL '1 hour'),
    (v_james_id, v_at_meeting, 10, NOW() - INTERVAL '6 hours');

  -- Priya R.: 68 points
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
  INSERT INTO public.activities (user_id, activity_type_id, points, logged_at) VALUES
    (v_derek_id, v_at_huddle, 5, NOW() - INTERVAL '7 hours'),
    (v_derek_id, v_at_phone, 4, NOW() - INTERVAL '2 hours'),
    (v_derek_id, v_at_phone, 4, NOW() - INTERVAL '1.5 hours'),
    (v_derek_id, v_at_meeting, 10, NOW() - INTERVAL '6 hours');

  -- New Agent: 0 points (no activities inserted)

  RAISE NOTICE 'Demo data reset complete!';
END;
$$;

-- Schedule the job: run at 3am UTC daily
SELECT cron.schedule(
  'reset-demo-data',
  '0 3 * * *',
  'SELECT public.reset_demo_data()'
);
