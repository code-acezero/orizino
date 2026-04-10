import React, { useRef, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star, Loader2 } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { trackClick } from "@/hooks/use-analytics";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/app-toast";
import QuickViewModal from "@/components/QuickViewModal";

export interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  thumbnail?: string;
  avgRating?: number;
  reviewCount?: number;
  slug: string;
  className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  compareAtPrice,
  thumbnail,
  avgRating = 0,
  reviewCount = 0,
  slug,
  className = "",
}) => {
  const { formatPrice } = useCurrency();
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [addingToCart, setAddingToCart] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  // Check if product has variants
  const { data: hasVariants } = useQuery({
    queryKey: ["product-has-variants", id],
    queryFn: async () => {
      const { count } = await supabase
        .from("product_variants")
        .select("id", { count: "exact", head: true })
        .eq("product_id", id)
        .eq("is_active", true);
      return (count || 0) > 0;
    },
    staleTime: 60000,
  });

  // Check wishlist status on mount
  React.useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || cancelled) return;
      supabase.from("wishlist_items").select("id").eq("user_id", user.id).eq("product_id", id).maybeSingle()
        .then(({ data }) => { if (!cancelled) setInWishlist(!!data); });
    });
    return () => { cancelled = true; };
  }, [id]);

  const handleToggleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in to use wishlist"); return; }
    setTogglingWishlist(true);
    try {
      if (inWishlist) {
        await supabase.from("wishlist_items").delete().eq("user_id", user.id).eq("product_id", id);
        setInWishlist(false);
        toast.success("Removed from wishlist");
      } else {
        await supabase.from("wishlist_items").insert({ user_id: user.id, product_id: id });
        setInWishlist(true);
        toast.success("Added to wishlist");
      }
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    } catch { toast.error("Failed to update wishlist"); }
    finally { setTogglingWishlist(false); }
  }, [id, inWishlist, queryClient]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // If product has variants, open quick view for variant selection
    if (hasVariants) {
      setQuickViewOpen(true);
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in to add items to cart"); return; }
    setAddingToCart(true);
    try {
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", id)
        .is("variant_id", null)
        .maybeSingle();
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: user.id, product_id: id, quantity: 1 });
      }
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success(`${name} added to cart`);
    } catch { toast.error("Failed to add to cart"); }
    finally { setAddingToCart(false); }
  }, [id, name, queryClient, hasVariants]);

  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springCfg = { stiffness: 260, damping: 20 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), springCfg);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), springCfg);
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springCfg);
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springCfg);
  const imgX = useSpring(useTransform(mouseX, [-0.5, 0.5], [10, -10]), { stiffness: 180, damping: 22 });
  const imgY = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 180, damping: 22 });
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [12, -12]), springCfg);
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [12, -12]), springCfg);
  const boxShadow = useTransform(
    [shadowX, shadowY],
    ([sx, sy]) => `${sx}px ${sy}px 30px -8px hsl(var(--primary) / 0.18), ${(sx as number) * 0.5}px ${(sy as number) * 0.5}px 60px -15px hsl(var(--foreground) / 0.1)`
  );
  const innerTop = useSpring(useTransform(mouseY, [-0.5, 0.5], [0.35, 0]), springCfg);
  const innerBottom = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 0.35]), springCfg);
  const innerLeft = useSpring(useTransform(mouseX, [-0.5, 0.5], [0.35, 0]), springCfg);
  const innerRight = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 0.35]), springCfg);
  // Text parallax
  const textX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 200, damping: 24 });
  const textY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-3, 3]), { stiffness: 200, damping: 24 });

  // Pre-compute motion values outside conditional JSX to avoid hooks-in-conditionals error
  const glareBackground = useTransform(
    [glareX, glareY],
    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, hsl(var(--primary) / 0.15) 0%, transparent 60%)`
  );
  const innerBoxShadow = useTransform(
    [innerTop, innerBottom, innerLeft, innerRight],
    ([t, b, l, r]) =>
      `inset 0 ${16 * (t as number)}px ${20 * (t as number)}px -6px hsl(var(--foreground) / ${(t as number) * 0.6}), ` +
      `inset 0 -${16 * (b as number)}px ${20 * (b as number)}px -6px hsl(var(--foreground) / ${(b as number) * 0.6}), ` +
      `inset ${16 * (l as number)}px 0 ${20 * (l as number)}px -6px hsl(var(--foreground) / ${(l as number) * 0.5}), ` +
      `inset -${16 * (r as number)}px 0 ${20 * (r as number)}px -6px hsl(var(--foreground) / ${(r as number) * 0.5})`
  );

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [mouseX, mouseY, isMobile]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={isMobile ? undefined : handleMouseMove}
      onMouseLeave={isMobile ? undefined : handleMouseLeave}
      style={isMobile ? {} : {
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
        boxShadow,
      }}
      whileHover={isMobile ? { y: -4 } : undefined}
      transition={{ duration: 0.3 }}
      className={`group glass rounded-3xl overflow-hidden flex flex-col h-full ${className}`}
    >
      <Link to={`/product/${slug}`} className="flex flex-col flex-1" onClick={() => trackClick("product_card", slug, window.location.pathname, { product_name: name })}>
        {/* Image with parallax offset + 3D box effect */}
        <div
          className="relative aspect-square overflow-hidden bg-secondary/20 cursor-zoom-in"
          style={isMobile ? {} : { transformStyle: "preserve-3d" }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickViewOpen(true); }}
        >
          <motion.img
            src={thumbnail || "/placeholder.svg"}
            alt={name}
            style={isMobile ? {} : { x: imgX, y: imgY, scale: 1.12 }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 pointer-events-none"
            loading="lazy"
          />
          {!isMobile && (
            <>
              {/* Glare overlay */}
              <motion.div
                className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: glareBackground }}
              />
              {/* 3D box inner edge shadows */}
              <motion.div
                className="pointer-events-none absolute inset-0 z-[11] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ boxShadow: innerBoxShadow }}
              />
            </>
          )}
          {discount > 0 && (
            <span className="absolute top-3 left-3 btn-pill bg-destructive text-destructive-foreground text-xs py-1 px-3 z-20">
              -{discount}%
            </span>
          )}
          {/* Quick actions */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleWishlist}
              disabled={togglingWishlist}
              className={`glass rounded-full p-2 transition-colors ${inWishlist ? "text-destructive" : "text-foreground hover:text-primary"}`}
            >
              <Heart className={`w-4 h-4 ${inWishlist ? "fill-destructive" : ""}`} />
            </motion.button>
          </div>
        </div>

        {/* Info with parallax depth */}
        <motion.div
          className="p-4 flex flex-col flex-1"
          style={isMobile ? {} : { x: textX, y: textY, translateZ: 30 }}
        >
          <h3 className="font-medium text-foreground text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.round(avgRating)
                    ? "fill-primary text-primary"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
            <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>
          </div>
          <div className="flex items-center gap-2 mt-auto lg:flex-row lg:items-center flex-col items-center">
            <span className="font-bold text-foreground group-hover:animate-[priceGlow_1.5s_ease-in-out_infinite] transition-all duration-300 text-sm lg:text-base"
              style={{ textShadow: 'none' }}
            >
              {formatPrice(price)}
            </span>
            {compareAtPrice && (
              <span className="text-xs lg:text-sm text-muted-foreground line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>
          {/* Floating Add to Cart */}
          <motion.button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-xs font-semibold
              translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
              transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              hover:brightness-110 active:scale-95 disabled:opacity-70"
          >
            {addingToCart ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShoppingCart className="w-3.5 h-3.5" />}
            {addingToCart ? "Adding..." : "Add to Cart"}
          </motion.button>
        </motion.div>
      </Link>
      <QuickViewModal productId={id} open={quickViewOpen} onOpenChange={setQuickViewOpen} />
    </motion.div>
  );
};

export default ProductCard;
