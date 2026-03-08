
-- Clear existing categories
DELETE FROM categories;

-- Insert parent categories
INSERT INTO categories (name, slug, icon, is_active, is_featured, sort_order, description, meta_title, meta_description) VALUES
('Electronics', 'electronics', '📱', true, true, 1, 'Latest gadgets and electronic devices', 'Electronics - Shop Gadgets & Devices', 'Browse our wide range of electronics including phones, laptops, and audio equipment.'),
('Fashion', 'fashion', '👗', true, true, 2, 'Trendy clothing and apparel', 'Fashion - Clothing & Apparel', 'Discover the latest fashion trends in clothing and accessories.'),
('Home & Living', 'home-living', '🏠', true, true, 3, 'Everything for your home', 'Home & Living - Furniture & Decor', 'Shop home essentials, furniture, kitchen appliances, and decor.'),
('Accessories', 'accessories', '⌚', true, true, 4, 'Watches, bags, and more', 'Accessories - Watches & Bags', 'Find the perfect accessories including watches, bags, and jewelry.'),
('Groceries', 'groceries', '🛒', true, true, 5, 'Fresh food and pantry essentials', 'Groceries - Fresh Food & Essentials', 'Order fresh groceries and pantry staples.'),
('Sports & Outdoors', 'sports-outdoors', '⚽', true, true, 6, 'Gear up for adventure', 'Sports & Outdoors - Athletic Gear', 'Shop sports equipment and outdoor gear.');

-- Insert subcategories for Electronics
INSERT INTO categories (name, slug, icon, is_active, is_featured, sort_order, parent_id, meta_title, meta_description) VALUES
('Smartphones', 'smartphones', '📱', true, false, 1, (SELECT id FROM categories WHERE slug = 'electronics'), 'Smartphones - Latest Mobile Phones', 'Shop the latest smartphones from top brands.'),
('Laptops', 'laptops', '💻', true, false, 2, (SELECT id FROM categories WHERE slug = 'electronics'), 'Laptops - Notebooks & Ultrabooks', 'Find the perfect laptop for work, gaming, or creativity.'),
('Audio', 'audio', '🎧', true, false, 3, (SELECT id FROM categories WHERE slug = 'electronics'), 'Audio - Headphones & Speakers', 'Premium headphones, earbuds, and speakers.');

-- Insert subcategories for Fashion
INSERT INTO categories (name, slug, icon, is_active, is_featured, sort_order, parent_id, meta_title, meta_description) VALUES
('Men', 'men', '👔', true, false, 1, (SELECT id FROM categories WHERE slug = 'fashion'), 'Men''s Fashion', 'Shop men''s clothing, shoes, and accessories.'),
('Women', 'women', '👗', true, false, 2, (SELECT id FROM categories WHERE slug = 'fashion'), 'Women''s Fashion', 'Shop women''s clothing, shoes, and accessories.'),
('Kids', 'kids', '🧒', true, false, 3, (SELECT id FROM categories WHERE slug = 'fashion'), 'Kids'' Fashion', 'Shop kids'' clothing, shoes, and accessories.');

-- Insert subcategories for Home & Living
INSERT INTO categories (name, slug, icon, is_active, is_featured, sort_order, parent_id, meta_title, meta_description) VALUES
('Kitchen', 'kitchen', '🍳', true, false, 1, (SELECT id FROM categories WHERE slug = 'home-living'), 'Kitchen Appliances & Cookware', 'Kitchen essentials and appliances.'),
('Furniture', 'furniture', '🛋️', true, false, 2, (SELECT id FROM categories WHERE slug = 'home-living'), 'Furniture - Tables & Chairs', 'Quality furniture for every room.'),
('Decor', 'decor', '🖼️', true, false, 3, (SELECT id FROM categories WHERE slug = 'home-living'), 'Home Decor', 'Beautiful decor to personalize your space.');

-- Insert subcategories for Accessories
INSERT INTO categories (name, slug, icon, is_active, is_featured, sort_order, parent_id, meta_title, meta_description) VALUES
('Watches', 'watches', '⌚', true, false, 1, (SELECT id FROM categories WHERE slug = 'accessories'), 'Watches', 'Browse stylish watches for every occasion.'),
('Bags', 'bags', '👜', true, false, 2, (SELECT id FROM categories WHERE slug = 'accessories'), 'Bags & Backpacks', 'Find the perfect bag for work or travel.'),
('Jewelry', 'jewelry', '💍', true, false, 3, (SELECT id FROM categories WHERE slug = 'accessories'), 'Jewelry', 'Elegant jewelry for every style.');
