
CREATE TABLE public.category_filters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  filter_name TEXT NOT NULL,
  filter_values TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_category_filters_category ON public.category_filters(category_id);

ALTER TABLE public.category_filters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage category filters"
ON public.category_filters FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active category filters"
ON public.category_filters FOR SELECT TO public
USING (is_active = true);
