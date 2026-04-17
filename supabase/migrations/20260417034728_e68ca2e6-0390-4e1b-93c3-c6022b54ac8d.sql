-- Shared updated_at trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Pathao token storage (admin-only)
CREATE TABLE public.pathao_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  environment text NOT NULL UNIQUE CHECK (environment IN ('sandbox','live')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pathao_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pathao tokens"
ON public.pathao_tokens FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Pathao shipments (one per order)
CREATE TABLE public.pathao_shipments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  consignment_id text NOT NULL,
  merchant_order_id text,
  environment text NOT NULL DEFAULT 'sandbox',
  shipment_type text NOT NULL DEFAULT 'delivery' CHECK (shipment_type IN ('delivery','return')),
  order_status text,
  order_status_slug text,
  delivery_fee numeric DEFAULT 0,
  cod_amount numeric DEFAULT 0,
  recipient_city integer,
  recipient_zone integer,
  recipient_area integer,
  recipient_city_name text,
  recipient_zone_name text,
  invoice_id text,
  raw_response jsonb DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX pathao_shipments_consignment_idx
  ON public.pathao_shipments(consignment_id, environment);
CREATE INDEX pathao_shipments_order_idx ON public.pathao_shipments(order_id);
CREATE INDEX pathao_shipments_status_idx ON public.pathao_shipments(order_status_slug);

ALTER TABLE public.pathao_shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shipments"
ON public.pathao_shipments FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order shipments"
ON public.pathao_shipments FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.orders o
  WHERE o.id = pathao_shipments.order_id AND o.user_id = auth.uid()
));

CREATE TRIGGER set_pathao_shipments_updated
BEFORE UPDATE ON public.pathao_shipments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE TRIGGER set_pathao_tokens_updated
BEFORE UPDATE ON public.pathao_tokens
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- Allow public read of pathao_public_config setting key
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.site_settings;
CREATE POLICY "Public can view non-sensitive settings"
ON public.site_settings
FOR SELECT
USING (key = ANY (ARRAY[
  'site_name','site_description','logo_url','site_icon_url','favicon_url',
  'theme','primary_color','accent_color','font_family','announcement_bar',
  'social_links','contact_info','ai_agent_config','currency_config',
  'homepage_layout','seo_title','seo_description','seo_keywords','og_image_url',
  'site_theme','site_mode','site_customizer','mobile_ui_config',
  'logo_display_style','logo_effect','title_letter_colors','showcase_config',
  'home_category_sections','home_sales_config','home_new_arrivals',
  'home_layout_config','home_section_order','product_page_layout',
  'notification_order','popup_order','voice_call_config',
  'seo_pages','seo_global','footer_config','title_font',
  'shipping_fee','free_shipping_threshold','tax_rate',
  'contact_email','contact_phone','support_url','address',
  'announcement_bar_text','announcement_bar_enabled',
  'order_prefix','items_per_page','allow_guest_checkout',
  'show_stock_count','low_stock_threshold',
  'social_facebook','social_instagram','social_twitter',
  'social_youtube','social_tiktok',
  'terms_url','privacy_url','refund_policy_url',
  'maintenance_mode','landing_config',
  'payment_bkash_personal','payment_nagad_personal',
  'payment_upay_personal','payment_rocket_personal',
  'payment_stripe_config','payment_bkash_merchant',
  'payment_nagad_merchant','payment_sslcommerz_config',
  'payment_gateways_enabled','payment_gateways_config','branding_config',
  'facebook_pixel_config','google_ads_config',
  'search_console_config','ad_setup_config','pathao_public_config'
]));