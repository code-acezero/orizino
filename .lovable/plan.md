

# Populate Site-Wide SEO for Clothing Brand Launch

## Status of Code Fixes
All 8 planned code fixes are **already applied** from the previous implementation:
- ICE/TURN protocol prefix, SEO RLS migration, toast unification, ProtectedRoute state, sonner cleanup, ip-api HTTP, VoiceCallButton ref, AuthModal deletion

No further code changes needed for those items.

## Remaining Work: SEO Data Population

The `seo_pages` setting currently only has the `home` page populated. All other pages (`shop`, `landing`, `auth`, `cart`, `wishlist`, `checkout`, `orders`, `support`, `profile`) need clothing-focused SEO metadata.

### What will be done

**Update `site_settings` row for `seo_pages`** with optimized metadata for all 10 page IDs, focused on:
- **Brand**: Orizino -- "More than a Brand, an Evolution"
- **Niche**: Drop shoulder t-shirts, oversized streetwear, custom/unique clothing
- **Keywords**: drop shoulder t-shirt, oversized tee, streetwear, custom clothing, premium cotton, Orizino

Each page entry will include: `title`, `description`, `keywords`, `og_title`, `og_description`, `robots`, and the home page will also get JSON-LD structured data (Organization + WebSite schema).

**Update `site_settings` row for `seo_global`** with:
- Refined `site_title_suffix`: ` | Orizino`
- Default OG image placeholder

### Page SEO Content (Summary)

| Page | Title | Focus Keywords |
|------|-------|---------------|
| home | Orizino - Premium Drop Shoulder T-Shirts | drop shoulder t-shirt, oversized, streetwear |
| shop | Shop Drop Shoulder T-Shirts | shop clothing, buy t-shirts, oversized tee |
| landing | Welcome to Orizino | clothing brand, fashion, evolution |
| auth | Sign In / Create Account | account, register, login |
| cart | Your Shopping Cart | cart, checkout, order |
| wishlist | Your Wishlist | wishlist, save, favorites |
| checkout | Secure Checkout | checkout, payment, shipping |
| orders | Your Orders | orders, tracking, delivery |
| support | Help & Support | support, contact, help |
| profile | Your Profile | profile, account settings |

### Technical Steps

1. Use Supabase insert tool to `UPDATE site_settings SET value = ...` for key `seo_pages` with all 10 pages
2. Use Supabase insert tool to `UPDATE site_settings SET value = ...` for key `seo_global` with refined suffix
3. Verify the data reads correctly for public (anon) users via the RLS policy

No file changes required -- this is purely a data update.

