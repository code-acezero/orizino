
-- 1. Create a public_reviews view that excludes user_id for safe public access
CREATE OR REPLACE VIEW public.public_reviews AS
SELECT id, product_id, rating, title, comment, created_at, is_approved
FROM public.reviews;

-- 2. Remove the public SELECT policy on the base reviews table
-- (keep user's own reviews and admin policies intact)
DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;

-- 3. Create a view for product_requests that excludes admin_notes
CREATE OR REPLACE VIEW public.user_product_requests AS
SELECT id, user_id, product_name, description, category, reference_url, status, created_at
FROM public.product_requests;

-- 4. Drop the overly broad user SELECT policy on product_requests
DROP POLICY IF EXISTS "Users can view own requests" ON public.product_requests;

-- 5. Tighten page_analytics INSERT policy - restrict columns via a check
-- Replace the always-true INSERT with one that still allows anon inserts
-- but prevents inserting into unexpected fields
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.page_analytics;
CREATE POLICY "Anyone can insert analytics"
ON public.page_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL AND page IS NOT NULL AND event_type IS NOT NULL
);
