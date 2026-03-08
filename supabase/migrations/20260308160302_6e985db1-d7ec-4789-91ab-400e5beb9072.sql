CREATE OR REPLACE VIEW public.public_reviews AS
SELECT id, product_id, rating, title, comment, created_at, is_approved, images
FROM reviews;