import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { MapPin, CreditCard, Truck, Check, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/app-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({ full_name: "", phone: "", street: "", city: "", state: "", zip: "", country: "" });
  const [notes, setNotes] = useState("");

  // Load profile address
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, address").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        const addr = (data.address as Record<string, string>) || {};
        setAddress({
          full_name: data.full_name || "",
          phone: data.phone || "",
          street: addr.street || "",
          city: addr.city || "",
          state: addr.state || "",
          zip: addr.zip || "",
          country: addr.country || "",
        });
      }
    });
  }, [user]);

  const { data: cartItems } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("*, products(id, name, price, thumbnail)")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user,
  });

  const subtotal = cartItems?.reduce((sum, item) => sum + ((item.products as any)?.price || 0) * item.quantity, 0) || 0;
  const shippingFee = subtotal >= 50 ? 0 : 5.99;
  const total = subtotal + shippingFee;

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cartItems?.length) return;

    // Validate
    if (!address.full_name || !address.phone || !address.street || !address.city) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    setLoading(true);
    const orderNumber = `ZM-${Date.now().toString(36).toUpperCase()}`;

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        subtotal,
        shipping_fee: shippingFee,
        total,
        shipping_address: address,
        payment_method: "cod",
        notes,
        status: "pending",
      })
      .select("id")
      .single();

    if (orderError || !order) {
      toast({ title: "Order failed", description: orderError?.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create order items
    const orderItems = cartItems.map((item) => {
      const product = item.products as any;
      return {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_image: product.thumbnail,
        unit_price: product.price,
        quantity: item.quantity,
        total_price: product.price * item.quantity,
      };
    });

    await supabase.from("order_items").insert(orderItems);

    // Clear cart
    await supabase.from("cart_items").delete().eq("user_id", user.id);

    setLoading(false);
    toast({ title: "Order placed!", description: `Order ${orderNumber} confirmed.` });
    navigate("/orders");
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold font-display text-foreground mb-8">Checkout</h1>

        <form onSubmit={handleOrder} className="grid md:grid-cols-5 gap-8">
          {/* Shipping form */}
          <div className="md:col-span-3 space-y-6">
            <div className="glass-strong rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground text-lg">Shipping Address</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Full Name *" value={address.full_name} onChange={(e) => setAddress({ ...address, full_name: e.target.value })} required
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="Phone *" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} required
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="Street Address *" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} required
                  className="md:col-span-2 px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="City *" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="ZIP Code" value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                <input placeholder="Country" value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })}
                  className="px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>

              <textarea placeholder="Order notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>

            {/* Payment */}
            <div className="glass-strong rounded-3xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h2 className="font-display font-semibold text-foreground text-lg">Payment Method</h2>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/30">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Truck className="w-5 h-5 text-primary" /></div>
                <div>
                  <p className="font-medium text-foreground">Cash on Delivery (COD)</p>
                  <p className="text-xs text-muted-foreground">Pay when you receive your order</p>
                </div>
                <Check className="w-5 h-5 text-primary ml-auto" />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="glass-strong rounded-3xl p-6 sticky top-24 space-y-4">
              <h3 className="font-display font-semibold text-foreground text-lg">Order Summary</h3>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cartItems?.map((item) => {
                  const product = item.products as any;
                  if (!product) return null;
                  return (
                    <div key={item.id} className="flex gap-3">
                      <img src={product.thumbnail || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-1">{product.name}</p>
                        <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-foreground">${(product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{shippingFee === 0 ? "Free" : `$${shippingFee.toFixed(2)}`}</span></div>
              </div>
              <div className="border-t border-border pt-4 flex justify-between font-bold text-foreground text-lg">
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading || !cartItems?.length}
                className="w-full btn-pill bg-gradient-primary text-primary-foreground font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <>Place Order <ArrowRight className="w-4 h-4" /></>}
              </motion.button>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
