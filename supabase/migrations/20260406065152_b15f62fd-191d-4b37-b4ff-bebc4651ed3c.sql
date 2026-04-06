
-- Insert Clothing category under Fashion
INSERT INTO categories (name, slug, parent_id, icon, icon_url, is_active, is_featured, sort_order, description, accent_color)
VALUES ('Clothing', 'clothing', '7858bd70-5ded-46db-8c89-3cec5959c220', '👕', '/icons/clothing-icon.png', true, true, 1, 'Premium streetwear and everyday essentials', '#e11d48');

-- Update Fashion and Accessories icons
UPDATE categories SET icon_url = '/icons/clothing-icon.png' WHERE slug = 'fashion';
UPDATE categories SET icon_url = '/icons/accessories-icon.png' WHERE slug = 'accessories';

-- Get Clothing category ID for products
DO $$
DECLARE
  clothing_id uuid;
BEGIN
  SELECT id INTO clothing_id FROM categories WHERE slug = 'clothing' LIMIT 1;

  -- Insert 5 T-shirt products
  INSERT INTO products (name, slug, price, compare_at_price, description, short_description, thumbnail, images, category_id, is_active, is_featured, stock_quantity, tags, sku)
  VALUES
  ('Shadow Drop Oversized Tee', 'shadow-drop-oversized-tee', 1290, 1690,
   'Premium heavyweight 300gsm cotton oversized drop shoulder t-shirt. Features a relaxed boxy silhouette with reinforced rib-knit collar and double-needle hem.',
   'Premium oversized drop shoulder tee in midnight black',
   '/products/tshirt-1-main.jpg',
   ARRAY['/products/tshirt-1-main.jpg', '/products/tshirt-1-alt1.jpg', '/products/tshirt-1-alt2.jpg'],
   clothing_id, true, true, 150, ARRAY['oversized', 'drop-shoulder', 'streetwear', 'black'], 'CLT-001'),

  ('Geo Print Oversized Tee', 'geo-print-oversized-tee', 1490, 1890,
   'Minimalist oversized t-shirt with subtle geometric triangle pattern. Made from premium 250gsm combed cotton with a soft enzyme wash finish.',
   'White oversized tee with geometric print',
   '/products/tshirt-2-main.jpg',
   ARRAY['/products/tshirt-2-main.jpg', '/products/tshirt-2-alt1.jpg'],
   clothing_id, true, true, 100, ARRAY['oversized', 'printed', 'minimal', 'white'], 'CLT-002'),

  ('Kanji Street Drop Tee', 'kanji-street-drop-tee', 1590, 2190,
   'Bold Japanese kanji print oversized drop shoulder t-shirt in military olive. Heavy 280gsm cotton with screen-printed artwork. Inspired by Tokyo street culture.',
   'Olive green kanji print drop shoulder tee',
   '/products/tshirt-3-main.jpg',
   ARRAY['/products/tshirt-3-main.jpg', '/products/tshirt-3-alt1.jpg'],
   clothing_id, true, true, 80, ARRAY['oversized', 'drop-shoulder', 'japanese', 'olive'], 'CLT-003'),

  ('Essential Fitted Tee', 'essential-fitted-tee', 990, 1290,
   'Clean, premium fitted t-shirt in deep navy with subtle embroidered logo. Made from 200gsm Supima cotton for a luxurious feel. Perfect everyday essential.',
   'Navy premium fitted tee with embroidered detail',
   '/products/tshirt-4-main.jpg',
   ARRAY['/products/tshirt-4-main.jpg', '/products/tshirt-4-alt1.jpg'],
   clothing_id, true, false, 200, ARRAY['fitted', 'essential', 'navy', 'premium'], 'CLT-004'),

  ('Vintage Wash Drop Tee', 'vintage-wash-drop-tee', 1690, 2290,
   'Stone-washed oversized drop shoulder t-shirt in rust brown. Each piece is uniquely acid-washed for a one-of-a-kind vintage aesthetic. 300gsm heavyweight cotton.',
   'Rust brown vintage washed drop shoulder tee',
   '/products/tshirt-5-main.jpg',
   ARRAY['/products/tshirt-5-main.jpg', '/products/tshirt-5-alt1.jpg'],
   clothing_id, true, true, 60, ARRAY['oversized', 'drop-shoulder', 'vintage', 'rust'], 'CLT-005');
END $$;

-- Insert showcase slides
INSERT INTO showcase_slides (title, subtitle, description, image_url, cta_text, cta_link, is_active, sort_order, transition_type, text_color)
VALUES
('Urban Edge Collection', 'New Arrivals 2026', 'Premium streetwear built for the bold. Oversized silhouettes, drop shoulders, and heavyweight cotton.', '/slides/slide-clothing-1.jpg', 'Shop Collection', '/categories/clothing', true, 1, 'fade', '#ffffff'),
('Earth Tone Essentials', 'Outdoor Ready', 'Explore our earth-toned streetwear line. Designed for urban adventures and everyday style.', '/slides/slide-clothing-2.jpg', 'Explore Now', '/categories/clothing', true, 2, 'fade', '#ffffff'),
('Navy Premium Line', 'Luxury Basics', 'Elevate your basics with our premium navy collection. Supima cotton, tailored fit, timeless design.', '/slides/slide-clothing-3.jpg', 'Shop Navy', '/categories/clothing', true, 3, 'fade', '#ffffff');

-- Insert a popup
INSERT INTO popups (title, message, image_url, is_active, trigger_type, trigger_value, position, animation_style, display_type, link_text, link_url, bg_color, text_color)
VALUES ('🔥 Flash Sale Live!', 'Get up to 40% off on all Drop Shoulder tees. Limited time only!', '/slides/slide-clothing-1.jpg', true, 'timer', 5000, 'center', 'scale', 'popup', 'Shop Sale', '/categories/clothing', null, null);

-- Insert a delivery offer
INSERT INTO delivery_offers (title, description, offer_type, discount_value, min_order_amount, is_active, target_areas)
VALUES ('Free Delivery on Orders Over ৳1500', 'Enjoy free shipping on all orders above ৳1500 across Bangladesh', 'free_delivery', 0, 1500, true, ARRAY['Dhaka', 'Chittagong', 'Sylhet']);

-- Insert a coupon
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, is_active, usage_limit)
VALUES ('FIRST20', 'Get 20% off on your first order!', 'percentage', 20, 500, 300, true, 100);

-- Insert a banner
INSERT INTO banners (title, subtitle, image_url, link_url, position, is_active, sort_order)
VALUES ('Summer Drop Collection', 'Up to 40% Off Premium Streetwear', '/slides/slide-clothing-1.jpg', '/categories/clothing', 'hero', true, 0);
