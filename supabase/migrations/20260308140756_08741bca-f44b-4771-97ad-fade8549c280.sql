
INSERT INTO site_settings (key, value) VALUES
('seo_pages', '{"value": {"home": {"title": "Welcome to Ace Marketplace - Your Premium Online Store", "description": "Shop the best electronics, fashion, and home products at Ace Marketplace. Free shipping on orders over $50.", "keywords": "marketplace, online shopping, electronics, fashion", "og_title": "Ace Marketplace - Shop Premium Products", "og_description": "Discover thousands of premium products at unbeatable prices.", "robots": "index, follow"}}}'::jsonb),
('seo_global', '{"value": {"site_title_suffix": " | Ace Marketplace"}}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
