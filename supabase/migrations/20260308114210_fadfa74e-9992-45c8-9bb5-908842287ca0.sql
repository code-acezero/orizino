
-- Popups: add position, animation, trigger, and color customization columns
ALTER TABLE public.popups 
  ADD COLUMN IF NOT EXISTS position text NOT NULL DEFAULT 'center',
  ADD COLUMN IF NOT EXISTS animation_style text NOT NULL DEFAULT 'scale',
  ADD COLUMN IF NOT EXISTS trigger_type text NOT NULL DEFAULT 'timer',
  ADD COLUMN IF NOT EXISTS trigger_value integer NOT NULL DEFAULT 1500,
  ADD COLUMN IF NOT EXISTS bg_color text,
  ADD COLUMN IF NOT EXISTS text_color text;

-- Notifications: add priority, scheduling, expiry, and icon columns
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS icon text;

-- Showcase slides: add text color and transition type columns
ALTER TABLE public.showcase_slides
  ADD COLUMN IF NOT EXISTS text_color text,
  ADD COLUMN IF NOT EXISTS transition_type text NOT NULL DEFAULT 'fade';
