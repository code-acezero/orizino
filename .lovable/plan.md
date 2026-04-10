

# Fix Variant Selection Enforcement

## Problems Found

1. **ProductDetailPage.tsx (lines 213, 242)**: The validation uses `&&` logic (`!selectedSize && !selectedColor`), which means it only blocks adding to cart when **both** size AND color are unselected. If a user picks size but skips color, it passes validation and saves to cart incomplete. This is the core bug.

2. **ProductCard.tsx**: The `hasVariants` query result may still be `undefined` (loading) when the user clicks "Add to Cart", causing it to skip the variant check and add directly to cart without the popup.

3. **ProductDetailPage.tsx** also lacks enforcement that a **matching variant** actually exists for the selected combination before saving.

## Plan

### Step 1: Fix ProductDetailPage validation (addToCart + buyNow)

Replace the `&&` check with proper per-attribute validation:

```typescript
// Before (broken):
if (hasVariants && (!selectedSize && !selectedColor)) { ... }

// After (correct):
const sizes = [...new Set(variants.filter(v => v.size).map(v => v.size))];
const colors = [...new Set(variants.filter(v => v.color).map(v => v.color))];
if (hasVariants) {
  if (sizes.length > 0 && !selectedSize) { toast error "Please select a size"; return; }
  if (colors.length > 0 && !selectedColor) { toast error "Please select a color"; return; }
  if (!selectedVariant) { toast error "This combination is unavailable"; return; }
}
```

Apply this fix in both `addToCart()` (line 213) and `buyNow()` (line 242).

### Step 2: Fix ProductCard.tsx — guard against undefined query result

Change `if (hasVariants)` to `if (hasVariants === true)` so that when the query is still loading (`undefined`), it doesn't skip to direct add-to-cart. Alternatively, always open QuickViewModal for safety when `hasVariants` is not explicitly `false`.

```typescript
// If variants query hasn't loaded yet or product has variants, show modal
if (hasVariants !== false) {
  setQuickViewOpen(true);
  return;
}
```

### Step 3: Verify QuickViewModal is correct

The QuickViewModal already has proper enforcement (lines 92-95, 132-143, 156, 207) — buttons are disabled when selections are incomplete. No changes needed there.

## Files to Edit
- `src/pages/ProductDetailPage.tsx` — fix validation in `addToCart` and `buyNow`
- `src/components/ProductCard.tsx` — guard against undefined `hasVariants`

