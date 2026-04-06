import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Zap } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface StickyAddToCartProps {
  product: {
    name: string;
    price: number;
    thumbnail?: string | null;
    stock_quantity: number;
  };
  onAddToCart: () => void;
  onBuyNow: () => void;
  addingToCart: boolean;
}

const StickyAddToCart: React.FC<StickyAddToCartProps> = ({ product, onAddToCart, onBuyNow, addingToCart }) => {
  const { formatPrice } = useCurrency();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed left-0 right-0 z-[49] glass-strong border-t border-border/50 rounded-t-none bottom-16 lg:bottom-0 lg:z-50"
          id="sticky-add-to-cart"
        >
          <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-4">
            {product.thumbnail && (
              <img src={product.thumbnail} alt="" className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl object-cover shrink-0 hidden sm:block" />
            )}
            <div className="flex-1 min-w-0 hidden sm:block">
              <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{product.name}</p>
              <p className="text-base sm:text-lg font-bold text-gradient">{formatPrice(product.price)}</p>
            </div>
            <div className="flex-1 sm:hidden">
              <p className="text-base font-bold text-gradient">{formatPrice(product.price)}</p>
            </div>
            <div className="flex gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={onAddToCart}
                disabled={addingToCart || product.stock_quantity === 0}
                className="btn-pill bg-secondary text-secondary-foreground font-semibold py-2 sm:py-2.5 px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm disabled:opacity-50"
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Cart</span>
              </button>
              <button
                onClick={onBuyNow}
                disabled={product.stock_quantity === 0}
                className="btn-pill bg-gradient-primary text-primary-foreground font-semibold py-2 sm:py-2.5 px-3 sm:px-4 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Buy Now
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StickyAddToCart;
