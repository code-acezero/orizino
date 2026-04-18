CREATE TABLE public.steadfast_shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  consignment_id TEXT NOT NULL,
  tracking_code TEXT,
  invoice TEXT,
  cod_amount NUMERIC DEFAULT 0,
  delivery_charge NUMERIC DEFAULT 0,
  status TEXT,
  tracking_message TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_address TEXT,
  note TEXT,
  raw_response JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.steadfast_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage steadfast shipments" ON public.steadfast_shipments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own steadfast shipments" ON public.steadfast_shipments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM orders o WHERE o.id = steadfast_shipments.order_id AND o.user_id = auth.uid()));

CREATE TRIGGER set_steadfast_updated BEFORE UPDATE ON public.steadfast_shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE INDEX idx_steadfast_order ON public.steadfast_shipments(order_id);
CREATE INDEX idx_steadfast_consignment ON public.steadfast_shipments(consignment_id);

-- Allow public to read steadfast public config from site_settings
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.site_settings;
CREATE POLICY "Public can view non-sensitive settings" ON public.site_settings
  FOR SELECT TO public
  USING (key = ANY (ARRAY['site_name'::text, 'site_description'::text, 'logo_url'::text, 'site_icon_url'::text, 'favicon_url'::text, 'theme'::text, 'primary_color'::text, 'accent_color'::text, 'font_family'::text, 'announcement_bar'::text, 'social_links'::text, 'contact_info'::text, 'ai_agent_config'::text, 'currency_config'::text, 'homepage_layout'::text, 'seo_title'::text, 'seo_description'::text, 'seo_keywords'::text, 'og_image_url'::text, 'site_theme'::text, 'site_mode'::text, 'site_customizer'::text, 'mobile_ui_config'::text, 'logo_display_style'::text, 'logo_effect'::text, 'title_letter_colors'::text, 'showcase_config'::text, 'home_category_sections'::text, 'home_sales_config'::text, 'home_new_arrivals'::text, 'home_layout_config'::text, 'home_section_order'::text, 'product_page_layout'::text, 'notification_order'::text, 'popup_order'::text, 'voice_call_config'::text, 'seo_pages'::text, 'seo_global'::text, 'footer_config'::text, 'title_font'::text, 'shipping_fee'::text, 'free_shipping_threshold'::text, 'tax_rate'::text, 'contact_email'::text, 'contact_phone'::text, 'support_url'::text, 'address'::text, 'announcement_bar_text'::text, 'announcement_bar_enabled'::text, 'order_prefix'::text, 'items_per_page'::text, 'allow_guest_checkout'::text, 'show_stock_count'::text, 'low_stock_threshold'::text, 'social_facebook'::text, 'social_instagram'::text, 'social_twitter'::text, 'social_youtube'::text, 'social_tiktok'::text, 'terms_url'::text, 'privacy_url'::text, 'refund_policy_url'::text, 'maintenance_mode'::text, 'landing_config'::text, 'payment_bkash_personal'::text, 'payment_nagad_personal'::text, 'payment_upay_personal'::text, 'payment_rocket_personal'::text, 'payment_stripe_config'::text, 'payment_bkash_merchant'::text, 'payment_nagad_merchant'::text, 'payment_sslcommerz_config'::text, 'payment_gateways_enabled'::text, 'payment_gateways_config'::text, 'branding_config'::text, 'facebook_pixel_config'::text, 'google_ads_config'::text, 'search_console_config'::text, 'ad_setup_config'::text, 'pathao_public_config'::text, 'steadfast_public_config'::text]));