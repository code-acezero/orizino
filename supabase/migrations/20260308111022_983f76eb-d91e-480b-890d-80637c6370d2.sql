
CREATE TABLE public.page_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL DEFAULT 'page_view',
  page text NOT NULL DEFAULT '/home',
  section_id text,
  session_id text,
  duration_ms integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_page_analytics_created_at ON public.page_analytics (created_at DESC);
CREATE INDEX idx_page_analytics_event_type ON public.page_analytics (event_type, page);
CREATE INDEX idx_page_analytics_section ON public.page_analytics (section_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can insert analytics events (anonymous tracking)
CREATE POLICY "Anyone can insert analytics"
ON public.page_analytics
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can read analytics
CREATE POLICY "Admins can read analytics"
ON public.page_analytics
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Admins can manage analytics
CREATE POLICY "Admins can manage analytics"
ON public.page_analytics
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
