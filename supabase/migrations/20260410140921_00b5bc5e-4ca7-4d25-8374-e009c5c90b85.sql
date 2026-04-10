
-- Update seo_global default_og_image
UPDATE public.site_settings 
SET value = jsonb_set(
  value,
  '{value,default_og_image}',
  '"https://orizino.lovable.app/og-image.jpg"'
),
updated_at = now()
WHERE key = 'seo_global';

-- Insert variants for all 5 products
-- Product 1: Shadow Drop Oversized Tee (d99f9e1f-82f7-4ef0-a48b-298b3da5b7b2)
INSERT INTO public.product_variants (product_id, size, color, stock_quantity, sort_order, is_active) VALUES
('d99f9e1f-82f7-4ef0-a48b-298b3da5b7b2', 'S', 'Black', 15, 1, true),
('d99f9e1f-82f7-4ef0-a48b-298b3da5b7b2', 'M', 'Black', 25, 2, true),
('d99f9e1f-82f7-4ef0-a48b-298b3da5b7b2', 'L', 'Black', 30, 3, true),
('d99f9e1f-82f7-4ef0-a48b-298b3da5b7b2', 'XL', 'Black', 20, 4, true),
('d99f9e1f-82f7-4ef0-a48b-298b3da5b7b2', 'XXL', 'Black', 10, 5, true),
('d99f9e1f-82f7-4ef0-a48b-298b3da5b7b2', 'S', 'Charcoal', 10, 6, true),
('d99f9e1f-82f7-4ef0-a48b-298b3da5b7b2', 'M', 'Charcoal', 20, 7, true),
('d99f9e1f-82f7-4ef0-a48b-298b3da5b7b2', 'L', 'Charcoal', 20, 8, true),

-- Product 2: Geo Print Oversized Tee (09d4b69d-3c87-4bc4-98e9-d7869995f9d9)
('09d4b69d-3c87-4bc4-98e9-d7869995f9d9', 'S', 'White', 10, 1, true),
('09d4b69d-3c87-4bc4-98e9-d7869995f9d9', 'M', 'White', 20, 2, true),
('09d4b69d-3c87-4bc4-98e9-d7869995f9d9', 'L', 'White', 25, 3, true),
('09d4b69d-3c87-4bc4-98e9-d7869995f9d9', 'XL', 'White', 15, 4, true),
('09d4b69d-3c87-4bc4-98e9-d7869995f9d9', 'XXL', 'White', 10, 5, true),
('09d4b69d-3c87-4bc4-98e9-d7869995f9d9', 'S', 'Navy', 10, 6, true),
('09d4b69d-3c87-4bc4-98e9-d7869995f9d9', 'M', 'Navy', 15, 7, true),
('09d4b69d-3c87-4bc4-98e9-d7869995f9d9', 'L', 'Navy', 15, 8, true),

-- Product 3: Kanji Street Drop Tee (3460d5d4-edcf-449f-a26b-a5449c6d0cca)
('3460d5d4-edcf-449f-a26b-a5449c6d0cca', 'S', 'Black', 10, 1, true),
('3460d5d4-edcf-449f-a26b-a5449c6d0cca', 'M', 'Black', 15, 2, true),
('3460d5d4-edcf-449f-a26b-a5449c6d0cca', 'L', 'Black', 20, 3, true),
('3460d5d4-edcf-449f-a26b-a5449c6d0cca', 'XL', 'Black', 15, 4, true),
('3460d5d4-edcf-449f-a26b-a5449c6d0cca', 'XXL', 'Black', 10, 5, true),
('3460d5d4-edcf-449f-a26b-a5449c6d0cca', 'M', 'Olive', 10, 6, true),
('3460d5d4-edcf-449f-a26b-a5449c6d0cca', 'L', 'Olive', 10, 7, true),

-- Product 4: Essential Fitted Tee (b13c2c39-98a2-40c3-a58a-10db43052c01)
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'S', 'White', 20, 1, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'M', 'White', 30, 2, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'L', 'White', 30, 3, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'XL', 'White', 25, 4, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'XXL', 'White', 15, 5, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'S', 'Black', 20, 6, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'M', 'Black', 30, 7, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'L', 'Black', 25, 8, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'XL', 'Black', 20, 9, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'S', 'Navy', 15, 10, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'M', 'Navy', 20, 11, true),
('b13c2c39-98a2-40c3-a58a-10db43052c01', 'L', 'Navy', 15, 12, true),

-- Product 5: Vintage Wash Drop Tee (034756b7-e17f-489d-ad42-10cc06a9364f)
('034756b7-e17f-489d-ad42-10cc06a9364f', 'S', 'Charcoal', 8, 1, true),
('034756b7-e17f-489d-ad42-10cc06a9364f', 'M', 'Charcoal', 12, 2, true),
('034756b7-e17f-489d-ad42-10cc06a9364f', 'L', 'Charcoal', 15, 3, true),
('034756b7-e17f-489d-ad42-10cc06a9364f', 'XL', 'Charcoal', 10, 4, true),
('034756b7-e17f-489d-ad42-10cc06a9364f', 'XXL', 'Charcoal', 5, 5, true),
('034756b7-e17f-489d-ad42-10cc06a9364f', 'S', 'Olive', 5, 6, true),
('034756b7-e17f-489d-ad42-10cc06a9364f', 'M', 'Olive', 10, 7, true),
('034756b7-e17f-489d-ad42-10cc06a9364f', 'L', 'Olive', 10, 8, true);
