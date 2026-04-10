import React, { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { X, Star, ShoppingCart, Heart, Loader2, ChevronLeft, ChevronRight, ExternalLink, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ZoomableImage from "@/components/product/ZoomableImage";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "@/lib/app-toast";

interface QuickViewModalProps {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ productId, open, onOpenChange }) => {
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [currentImg, setCurrentImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["quick-view", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
      return data;
    },
    enabled: open && !!productId,
  });

  const { data: variants } = useQuery({
    queryKey: ["quick-view-variants", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("sort_order");
      return data || [];
    },
    enabled: open && !!productId,
  });

  const images = product?.images?.length ? product.images : product?.thumbnail ? [product.thumbnail] : ["/placeholder.svg"];
  const sizes = [...new Set(variants?.filter(v => v.size).map(v => v.size!))];
  const colors = [...new Set(variants?.filter(v => v.color).map(v => v.color!))];
  const discount = product?.compare_at_price
    ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
    : 0;

  const handleAddToCart = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Please sign in to add items to cart"); return; }
    setAddingToCart(true);
    try {
      const matchedVariant = variants?.find(v =>
        (!selectedSize || v.size === selectedSize) && (!selectedColor || v.color === selectedColor)
      );
      let query = supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("user_id", user.id)
        .eq("product_id", productId);
      if (matchedVariant?.id) {
        query = query.eq("variant_id", matchedVariant.id);
      } else {
        query = query.is("variant_id", null);
      }
      const { data: existing } = await query.maybeSingle();
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: productId,
          quantity,
          variant_id: matchedVariant?.id ?? null,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
      toast.success(`${product?.name} added to cart`);
    } catch { toast.error("Failed to add to cart"); }
    finally { setAddingToCart(false); }
  }, [productId, product?.name, quantity, selectedSize, selectedColor, variants, queryClient]);

  const nextImg = () => setCurrentImg(i => (i + 1) % images.length);
  const prevImg = () => setCurrentImg(i => (i - 1 + images.length) % images.length);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl rounded-2xl max-h-[90vh]">
        {isLoading || !product ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image gallery */}
            <div className="relative aspect-square bg-secondary/10 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImg}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="w-full h-full"
                >
                  <ZoomableImage
                    src={images[currentImg]}
                    alt={product.name}
                    className="w-full h-full"
                    zoomScale={2.5}
                  />
                </motion.div>
              </AnimatePresence>
              {/* Zoom hint */}
              <div className="absolute top-3 right-3 glass rounded-full p-1.5 opacity-50 pointer-events-none z-10">
                <Search className="w-3 h-3 text-foreground" />
              </div>
              {images.length > 1 && (
                <>
                  <button onClick={prevImg} className="absolute left-2 top-1/2 -translate-y-1/2 glass rounded-full p-1.5 text-foreground hover:text-primary z-10">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button onClick={nextImg} className="absolute right-2 top-1/2 -translate-y-1/2 glass rounded-full p-1.5 text-foreground hover:text-primary z-10">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
              {discount > 0 && (
                <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs py-1 px-3 rounded-full font-semibold z-10">
                  -{discount}%
                </span>
              )}
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                        i === currentImg ? "border-primary scale-110" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product details */}
            <div className="p-6 flex flex-col max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-bold text-foreground mb-1 leading-tight">{product.name}</h2>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.avg_rating || 0) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
                ))}
                <span className="text-xs text-muted-foreground ml-1">({product.review_count || 0})</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-foreground">{formatPrice(product.price)}</span>
                {product.compare_at_price && (
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>
                )}
              </div>

              {/* Description */}
              {product.short_description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{product.short_description}</p>
              )}

              {/* Sizes */}
              {sizes.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-foreground mb-2">Size</p>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedSize(selectedSize === s ? null : s)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                          selectedSize === s
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              {colors.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-foreground mb-2">Color</p>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedColor(selectedColor === c ? null : c)}
                        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                          selectedColor === c
                            ? "border-primary bg-primary/10 text-primary font-semibold"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-foreground mb-2">Quantity</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-secondary/50"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-semibold text-foreground">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-foreground hover:bg-secondary/50"
                  >
                    +
                  </button>
                  <span className="text-xs text-muted-foreground ml-2">
                    {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-4">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleAddToCart}
                  disabled={addingToCart || product.stock_quantity === 0}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold
                    hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {addingToCart ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                  {addingToCart ? "Adding..." : "Add to Cart"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="w-12 h-12 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                >
                  <Heart className="w-4 h-4" />
                </motion.button>
              </div>

              {/* View full page link */}
              <Link
                to={`/product/${product.slug}`}
                onClick={() => onOpenChange(false)}
                className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View full details
              </Link>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewModal;
