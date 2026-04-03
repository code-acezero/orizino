
-- Fix: email_subscriptions should not be publicly readable
-- Only admins should be able to SELECT emails
-- The existing "Anyone can subscribe" INSERT policy stays

-- Fix: coupons should require authentication to read
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
CREATE POLICY "Authenticated users can view active coupons" ON coupons
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Fix: email_subscriptions has no SELECT restriction
-- Already has "Admins can manage subscriptions" for ALL, which covers admin SELECT
-- No additional policy needed - just confirming no public SELECT exists
