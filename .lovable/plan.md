

# Comprehensive Site Overhaul: Landing Page, Search, Payments, Missing Features

## Summary
Redesign the landing page as a brand portfolio (remove featured products, add branded product showcase), fix search/navigation UX, add payment gateway configuration (Stripe + Bangladeshi gateways with personal account fallback), remove hardcoded data, and fill in missing e-commerce features.

---

## 1. Landing Page Overhaul

### 1a. Replace Featured Products with Branded Product Showcase
- Remove the `show_featured_products` section and `featuredProducts` query
- Add a new "Brand Showcase" section: full-width split layout with a large product/brand image on one side and product details + CTA on the other, styled as a portfolio piece
- Admin config: `showcase_product_id`, `showcase_image_url`, `showcase_headline`, `showcase_description`

### 1b. Center Hero Content + Enhanced Particles
- Change hero layout from left-aligned `max-w-3xl` to `text-center mx-auto max-w-4xl`
- Increase floating particles from 8 to ~20 with varied sizes, glow effects, and staggered upward drift
- Add subtle radial gradient pulse behind the centered text

### 1c. Replace Landing Nav with Main Navbar
- Remove the custom floating glass nav in LandingPage
- Instead, use the shared `Navbar` component (import from MainLayout pattern) or wrap the landing route inside MainLayout
- This ensures consistent branding, search, cart, and user menu

### 1d. Remove Hardcoded Data
- Audit `defaultLandingConfig` — keep as empty defaults (already mostly empty)
- Remove hardcoded `"Ace Marketplace"` from CheckoutPage `useSeoMeta`
- Remove `"Zero Marketplace"` default from AdminSettings
- Replace all hardcoded site names with dynamic `site_name` from settings
- Check Footer, Navbar, and other components for hardcoded brand references

---

## 2. Search Bar Redesign

### 2a. New Search UI
- Redesign desktop search: glass-morphic input with animated expanding focus state, subtle glow border, and microphone icon placeholder
- Mobile search: redesign with larger touch targets, slide-down animation

### 2b. Search Without Page Reload
- Currently `handleSearchSubmit` navigates to `/shop?q=...` which causes a full route change
- If already on `/shop`, update the URL query parameter without re-mounting the page using `useSearchParams` + `replace: true`
- If on another page, navigate to `/shop?q=...` normally but the Navbar won't re-render since it's in MainLayout

---

## 3. Mobile Top Menu & Dynamic Island Fix

- Review `NotificationBell` dynamic island positioning — ensure it doesn't overlap with mobile search bar
- Fix mobile navbar height and z-index conflicts with BottomNav
- Ensure the dynamic island notification popup doesn't push content or break layout on small screens
- Add `safe-area-inset` padding for notched devices

---

## 4. Payment Gateway Configuration

### 4a. Admin Payment Settings Page
Create new admin page `src/pages/admin/AdminPaymentGateways.tsx` with tabs:
- **Stripe**: API key fields (publishable + secret), webhook URL display, enable/disable toggle
- **bKash Merchant**: App Key, App Secret, Username, Password fields
- **Nagad Merchant**: Merchant ID, Public Key, Private Key
- **SSLCommerz**: Store ID, Store Password, sandbox toggle
- **Personal Accounts** (interim): For each gateway (bKash, Nagad, Upay, Rocket):
  - Account number field
  - Account holder name
  - QR code image upload
  - Custom payment instructions text

### 4b. Checkout Integration
- Update `CheckoutPage.tsx`: When user selects bKash/Nagad/Upay/Rocket, show:
  - The configured account number
  - QR code image (if uploaded)
  - Payment instructions
  - Transaction ID input field for user to enter after sending money
  - Store transaction ID in the order record

### 4c. Database
- Store payment gateway configs in `site_settings` with keys like `payment_bkash_personal`, `payment_nagad_personal`, `payment_stripe_config`, etc.
- Add `transaction_id` column to `orders` table
- Add admin sidebar entry under Commerce group

---

## 5. Missing E-Commerce Features

### 5a. Order Tracking
- Order status timeline already exists (`OrderTrackingTimeline`). Verify it's wired up on the user's order detail view.

### 5b. Return/Refund Request System
- Add `return_requests` table: `id, order_id, user_id, reason, status (pending/approved/rejected/completed), admin_notes, created_at`
- Add return request button on user's order page (only for delivered orders)
- Admin page to manage return requests

### 5c. Product Compare
- Add compare functionality: users can select 2-3 products to compare side-by-side
- Floating compare bar at bottom when products are selected

### 5d. Recently Viewed Products
- Track recently viewed products in localStorage
- Show "Recently Viewed" section on HomePage and ShopPage

### 5e. Email Notifications (skeleton)
- Order confirmation, shipping update, delivery confirmation notification templates
- Already have Resend API key configured — wire up order status change triggers

---

## 6. User Profile & Settings Additions

### 6a. Profile Page
- Add "Account Info" section showing: email, join date, total orders, total spend
- Add "Referral Code" display (generate unique code per user stored in preferences)
- Add "Download My Data" button (GDPR compliance)
- Add order return history tab

### 6b. Settings Page
- Add "Two-Factor Authentication" placeholder/coming-soon section
- Add "Login Activity" section showing recent login timestamps
- Add "Connected Devices" placeholder
- Add "Email Preferences" with granular opt-in/out for marketing, order updates, newsletter
- Add "Data & Privacy" section with data export and account deletion request

---

## 7. Admin Sidebar Update
- Add "Payment Gateways" entry under Commerce group
- Add "Returns" entry under Commerce group (for return requests)

---

## Technical Details

### New Files
| File | Purpose |
|------|---------|
| `src/pages/admin/AdminPaymentGateways.tsx` | Payment gateway configuration |
| `src/pages/admin/AdminReturns.tsx` | Return request management |

### Database Migration
```sql
-- Add transaction_id to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS transaction_id text;

-- Return requests table
CREATE TABLE public.return_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
-- RLS policies for return_requests
CREATE POLICY "Users can create return requests" ON public.return_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own returns" ON public.return_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage returns" ON public.return_requests FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add payment config keys to RLS allowlist
-- (will update site_settings public read policy to include payment_* keys)
```

### Files to Edit
| File | Change |
|------|---------|
| `src/pages/LandingPage.tsx` | Remove featured products, add brand showcase, center hero, enhance particles, remove custom nav |
| `src/components/Navbar.tsx` | Redesign search bar, fix mobile layout |
| `src/components/NotificationBell.tsx` | Fix dynamic island positioning on mobile |
| `src/pages/CheckoutPage.tsx` | Add personal payment gateway UI with QR codes, transaction ID input, remove hardcoded names |
| `src/pages/admin/AdminSettings.tsx` | Remove hardcoded "Zero Marketplace" default |
| `src/pages/ProfilePage.tsx` | Add account info, referral code, return history tab |
| `src/pages/SettingsPage.tsx` | Add data & privacy, email preferences, login activity sections |
| `src/components/admin/AdminSidebar.tsx` | Add Payment Gateways and Returns entries |
| `src/App.tsx` | Add routes for AdminPaymentGateways, AdminReturns; wrap landing in MainLayout |
| `src/pages/admin/AdminLanding.tsx` | Replace featured products config with brand showcase config |

### Priority Order
1. Landing page overhaul (visual impact)
2. Search + navigation fixes (UX critical)
3. Payment gateway config (business critical)
4. Hardcoded data removal
5. Missing features (returns, compare, recently viewed)
6. Profile/settings additions

