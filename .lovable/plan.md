# Final Site Overhaul: Landing Page, Sounds, Support UI, and Polish

## Summary

Rebuild the landing page as a fully immersive cinematic brand portfolio with its own minimal nav and footer style, add sound effects for calls and notifications, show AI agent name/avatar in support chat, and complete remaining site features.

---

## 1. Landing Page -- Own Nav + No Bottom Nav

### 1a. Custom Minimal Landing Nav

- Remove the `<Navbar />` import from LandingPage. Instead, build a slim, transparent floating nav bar inside LandingPage itself with: logo/site name (left), and limited links: "Home", "Shop", "Support", "Sign In" (right).
- No bottom nav on mobile for landing page (it's already outside MainLayout, so BottomNav won't render).
- Style: absolute positioned, transparent bg with blur on scroll, minimal and cinematic.

### 1b. Landing-Specific Footer

- Replace `<Footer />` in LandingPage with a compact inline footer: single row with copyright, social links, and "Enter Store" CTA. Styled differently from the main footer -- minimal, dark glass strip.

---

## 2. Landing Page Cinematic Overhaul

### 2a. Enhanced Hero

- Increase particle count to 30+ with more variation (size 1-8px, multiple colors, staggered drift).
- Add a slow cinematic camera zoom effect on the hero background (scale 1 to 1.05 over 20s loop).
- Add floating light streaks / lens flare divs drifting across.
- Scroll-driven parallax layers (foreground text moves faster than background shapes).

### 2b. Branded Product Highlight Section (New)

- Large full-width section with a hero-sized product image on one side (with parallax float) and detailed product info on the other: name, price, short description, "Shop Now" CTA.
- Fetches the product configured in `showcase_product_id` from the `products` table (or falls back to `showcase_image_url` / `showcase_headline` from landing_config).
- Cinematic reveal animation: image slides in from left, text fades in from right.

### 2c. Rich Data Sections

- About Us: Add animated word-by-word reveal on scroll.
- Mission/Vision: Add glowing border animation on hover, floating icon animation.
- Stats: Larger typography, add subtle background pulse per stat card.
- Categories: Full-bleed image cards with cinematic zoom-on-hover and overlay gradient.
- CTA: Add floating particle ring around the CTA button.

### 2d. New Section: "Why Us" / Trust Signals

- Animated icons grid: Free Shipping, Secure Payments, 24/7 Support, Easy Returns.
- Each with a micro-animation on scroll entrance.

---

## 3. Support Chat -- Avatar + Name Display

### 3a. AIChatWidget Header

- Change header from `{agentName || "Support"}` to show avatar inline and name in format: `Support ({agentName})` when agentName exists.
- Show the `<AgentAvatar />` component (already exists) beside the name consistently. set the current morcot as the default/main avatar. remove harcoded avatar and upload the moscott through admin panel, but match the color and theme of the avatar.

### 3b. SupportPage Header

- Similarly update the SupportPage chat header to show the AI agent name in bracket format with avatar.

---

## 4. Sound Effects

### 4a. Ringtone for Support Calls

- Generate a short ringtone using Web Audio API (oscillator-based melody) -- no external files needed.
- Play on incoming call in `AIChatWidget` and `SupportPage` when `incomingCall` becomes true.
- Loop until accepted/rejected/timeout. Stop on `acceptCall` or `rejectCall`.

### 4b. Notification Sound

- Generate a short notification chime using Web Audio API (two-tone ascending beep).
- Play in `NotificationBell` when a new unread notification arrives (compare previous count).
- Respect the user's `sound` preference from settings (`notifPrefs.sound`).

### 4c. Implementation

- Create `src/lib/sounds.ts` with functions: `playRingtone()`, `stopRingtone()`, `playNotificationSound()` -- all using `AudioContext` + `OscillatorNode` (no external audio files).

---

## 5. Hardcoded Data Removal (Final Pass)

- Scan CheckoutPage, AdminSettings, Footer, Navbar for any remaining hardcoded brand names.
- Replace with dynamic `site_name` from `site_settings`.

---

## 6. Profile & Settings Additions

### 6a. Profile Page

- Add "Account Overview" card: email, join date, total orders count, total spend.
- Add "Referral Code" display (auto-generate from user ID substring).
- Add "Return History" tab showing user's return_requests.

### 6b. Settings Page

- Add "Data & Privacy" section: "Download My Data" button (exports profile + orders as JSON), "Delete Account" request.
- Add "Email Preferences" section with toggles for marketing, order updates, newsletter.
- Add "Login Activity" placeholder showing "Coming soon".

---

## 7. Recently Viewed Products

- Create `src/hooks/use-recently-viewed.ts`: stores last 10 viewed product IDs in localStorage.
- Call from `ProductDetailPage` on mount.
- Show "Recently Viewed" carousel on HomePage and ShopPage (query products by stored IDs).

## 8. product return workflow

- add proper return policy and workflow
- product return option with proper intigration and echo system

## 9. admin route change

- change admin route from /admin to /origin for better security.

---

## Technical Details

### New Files


| File                               | Purpose                                                |
| ---------------------------------- | ------------------------------------------------------ |
| `src/lib/sounds.ts`                | Web Audio API ringtone + notification sound generators |
| `src/hooks/use-recently-viewed.ts` | localStorage-based recently viewed product tracking    |


### Files to Edit


| File                                  | Change                                                                                                                                  |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/LandingPage.tsx`           | Complete rebuild: custom minimal nav, cinematic hero, branded product highlight, landing-specific footer, enhanced particles/animations |
| `src/components/AIChatWidget.tsx`     | Show avatar + `Support (name)` format in header                                                                                         |
| `src/pages/SupportPage.tsx`           | Show avatar + name bracket format                                                                                                       |
| `src/components/NotificationBell.tsx` | Play notification sound on new unread                                                                                                   |
| `src/pages/ProfilePage.tsx`           | Add account overview, referral code, return history                                                                                     |
| `src/pages/SettingsPage.tsx`          | Add data privacy, email preferences sections                                                                                            |
| `src/pages/HomePage.tsx`              | Add "Recently Viewed" section                                                                                                           |
| `src/pages/ProductDetailPage.tsx`     | Track recently viewed                                                                                                                   |
| `src/pages/CheckoutPage.tsx`          | Remove any remaining hardcoded names                                                                                                    |
| `src/pages/admin/AdminLanding.tsx`    | Add showcase_product_id picker field                                                                                                    |


### Sound Generation Approach

All sounds are synthesized at runtime using the Web Audio API -- no audio files to host or download. This keeps the bundle small and creates unique, custom sounds.

```text
Ringtone pattern:  C5-E5-G5-C6 arpeggio, 0.15s per note, looped every 2s
Notification:      E5(0.1s) -> G5(0.15s) ascending two-tone chime
```