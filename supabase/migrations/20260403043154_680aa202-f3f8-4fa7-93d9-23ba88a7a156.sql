
-- Tighten the analytics INSERT policy with stricter checks
DROP POLICY IF EXISTS "Anyone can insert analytics" ON page_analytics;
CREATE POLICY "Anyone can insert analytics" ON page_analytics
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    session_id IS NOT NULL
    AND page IS NOT NULL
    AND event_type IS NOT NULL
    AND event_type IN ('page_view', 'click', 'scroll', 'section_view', 'engagement', 'conversion', 'add_to_cart', 'purchase')
    AND page ~ '^/'
    AND char_length(page) <= 500
    AND (section_id IS NULL OR char_length(section_id) <= 200)
    AND (metadata IS NULL OR char_length(metadata::text) <= 2000)
  );
