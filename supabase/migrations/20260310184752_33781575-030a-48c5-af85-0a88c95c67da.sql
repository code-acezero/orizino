-- Fix overly permissive email subscription policy
DROP POLICY "Anyone can subscribe" ON public.email_subscriptions;
CREATE POLICY "Anyone can subscribe" ON public.email_subscriptions
  FOR INSERT TO public
  WITH CHECK (email IS NOT NULL AND email <> '');