
-- Fix views to use security_invoker to respect RLS of the querying user
ALTER VIEW public.public_reviews SET (security_invoker = on);
ALTER VIEW public.user_product_requests SET (security_invoker = on);

-- Since we removed the public SELECT on reviews base table,
-- we need a policy that allows anon/authenticated to SELECT from the base table
-- but ONLY through the view (security_invoker means the view uses caller's permissions).
-- Re-add a restricted approved-reviews policy:
CREATE POLICY "Anyone can view approved reviews"
ON public.reviews
FOR SELECT
USING (is_approved = true);

-- Re-add user SELECT on product_requests base table (view will filter columns)
CREATE POLICY "Users can view own requests"
ON public.product_requests
FOR SELECT
USING (auth.uid() = user_id);
