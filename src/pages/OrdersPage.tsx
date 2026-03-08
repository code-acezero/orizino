import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, ChevronRight, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  processing: "bg-blue-500/20 text-blue-400",
  shipped: "bg-purple-500/20 text-purple-400",
  delivered: "bg-primary/20 text-primary",
  cancelled: "bg-destructive/20 text-destructive",
};

const OrdersPage: React.FC = () => {
  const { user } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(id, product_name, product_image, quantity, unit_price, total_price)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold font-display text-foreground mb-8">My Orders</h1>

        {isLoading ? (
          <div className="space-y-4">{[1, 2].map((i) => <div key={i} className="glass rounded-3xl p-6 h-32 animate-pulse" />)}</div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">No orders yet</p>
            <Link to="/shop" className="btn-pill bg-gradient-primary text-primary-foreground font-semibold px-8 py-3 mt-6 inline-block">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-display font-semibold text-foreground">{order.order_number}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${statusColors[order.status] || "bg-secondary text-muted-foreground"}`}>
                    {order.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {(order.order_items as any[])?.slice(0, 3).map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <img src={item.product_image || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      <span className="text-sm text-foreground flex-1 line-clamp-1">{item.product_name}</span>
                      <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                      <span className="text-sm font-medium text-foreground">${item.total_price.toFixed(2)}</span>
                    </div>
                  ))}
                  {(order.order_items as any[])?.length > 3 && (
                    <p className="text-xs text-muted-foreground">+{(order.order_items as any[]).length - 3} more items</p>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="font-bold text-foreground">Total: ${order.total.toFixed(2)}</span>
                  {order.tracking_number && (
                    <span className="text-xs text-primary">Tracking: {order.tracking_number}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrdersPage;
