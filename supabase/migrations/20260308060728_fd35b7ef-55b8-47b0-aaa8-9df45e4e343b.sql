
-- Add accent_color, banner fields, and change icon to icon_url for categories
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#6366f1',
  ADD COLUMN IF NOT EXISTS icon_url text,
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS banner_type text DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS youtube_url text;
