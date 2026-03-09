import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, Trash2, ShoppingCart, ArrowRight, Share2, Bell, BellOff,
  Grid3X3, List, Check, AlertCircle, TrendingDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { toast } from "@/lib/app-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const WishlistPage: React.FC = () => {
  useSeoMeta("wishlist", "Wishlist | Ace Marketplace");
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const { data: items, isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("wishlist_items")
        .select("*, products(id, name, price, compare_at_price, thumbnail, slug, stock_quantity, avg_rating, review_count)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  const { data: stockNotifs } = useQuery({
    queryKey: ["stock-notifs", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("stock_notifications").select("product_id").eq("user_id", user!.id).eq("is_notified", false);
      return data?.map((n) => n.product_id) || [];
    },
    enabled: !!user,
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => { await supabase.from("wishlist_items").delete().eq("id", id); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-count"] });
    },
  });

  const addToCart = async (productId: string) => {
    if (!user) return;
    const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", productId).maybeSingle();
    if (existing) await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id);
    else await supabase.from("cart_items").insert({ user_id: user.id, product_id: productId, quantity: 1 });
    queryClient.invalidateQueries({ queryKey: ["cart"] });
    queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    toast({ title: "Added to cart!" });
  };

  const addAllToCart = async () => {
    if (!user || !items) return;
    const toAdd = selectedItems.length > 0 ? items.filter((i) => selectedItems.includes(i.id)) : items;
    for (const item of toAdd) {
      const product = item.products as any;
      if (!product || product.stock_quantity <= 0) continue;
      await addToCart(product.id);
    }
    toast({ title: `${toAdd.length} items added to cart` });
    setSelectedItems([]);
  };

  const removeSelected = async () => {
    for (const id of selectedItems) {
      await supabase.from("wishlist_items").delete().eq("id", id);
    }
    setSelectedItems([]);
    queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    queryClient.invalidateQueries({ queryKey: ["wishlist-count"] });
    toast({ title: "Selected items removed" });
  };

  const toggleNotify = async (productId: string) => {
    if (!user) return;
    const isSubscribed = stockNotifs?.includes(productId);
    if (isSubscribed) {
      await supabase.from("stock_notifications").delete().eq("user_id", user.id).eq("product_id", productId);
      toast({ title: "Restock alert removed" });
    } else {
      await supabase.from("stock_notifications").insert({ user_id: user.id, product_id: productId, email: user.email });
      toast({ title: "You'll be notified when back in stock!" });
    }
    queryClient.invalidateQueries({ queryKey: ["stock-notifs"] });
  };

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const shareWishlist = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast({ title: "Wishlist link copied!" });
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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-display text-foreground">My Wishlist</h1>
            <p className="text-sm text-muted-foreground mt-1">{items?.length || 0} items saved</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={shareWishlist} className="rounded-xl gap-1.5 hidden sm:flex"><Share2 className="w-4 h-4" /> Share</Button>
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><Grid3X3 className="w-4 h-4" /></button>
              <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><List className="w-4 h-4" /></button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {items && items.length > 0 && (
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <Button size="sm" variant="outline" onClick={addAllToCart} className="rounded-xl gap-1.5">
              <ShoppingCart className="w-4 h-4" /> {selectedItems.length > 0 ? `Add ${selectedItems.length} to Cart` : "Add All to Cart"}
            </Button>
            {selectedItems.length > 0 && (
              <Button size="sm" variant="outline" onClick={removeSelected} className="rounded-xl gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" /> Remove Selected
              </Button>
            )}
          </div>
        )}

        {isLoading ? (
          <div className={`${viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 gap-4" : "space-y-4"}`}>
            {[1, 2, 3].map((i) => <div key={i} className="glass rounded-3xl p-6 h-48 animate-pulse" />)}
          </div>
        ) : !items || items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Your wishlist is empty</p>
            <Link to="/shop" className="btn-pill bg-gradient-primary text-primary-foreground font-semibold px-8 py-3 mt-6 inline-flex items-center gap-2">Browse Products <ArrowRight className="w-4 h-4" /></Link>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <AnimatePresence>
              {items.map((item) => {
                const product = item.products as any;
                if (!product) return null;
                const outOfStock = product.stock_quantity <= 0;
                const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
                const isSelected = selectedItems.includes(item.id);

                return (
                  <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    className={`glass rounded-2xl overflow-hidden group relative ${outOfStock ? "opacity-70" : ""}`}>
                    {/* Select checkbox */}
                    <button onClick={() => toggleSelect(item.id)} className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/50 bg-background/50 backdrop-blur-sm opacity-0 group-hover:opacity-100"}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                    </button>

                    <Link to={`/product/${product.slug}`} className="block aspect-square relative overflow-hidden">
                      <img src={product.thumbnail || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      {outOfStock && <div className="absolute inset-0 bg-background/60 flex items-center justify-center"><Badge variant="destructive">Out of Stock</Badge></div>}
                      {hasDiscount && <Badge className="absolute top-2 right-2 text-[10px]"><TrendingDown className="w-3 h-3 mr-0.5" /> {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF</Badge>}
                    </Link>
                    <div className="p-3 space-y-2">
                      <Link to={`/product/${product.slug}`} className="text-sm font-medium text-foreground hover:text-primary line-clamp-2 leading-tight">{product.name}</Link>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{formatPrice(product.price)}</span>
                        {product.compare_at_price && <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>}
                      </div>
                      {product.avg_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 text-xs">{"★".repeat(Math.round(product.avg_rating))}</span>
                          <span className="text-[10px] text-muted-foreground">({product.review_count})</span>
                        </div>
                      )}
                      <div className="flex gap-1.5">
                        {outOfStock ? (
                          <Button size="sm" variant="outline" onClick={() => toggleNotify(product.id)} className="flex-1 rounded-xl text-xs h-8 gap-1">
                            {stockNotifs?.includes(product.id) ? <><BellOff className="w-3 h-3" /> Subscribed</> : <><Bell className="w-3 h-3" /> Notify Me</>}
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => addToCart(product.id)} className="flex-1 rounded-xl text-xs h-8 gap-1">
                            <ShoppingCart className="w-3 h-3" /> Add to Cart
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => removeItem.mutate(item.id)} className="rounded-xl text-xs h-8 px-2 text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item) => {
                const product = item.products as any;
                if (!product) return null;
                const outOfStock = product.stock_quantity <= 0;
                const isSelected = selectedItems.includes(item.id);

                return (
                  <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -100 }}
                    className={`glass rounded-2xl p-4 flex gap-4 items-center ${outOfStock ? "opacity-70" : ""}`}>
                    <button onClick={() => toggleSelect(item.id)} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/50"}`}>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                    </button>
                    <Link to={`/product/${product.slug}`} className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                      <img src={product.thumbnail || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${product.slug}`} className="font-medium text-foreground hover:text-primary line-clamp-1">{product.name}</Link>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-foreground">{formatPrice(product.price)}</span>
                        {product.compare_at_price && <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compare_at_price)}</span>}
                      </div>
                      {outOfStock && <Badge variant="destructive" className="mt-1 text-[10px]">Out of Stock</Badge>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {outOfStock ? (
                        <Button size="sm" variant="outline" onClick={() => toggleNotify(product.id)} className="rounded-xl">
                          {stockNotifs?.includes(product.id) ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => addToCart(product.id)} className="rounded-xl"><ShoppingCart className="w-4 h-4" /></Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => removeItem.mutate(item.id)} className="rounded-xl text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;
