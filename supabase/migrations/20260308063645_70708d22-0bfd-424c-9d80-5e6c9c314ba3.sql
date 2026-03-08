
CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text,
  image_url text,
  link_url text,
  link_text text DEFAULT 'Learn More',
  is_active boolean NOT NULL DEFAULT true,
  display_type text NOT NULL DEFAULT 'popup',
  max_views integer DEFAULT 1,
  duration_hours integer DEFAULT 24,
  starts_at timestamp with time zone DEFAULT now(),
  ends_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage popups" ON public.popups FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active popups" ON public.popups FOR SELECT
  USING (is_active = true);
