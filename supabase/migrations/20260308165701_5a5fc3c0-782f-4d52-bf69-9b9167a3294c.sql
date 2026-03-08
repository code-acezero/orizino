
-- Add variant_id to cart_items
ALTER TABLE public.cart_items 
ADD COLUMN variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL;

-- Update unique constraint: same product+variant = same cart line
CREATE UNIQUE INDEX cart_items_user_product_variant ON public.cart_items (user_id, product_id, COALESCE(variant_id, '00000000-0000-0000-0000-000000000000'));
