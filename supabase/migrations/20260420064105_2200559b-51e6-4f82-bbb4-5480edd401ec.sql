
-- ============ LOYALTY & TIER SYSTEM ============
CREATE TABLE public.loyalty_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  min_lifetime_spend numeric NOT NULL DEFAULT 0,
  points_multiplier numeric NOT NULL DEFAULT 1.0,
  discount_percentage numeric NOT NULL DEFAULT 0,
  perks jsonb DEFAULT '[]'::jsonb,
  badge_color text DEFAULT '#9ca3af',
  badge_icon text DEFAULT 'medal',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active tiers" ON public.loyalty_tiers FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tiers" ON public.loyalty_tiers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.loyalty_tiers (name, slug, min_lifetime_spend, points_multiplier, discount_percentage, badge_color, badge_icon, sort_order, perks) VALUES
  ('Bronze', 'bronze', 0, 1.0, 0, '#cd7f32', 'medal', 1, '["Earn 1 point per ৳1 spent"]'::jsonb),
  ('Silver', 'silver', 5000, 1.25, 2, '#c0c0c0', 'award', 2, '["1.25x points", "2% tier discount", "Early sale access"]'::jsonb),
  ('Gold', 'gold', 20000, 1.5, 5, '#ffd700', 'trophy', 3, '["1.5x points", "5% tier discount", "Free shipping on orders > 1000"]'::jsonb),
  ('Platinum', 'platinum', 50000, 1.75, 8, '#e5e4e2', 'crown', 4, '["1.75x points", "8% tier discount", "Always free shipping", "Priority support"]'::jsonb),
  ('Diamond', 'diamond', 100000, 2.0, 12, '#b9f2ff', 'gem', 5, '["2x points", "12% tier discount", "VIP perks", "Exclusive drops"]'::jsonb);

CREATE TABLE public.user_loyalty (
  user_id uuid PRIMARY KEY,
  points_balance integer NOT NULL DEFAULT 0,
  lifetime_points integer NOT NULL DEFAULT 0,
  lifetime_spend numeric NOT NULL DEFAULT 0,
  current_tier_id uuid REFERENCES public.loyalty_tiers(id),
  total_orders integer NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  referral_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_loyalty ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own loyalty" ON public.user_loyalty FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage all loyalty" ON public.user_loyalty FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_loyalty_updated_at BEFORE UPDATE ON public.user_loyalty
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

CREATE TABLE public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL,
  reference_id uuid,
  points_change integer NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_loyalty_transactions_user ON public.loyalty_transactions(user_id, created_at DESC);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own transactions" ON public.loyalty_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins manage all transactions" ON public.loyalty_transactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ USER ADDRESSES ============
CREATE TABLE public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text NOT NULL DEFAULT 'Home',
  address_type text NOT NULL DEFAULT 'home',
  full_name text NOT NULL,
  phone text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  area text,
  postal_code text,
  country text NOT NULL DEFAULT 'Bangladesh',
  latitude numeric,
  longitude numeric,
  is_default boolean NOT NULL DEFAULT false,
  pathao_city_id integer,
  pathao_zone_id integer,
  pathao_area_id integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_addresses_user ON public.user_addresses(user_id);

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own addresses" ON public.user_addresses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins view all addresses" ON public.user_addresses FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_user_addresses_updated_at BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_timestamp();

-- ============ USER PAYMENT METHODS ============
CREATE TABLE public.user_payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  account_label text NOT NULL,
  account_number_masked text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_payment_methods_user ON public.user_payment_methods(user_id);

ALTER TABLE public.user_payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own payment methods" ON public.user_payment_methods FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ COURIER ZONES (cached from APIs) ============
CREATE TABLE public.courier_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  city_id integer,
  city_name text NOT NULL,
  zone_id integer,
  zone_name text,
  area_id integer,
  area_name text,
  is_active boolean NOT NULL DEFAULT true,
  last_synced_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_courier_zones_provider_city ON public.courier_zones(provider, city_id);
CREATE UNIQUE INDEX idx_courier_zones_unique ON public.courier_zones(provider, COALESCE(city_id, 0), COALESCE(zone_id, 0), COALESCE(area_id, 0));

ALTER TABLE public.courier_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view zones" ON public.courier_zones FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage zones" ON public.courier_zones FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ COURIER PRICING RULES ============
CREATE TABLE public.courier_pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  zone_type text NOT NULL,
  weight_max numeric NOT NULL DEFAULT 1.0,
  base_fee numeric NOT NULL DEFAULT 0,
  per_kg_fee numeric NOT NULL DEFAULT 0,
  hub_pickup_discount numeric NOT NULL DEFAULT 40,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view pricing rules" ON public.courier_pricing_rules FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage pricing rules" ON public.courier_pricing_rules FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed sane defaults for BD
INSERT INTO public.courier_pricing_rules (provider, zone_type, weight_max, base_fee, per_kg_fee, hub_pickup_discount, sort_order) VALUES
  ('pathao', 'inside_city', 1.0, 70, 15, 40, 1),
  ('pathao', 'sub_city', 1.0, 110, 20, 40, 2),
  ('pathao', 'outside_city', 1.0, 130, 25, 40, 3),
  ('steadfast', 'inside_city', 1.0, 60, 15, 40, 1),
  ('steadfast', 'outside_city', 1.0, 120, 25, 40, 2);

-- ============ COURIER HUBS ============
CREATE TABLE public.courier_hubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  hub_name text NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  area text,
  contact_phone text,
  latitude numeric,
  longitude numeric,
  is_pickup_point boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_hubs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view hubs" ON public.courier_hubs FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage hubs" ON public.courier_hubs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ AUTO-SYNC SHIPMENTS METADATA on orders ============
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS preferred_courier text,
  ADD COLUMN IF NOT EXISTS hub_pickup boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_hub_id uuid REFERENCES public.courier_hubs(id),
  ADD COLUMN IF NOT EXISTS loyalty_points_used integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_discount numeric DEFAULT 0;

-- ============ AWARD POINTS FUNCTION ============
CREATE OR REPLACE FUNCTION public.award_loyalty_points(
  _user_id uuid,
  _points integer,
  _source text,
  _reference_id uuid DEFAULT NULL,
  _description text DEFAULT NULL,
  _spend_amount numeric DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _new_tier_id uuid;
BEGIN
  -- Insert transaction
  INSERT INTO public.loyalty_transactions (user_id, points_change, source, reference_id, description)
  VALUES (_user_id, _points, _source, _reference_id, _description);

  -- Upsert user_loyalty
  INSERT INTO public.user_loyalty (user_id, points_balance, lifetime_points, lifetime_spend, referral_code)
  VALUES (_user_id, GREATEST(_points, 0), GREATEST(_points, 0), _spend_amount, 'REF' || UPPER(SUBSTRING(_user_id::text, 1, 8)))
  ON CONFLICT (user_id) DO UPDATE SET
    points_balance = user_loyalty.points_balance + _points,
    lifetime_points = user_loyalty.lifetime_points + GREATEST(_points, 0),
    lifetime_spend = user_loyalty.lifetime_spend + _spend_amount,
    updated_at = now();

  -- Recalculate tier
  SELECT id INTO _new_tier_id FROM public.loyalty_tiers
  WHERE is_active = true AND min_lifetime_spend <= (SELECT lifetime_spend FROM public.user_loyalty WHERE user_id = _user_id)
  ORDER BY min_lifetime_spend DESC LIMIT 1;

  UPDATE public.user_loyalty SET current_tier_id = _new_tier_id WHERE user_id = _user_id;
END;
$$;
