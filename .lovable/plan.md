
# Comprehensive Site Hardening, Moderator Roles, Custom Fonts, Source Protection & SEO Sitelinks

## Summary
Complete unfinished custom font integration, add moderator role-based access to admin sidebar, add source code protection, add Google Sitelinks SearchBox schema, and fix remaining issues.

---

## 1. Custom Fonts Integration (Unfinished from Previous Task)

Font files exist at `public/fonts/` (10 OTF files) but have zero integration.

**Changes:**
- **`src/index.css`**: Add `@font-face` declarations for all 10 custom fonts (Agraham, Bilderberg, Nevera, OrangeAvenue, PrimorStylish, ProdesStencil, Rostex, SingleGrinch, Transcity, Zaslia)
- **`src/components/admin/SiteCustomizer.tsx`**: Add custom fonts to the `fonts` array with a "Custom" separator so they appear in heading/body font selectors
- **`src/pages/admin/AdminBranding.tsx`**: Add a "Title Font" selector allowing admins to pick a custom display font specifically for the site title/name, category titles, and product titles. Store as `title_font` in `site_settings`
- **`src/components/SiteThemeProvider.tsx`**: Read `title_font` setting and apply as a CSS custom property `--font-title` on `<html>`
- **`src/components/Navbar.tsx`**: Apply `font-family: var(--font-title)` to the site name text
- **`src/components/Footer.tsx`**: Apply title font to brand name
- **`src/pages/ShopPage.tsx`** / **`src/pages/CategoryPage.tsx`** / **`src/pages/ProductDetailPage.tsx`**: Apply `--font-title` to category and product title headings

**Database**: Update `site_settings` public read RLS policy to include `title_font`.

---

## 2. Moderator Role-Based Admin Access

Currently `AdminRoute` only checks for `admin` role. Moderators should see a subset of pages.

**Changes:**
- **`src/components/AdminRoute.tsx`**: Check for both `admin` and `moderator` roles. Pass the role down via context or prop.
- **`src/components/admin/AdminSidebar.tsx`**: Fetch user role. Moderators see only: Dashboard, Products, Categories, Orders, Coupons, Delivery Offers, Banners, Showcase, Reviews, Announcements, Live Support. Hide: Users, User Promos, Shipping, Landing Page, Home Page, Footer, CMS Pages, Requests, Call Settings, AI Agent, Branding, Mobile UI, API Keys, Settings.
- **`src/components/admin/AdminLayout.tsx`**: Show "Moderator" instead of "Administrator" for moderator role.
- **`src/App.tsx`**: No route changes needed since sidebar hides links; but add route-level guards for admin-only pages to prevent direct URL access by moderators.

---

## 3. Source Code Protection (DevTools Deterrent)

Add a lightweight script that detects DevTools opening and shows humorous messages in the console instead of useful debugging info.

**Changes:**
- **`src/main.tsx`**: In production mode, add:
  - `console.log` override that shows funny messages ("Nice try! The source code is on vacation.")
  - Disable right-click context menu with a friendly toast
  - Add console warning messages with styled ASCII art
  - Note: This is a deterrent, not real security. The actual security is server-side RLS.

---

## 4. Google Sitelinks SearchBox Schema

Add structured data so Google can show sitelinks with a search box in search results.

**Changes:**
- **`index.html`**: Already has SearchAction schema (line 47-52). Verify it matches Google's requirements.
- **`src/hooks/use-seo-meta.ts`**: The existing hook handles per-page SEO. Add a `WebSite` schema with `SearchAction` to the home page SEO if not already present in structured_data.
- **`public/robots.txt`**: Already correct. No changes needed.

---

## 5. Fixes & Polish

### 5a. LandingPage Footer
- **`src/pages/LandingPage.tsx`**: Still renders `<Footer />` directly (line 357). This is correct since LandingPage is outside MainLayout, but ensure it doesn't double-render.

### 5b. Console Warning Fix
- **`src/components/ImageUpload.tsx`**: Add `React.forwardRef` to fix the "Function components cannot be given refs" warning from AdminBranding.

### 5c. Badge ref warning
- **`src/components/ui/badge.tsx`**: Already using CVA; ensure it forwards refs properly.

### 5d. Admin Panel Cleanup
- Remove any duplicate sidebar entries (Footer appears in both Content group in sidebar and as a route - verify no duplication)
- Ensure admin header says site name from settings instead of hardcoded "Zero Marketplace Admin"

### 5e. Mobile Optimizations
- Ensure `AIChatWidget` doesn't overlap with `BottomNav` on mobile
- Check chat widget z-index layering

---

## Technical Details

### Migration SQL
```sql
-- Update site_settings public read policy to include title_font
DROP POLICY IF EXISTS "Public can view non-sensitive settings" ON public.site_settings;
CREATE POLICY "Public can view non-sensitive settings"
ON public.site_settings FOR SELECT TO public
USING (key = ANY (ARRAY[
  'site_name','site_description','logo_url','site_icon_url','favicon_url',
  'theme','primary_color','accent_color','font_family',
  'announcement_bar','social_links','contact_info',
  'ai_agent_config','currency_config',
  'homepage_layout','seo_title','seo_description','seo_keywords','og_image_url',
  'site_theme','site_mode','site_customizer',
  'mobile_ui_config','logo_display_style','logo_effect',
  'title_letter_colors','showcase_config',
  'home_category_sections','home_sales_config','home_new_arrivals',
  'home_layout_config','home_section_order',
  'product_page_layout','notification_order','popup_order',
  'voice_call_config','seo_pages','seo_global',
  'footer_config','title_font'
]));
```

### Files Summary
| File | Action |
|------|--------|
| `src/index.css` | Edit - add @font-face declarations |
| `src/components/admin/SiteCustomizer.tsx` | Edit - add custom fonts to selector |
| `src/pages/admin/AdminBranding.tsx` | Edit - add title font picker |
| `src/components/SiteThemeProvider.tsx` | Edit - apply title_font CSS var |
| `src/components/Navbar.tsx` | Edit - use --font-title on site name |
| `src/components/Footer.tsx` | Edit - use --font-title on brand |
| `src/pages/ShopPage.tsx` | Edit - apply title font to category headers |
| `src/pages/CategoryPage.tsx` | Edit - apply title font |
| `src/pages/ProductDetailPage.tsx` | Edit - apply title font to product name |
| `src/components/AdminRoute.tsx` | Edit - support moderator role |
| `src/components/admin/AdminSidebar.tsx` | Edit - role-based menu filtering |
| `src/components/admin/AdminLayout.tsx` | Edit - show role label |
| `src/main.tsx` | Edit - add source protection in prod |
| `src/components/ImageUpload.tsx` | Edit - add forwardRef |
| Migration | Create - update RLS policy |
