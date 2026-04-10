-- Update variant images by color
UPDATE public.product_variants SET image_url = 'https://orizino.lovable.app/products/variant-black-tee.jpg' WHERE color = 'Black' AND image_url IS NULL;
UPDATE public.product_variants SET image_url = 'https://orizino.lovable.app/products/variant-charcoal-tee.jpg' WHERE color = 'Charcoal' AND image_url IS NULL;
UPDATE public.product_variants SET image_url = 'https://orizino.lovable.app/products/variant-white-tee.jpg' WHERE color = 'White' AND image_url IS NULL;
UPDATE public.product_variants SET image_url = 'https://orizino.lovable.app/products/variant-navy-tee.jpg' WHERE color = 'Navy' AND image_url IS NULL;
UPDATE public.product_variants SET image_url = 'https://orizino.lovable.app/products/variant-olive-tee.jpg' WHERE color = 'Olive' AND image_url IS NULL;