-- Add Peak Performance category with 3 activities
-- Daily Huddle +5, Weekly Sales Meeting +10, Agent Training +5

-- Update the category check constraint to include peak_performance
ALTER TABLE public.activity_types DROP CONSTRAINT activity_types_category_check;
ALTER TABLE public.activity_types ADD CONSTRAINT activity_types_category_check
  CHECK (category IN ('closing', 'contract', 'lead_mgmt',
    'appointment', 'contact', 'marketing', 'nurture', 'peak_performance'));

INSERT INTO public.activity_types (name, points, category, icon, sort_order, is_default, is_active)
VALUES
  ('Daily Huddle', 5, 'peak_performance', '🎯', 20, true, true),
  ('Weekly Sales Meeting', 10, 'peak_performance', '📊', 21, true, true),
  ('Agent Training', 5, 'peak_performance', '🎓', 22, true, true);
