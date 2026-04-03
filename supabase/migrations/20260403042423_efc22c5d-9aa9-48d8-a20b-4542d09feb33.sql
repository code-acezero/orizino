
-- Switch site_settings SELECT from denylist to allowlist
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON site_settings;
CREATE POLICY "Public can view non-sensitive settings" ON site_settings
  FOR SELECT TO public
  USING (key IN (
    'site_name', 'site_description', 'logo_url', 'site_icon_url', 'favicon_url',
    'theme', 'primary_color', 'accent_color', 'font_family',
    'announcement_bar', 'social_links', 'contact_info',
    'ai_agent_config', 'currency_config', 'homepage_layout',
    'seo_title', 'seo_description', 'seo_keywords', 'og_image_url'
  ));
