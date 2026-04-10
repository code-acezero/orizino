
-- Add targeting columns to coupons table
ALTER TABLE public.coupons
ADD COLUMN IF NOT EXISTS target_categories uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS target_products uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS first_order_only boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS per_user_limit integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS min_items integer DEFAULT NULL;

-- Add starts_at if missing
ALTER TABLE public.coupons ALTER COLUMN starts_at SET DEFAULT now();
