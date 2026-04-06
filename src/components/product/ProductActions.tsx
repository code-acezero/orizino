import React from "react";
import { motion } from "framer-motion";
import { ShoppingCart, Heart, Minus, Plus, Zap, Share2, Check } from "lucide-react";
import { toast } from "@/lib/app-toast";

interface ProductActionsProps {
  quantity: number;
  setQuantity: (q: number) => void;
  maxQuantity: number;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onToggleWishlist: () => void;
  addingToCart: boolean;
  inStock: boolean;
  layout?: "minimal" | "premium" | "editorial";
}

const ProductActions: React.FC<ProductActionsProps> = ({
  quantity, setQuantity, maxQuantity, onAddToCart, onBuyNow, onToggleWishlist, addingToCart, inStock, layout = "premium",
}) => {
  const isMinimal = layout === "minimal";

  const handleShare = async () => {
    try {
      await navigator.share({ url: window.location.href, title: document.title });
    } catch {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!" });
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Stock indicator */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
        {inStock ? (
          <>
            <span className="flex items-center gap-1 sm:gap-1.5 text-primary">
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              In Stock
            </span>
            {maxQuantity <= 10 && (
              <span className="text-amber-500 dark:text-amber-400 text-[10px] sm:text-xs font-medium">
                Only {maxQuantity} left!
              </span>
            )}
          </>
        ) : (
          <span className="text-destructive font-medium">Out of Stock</span>
        )}
      </div>

      {/* ── Mobile / Tablet: two rows ── */}
      <div className="lg:hidden space-y-2">
        {/* Row 1: Quantity + Wishlist + Share */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`flex items-center gap-0.5 sm:gap-1 px-1 sm:px-1.5 py-0.5 sm:py-1 shrink-0 ${isMinimal ? "border border-border rounded-lg" : "glass rounded-full"}`}>
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1 sm:p-1.5 rounded-full hover:bg-secondary/50">
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <span className="w-6 sm:w-7 text-center font-semibold text-foreground text-xs sm:text-sm">{quantity}</span>
            <button onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))} className="p-1 sm:p-1.5 rounded-full hover:bg-secondary/50">
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
          <div className="flex-1" />
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onToggleWishlist}
            className={`p-2 sm:p-2.5 shrink-0 text-foreground hover:text-primary ${isMinimal ? "border border-border rounded-lg" : "glass rounded-full"}`}>
            <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleShare}
            className={`p-2 sm:p-2.5 shrink-0 text-foreground hover:text-primary ${isMinimal ? "border border-border rounded-lg" : "glass rounded-full"}`}>
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </motion.button>
        </div>
        {/* Row 2: Add to Cart + Buy Now */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onAddToCart} disabled={addingToCart || !inStock}
            className={`flex-1 min-w-0 font-semibold py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm disabled:opacity-50 ${
              isMinimal ? "bg-foreground text-background rounded-lg" : "btn-pill bg-gradient-primary text-primary-foreground"
            }`}>
            {addingToCart ? (
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <><ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="truncate">Add to Cart</span></>
            )}
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onBuyNow} disabled={!inStock}
            className={`flex-1 min-w-0 font-semibold py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm disabled:opacity-50 ${
              isMinimal ? "border border-border rounded-lg text-foreground hover:bg-secondary/30" : "btn-pill glass-strong text-foreground hover:border-primary/30"
            }`}>
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" /><span className="truncate">Buy Now</span>
          </motion.button>
        </div>
      </div>

      {/* ── Desktop: single row ── */}
      <div className="hidden lg:flex items-center gap-2">
        <div className={`flex items-center gap-1 px-1.5 py-1 shrink-0 ${isMinimal ? "border border-border rounded-lg" : "glass rounded-full"}`}>
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-1.5 rounded-full hover:bg-secondary/50">
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-7 text-center font-semibold text-foreground text-sm">{quantity}</span>
          <button onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))} className="p-1.5 rounded-full hover:bg-secondary/50">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onAddToCart} disabled={addingToCart || !inStock}
          className={`flex-1 min-w-0 font-semibold py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${
            isMinimal ? "bg-foreground text-background rounded-lg" : "btn-pill bg-gradient-primary text-primary-foreground"
          }`}>
          {addingToCart ? (
            <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <><ShoppingCart className="w-4 h-4" /><span className="truncate">Add to Cart</span></>
          )}
        </motion.button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onBuyNow} disabled={!inStock}
          className={`flex-1 min-w-0 font-semibold py-2.5 flex items-center justify-center gap-2 text-sm disabled:opacity-50 ${
            isMinimal ? "border border-border rounded-lg text-foreground hover:bg-secondary/30" : "btn-pill glass-strong text-foreground hover:border-primary/30"
          }`}>
          <Zap className="w-4 h-4" /><span className="truncate">Buy Now</span>
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onToggleWishlist}
          className={`p-2.5 shrink-0 text-foreground hover:text-primary ${isMinimal ? "border border-border rounded-lg" : "glass rounded-full"}`}>
          <Heart className="w-4 h-4" />
        </motion.button>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleShare}
          className={`p-2.5 shrink-0 text-foreground hover:text-primary ${isMinimal ? "border border-border rounded-lg" : "glass rounded-full"}`}>
          <Share2 className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};

export default ProductActions;
