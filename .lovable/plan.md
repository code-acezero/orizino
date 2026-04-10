

# Fly-to-Cart Animation + Immersive 3D Landing Page Rebuild

## 1. Fly-to-Cart Animation

When a user clicks "Add to Cart" on a `ProductCard`, the product thumbnail clones itself, shrinks and arcs toward the cart icon in the navbar, then disappears with a pulse effect on the cart badge.

**Implementation:**
- **New component `src/components/FlyToCartAnimation.tsx`**: A portal-rendered component that creates an absolutely positioned clone of the product image, animates it via `framer-motion` from the click position to the cart icon's position (queried via `document.getElementById("nav-cart-icon")`), then removes itself.
- **`src/components/ProductCard.tsx`**: After successful `addToCart`, capture the thumbnail element's bounding rect and trigger the fly animation via a shared event emitter or state callback. Render `<FlyToCartAnimation>` conditionally.
- **`src/components/Navbar.tsx`**: Add `id="nav-cart-icon"` to the cart `<Link>` element so the animation can target it. Add a brief scale-pulse on the cart badge when a fly animation completes (listen for a custom DOM event `cart-fly-landed`).
- **`src/pages/ProductDetailPage.tsx`**: Wire the same fly animation for the "Add to Cart" button on the product detail page.

**Animation path**: Use `framer-motion` `animate` with keyframes — scale from 1→0.3, opacity 1→0.7→0, position from source rect to cart icon rect with a slight upward arc (bezier-like via intermediate keyframe).

---

## 2. Immersive 3D Landing Page Rebuild

Complete rebuild of `src/pages/LandingPage.tsx` with a fantasy/artistic design. The admin `landing_config` data contract stays the same so existing admin controls keep working.

**Sections (top to bottom):**

1. **Floating Glass Nav** (keep existing, minor style tweaks)

2. **Hero — Full-viewport immersive scene**
   - Large animated gradient mesh background with floating 3D geometric shapes (CSS `perspective` + `transform-style: preserve-3d` + framer-motion rotations)
   - Glowing particle dots drifting upward (reuse `ParticleOverlay` concept)
   - Hero text with staggered letter-by-letter animation, gradient text
   - Scroll indicator arrow at bottom

3. **Brand Story / About Us** (new section)
   - Split layout: left side has animated text reveal on scroll, right side has a floating product image with parallax
   - "More than a Brand, an Evolution" tagline with typewriter effect
   - Subtle horizontal scroll-driven progress line

4. **Mission & Vision** (new section)
   - Two glass cards side by side with hover 3D tilt (like ProductCard's mouse tracking)
   - Mission card with target icon, Vision card with eye icon
   - Cards float in from left/right on scroll

5. **Featured Products Preview** (new section)
   - Horizontal scroll carousel of 4-6 featured products from Supabase
   - Each card has hover parallax and "Shop Now" CTA
   - Section header with animated underline

6. **Stats Counter** (enhanced existing)
   - Numbers animate counting up when scrolled into view using `useInView` + `animate`
   - Glass card background with subtle glow

7. **Features Grid** (enhanced existing)
   - 2x2 grid with staggered entrance, hover glow effect on cards
   - Icons with animated gradient background

8. **Categories** (enhanced existing)
   - Larger cards with image backgrounds and glass overlay text
   - Hover zoom effect on images

9. **Testimonials** (enhanced existing)
   - Horizontal auto-scrolling marquee style
   - Avatar circles with quote cards

10. **CTA Section** (enhanced)
    - Full-width gradient background with floating shapes
    - Pulsing CTA button with glow

11. **Footer** (existing)

**New data fields** added to `LandingConfig` interface (with defaults so existing configs don't break):
- `about_title`, `about_text` (About Us content)
- `mission_text`, `vision_text` (Mission/Vision)
- `show_about`, `show_mission_vision`, `show_featured_products` (toggles)

**Admin page `src/pages/admin/AdminLanding.tsx`**: Add new tabs for About Us and Mission/Vision content editing.

---

## Technical Details

### Files to Create
| File | Purpose |
|------|---------|
| `src/components/FlyToCartAnimation.tsx` | Animated clone that flies product image to cart icon |

### Files to Edit
| File | Change |
|------|--------|
| `src/components/ProductCard.tsx` | Trigger fly animation on add-to-cart success |
| `src/components/Navbar.tsx` | Add `id="nav-cart-icon"`, pulse effect on land |
| `src/pages/LandingPage.tsx` | Complete rebuild with 3D immersive sections |
| `src/pages/admin/AdminLanding.tsx` | Add About/Mission/Vision config tabs |
| `src/pages/ProductDetailPage.tsx` | Wire fly-to-cart on detail page |

### Performance Considerations
- All 3D transforms use `will-change: transform` and `transform-style: preserve-3d`
- Particle effects use CSS animations (not JS RAF) for 60fps
- `viewport={{ once: true }}` on all scroll animations to avoid re-triggers
- Lazy load featured product images
- Reduce motion: respect `prefers-reduced-motion` media query

