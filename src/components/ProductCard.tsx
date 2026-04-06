import React, { useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Star } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { trackClick } from "@/hooks/use-analytics";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useIsMobile } from "@/hooks/use-mobile";

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
  // Text parallax — floats toward the viewer
  const textX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), { stiffness: 200, damping: 24 });
  const textY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-3, 3]), { stiffness: 200, damping: 24 });

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
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={isMobile ? {} : {
        rotateX,
        rotateY,
        transformPerspective: 800,
        transformStyle: "preserve-3d",
        boxShadow,
      }}
      whileHover={isMobile ? { y: -4 } : undefined}
      transition={{ duration: 0.3 }}
      className={`group glass rounded-3xl overflow-hidden will-change-transform ${className}`}
    >
      <Link to={`/product/${slug}`} className="block" onClick={() => trackClick("product_card", slug, window.location.pathname, { product_name: name })}>
        {/* Image with parallax offset + 3D box effect */}
        <div className="relative aspect-square overflow-hidden bg-secondary/20" style={isMobile ? {} : { transformStyle: "preserve-3d" }}>
          <motion.img
            src={thumbnail || "/placeholder.svg"}
            alt={name}
            style={isMobile ? {} : { x: imgX, y: imgY, scale: 1.12 }}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          {!isMobile && (
            <>
              {/* Glare overlay */}
              <motion.div
                className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background: useTransform(
                    [glareX, glareY],
                    ([gx, gy]) => `radial-gradient(circle at ${gx}% ${gy}%, hsl(var(--primary) / 0.15) 0%, transparent 60%)`
                  ),
                }}
              />
              {/* 3D box inner edge shadows */}
              <motion.div
                className="pointer-events-none absolute inset-0 z-[11] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  boxShadow: useTransform(
                    [innerTop, innerBottom, innerLeft, innerRight],
                    ([t, b, l, r]) =>
                      `inset 0 ${16 * (t as number)}px ${20 * (t as number)}px -6px hsl(var(--foreground) / ${(t as number) * 0.6}), ` +
                      `inset 0 -${16 * (b as number)}px ${20 * (b as number)}px -6px hsl(var(--foreground) / ${(b as number) * 0.6}), ` +
                      `inset ${16 * (l as number)}px 0 ${20 * (l as number)}px -6px hsl(var(--foreground) / ${(l as number) * 0.5}), ` +
                      `inset -${16 * (r as number)}px 0 ${20 * (r as number)}px -6px hsl(var(--foreground) / ${(r as number) * 0.5})`
                  ),
                }}
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
              className="glass rounded-full p-2 text-foreground hover:text-primary"
            >
              <Heart className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="glass rounded-full p-2 text-foreground hover:text-primary"
            >
              <ShoppingCart className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Info — floats above card surface with parallax */}
        <motion.div
          className="p-4"
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
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground group-hover:animate-[priceGlow_1.5s_ease-in-out_infinite] transition-all duration-300"
              style={{ textShadow: 'none' }}
            >
              {formatPrice(price)}
            </span>
            {compareAtPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>
          {/* Floating Add to Cart */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 20, opacity: 0 }}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-2.5 text-xs font-semibold
              translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
              transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              hover:brightness-110 active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add to Cart
          </motion.button>
        </motion.div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
