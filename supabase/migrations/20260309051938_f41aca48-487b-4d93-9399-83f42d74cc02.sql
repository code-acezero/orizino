
-- Fix: Restrict public SELECT on site_settings to exclude sensitive keys like api_keys
DROP POLICY "Anyone can view site settings" ON public.site_settings;

CREATE POLICY "Public can view non-sensitive settings" ON public.site_settings
  FOR SELECT USING (key NOT IN ('api_keys'));
