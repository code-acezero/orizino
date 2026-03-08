
-- Product variants table for size/color inventory tracking
CREATE TABLE public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  size text,
  color text,
  sku text,
  price_override numeric,
  stock_quantity integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate size/color combos
CREATE UNIQUE INDEX product_variants_unique_combo ON public.product_variants (product_id, COALESCE(size, ''), COALESCE(color, ''));

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Anyone can view variants of active products
CREATE POLICY "Anyone can view active product variants"
  ON public.product_variants
  FOR SELECT
  USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM public.products WHERE products.id = product_variants.product_id AND products.is_active = true
    )
  );

-- Admins can manage variants
CREATE POLICY "Admins can manage product variants"
  ON public.product_variants
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
