import React, { useState, lazy, Suspense } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Shield, Truck, RotateCcw, Package, X, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/app-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useProductSeoMeta } from "@/hooks/use-product-seo-meta";
import { useIsMobile } from "@/hooks/use-mobile";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ImageGallery from "@/components/product/ImageGallery";
import InfinityGallery from "@/components/product/InfinityGallery";
import ProductTabs from "@/components/product/ProductTabs";
import ProductActions from "@/components/product/ProductActions";
import CurrencyWidget from "@/components/product/CurrencyWidget";
import StickyAddToCart from "@/components/product/StickyAddToCart";
import VariantSelector from "@/components/product/VariantSelector";
import VariantComparison from "@/components/product/VariantComparison";
import NotifyWhenAvailable from "@/components/product/NotifyWhenAvailable";
import { Badge } from "@/components/ui/badge";

// Lazy load gallery variants
const CoverflowGallery = lazy(() => import("@/components/product/CoverflowGallery"));
const FilmstripGallery = lazy(() => import("@/components/product/FilmstripGallery"));
const GridMosaicGallery = lazy(() => import("@/components/product/GridMosaicGallery"));
const ParallaxStackGallery = lazy(() => import("@/components/product/ParallaxStackGallery"));

export type LayoutStyle = "dark-luxury" | "glass" | "neon" | "minimal" | "magazine";
export type GalleryStyle = "default" | "infinity" | "coverflow" | "filmstrip" | "mosaic" | "parallax-stack";

const LAYOUT_CONFIGS: Record<LayoutStyle, { containerClass: string; textClass: string; priceClass: string; mobilePriceClass: string; cardClass: string; accentBorder: string }> = {
  "dark-luxury": {
    containerClass: "bg-black/40",
    textClass: "text-white",
    priceClass: "text-4xl md:text-5xl font-black tracking-tight text-white",
    mobilePriceClass: "text-2xl font-black tracking-tight text-white",
    cardClass: "bg-white/5 border border-white/10 backdrop-blur-lg",
    accentBorder: "border-amber-400/30",
  },
  glass: {
    containerClass: "",
    textClass: "text-foreground",
    priceClass: "text-4xl font-bold text-gradient",
    mobilePriceClass: "text-2xl font-bold text-gradient",
    cardClass: "glass",
    accentBorder: "border-primary/30",
  },
  neon: {
    containerClass: "",
    textClass: "text-foreground",
    priceClass: "text-4xl font-black text-primary drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]",
    mobilePriceClass: "text-2xl font-black text-primary drop-shadow-[0_0_15px_hsl(var(--primary)/0.5)]",
    cardClass: "bg-background/80 border border-primary/20 shadow-[0_0_30px_hsl(var(--primary)/0.1)]",
    accentBorder: "border-primary/40",
  },
  minimal: {
    containerClass: "",
    textClass: "text-foreground",
    priceClass: "text-3xl font-semibold text-foreground tracking-tight",
    mobilePriceClass: "text-xl font-semibold text-foreground tracking-tight",
    cardClass: "bg-transparent",
    accentBorder: "border-border",
  },
  magazine: {
    containerClass: "",
    textClass: "text-foreground",
    priceClass: "text-4xl font-display font-bold text-foreground italic",
    mobilePriceClass: "text-2xl font-display font-bold text-foreground italic",
    cardClass: "glass rounded-3xl",
    accentBorder: "border-primary/20",
  },
};

