import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingCart, Minus, Plus, ChevronLeft, ChevronRight, Check, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/app-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useProductSeoMeta } from "@/hooks/use-product-seo-meta";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import ReviewForm from "@/components/ReviewForm";

const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { formatPrice, currency, setCurrency, enabledCurrencies, config } = useCurrency();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

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

  // Apply SEO metadata for product detail page
  useProductSeoMeta(product);

  // Fetch parent category for breadcrumbs
  const productCat = product?.categories as any;
  const { data: parentCategory } = useQuery({
    queryKey: ["parent-category", productCat?.parent_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("name, slug")
        .eq("id", productCat.parent_id)
        .single();
      return data;
    },
    enabled: !!productCat?.parent_id,
  });
  const { data: reviews } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", product!.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!product?.id,
  });

  // Fetch related products from same category
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
  const images = product?.images?.length ? product.images : [product?.thumbnail || "/placeholder.svg"];
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

    // Check if already in cart
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity });
    }

    setAddingToCart(false);
    toast({ title: "Added to cart!", description: `${product.name} x${quantity}` });
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }
    if (!product) return;

    const { data: existing } = await supabase
      .from("wishlist_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();

    if (existing) {
      await supabase.from("wishlist_items").delete().eq("id", existing.id);
      toast({ title: "Removed from wishlist" });
    } else {
      await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: product.id });
      toast({ title: "Added to wishlist!" });
    }
  };

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

  const specs = product.specifications as Record<string, string> | null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/home" },
            ...(parentCategory ? [{ label: parentCategory.name, href: `/categories/${parentCategory.slug}` }] : []),
            ...(productCat
              ? [{ label: productCat.name, href: `/categories/${productCat.slug}` }]
              : []),
            { label: product.name },
          ]}
          className="mb-6"
        />
        <div className="grid md:grid-cols-2 gap-10">
          {/* Image Gallery */}
          <div>
            <div className="relative aspect-square rounded-3xl overflow-hidden glass mb-4">
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImage((p) => (p - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 glass rounded-full p-2 text-foreground hover:text-primary">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={() => setSelectedImage((p) => (p + 1) % images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 glass rounded-full p-2 text-foreground hover:text-primary">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {discount > 0 && (
                <span className="absolute top-4 left-4 btn-pill bg-destructive text-destructive-foreground text-sm py-1 px-4">-{discount}%</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-colors ${i === selectedImage ? "border-primary" : "border-transparent"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {product.categories && (
              <span className="text-sm text-primary">{(product.categories as any).name}</span>
            )}
            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.round(product.avg_rating || 0) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">({product.review_count || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-foreground">{formatPrice(product.price)}</span>
              {product.compare_at_price && (
                <span className="text-xl text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
              )}
            </div>

            {/* Currency converter widget */}
            {enabledCurrencies.length > 1 && (
              <div className="rounded-2xl border border-border/50 bg-secondary/20 p-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5" /> Price in other currencies
                </p>
                <div className="flex flex-wrap gap-2">
                  {enabledCurrencies
                    .filter((c) => c.code !== currency)
                    .map((c) => {
                      const rate = config.exchange_rates[c.code];
                      if (!rate && c.code !== config.default_currency) return null;
                      const converted = c.code === config.default_currency ? product.price : product.price * rate;
                      const noDecimal = ["JPY", "KRW", "VND", "IRR"].includes(c.code);
                      return (
                        <button
                          key={c.code}
                          onClick={() => setCurrency(c.code)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-sm"
                        >
                          <span className="font-display">{c.symbol}</span>
                          <span className="text-foreground font-medium">
                            {converted.toLocaleString(undefined, { minimumFractionDigits: noDecimal ? 0 : 2, maximumFractionDigits: noDecimal ? 0 : 2 })}
                          </span>
                          <span className="text-muted-foreground text-xs">{c.code}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {product.short_description && <p className="text-muted-foreground">{product.short_description}</p>}

            {/* Stock */}
            <div className="flex items-center gap-2 text-sm">
              {product.stock_quantity > 0 ? (
                <><Check className="w-4 h-4 text-primary" /><span className="text-primary">In Stock ({product.stock_quantity} available)</span></>
              ) : (
                <span className="text-destructive">Out of Stock</span>
              )}
            </div>

            {/* Quantity + Actions */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 glass rounded-full px-2 py-1">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 rounded-full hover:bg-secondary/50"><Minus className="w-4 h-4" /></button>
                <span className="w-8 text-center font-medium text-foreground">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="p-2 rounded-full hover:bg-secondary/50"><Plus className="w-4 h-4" /></button>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addToCart}
                disabled={addingToCart || product.stock_quantity === 0}
                className="flex-1 btn-pill bg-gradient-primary text-primary-foreground font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addingToCart ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><ShoppingCart className="w-5 h-5" /> Add to Cart</>}
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={toggleWishlist} className="p-3 glass rounded-full text-foreground hover:text-primary">
                <Heart className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="glass-strong rounded-3xl p-6">
                <h3 className="font-display font-semibold text-foreground mb-3">Description</h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Specifications */}
            {specs && Object.keys(specs).length > 0 && (
              <div className="glass-strong rounded-3xl p-6">
                <h3 className="font-display font-semibold text-foreground mb-3">Specifications</h3>
                <div className="space-y-2">
                  {Object.entries(specs).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="text-foreground font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Reviews */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold font-display text-foreground mb-6">Customer Reviews</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <ReviewForm productId={product.id} />
          </div>
          {reviews && reviews.length > 0 && (
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="glass rounded-3xl p-6">
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                  {review.title && <h4 className="font-semibold text-foreground mb-1">{review.title}</h4>}
                  {review.comment && <p className="text-muted-foreground text-sm">{review.comment}</p>}
                  <p className="text-xs text-muted-foreground/60 mt-3">{new Date(review.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-display text-foreground">You May Also Like</h2>
              {productCat && (
                <Link to={`/categories/${productCat.slug}`} className="text-sm text-primary hover:underline">
                  View all in {productCat.name} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <ProductCard
                    id={p.id}
                    name={p.name}
                    price={p.price}
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
    </div>
  );
};

export default ProductDetailPage;
