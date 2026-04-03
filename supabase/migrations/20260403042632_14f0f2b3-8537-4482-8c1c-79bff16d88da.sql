
-- Fix: user_promos should only show promos relevant to the current user
DROP POLICY IF EXISTS "Users can view their eligible promos" ON user_promos;
CREATE POLICY "Users can view their eligible promos" ON user_promos
  FOR SELECT TO authenticated
  USING (
    is_active = true
    AND (starts_at IS NULL OR starts_at <= now())
    AND (expires_at IS NULL OR expires_at > now())
    AND (
      target_user_ids IS NULL
      OR target_user_ids = '{}'
      OR auth.uid() = ANY(target_user_ids)
    )
  );
