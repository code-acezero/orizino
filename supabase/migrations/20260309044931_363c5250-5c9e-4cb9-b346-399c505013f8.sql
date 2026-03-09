
-- Coupons table
CREATE TABLE public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount_amount NUMERIC,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active coupons" ON public.coupons FOR SELECT
  USING (is_active = true);

-- Shipping methods table
CREATE TABLE public.shipping_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  estimated_days TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  min_order_free NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage shipping methods" ON public.shipping_methods FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view active shipping methods" ON public.shipping_methods FOR SELECT
  USING (is_active = true);

-- Add columns to orders for new features
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_method_id UUID REFERENCES public.shipping_methods(id),
  ADD COLUMN IF NOT EXISTS gift_wrap BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gift_message TEXT;

-- Insert default shipping methods
INSERT INTO public.shipping_methods (name, description, price, estimated_days, sort_order, min_order_free) VALUES
  ('Standard Delivery', 'Regular delivery across Bangladesh', 60, '3-5 business days', 0, 2000),
  ('Express Delivery', 'Fast delivery within 1-2 days', 120, '1-2 business days', 1, NULL),
  ('Same Day Delivery', 'Delivery within same day (Dhaka only)', 200, 'Same day', 2, NULL);
