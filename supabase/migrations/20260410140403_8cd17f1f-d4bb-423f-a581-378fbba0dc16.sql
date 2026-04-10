
-- Populate clothing-focused SEO for all pages
UPDATE public.site_settings 
SET value = jsonb_build_object('value', jsonb_build_object(
  'home', jsonb_build_object(
    'title', 'Orizino - Premium Drop Shoulder T-Shirts & Streetwear',
    'description', 'Shop Orizino for premium drop shoulder t-shirts, oversized tees, and unique streetwear. More than a Brand, an Evolution. Free shipping on select orders.',
    'keywords', 'Orizino, drop shoulder t-shirt, oversized t-shirt, streetwear, custom t-shirt, premium cotton tee, unique clothing, fashion brand, buy t-shirts online',
    'og_title', 'Orizino - Premium Drop Shoulder T-Shirts & Streetwear',
    'og_description', 'Discover Orizino — premium drop shoulder t-shirts and unique streetwear. More than a Brand, an Evolution.',
    'robots', 'index, follow',
    'canonical_url', 'https://orizino.lovable.app',
    'structured_data', '{"@context":"https://schema.org","@type":"Organization","name":"Orizino","url":"https://orizino.lovable.app","description":"Premium drop shoulder t-shirts and unique streetwear. More than a Brand, an Evolution.","sameAs":[]}'
  ),
  'shop', jsonb_build_object(
    'title', 'Shop Drop Shoulder T-Shirts & Oversized Tees',
    'description', 'Browse our collection of premium drop shoulder t-shirts, oversized tees, and custom streetwear. Unique designs, premium cotton, unbeatable quality.',
    'keywords', 'shop drop shoulder t-shirt, buy oversized tee, streetwear collection, custom t-shirts, premium clothing store, Orizino shop',
    'og_title', 'Shop Drop Shoulder T-Shirts | Orizino',
    'og_description', 'Browse premium drop shoulder t-shirts and oversized streetwear at Orizino.',
    'robots', 'index, follow',
    'canonical_url', 'https://orizino.lovable.app/shop',
    'structured_data', ''
  ),
  'landing', jsonb_build_object(
    'title', 'Welcome to Orizino - More Than a Brand, an Evolution',
    'description', 'Orizino is a premium clothing brand specializing in drop shoulder t-shirts and unique streetwear. Discover fashion that evolves with you.',
    'keywords', 'Orizino clothing brand, fashion evolution, drop shoulder tee, streetwear brand, premium fashion, unique clothing line',
    'og_title', 'Welcome to Orizino',
    'og_description', 'More than a Brand, an Evolution. Premium drop shoulder t-shirts and streetwear.',
    'robots', 'index, follow',
    'canonical_url', 'https://orizino.lovable.app/landing',
    'structured_data', ''
  ),
  'auth', jsonb_build_object(
    'title', 'Sign In or Create Account',
    'description', 'Sign in or create your Orizino account to shop premium drop shoulder t-shirts, track orders, and access exclusive deals.',
    'keywords', 'Orizino login, create account, sign in, register, clothing account',
    'og_title', 'Sign In | Orizino',
    'og_description', 'Join Orizino for exclusive access to premium streetwear and drop shoulder t-shirts.',
    'robots', 'noindex, nofollow',
    'canonical_url', '',
    'structured_data', ''
  ),
  'cart', jsonb_build_object(
    'title', 'Your Shopping Cart',
    'description', 'Review your Orizino cart — premium drop shoulder t-shirts and streetwear ready for checkout.',
    'keywords', 'shopping cart, Orizino cart, checkout, buy clothing',
    'og_title', 'Your Cart | Orizino',
    'og_description', 'Complete your purchase of premium Orizino streetwear.',
    'robots', 'noindex, nofollow',
    'canonical_url', '',
    'structured_data', ''
  ),
  'wishlist', jsonb_build_object(
    'title', 'Your Wishlist',
    'description', 'Save your favorite Orizino drop shoulder t-shirts and streetwear to your wishlist.',
    'keywords', 'wishlist, saved items, favorites, Orizino wishlist',
    'og_title', 'Your Wishlist | Orizino',
    'og_description', 'Your saved Orizino items.',
    'robots', 'noindex, nofollow',
    'canonical_url', '',
    'structured_data', ''
  ),
  'checkout', jsonb_build_object(
    'title', 'Secure Checkout',
    'description', 'Complete your Orizino order securely. Fast shipping on premium drop shoulder t-shirts and streetwear.',
    'keywords', 'checkout, secure payment, Orizino order, buy streetwear',
    'og_title', 'Checkout | Orizino',
    'og_description', 'Complete your Orizino purchase securely.',
    'robots', 'noindex, nofollow',
    'canonical_url', '',
    'structured_data', ''
  ),
  'orders', jsonb_build_object(
    'title', 'Your Orders',
    'description', 'Track your Orizino orders — see delivery status for your drop shoulder t-shirts and streetwear purchases.',
    'keywords', 'order tracking, my orders, delivery status, Orizino orders',
    'og_title', 'Your Orders | Orizino',
    'og_description', 'Track your Orizino order delivery status.',
    'robots', 'noindex, nofollow',
    'canonical_url', '',
    'structured_data', ''
  ),
  'support', jsonb_build_object(
    'title', 'Help & Support',
    'description', 'Need help with your Orizino order? Contact our support team for assistance with drop shoulder t-shirts, shipping, returns, and more.',
    'keywords', 'Orizino support, help, contact us, customer service, returns, shipping help',
    'og_title', 'Help & Support | Orizino',
    'og_description', 'Get help with your Orizino orders and products.',
    'robots', 'index, follow',
    'canonical_url', 'https://orizino.lovable.app/support',
    'structured_data', ''
  ),
  'profile', jsonb_build_object(
    'title', 'Your Profile',
    'description', 'Manage your Orizino account settings, addresses, and preferences.',
    'keywords', 'profile, account settings, Orizino account, manage account',
    'og_title', 'Your Profile | Orizino',
    'og_description', 'Manage your Orizino account.',
    'robots', 'noindex, nofollow',
    'canonical_url', '',
    'structured_data', ''
  )
)),
updated_at = now()
WHERE key = 'seo_pages';

-- Update global SEO settings
UPDATE public.site_settings 
SET value = jsonb_build_object('value', jsonb_build_object(
  'site_title_suffix', ' | Orizino',
  'default_og_image', '',
  'google_analytics_id', '',
  'google_search_console', '',
  'facebook_pixel_id', '',
  'sitemap_enabled', true,
  'auto_generate_meta', true
)),
updated_at = now()
WHERE key = 'seo_global';
