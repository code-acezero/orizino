import React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Heart, Trash2, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "@/lib/app-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSeoMeta } from "@/hooks/use-seo-meta";

const WishlistPage: React.FC = () => {
  useSeoMeta("wishlist", "Wishlist | Ace Marketplace");
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wishlist_items")
        .select("*, products(id, name, price, compare_at_price, thumbnail, slug, stock_quantity)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("wishlist_items").delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const addToCart = async (productId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", productId).maybeSingle();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity: 1 });
    }
    toast({ title: "Added to cart!" });
  };

  if (!user) {
    return (
      <div className="min-h-screen pb-20 lg:pb-0">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold font-display text-foreground mb-2">Wishlist</h1>
          <p className="text-muted-foreground mb-6">Sign in to view your wishlist</p>
          <Link to="/auth" className="btn-pill bg-gradient-primary text-primary-foreground font-semibold px-8 py-3">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold font-display text-foreground mb-8">My Wishlist</h1>

        {isLoading ? (
          <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="glass rounded-3xl p-6 h-24 animate-pulse" />)}</div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Your wishlist is empty</p>
            <Link to="/shop" className="btn-pill bg-gradient-primary text-primary-foreground font-semibold px-8 py-3 mt-6 inline-block">Browse Products</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const product = item.products as any;
              if (!product) return null;
              return (
                <motion.div key={item.id} layout className="glass rounded-3xl p-4 flex gap-4 items-center">
                  <Link to={`/product/${product.slug}`} className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                    <img src={product.thumbnail || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${product.slug}`} className="font-medium text-foreground hover:text-primary line-clamp-1">{product.name}</Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-bold text-foreground">{formatPrice(product.price)}</span>
                      {product.compare_at_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => addToCart(product.id)} className="p-2 glass rounded-full text-primary hover:bg-primary/10">
                      <ShoppingCart className="w-4 h-4" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => removeItem.mutate(item.id)} className="p-2 glass rounded-full text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;
