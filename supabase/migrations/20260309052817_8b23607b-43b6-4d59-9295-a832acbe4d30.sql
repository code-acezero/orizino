
-- User-targeted promotional codes with eligibility conditions
CREATE TABLE public.user_promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  coupon_code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage', -- percentage or fixed
  discount_value numeric NOT NULL DEFAULT 0,
  max_discount_amount numeric,
  condition_type text NOT NULL DEFAULT 'manual',
  -- condition_type: 'first_time_buyer', 'most_visited', 'premium_buyer', 'review_count', 'total_spent', 'order_count', 'manual'
  condition_value jsonb DEFAULT '{}'::jsonb,
  -- e.g. {"min_reviews": 5}, {"min_orders": 10}, {"min_total_spent": 5000}, {"user_ids": ["uuid1","uuid2"]}
  target_user_ids uuid[] DEFAULT '{}',
  popup_title text,
  popup_message text,
  popup_image_url text,
  popup_bg_color text,
  popup_text_color text,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  usage_limit integer,
  used_count integer DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_promos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage user promos" ON public.user_promos
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their eligible promos" ON public.user_promos
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Track which users have claimed/used a promo
CREATE TABLE public.user_promo_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_id uuid REFERENCES public.user_promos(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  used_at timestamptz,
  is_used boolean NOT NULL DEFAULT false,
  dismissed boolean NOT NULL DEFAULT false,
  UNIQUE(promo_id, user_id)
);

ALTER TABLE public.user_promo_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own promo claims" ON public.user_promo_claims
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all promo claims" ON public.user_promo_claims
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Delivery offers (time-limited free/reduced shipping)
CREATE TABLE public.delivery_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  offer_type text NOT NULL DEFAULT 'free_delivery', -- free_delivery, reduced_delivery, flat_rate
  discount_value numeric NOT NULL DEFAULT 0, -- for reduced: amount off; for flat_rate: the flat rate
  min_order_amount numeric DEFAULT 0,
  target_areas text[] DEFAULT '{}', -- empty = all areas; specific city/area names
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage delivery offers" ON public.delivery_offers
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active delivery offers" ON public.delivery_offers
  FOR SELECT
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
  );
