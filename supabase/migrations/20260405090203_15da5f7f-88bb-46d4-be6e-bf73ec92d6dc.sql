DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.site_settings;
CREATE POLICY "Public can view non-sensitive settings" ON public.site_settings FOR SELECT TO public USING (
  key = ANY (ARRAY[
    'site_name', 'site_description', 'logo_url', 'site_icon_url', 'favicon_url',
    'theme', 'primary_color', 'accent_color', 'font_family',
    'announcement_bar', 'social_links', 'contact_info',
    'ai_agent_config', 'currency_config', 'homepage_layout',
    'seo_title', 'seo_description', 'seo_keywords', 'og_image_url',
    'site_theme', 'site_mode', 'site_customizer', 'mobile_ui_config',
    'logo_display_style', 'logo_effect', 'title_letter_colors'
  ])
);