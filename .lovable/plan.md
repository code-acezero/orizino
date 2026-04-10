

# Complete Unfinished Code, Fix TURN/ICE, and Optimize

## Issues Found

### 1. ICE/TURN Server Configuration Bug
The Coturn URL stored in `site_settings` is `free.expressturn.com:3478` -- missing the required `turn:` protocol prefix. The `getIceServers()` function passes this directly to `RTCPeerConnection`, which expects `turn:host:port`. The Metered TURN config looks correct structurally but may fail due to CORS when fetching credentials from the client side (browser blocks cross-origin fetch to metered API).

### 2. SEO Settings Not Readable by Public Users
The `site_settings` RLS allowlist does NOT include `seo_pages` or `seo_global`, so the `useSeoMeta` hook silently returns empty data for non-admin visitors. All SEO meta tags are effectively broken for public users.

### 3. Toast System Inconsistency
`ProductCard.tsx` and `QuickViewModal.tsx` import `toast` from `"sonner"` instead of `@/lib/app-toast`. Since `AppToastOverlay` was removed from App.tsx, these sonner toasts won't display anywhere. They need to use the unified `app-toast` system that feeds into `NotificationBell`.

### 4. `sonner.tsx` Imports from `next-themes`
`src/components/ui/sonner.tsx` imports `useTheme` from `next-themes` which isn't installed. This file is unused but could cause build issues if ever imported.

### 5. Missing `ProtectedRoute` State Pass-through
`ProtectedRoute` redirects to `/auth` but doesn't pass `state: { from }`, so after login the user won't return to their intended page.

### 6. `ip-api.com` Returns 403
Network requests show `ip-api.com/json/` returning 403 (it blocks HTTPS requests on its free tier). This is likely used for geo-detection and silently fails.

### 7. Particle Overlay on Slider
The `ParticleOverlay` receives `containerSize.w` and `containerSize.h`. The `ResizeObserver` was fixed to depend on `slides.length`, but the component returns `null` when width/height is 0. This should work now -- but we should verify the container measurement fires correctly.

---

## Plan

### Step 1: Fix ICE/TURN Server Logic
**File: `src/lib/ice-servers.ts`**
- Auto-prepend `turn:` to coturn URLs if missing the protocol prefix
- For Metered TURN: add error handling for CORS failures and consider using the standard `global.relay.metered.ca` domain format
- Add `turns:` support for TLS connections

### Step 2: Fix SEO RLS Allowlist
**Migration SQL:**
- Add `seo_pages` and `seo_global` to the public SELECT allowlist in `site_settings` RLS policy

### Step 3: Fix Toast Inconsistencies
**Files: `src/components/ProductCard.tsx`, `src/components/QuickViewModal.tsx`**
- Replace `import { toast } from "sonner"` with `import { toast } from "@/lib/app-toast"`
- Update toast call signatures to match `app-toast` API (`toast.success(...)` or `toast({ title, ... })`)

### Step 4: Fix ProtectedRoute State
**File: `src/components/ProtectedRoute.tsx`**
- Pass `state={{ from: location.pathname }}` in the Navigate to `/auth` so users return to their intended page after login

### Step 5: Remove/Fix Dead Imports
**File: `src/components/ui/sonner.tsx`**
- Remove the `next-themes` import or delete the file entirely since it's unused

### Step 6: Fix ip-api.com Geo Detection
- Replace `https://ip-api.com/json/` with `http://ip-api.com/json/` (free tier only works over HTTP) or switch to a free HTTPS alternative, or gracefully handle the 403

### Step 7: Verify Particle Overlay Rendering
**File: `src/components/ParallaxSlider.tsx`**
- Confirm `containerSize` is set before rendering `ParticleOverlay`; add a small delay fallback if `ResizeObserver` doesn't fire

### Step 8: VoiceCallButton Stale Closure Fix
**File: `src/components/admin/VoiceCallButton.tsx`**
- The `startCall` timeout callback captures stale `callState` -- use a ref to track current state

### Step 9: Minor Completions
- Ensure `AppToastOverlay` component file can be safely deleted or left unused
- Verify all admin sidebar links match routes in `App.tsx` (they do)
- Confirm `AuthModal.tsx` file is no longer imported anywhere (confirmed -- it's orphaned, can delete)

