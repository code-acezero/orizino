import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Phone, MapPin, Save, LogOut, ShoppingCart, Package, Star, Bell, Settings, ChevronRight, Camera } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const ProfilePage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [address, setAddress] = useState({ street: "", city: "", state: "", zip: "", country: "" });
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setAvatarUrl(data.avatar_url || "");
        const addr = (data.address as Record<string, string>) || {};
        setAddress({ street: addr.street || "", city: addr.city || "", state: addr.state || "", zip: addr.zip || "", country: addr.country || "" });
      }
    });
  }, [user]);

  const { data: orders } = useQuery({
    queryKey: ["profile-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, order_number, status, total, created_at").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: cartCount } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("cart_items").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: reviews } = useQuery({
    queryKey: ["profile-reviews", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("id, rating, title, comment, created_at, product_id").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(5);
      return data || [];
    },
    enabled: !!user,
  });

  const { data: notifications } = useQuery({
    queryKey: ["profile-notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").or(`user_id.eq.${user!.id},user_id.is.null`).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!user,
  });

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone, address, avatar_url: avatarUrl }).eq("id", user.id);
    setLoading(false);
    if (error) toast({ title: "Error saving", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated!" });
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    processing: "bg-blue-500/20 text-blue-400",
    shipped: "bg-purple-500/20 text-purple-400",
    delivered: "bg-green-500/20 text-green-400",
    cancelled: "bg-red-500/20 text-red-400",
  };

  const tabs = [
    { id: "profile", icon: User, label: "Profile" },
    { id: "orders", icon: Package, label: "Orders" },
    { id: "reviews", icon: Star, label: "Reviews" },
    { id: "notifications", icon: Bell, label: "Alerts" },
  ];

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-10 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl font-display">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold font-display text-foreground">{fullName || "User"}</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to="/settings" className="p-2.5 rounded-full glass text-muted-foreground hover:text-foreground">
                <Settings className="w-5 h-5" />
              </Link>
              <motion.button whileTap={{ scale: 0.95 }} onClick={signOut} className="p-2.5 rounded-full glass text-destructive">
                <LogOut className="w-5 h-5" />
              </motion.button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Link to="/cart" className="glass rounded-2xl p-4 text-center hover:border-primary/30 transition-all">
              <ShoppingCart className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{cartCount}</p>
              <p className="text-xs text-muted-foreground">In Cart</p>
            </Link>
            <Link to="/orders" className="glass rounded-2xl p-4 text-center hover:border-primary/30 transition-all">
              <Package className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{orders?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Orders</p>
            </Link>
            <div className="glass rounded-2xl p-4 text-center">
              <Star className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold text-foreground">{reviews?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Reviews</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl bg-secondary/30 mb-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap relative ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.id === "notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="glass-strong rounded-3xl p-6 sm:p-8 space-y-5">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block flex items-center gap-1"><MapPin className="w-4 h-4" /> Address</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(["street", "city", "state", "zip", "country"] as const).map((field) => (
                    <input key={field} placeholder={field.charAt(0).toUpperCase() + field.slice(1)} value={address[field]}
                      onChange={(e) => setAddress({ ...address, [field]: e.target.value })}
                      className={`px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${field === "street" ? "md:col-span-2" : ""}`} />
                  ))}
                </div>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={loading}
                className="w-full btn-pill bg-gradient-primary text-primary-foreground font-semibold py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
              </motion.button>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div className="space-y-3">
              {orders?.length === 0 && (
                <div className="glass-strong rounded-3xl p-8 text-center">
                  <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <Link to="/shop" className="text-primary text-sm hover:underline mt-2 inline-block">Start Shopping</Link>
                </div>
              )}
              {orders?.map((order) => (
                <Link key={order.id} to="/orders" className="block glass rounded-2xl p-4 hover:border-primary/30 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">#{order.order_number}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-secondary text-foreground"}`}>
                        {order.status}
                      </span>
                      <p className="text-sm font-bold text-foreground">${Number(order.total).toFixed(2)}</p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
              {(orders?.length || 0) > 0 && (
                <Link to="/orders" className="block text-center text-sm text-primary hover:underline py-2">View All Orders</Link>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="space-y-3">
              {reviews?.length === 0 && (
                <div className="glass-strong rounded-3xl p-8 text-center">
                  <Star className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No reviews yet</p>
                </div>
              )}
              {reviews?.map((review) => (
                <div key={review.id} className="glass rounded-2xl p-4">
                  <div className="flex items-center gap-1 mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"}`} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.title && <p className="text-sm font-semibold text-foreground">{review.title}</p>}
                  {review.comment && <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-3">
              {notifications?.length === 0 && (
                <div className="glass-strong rounded-3xl p-8 text-center">
                  <Bell className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No notifications</p>
                </div>
              )}
              {notifications?.map((n) => (
                <button key={n.id} onClick={() => !n.is_read && markNotificationRead(n.id)}
                  className={`w-full text-left glass rounded-2xl p-4 transition-all ${!n.is_read ? "border-primary/30" : "opacity-70"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.is_read ? "bg-primary" : "bg-muted-foreground"}`} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      {n.message && <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>}
                      <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
