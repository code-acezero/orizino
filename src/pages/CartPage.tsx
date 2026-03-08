import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CartPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cartItems, isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("*, products(id, name, price, compare_at_price, thumbnail, slug, stock_quantity)")
        .eq("user_id", user!.id)
        .order("created_at");
      return data || [];
    },
    enabled: !!user,
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        await supabase.from("cart_items").delete().eq("id", id);
      } else {
        await supabase.from("cart_items").update({ quantity }).eq("id", id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("cart_items").delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (!user) {
    return (
      <div className="min-h-screen pb-20 lg:pb-0">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">Your Cart</h1>
          <p className="text-muted-foreground mb-6">Please sign in to view your cart</p>
          <Link to="/auth" className="btn-pill bg-gradient-primary text-primary-foreground font-semibold px-8 py-3 inline-flex items-center gap-2">
            Sign In <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const subtotal = cartItems?.reduce((sum, item) => {
    const product = item.products as any;
    return sum + (product?.price || 0) * item.quantity;
  }, 0) || 0;

  const shippingFee = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shippingFee;

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold font-display text-foreground mb-8">Shopping Cart</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass rounded-3xl p-6 h-28 animate-pulse" />
            ))}
          </div>
        ) : !cartItems || cartItems.length === 0 ? (
          <div className="text-center py-20">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Your cart is empty</p>
            <Link to="/shop" className="btn-pill bg-gradient-primary text-primary-foreground font-semibold px-8 py-3 mt-6 inline-flex items-center gap-2">
              Start Shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => {
                const product = item.products as any;
                if (!product) return null;
                return (
                  <motion.div key={item.id} layout className="glass rounded-3xl p-4 flex gap-4">
                    <Link to={`/product/${product.slug}`} className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                      <img src={product.thumbnail || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${product.slug}`} className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1">{product.name}</Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-foreground">${product.price.toFixed(2)}</span>
                        {product.compare_at_price && <span className="text-sm text-muted-foreground line-through">${product.compare_at_price.toFixed(2)}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1 glass rounded-full px-1 py-0.5">
                          <button onClick={() => updateQty.mutate({ id: item.id, quantity: item.quantity - 1 })} className="p-1.5 rounded-full hover:bg-secondary/50"><Minus className="w-3 h-3" /></button>
                          <span className="w-6 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                          <button onClick={() => updateQty.mutate({ id: item.id, quantity: Math.min(product.stock_quantity, item.quantity + 1) })} className="p-1.5 rounded-full hover:bg-secondary/50"><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeItem.mutate(item.id)} className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-secondary/50">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="glass-strong rounded-3xl p-6 h-fit sticky top-24 space-y-4">
              <h3 className="font-display font-semibold text-foreground text-lg">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}</span></div>
                {shippingFee > 0 && <p className="text-xs text-primary">Free shipping on orders over $50</p>}
              </div>
              <div className="border-t border-border pt-4 flex justify-between font-bold text-foreground">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>
              <Link to="/checkout" className="block">
                <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full btn-pill bg-gradient-primary text-primary-foreground font-semibold py-3 flex items-center justify-center gap-2">
                  Checkout <ArrowRight className="w-4 h-4" />
                </motion.span>
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;
