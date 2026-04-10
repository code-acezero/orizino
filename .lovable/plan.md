

# Redesign Plan: Footer, Persistent Layout, Navbar Tweaks, Support Chat

## Summary
Five interconnected changes: compact artistic footer with admin customization, persistent shell layout for Navbar/BottomNav/Footer, navbar visual tweaks, redesigned support chat with complaint submission, and improved data caching.

---

## 1. Persistent Layout Shell (Navbar + BottomNav + Footer)

**Problem**: Every page imports and renders `<Navbar />` and `<Footer />` independently, causing re-mount and data refetch on navigation.

**Solution**: Create a `MainLayout` wrapper component rendered once at the route level in `App.tsx`, similar to how `AdminLayout` works.

**Files**:
- **New**: `src/components/MainLayout.tsx` — renders `<Navbar />`, `<Outlet />`, `<Footer />` in a stable shell
- **Edit**: `src/App.tsx` — wrap all public routes inside a `<Route element={<MainLayout />}>` parent, using nested `<Route>` children
- **Edit**: All 12 page files (`HomePage`, `ShopPage`, `CartPage`, etc.) — remove `<Navbar />` and `<Footer />` imports/renders, keep only page content

The Navbar, BottomNav, and Footer will mount once and persist across all page navigations. React Query caching already prevents data refetch; this change prevents component remounting.

---

## 2. Footer Redesign — Compact & Artistic

**Problem**: Current footer is functional but takes vertical space and lacks visual flair.

**Solution**: Redesign to a single-row or two-row compact footer with artistic glass styling.

**File**: `src/components/Footer.tsx`

Design direction:
- Single compact bar (~60-80px total) with inline columns
- Horizontal layout: brand/logo left, inline link pills center, social icons + newsletter right
- Subtle animated gradient border on top, glass card styling
- Animated decorative accent orbs (small, subtle)
- "Powered by" / copyright as a thin bottom strip
- Trust badges shown as small inline icons with tooltips instead of stacked rows

---

## 3. Admin Footer Customization

**New admin page**: `src/pages/admin/AdminFooter.tsx`

Customization options stored in `site_settings` key `footer_config`:
- Toggle sections: newsletter, social links, categories, quick links, trust badges
- Custom copyright text
- Footer style: "minimal" | "compact" | "expanded"  
- Background style: transparent, glass, solid
- Social media URLs (Facebook, Instagram, Twitter, TikTok, YouTube)

**Files**:
- **New**: `src/pages/admin/AdminFooter.tsx`
- **Edit**: `src/components/admin/AdminSidebar.tsx` — add "Footer" nav item
- **Edit**: `src/App.tsx` — add admin route
- **Edit**: `src/components/Footer.tsx` — read `footer_config` from site_settings and conditionally render sections

**Database**: Update the `site_settings` public read RLS policy to include `footer_config`.

---

## 4. Navbar Visual Tweaks

**File**: `src/components/Navbar.tsx`

Changes:
- Add a subtle bottom border glow effect (gradient line like footer top border)
- Improve search bar styling with a frosted-glass look and subtle icon animation on focus
- Add micro-animation to cart badge count changes (scale bounce)
- Refine category dropdown with subtle backdrop blur and smoother animations
- Polish user avatar menu with better spacing and hover effects

---

## 5. Support Chat Redesign + Complaint Feature

**File**: `src/components/AIChatWidget.tsx`

Visual redesign:
- Tabbed interface inside the chat panel: "Chat" | "Complaint"
- Chat tab: keep existing AI + live support flow with polished message bubbles
- Rounded header with gradient accent and agent status pill
- Quick-action chips below the header (e.g., "Track Order", "Live Agent", "Submit Complaint")
- Smoother message animations

Complaint tab:
- Simple form: subject, category dropdown (Order Issue, Product Quality, Delivery, Other), description textarea, optional image upload
- Submit inserts into `support_conversations` with `subject` set to complaint title and a flag

**Database migration**: Add a `type` column to `support_conversations` to distinguish complaints from regular support chats.

```sql
ALTER TABLE public.support_conversations 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'support';
```

Also update `site_settings` RLS policy to include `footer_config`.

---

## 6. Data Persistence / Caching Improvements

**File**: `src/App.tsx` — already has good defaults (5min staleTime, 30min gcTime). No major changes needed since the persistent layout shell (step 1) solves the main re-fetching problem.

Minor tweaks:
- Increase `staleTime` for site-settings queries to 15 minutes across components
- Ensure Navbar/Footer queries use consistent query keys to share cache

---

## Technical Details

### Migration SQL
```sql
-- Add complaint type to support conversations
ALTER TABLE public.support_conversations 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'support';

-- Update site_settings public read policy to include footer_config
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
  'footer_config'
]));
```

### Files Created/Edited Summary
| File | Action |
|------|--------|
| `src/components/MainLayout.tsx` | Create — persistent shell |
| `src/App.tsx` | Edit — nested route structure |
| 12 page files | Edit — remove Navbar/Footer |
| `src/components/Footer.tsx` | Edit — full redesign |
| `src/pages/admin/AdminFooter.tsx` | Create — footer admin |
| `src/components/admin/AdminSidebar.tsx` | Edit — add footer link |
| `src/components/Navbar.tsx` | Edit — visual tweaks |
| `src/components/AIChatWidget.tsx` | Edit — redesign + complaint |
| Migration | Create — type column + RLS update |

