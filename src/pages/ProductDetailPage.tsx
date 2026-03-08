import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Shield, Truck, RotateCcw, Package, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/app-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useProductSeoMeta } from "@/hooks/use-product-seo-meta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ImageGallery from "@/components/product/ImageGallery";
import ProductTabs from "@/components/product/ProductTabs";
import ProductActions from "@/components/product/ProductActions";
import CurrencyWidget from "@/components/product/CurrencyWidget";
import StickyAddToCart from "@/components/product/StickyAddToCart";
import VariantSelector from "@/components/product/VariantSelector";
import VariantComparison from "@/components/product/VariantComparison";
import NotifyWhenAvailable from "@/components/product/NotifyWhenAvailable";
import { Badge } from "@/components/ui/badge";

type LayoutStyle = "minimal" | "premium" | "editorial";

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  // Fetch product page layout setting
  const { data: layoutStyle } = useQuery<LayoutStyle>({
    queryKey: ["product-page-layout"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "product_page_layout")
        .maybeSingle();
      const val = (data?.value as any)?.value ?? data?.value;
      return (val as LayoutStyle) || "premium";
    },
  });
  const layout: LayoutStyle = layoutStyle || "premium";

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

  const { data: reviews } = useQuery<{ id: string; product_id: string; rating: number; title: string | null; comment: string | null; created_at: string; is_approved?: boolean }[]>({
    queryKey: ["reviews", product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("public_reviews" as any)
        .select("id, product_id, rating, title, comment, created_at, is_approved")
        .eq("product_id", product!.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      return (data as any) || [];
    },
    enabled: !!product?.id,
  });

  const { data: ownReviews } = useQuery<{ id: string; product_id: string; rating: number; title: string | null; comment: string | null; created_at: string; is_approved: boolean }[]>({
    queryKey: ["own-reviews", product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id, product_id, rating, title, comment, created_at, is_approved")
        .eq("product_id", product!.id)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []) as any;
    },
    enabled: !!product?.id && !!user,
  });

  const ownReviewIds = new Set((ownReviews || []).map((r) => r.id));
  const pendingOwnReviews = (ownReviews || []).filter((r) => !r.is_approved);
  const mergedReviews = [...pendingOwnReviews, ...(reviews || [])].filter(
    (r, i, arr) => arr.findIndex((x) => x.id === r.id) === i
  );

  const { data: relatedProducts } = useQuery({
    queryKey: ["related-products", product?.category_id, product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("category_id", product!.category_id!)
        .eq("is_active", true)
        .neq("id", product!.id)
        .order("avg_rating", { ascending: false })
        .limit(4);
      return data || [];
    },
    enabled: !!product?.category_id && !!product?.id,
  });

  // Fetch variants for stock-aware selection
  const { data: variants = [] } = useQuery({
    queryKey: ["product-variants", product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_variants")
        .select("id, size, color, stock_quantity, price_override, is_active, image_url")
        .eq("product_id", product!.id)
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    enabled: !!product?.id,
  });

  const hasVariants = variants.length > 0;
  const effectiveStock = hasVariants
    ? (() => {
        const match = variants.find(
          (v) => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor)
        );
        if (selectedSize || selectedColor) return match?.stock_quantity ?? 0;
        return variants.reduce((sum, v) => sum + v.stock_quantity, 0);
      })()
    : product?.stock_quantity ?? 0;

  const selectedVariant = hasVariants
    ? variants.find(
        (v) => (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor)
      )
    : null;
  const effectivePrice = selectedVariant?.price_override ?? product?.price ?? 0;

  // Build images: if a color is selected and variants have images for that color, show those first
  const baseImages = product?.images?.length ? product.images : [product?.thumbnail || "/placeholder.svg"];
  const variantImages = selectedColor
    ? variants
        .filter((v) => v.color === selectedColor && (v as any).image_url)
        .map((v) => (v as any).image_url as string)
    : [];
  const images = variantImages.length > 0 ? [...variantImages, ...baseImages] : baseImages;
  const discount = product?.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const addToCart = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to add items to cart.", variant: "destructive" });
      return;
    }
    if (!product) return;
    setAddingToCart(true);
    const variantId = selectedVariant?.id || null;
    let query = supabase
      .from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", product.id);
    if (variantId) {
      query = query.eq("variant_id", variantId);
    } else {
      query = query.is("variant_id", null);
    }
    const { data: existing } = await query.maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity, variant_id: variantId } as any);
    }
    setAddingToCart(false);
    const variantLabel = [selectedSize, selectedColor].filter(Boolean).join(" / ");
    toast({ title: "Added to cart!", description: `${product.name}${variantLabel ? ` (${variantLabel})` : ""} x${quantity}` });
  };

  const addVariantToCart = async (variantId: string, variantLabel: string) => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to add items to cart.", variant: "destructive" });
      return;
    }
    if (!product) return;
    const query = supabase
      .from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", product.id).eq("variant_id", variantId);
    const { data: existing } = await query.maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: 1, variant_id: variantId } as any);
    }
    toast({ title: "Added to cart!", description: `${product.name}${variantLabel ? ` (${variantLabel})` : ""} x1` });
  };

  const buyNow = async () => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }
    if (!product) return;
    setAddingToCart(true);
    const variantId = selectedVariant?.id || null;
    let query = supabase
      .from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", product.id);
    if (variantId) {
      query = query.eq("variant_id", variantId);
    } else {
      query = query.is("variant_id", null);
    }
    const { data: existing } = await query.maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: quantity }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity, variant_id: variantId } as any);
    }
    setAddingToCart(false);
    navigate("/checkout");
  };

  const toggleWishlist = async () => {
    if (!user) { toast({ title: "Please sign in", variant: "destructive" }); return; }
    if (!product) return;
    const { data: existing } = await supabase
      .from("wishlist_items").select("id").eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
    if (existing) {
      await supabase.from("wishlist_items").delete().eq("id", existing.id);
      toast({ title: "Removed from wishlist" });
    } else {
      await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: product.id });
      toast({ title: "Added to wishlist!" });
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-10">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square rounded-3xl bg-secondary/20 animate-pulse" />
            <div className="space-y-4">
              <div className="h-8 bg-secondary/20 rounded-full w-3/4 animate-pulse" />
              <div className="h-4 bg-secondary/20 rounded-full w-1/2 animate-pulse" />
              <div className="h-10 bg-secondary/20 rounded-full w-1/3 animate-pulse" />
              <div className="h-12 bg-secondary/20 rounded-full w-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Product not found</h1>
        </div>
      </div>
    );
  }

  const isMinimal = layout === "minimal";
  const isEditorial = layout === "editorial";

  const trustBadges = [
    { icon: Truck, label: "Free Shipping", sub: "On orders over $50" },
    { icon: Shield, label: "Secure Payment", sub: "100% protected" },
    { icon: RotateCcw, label: "Easy Returns", sub: "30-day policy" },
    { icon: Package, label: "Quality Guaranteed", sub: "Authentic products" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className={`container mx-auto px-4 py-8 ${isEditorial ? "max-w-6xl" : ""}`}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/home" },
            ...(parentCategory ? [{ label: parentCategory.name, href: `/categories/${parentCategory.slug}` }] : []),
            ...(productCat ? [{ label: productCat.name, href: `/categories/${productCat.slug}` }] : []),
            { label: product.name },
          ]}
          className="mb-6"
        />

        {/* ===== EDITORIAL LAYOUT ===== */}
        {isEditorial && (
          <div className="space-y-12">
            {/* Full-width hero image */}
            <ImageGallery key={selectedColor || "default"} images={images} productName={product.name} discount={discount} layout="editorial" />

            {/* Content below */}
            <div className="grid md:grid-cols-5 gap-10">
              <div className="md:col-span-3 space-y-8">
                {productCat && <span className="text-sm text-primary font-medium tracking-wider uppercase">{productCat.name}</span>}
                <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground leading-tight">{product.name}</h1>
                {product.short_description && <p className="text-lg text-muted-foreground leading-relaxed">{product.short_description}</p>}

                <ProductTabs
                  product={{ id: product.id, description: product.description, specifications: product.specifications as any }}
                  reviews={mergedReviews}
                  ownReviewIds={ownReviewIds}
                  layout="editorial"
                />
              </div>

              <div className="md:col-span-2 space-y-6">
                <div className="sticky top-24 space-y-6">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-5 h-5 ${i < Math.round(product.avg_rating || 0) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">({product.review_count || 0})</span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-bold text-gradient">{formatPrice(effectivePrice)}</span>
                    {product.compare_at_price && (
                      <span className="text-xl text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
                    )}
                  </div>

                  <CurrencyWidget price={effectivePrice} />

                  {hasVariants && product && (
                    <VariantSelector
                      productId={product.id}
                      selectedSize={selectedSize}
                      selectedColor={selectedColor}
                      onSizeChange={setSelectedSize}
                      onColorChange={setSelectedColor}
                      layout="editorial"
                    />
                   )}

                  {/* Selected variant badge */}
                  {(selectedSize || selectedColor) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-muted-foreground">Selected:</span>
                      {selectedSize && (
                        <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1">
                          Size: {selectedSize}
                          <button onClick={() => setSelectedSize(null)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"><X className="w-3 h-3" /></button>
                        </Badge>
                      )}
                      {selectedColor && (
                        <Badge variant="secondary" className="gap-1.5 pl-2 pr-1.5 py-1">
                          <span className="w-3 h-3 rounded-full border border-border/50 inline-block shrink-0" style={{ backgroundColor: selectedColor.toLowerCase() }} />
                          {selectedColor}
                          <button onClick={() => setSelectedColor(null)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"><X className="w-3 h-3" /></button>
                        </Badge>
                      )}
                    </div>
                  )}

                  {hasVariants && product && (
                    <VariantComparison
                      productId={product.id}
                      basePrice={product.price}
                      compareAtPrice={product.compare_at_price}
                      productName={product.name}
                      productThumbnail={product.thumbnail}
                      onAddToCart={addVariantToCart}
                    />
                  )}

                  <ProductActions
                    quantity={quantity} setQuantity={setQuantity} maxQuantity={effectiveStock}
                    onAddToCart={addToCart} onBuyNow={buyNow} onToggleWishlist={toggleWishlist}
                    addingToCart={addingToCart} inStock={effectiveStock > 0} layout="editorial"
                  />

                  {effectiveStock === 0 && (
                    <NotifyWhenAvailable
                      productId={product.id}
                      variantId={selectedVariant?.id}
                      variantLabel={[selectedSize, selectedColor].filter(Boolean).join(" / ") || undefined}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MINIMAL & PREMIUM LAYOUT ===== */}
        {!isEditorial && (
          <>
            <div className="grid md:grid-cols-2 gap-10">
              <ImageGallery key={selectedColor || "default"} images={images} productName={product.name} discount={discount} layout={layout} />

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                {productCat && (
                  <span className={`text-sm ${isMinimal ? "text-muted-foreground tracking-widest uppercase font-light" : "text-primary font-medium"}`}>
                    {productCat.name}
                  </span>
                )}
                <h1 className={`font-bold font-display text-foreground ${isMinimal ? "text-3xl md:text-5xl tracking-tight" : "text-3xl md:text-4xl"}`}>
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-5 h-5 ${i < Math.round(product.avg_rating || 0) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {product.avg_rating?.toFixed(1) || "0"} ({product.review_count || 0} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className={`font-bold ${isMinimal ? "text-3xl text-foreground" : "text-4xl text-gradient"}`}>
                    {formatPrice(effectivePrice)}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-xl text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
                  )}
                  {discount > 0 && !isMinimal && (
                    <span className="text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      Save {discount}%
                    </span>
                  )}
                </div>

                <CurrencyWidget price={effectivePrice} />

                {product.short_description && (
                  <p className={`${isMinimal ? "text-muted-foreground text-base" : "text-muted-foreground"}`}>{product.short_description}</p>
                )}

                {hasVariants && (
                  <VariantSelector
                    productId={product.id}
                    selectedSize={selectedSize}
                    selectedColor={selectedColor}
                    onSizeChange={setSelectedSize}
                    onColorChange={setSelectedColor}
                    layout={layout}
                  />
                )}

                {/* Selected variant badge */}
                {(selectedSize || selectedColor) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">Selected:</span>
                    {selectedSize && (
                      <Badge variant="secondary" className="gap-1 pl-2.5 pr-1.5 py-1">
                        Size: {selectedSize}
                        <button onClick={() => setSelectedSize(null)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"><X className="w-3 h-3" /></button>
                      </Badge>
                    )}
                    {selectedColor && (
                      <Badge variant="secondary" className="gap-1.5 pl-2 pr-1.5 py-1">
                        <span className="w-3 h-3 rounded-full border border-border/50 inline-block shrink-0" style={{ backgroundColor: selectedColor.toLowerCase() }} />
                        {selectedColor}
                        <button onClick={() => setSelectedColor(null)} className="ml-0.5 rounded-full hover:bg-foreground/10 p-0.5"><X className="w-3 h-3" /></button>
                      </Badge>
                    )}
                  </div>
                )}

                {hasVariants && product && (
                  <VariantComparison
                    productId={product.id}
                    basePrice={product.price}
                    compareAtPrice={product.compare_at_price}
                    productName={product.name}
                    productThumbnail={product.thumbnail}
                    onAddToCart={addVariantToCart}
                  />
                )}

                <ProductActions
                  quantity={quantity} setQuantity={setQuantity} maxQuantity={effectiveStock}
                  onAddToCart={addToCart} onBuyNow={buyNow} onToggleWishlist={toggleWishlist}
                  addingToCart={addingToCart} inStock={effectiveStock > 0} layout={layout}
                />

                {effectiveStock === 0 && (
                  <NotifyWhenAvailable
                    productId={product.id}
                    variantId={selectedVariant?.id}
                    variantLabel={[selectedSize, selectedColor].filter(Boolean).join(" / ") || undefined}
                  />
                )}

                {/* Trust badges (premium only) */}
                {!isMinimal && (
                  <div className="grid grid-cols-2 gap-3">
                    {trustBadges.map((badge) => (
                      <div key={badge.label} className="glass rounded-2xl p-3 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary/10">
                          <badge.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{badge.label}</p>
                          <p className="text-[10px] text-muted-foreground">{badge.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Tabs section */}
            <section className="mt-16">
              <ProductTabs
                product={{ id: product.id, description: product.description, specifications: product.specifications as any }}
                reviews={mergedReviews}
                ownReviewIds={ownReviewIds}
                layout={layout}
              />
            </section>
          </>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`font-bold font-display text-foreground ${isMinimal ? "text-xl" : "text-2xl"}`}>You May Also Like</h2>
              {productCat && (
                <Link to={`/categories/${productCat.slug}`} className="text-sm text-primary hover:underline">
                  View all in {productCat.name} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <ProductCard
                    id={p.id} name={p.name} price={p.price}
                    compareAtPrice={p.compare_at_price ?? undefined}
                    thumbnail={p.thumbnail ?? undefined}
                    avgRating={p.avg_rating ?? undefined}
                    reviewCount={p.review_count ?? undefined}
                    slug={p.slug}
                  />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />

      {/* Sticky Add to Cart Bar */}
      <StickyAddToCart
        product={{ name: product.name, price: product.price, thumbnail: product.thumbnail, stock_quantity: product.stock_quantity }}
        onAddToCart={addToCart}
        onBuyNow={buyNow}
        addingToCart={addingToCart}
      />
    </div>
  );
};

export default ProductDetailPage;