const GalleryLoader = () => (
  <div className="w-full aspect-square rounded-3xl bg-secondary/10 animate-pulse flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const isMobile = useIsMobile();

  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Fetch product page layout setting
  const { data: pageSettings } = useQuery({
    queryKey: ["product-page-layout"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "product_page_layout")
        .maybeSingle();
      const val = (data?.value as any) || {};
      return {
        layout: (val.layout || "glass") as LayoutStyle,
        gallery: (val.gallery || "default") as GalleryStyle,
      };
    },
  });
  const layout: LayoutStyle = pageSettings?.layout || "glass";
  const galleryStyle: GalleryStyle = pageSettings?.gallery || "default";
  const cfg = LAYOUT_CONFIGS[layout] || LAYOUT_CONFIGS.glass;

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(name, slug, parent_id)")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      return data;
    },
    enabled: !!slug,
  });

  useProductSeoMeta(product);

  const productCat = product?.categories as any;
  const { data: parentCategory } = useQuery({
    queryKey: ["parent-category", productCat?.parent_id],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("name, slug").eq("id", productCat.parent_id).single();
      return data;
    },
    enabled: !!productCat?.parent_id,
  });

  const { data: reviews } = useQuery<any[]>({
    queryKey: ["reviews", product?.id],
    queryFn: async () => {
      const { data } = await supabase.from("public_reviews" as any).select("id, product_id, rating, title, comment, created_at, is_approved")
        .eq("product_id", product!.id).eq("is_approved", true).order("created_at", { ascending: false });
      return (data as any) || [];
    },
    enabled: !!product?.id,
  });

  const { data: ownReviews } = useQuery<any[]>({
    queryKey: ["own-reviews", product?.id],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("id, product_id, rating, title, comment, created_at, is_approved")
        .eq("product_id", product!.id).eq("user_id", user!.id).order("created_at", { ascending: false });
      return (data || []) as any;
    },
    enabled: !!product?.id && !!user,
  });

  const ownReviewIds = new Set((ownReviews || []).map((r: any) => r.id));
  const pendingOwnReviews = (ownReviews || []).filter((r: any) => !r.is_approved);
  const mergedReviews = [...pendingOwnReviews, ...(reviews || [])].filter((r, i, arr) => arr.findIndex((x) => x.id === r.id) === i);

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id, product?.id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("category_id", product!.category_id!)
        .eq("is_active", true).neq("id", product!.id).order("avg_rating", { ascending: false }).limit(4);
      return data || [];
    },
    enabled: !!product?.category_id && !!product?.id,
  });

  const { data: variants = [] } = useQuery({
    queryKey: ["product-variants", product?.id],
    queryFn: async () => {
      const { data } = await supabase.from("product_variants").select("id, size, color, stock_quantity, price_override, is_active, image_url")
        .eq("product_id", product!.id).eq("is_active", true).order("sort_order");
      return data || [];
    },
    enabled: !!product?.id,
  });

  const hasVariants = variants.length > 0;
  const effectiveStock = hasVariants
    ? (() => {
        const match = variants.find(v => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor));
        if (selectedSize || selectedColor) return match?.stock_quantity ?? 0;
        return variants.reduce((sum, v) => sum + v.stock_quantity, 0);
      })()
    : product?.stock_quantity ?? 0;

  const selectedVariant = hasVariants
    ? variants.find(v => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor))
    : null;
  const effectivePrice = selectedVariant?.price_override ?? product?.price ?? 0;

  const baseImages = product?.images?.length ? product.images : [product?.thumbnail || "/placeholder.svg"];
  const variantImages = selectedColor
    ? variants.filter(v => v.color === selectedColor && (v as any).image_url).map(v => (v as any).image_url as string)
    : [];
  const images = variantImages.length > 0 ? [...variantImages, ...baseImages] : baseImages;
  const discount = product?.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  // === Cart / Wishlist actions ===
  const addToCart = async () => {
    if (!user) { toast({ title: "Please sign in", description: "You need to be logged in to add items to cart.", variant: "destructive" }); return; }
    if (!product) return;
    setAddingToCart(true);
    const variantId = selectedVariant?.id || null;
    let query = supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", product.id);
    if (variantId) query = query.eq("variant_id", variantId); else query = query.is("variant_id", null);
    const { data: existing } = await query.maybeSingle();
    if (existing) await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
    else await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity, variant_id: variantId } as any);
    setAddingToCart(false);
    const variantLabel = [selectedSize, selectedColor].filter(Boolean).join(" / ");
    toast({ title: "Added to cart!", description: `${product.name}${variantLabel ? ` (${variantLabel})` : ""} x${quantity}` });
  };

  const addVariantToCart = async (variantId: string, variantLabel: string, qty: number = 1) => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!product) return;
    const query = supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", product.id).eq("variant_id", variantId);
    const { data: existing } = await query.maybeSingle();
    if (existing) await supabase.from("cart_items").update({ quantity: existing.quantity + qty }).eq("id", existing.id);
    else await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: qty, variant_id: variantId } as any);
    toast({ title: "Added to cart!", description: `${product.name}${variantLabel ? ` (${variantLabel})` : ""} x${qty}` });
  };

  const buyNow = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!product) return;
    setAddingToCart(true);
    const variantId = selectedVariant?.id || null;
    let query = supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", product.id);
    if (variantId) query = query.eq("variant_id", variantId); else query = query.is("variant_id", null);
    const { data: existing } = await query.maybeSingle();
    if (existing) await supabase.from("cart_items").update({ quantity }).eq("id", existing.id);
    else await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity, variant_id: variantId } as any);
    setAddingToCart(false);
    navigate("/checkout");
  };

  const toggleWishlist = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!product) return;
    const { data: existing } = await supabase.from("wishlist_items").select("id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
    if (existing) { await supabase.from("wishlist_items").delete().eq("id", existing.id); toast({ title: "Removed from wishlist" }); }
    else { await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: product.id }); toast({ title: "Added to wishlist!" }); }
  };

  // === Render gallery ===
  const renderGallery = () => {
    const galleryProps = { images, productName: product!.name, discount };
    switch (galleryStyle) {
      case "infinity": return <InfinityGallery key={selectedColor || "default"} {...galleryProps} />;
      case "coverflow": return <Suspense fallback={<GalleryLoader />}><CoverflowGallery key={selectedColor || "default"} {...galleryProps} /></Suspense>;
      case "filmstrip": return <Suspense fallback={<GalleryLoader />}><FilmstripGallery key={selectedColor || "default"} {...galleryProps} /></Suspense>;
      case "mosaic": return <Suspense fallback={<GalleryLoader />}><GridMosaicGallery key={selectedColor || "default"} {...galleryProps} /></Suspense>;
      case "parallax-stack": return <Suspense fallback={<GalleryLoader />}><ParallaxStackGallery key={selectedColor || "default"} {...galleryProps} /></Suspense>;
      default: return <ImageGallery key={selectedColor || "default"} {...galleryProps} layout="premium" />;
    }
  };

  // === Skeleton ===
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-3 sm:px-4 py-6 md:py-8">
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            <div className="aspect-square rounded-2xl md:rounded-3xl bg-secondary/10 animate-pulse" />
            <div className="space-y-3 md:space-y-4 py-2 md:py-4">
              <div className="h-3 md:h-4 bg-secondary/10 rounded-full w-24 animate-pulse" />
              <div className="h-6 md:h-8 bg-secondary/10 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 md:h-5 bg-secondary/10 rounded-full w-1/2 animate-pulse" />
              <div className="h-8 md:h-10 bg-secondary/10 rounded-full w-1/3 animate-pulse" />
              <div className="h-10 md:h-12 bg-secondary/10 rounded-full w-full animate-pulse mt-6 md:mt-8" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen"><Navbar />
        <div className="container mx-auto px-3 sm:px-4 py-16 md:py-20 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">Product not found</h1>
        </div>
      </div>
    );
  }

  const trustBadges = [
    { icon: Truck, label: "Free Shipping", sub: "On orders over $50" },
    { icon: Shield, label: "Secure Payment", sub: "100% protected" },
    { icon: RotateCcw, label: "Easy Returns", sub: "30-day policy" },
    { icon: Package, label: "Quality Guaranteed", sub: "Authentic products" },
  ];

  // === Shared variant badge section ===
  const VariantBadges = () => (
    <AnimatePresence>
      {(selectedSize || selectedColor) && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground">Selected:</span>
          <AnimatePresence mode="popLayout">
            {selectedSize && (
              <motion.div key="size" layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                <Badge variant="secondary" className="gap-1 pl-2 pr-1 py-0.5 sm:py-1 text-[10px] sm:text-xs">
                  Size: {selectedSize}
                  <button onClick={() => setSelectedSize(null)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"><X className="w-2.5 h-2.5 sm:w-3 sm:h-3" /></button>
                </Badge>
              </motion.div>
            )}
            {selectedColor && (
              <motion.div key="color" layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                <Badge variant="secondary" className="gap-1 pl-1.5 pr-1 py-0.5 sm:py-1 text-[10px] sm:text-xs">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-border/50 inline-block shrink-0" style={{ backgroundColor: selectedColor.toLowerCase() }} />
                  {selectedColor}
                  <button onClick={() => setSelectedColor(null)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"><X className="w-2.5 h-2.5 sm:w-3 sm:h-3" /></button>
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // === Shared product info section ===
  const ProductInfo = ({ sticky = false }: { sticky?: boolean }) => (
    <div className={`space-y-3 sm:space-y-4 md:space-y-5 ${sticky ? "md:sticky md:top-24" : ""}`}>
      {productCat && (
        <motion.span initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="inline-block text-[10px] sm:text-xs font-semibold tracking-[0.15em] sm:tracking-[0.2em] uppercase text-primary">
          {productCat.name}
        </motion.span>
      )}

      <motion.h1 initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className={`font-bold font-display leading-tight ${
          isMobile
            ? "text-xl"
            : layout === "magazine"
              ? "text-4xl md:text-5xl italic"
              : "text-3xl md:text-4xl"
        } ${cfg.textClass}`}>
        {product.name}
      </motion.h1>

      {/* Rating */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center gap-1.5 sm:gap-2">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${i < Math.round(product.avg_rating || 0)
              ? layout === "neon" ? "fill-primary text-primary drop-shadow-[0_0_4px_hsl(var(--primary)/0.6)]" : "fill-primary text-primary"
              : "text-muted-foreground/30"}`} />
          ))}
        </div>
        <span className="text-xs sm:text-sm text-muted-foreground">{product.avg_rating?.toFixed(1) || "0"} ({product.review_count || 0})</span>
      </motion.div>

      {/* Price */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
        <span className={isMobile ? cfg.mobilePriceClass : cfg.priceClass}>{formatPrice(effectivePrice)}</span>
        {product.compare_at_price && (
          <span className="text-sm sm:text-lg text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
        )}
        {discount > 0 && (
          <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
            layout === "neon" ? "bg-primary/20 text-primary border border-primary/30" : "bg-primary/10 text-primary"
          }`}>
            {layout === "neon" && <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-0.5 sm:mr-1" />}
            Save {discount}%
          </span>
        )}
      </motion.div>

      <CurrencyWidget price={effectivePrice} />

      {product.short_description && (
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{product.short_description}</p>
      )}

      {hasVariants && (
        <VariantSelector productId={product.id} selectedSize={selectedSize} selectedColor={selectedColor}
          onSizeChange={setSelectedSize} onColorChange={setSelectedColor} layout={layout === "minimal" ? "minimal" : "premium"} />
      )}

      <VariantBadges />

      {hasVariants && product && (
        <VariantComparison productId={product.id} basePrice={product.price} compareAtPrice={product.compare_at_price}
          productName={product.name} productThumbnail={product.thumbnail} onAddToCart={addVariantToCart} />
      )}

      <ProductActions quantity={quantity} setQuantity={setQuantity} maxQuantity={effectiveStock}
        onAddToCart={addToCart} onBuyNow={buyNow} onToggleWishlist={toggleWishlist}
        addingToCart={addingToCart} inStock={effectiveStock > 0} layout={layout === "minimal" ? "minimal" : "premium"} />

      {effectiveStock === 0 && (
        <NotifyWhenAvailable productId={product.id} variantId={selectedVariant?.id}
          variantLabel={[selectedSize, selectedColor].filter(Boolean).join(" / ") || undefined} />
      )}

      {/* Trust badges */}
      {layout !== "minimal" && (
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-1 sm:pt-2">
          {trustBadges.map((badge) => (
            <div key={badge.label} className={`${cfg.cardClass} rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center gap-1.5 sm:gap-2.5`}>
              <div className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg shrink-0 ${layout === "neon" ? "bg-primary/10 shadow-[0_0_10px_hsl(var(--primary)/0.2)]" : "bg-primary/10"}`}>
                <badge.icon className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${layout === "neon" ? "text-primary drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]" : "text-primary"}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-semibold text-foreground leading-tight truncate">{badge.label}</p>
                <p className="text-[8px] sm:text-[9px] text-muted-foreground leading-tight truncate">{badge.sub}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // === MAGAZINE layout: full-width gallery, then split content ===
  const isMagazine = layout === "magazine";

  return (
    <div className={`min-h-screen ${layout === "dark-luxury" ? "bg-black/20" : ""}`}>
      <Navbar />
      <main className={`container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 ${isMagazine ? "max-w-6xl" : ""}`}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/home" },
            ...(parentCategory ? [{ label: parentCategory.name, href: `/categories/${parentCategory.slug}` }] : []),
            ...(productCat ? [{ label: productCat.name, href: `/categories/${productCat.slug}` }] : []),
            { label: product.name },
          ]}
          className="mb-3 sm:mb-4 md:mb-6"
        />

        {isMagazine ? (
          /* Magazine: Full-width gallery then split content */
          <div className="space-y-6 sm:space-y-8 md:space-y-12">
            {renderGallery()}
            <div className="grid md:grid-cols-5 gap-6 sm:gap-8 md:gap-12">
              <div className="md:col-span-3 space-y-6 sm:space-y-8">
                <ProductInfo />
              </div>
              <div className="md:col-span-2">
                <ProductTabs
                  product={{ id: product.id, description: product.description, specifications: product.specifications as any }}
                  reviews={mergedReviews} ownReviewIds={ownReviewIds} layout="editorial"
                />
              </div>
            </div>
          </div>
        ) : (
          /* All other layouts: side-by-side on desktop, stacked on mobile */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-10">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                {renderGallery()}
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <ProductInfo sticky />
              </motion.div>
            </div>
            <section className="mt-8 sm:mt-12 md:mt-16">
              <ProductTabs
                product={{ id: product.id, description: product.description, specifications: product.specifications as any }}
                reviews={mergedReviews} ownReviewIds={ownReviewIds} layout={layout === "minimal" ? "minimal" : "premium"}
              />
            </section>
          </>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-8 sm:mt-12 md:mt-16">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={`font-bold font-display text-foreground ${layout === "minimal" ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}>
                {layout === "neon" && <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2 text-primary" />}
                You May Also Like
              </h2>
              {productCat && (
                <Link to={`/categories/${productCat.slug}`} className="text-xs sm:text-sm text-primary hover:underline">
                  View all
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              {relatedProducts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                  <ProductCard id={p.id} name={p.name} price={p.price}
                    compareAtPrice={p.compare_at_price ?? undefined} thumbnail={p.thumbnail ?? undefined}
                    avgRating={p.avg_rating ?? undefined} reviewCount={p.review_count ?? undefined} slug={p.slug} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <StickyAddToCart product={{ name: product.name, price: product.price, thumbnail: product.thumbnail, stock_quantity: product.stock_quantity }}
        onAddToCart={addToCart} onBuyNow={buyNow} addingToCart={addingToCart} />
    </div>
  );
};

export default ProductDetailPage;
