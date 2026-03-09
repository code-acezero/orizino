import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Phone, MapPin, Save, LogOut, ShoppingCart, Package, Star, Bell,
  Settings, ChevronRight, Camera, Plus, Trash2, Home, Building2, MapPinned,
  CreditCard, Wallet, Edit3, CheckCircle2, Shield, Clock, Eye, EyeOff,
  Mail, Calendar, Award, TrendingUp, Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/app-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Address {
  id: string;
  label: string;
  type: "home" | "office" | "other";
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  type: "card" | "bank" | "wallet" | "cod";
  label: string;
  details: string;
  lastFour?: string;
  expiryDate?: string;
  isDefault: boolean;
}

const emptyAddress: Omit<Address, "id"> = {
  label: "", type: "home", name: "", phone: "", street: "", city: "", state: "", zip: "", country: "", isDefault: false,
};

const emptyPayment: Omit<PaymentMethod, "id"> = {
  type: "card", label: "", details: "", lastFour: "", expiryDate: "", isDefault: false,
};

const addressTypeIcons = { home: Home, office: Building2, other: MapPinned };

const ProfilePage: React.FC = () => {
  useSeoMeta("profile", "Profile | Ace Marketplace");
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Multi-address & payment
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentMethod | null>(null);
  const [addressForm, setAddressForm] = useState<Omit<Address, "id">>(emptyAddress);
  const [paymentForm, setPaymentForm] = useState<Omit<PaymentMethod, "id">>(emptyPayment);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setAvatarUrl(data.avatar_url || "");
        const prefs = (data.preferences as Record<string, any>) || {};
        if (prefs.addresses) setAddresses(prefs.addresses);
        if (prefs.paymentMethods) setPaymentMethods(prefs.paymentMethods);
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

  const { data: wishlistCount } = useQuery({
    queryKey: ["wishlist-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("wishlist_items").select("*", { count: "exact", head: true }).eq("user_id", user!.id);
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

  const savePreferences = async (newAddresses?: Address[], newPayments?: PaymentMethod[]) => {
    if (!user) return;
    const currentPrefs = (await supabase.from("profiles").select("preferences").eq("id", user.id).single()).data?.preferences as Record<string, any> || {};
    const updated: Record<string, any> = {
      ...currentPrefs,
      addresses: (newAddresses || addresses).map((a) => ({ ...a })),
      paymentMethods: (newPayments || paymentMethods).map((p) => ({ ...p })),
    };
    await supabase.from("profiles").update({ preferences: updated as any }).eq("id", user.id);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone, avatar_url: avatarUrl }).eq("id", user.id);
    setLoading(false);
    if (error) toast({ title: "Error saving", description: error.message, variant: "destructive" });
    else toast({ title: "Profile updated!" });
  };

  const markNotificationRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["profile-notifications"] });
  };

  // Address CRUD
  const openAddAddress = () => { setEditingAddress(null); setAddressForm(emptyAddress); setAddressDialogOpen(true); };
  const openEditAddress = (addr: Address) => { setEditingAddress(addr); setAddressForm(addr); setAddressDialogOpen(true); };
  const saveAddress = () => {
    let updated: Address[];
    if (editingAddress) {
      updated = addresses.map((a) => a.id === editingAddress.id ? { ...addressForm, id: editingAddress.id } : a);
    } else {
      updated = [...addresses, { ...addressForm, id: crypto.randomUUID() }];
    }
    if (addressForm.isDefault) updated = updated.map((a) => ({ ...a, isDefault: a.id === (editingAddress?.id || updated[updated.length - 1].id) }));
    setAddresses(updated);
    savePreferences(updated);
    setAddressDialogOpen(false);
    toast({ title: editingAddress ? "Address updated" : "Address added" });
  };
  const deleteAddress = (id: string) => {
    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
    savePreferences(updated);
    toast({ title: "Address removed" });
  };
  const setDefaultAddress = (id: string) => {
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    setAddresses(updated);
    savePreferences(updated);
    toast({ title: "Default address updated" });
  };

  // Payment CRUD
  const openAddPayment = () => { setEditingPayment(null); setPaymentForm(emptyPayment); setPaymentDialogOpen(true); };
  const openEditPayment = (pm: PaymentMethod) => { setEditingPayment(pm); setPaymentForm(pm); setPaymentDialogOpen(true); };
  const savePayment = () => {
    let updated: PaymentMethod[];
    if (editingPayment) {
      updated = paymentMethods.map((p) => p.id === editingPayment.id ? { ...paymentForm, id: editingPayment.id } : p);
    } else {
      updated = [...paymentMethods, { ...paymentForm, id: crypto.randomUUID() }];
    }
    if (paymentForm.isDefault) updated = updated.map((p) => ({ ...p, isDefault: p.id === (editingPayment?.id || updated[updated.length - 1].id) }));
    setPaymentMethods(updated);
    savePreferences(undefined, updated);
    setPaymentDialogOpen(false);
    toast({ title: editingPayment ? "Payment method updated" : "Payment method added" });
  };
  const deletePayment = (id: string) => {
    const updated = paymentMethods.filter((p) => p.id !== id);
    setPaymentMethods(updated);
    savePreferences(undefined, updated);
    toast({ title: "Payment method removed" });
  };
  const setDefaultPayment = (id: string) => {
    const updated = paymentMethods.map((p) => ({ ...p, isDefault: p.id === id }));
    setPaymentMethods(updated);
    savePreferences(undefined, updated);
    toast({ title: "Default payment updated" });
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
    { id: "addresses", icon: MapPin, label: "Addresses" },
    { id: "payments", icon: CreditCard, label: "Payments" },
    { id: "orders", icon: Package, label: "Orders" },
    { id: "reviews", icon: Star, label: "Reviews" },
    { id: "notifications", icon: Bell, label: "Alerts" },
  ];

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Profile Header Card */}
          <div className="glass-strong rounded-3xl p-6 sm:p-8 mb-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <div className="relative group flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-primary shadow-lg" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-3xl font-display shadow-lg">
                    {user?.email?.charAt(0).toUpperCase()}
                  </div>
                )}
                <label className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !user) return;
                    const ext = file.name.split(".").pop();
                    const path = `${user.id}/${Date.now()}.${ext}`;
                    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
                    if (error) { toast({ title: "Upload failed", variant: "destructive" }); return; }
                    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
                    setAvatarUrl(urlData.publicUrl);
                    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("id", user.id);
                    toast({ title: "Avatar updated!" });
                  }} />
                </label>
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                  <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">{fullName || "User"}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center sm:justify-start mt-1">
                  <Mail className="w-3.5 h-3.5" /> {user?.email}
                </p>
                <div className="flex items-center gap-3 justify-center sm:justify-start mt-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs gap-1"><Calendar className="w-3 h-3" /> Member since {memberSince}</Badge>
                  <Badge variant="secondary" className="text-xs gap-1"><Shield className="w-3 h-3" /> Verified</Badge>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link to="/settings" className="p-2.5 rounded-xl glass text-muted-foreground hover:text-foreground transition-colors">
                  <Settings className="w-5 h-5" />
                </Link>
                <motion.button whileTap={{ scale: 0.95 }} onClick={signOut} className="p-2.5 rounded-xl glass text-destructive hover:bg-destructive/10 transition-colors">
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { icon: ShoppingCart, count: cartCount, label: "In Cart", href: "/cart", color: "text-primary" },
              { icon: Package, count: orders?.length || 0, label: "Orders", href: "/orders", color: "text-primary" },
              { icon: Heart, count: wishlistCount || 0, label: "Wishlist", href: "/wishlist", color: "text-primary" },
              { icon: Star, count: reviews?.length || 0, label: "Reviews", href: undefined, color: "text-primary" },
            ].map((stat) => {
              const Wrapper = stat.href ? Link : "div";
              return (
                <Wrapper key={stat.label} to={stat.href as string} className="glass rounded-2xl p-4 text-center hover:border-primary/30 transition-all cursor-pointer group">
                  <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1 group-hover:scale-110 transition-transform`} />
                  <p className="text-xl font-bold text-foreground">{stat.count}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </Wrapper>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl bg-secondary/30 mb-6 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap relative min-w-fit ${activeTab === tab.id ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}>
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.id === "notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="glass-strong rounded-3xl p-6 sm:p-8 space-y-5">
                <h2 className="text-lg font-semibold font-display text-foreground">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="pl-10 rounded-xl bg-secondary/50" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className="pl-10 rounded-xl bg-secondary/50" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input value={user?.email || ""} disabled className="pl-10 rounded-xl bg-secondary/30 opacity-60" />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={loading} className="w-full rounded-xl h-12">
                  {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
                </Button>
              </motion.div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <motion.div key="addresses" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold font-display text-foreground">My Addresses</h2>
                  <Button size="sm" onClick={openAddAddress} className="rounded-xl gap-1.5"><Plus className="w-4 h-4" /> Add Address</Button>
                </div>
                {addresses.length === 0 && (
                  <div className="glass-strong rounded-3xl p-10 text-center">
                    <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">No addresses saved yet</p>
                    <Button onClick={openAddAddress} variant="outline" className="rounded-xl gap-1.5"><Plus className="w-4 h-4" /> Add Your First Address</Button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {addresses.map((addr) => {
                    const TypeIcon = addressTypeIcons[addr.type];
                    return (
                      <div key={addr.id} className={`glass rounded-2xl p-5 relative transition-all ${addr.isDefault ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-primary/20"}`}>
                        {addr.isDefault && <Badge className="absolute top-3 right-3 text-[10px]">Default</Badge>}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <TypeIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{addr.label || addr.type.charAt(0).toUpperCase() + addr.type.slice(1)}</p>
                            <p className="text-xs text-muted-foreground">{addr.name}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{addr.street}, {addr.city}, {addr.state} {addr.zip}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{addr.country}</p>
                        {addr.phone && <p className="text-xs text-muted-foreground mt-1">📞 {addr.phone}</p>}
                        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                          <Button size="sm" variant="ghost" onClick={() => openEditAddress(addr)} className="rounded-lg text-xs h-8 gap-1"><Edit3 className="w-3 h-3" /> Edit</Button>
                          {!addr.isDefault && <Button size="sm" variant="ghost" onClick={() => setDefaultAddress(addr.id)} className="rounded-lg text-xs h-8 gap-1"><CheckCircle2 className="w-3 h-3" /> Set Default</Button>}
                          <Button size="sm" variant="ghost" onClick={() => deleteAddress(addr.id)} className="rounded-lg text-xs h-8 gap-1 text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /> Delete</Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Payments Tab */}
            {activeTab === "payments" && (
              <motion.div key="payments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold font-display text-foreground">Payment Methods</h2>
                  <Button size="sm" onClick={openAddPayment} className="rounded-xl gap-1.5"><Plus className="w-4 h-4" /> Add Method</Button>
                </div>
                {paymentMethods.length === 0 && (
                  <div className="glass-strong rounded-3xl p-10 text-center">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">No payment methods saved</p>
                    <Button onClick={openAddPayment} variant="outline" className="rounded-xl gap-1.5"><Plus className="w-4 h-4" /> Add Payment Method</Button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paymentMethods.map((pm) => (
                    <div key={pm.id} className={`glass rounded-2xl p-5 relative transition-all ${pm.isDefault ? "border-primary/50 ring-1 ring-primary/20" : "hover:border-primary/20"}`}>
                      {pm.isDefault && <Badge className="absolute top-3 right-3 text-[10px]">Default</Badge>}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          {pm.type === "card" ? <CreditCard className="w-5 h-5 text-primary" /> :
                           pm.type === "bank" ? <Building2 className="w-5 h-5 text-primary" /> :
                           pm.type === "wallet" ? <Wallet className="w-5 h-5 text-primary" /> :
                           <Package className="w-5 h-5 text-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{pm.label || pm.type.toUpperCase()}</p>
                          {pm.lastFour && <p className="text-xs text-muted-foreground">•••• {pm.lastFour}</p>}
                          {pm.expiryDate && <p className="text-xs text-muted-foreground">Expires {pm.expiryDate}</p>}
                        </div>
                      </div>
                      {pm.details && <p className="text-xs text-muted-foreground">{pm.details}</p>}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                        <Button size="sm" variant="ghost" onClick={() => openEditPayment(pm)} className="rounded-lg text-xs h-8 gap-1"><Edit3 className="w-3 h-3" /> Edit</Button>
                        {!pm.isDefault && <Button size="sm" variant="ghost" onClick={() => setDefaultPayment(pm.id)} className="rounded-lg text-xs h-8 gap-1"><CheckCircle2 className="w-3 h-3" /> Set Default</Button>}
                        <Button size="sm" variant="ghost" onClick={() => deletePayment(pm.id)} className="rounded-lg text-xs h-8 gap-1 text-destructive hover:text-destructive"><Trash2 className="w-3 h-3" /> Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {orders?.length === 0 && (
                  <div className="glass-strong rounded-3xl p-10 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-2">No orders yet</p>
                    <Link to="/shop" className="text-primary text-sm hover:underline">Start Shopping →</Link>
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] || "bg-secondary text-foreground"}`}>{order.status}</span>
                        <p className="text-sm font-bold text-foreground">${Number(order.total).toFixed(2)}</p>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                ))}
                {(orders?.length || 0) > 0 && <Link to="/orders" className="block text-center text-sm text-primary hover:underline py-2">View All Orders</Link>}
              </motion.div>
            )}

            {/* Reviews Tab */}
            {activeTab === "reviews" && (
              <motion.div key="reviews" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {reviews?.length === 0 && (
                  <div className="glass-strong rounded-3xl p-10 text-center">
                    <Star className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
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
              </motion.div>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <motion.div key="notifications" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                {notifications?.length === 0 && (
                  <div className="glass-strong rounded-3xl p-10 text-center">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
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
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      <Footer />

      {/* Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAddress ? "Edit Address" : "Add New Address"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input value={addressForm.label} onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })} placeholder="e.g. My Home" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={addressForm.type} onValueChange={(v) => setAddressForm({ ...addressForm, type: v as Address["type"] })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">🏠 Home</SelectItem>
                    <SelectItem value="office">🏢 Office</SelectItem>
                    <SelectItem value="other">📍 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Recipient Name</Label>
                <Input value={addressForm.name} onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })} placeholder="Full name" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={addressForm.phone} onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="+1 555 000" className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Street Address</Label>
              <Input value={addressForm.street} onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })} placeholder="123 Main St, Apt 4B" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input value={addressForm.city} onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="City" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>State / Province</Label>
                <Input value={addressForm.state} onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })} placeholder="State" className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>ZIP / Postal Code</Label>
                <Input value={addressForm.zip} onChange={(e) => setAddressForm({ ...addressForm, zip: e.target.value })} placeholder="10001" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input value={addressForm.country} onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })} placeholder="United States" className="rounded-xl" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })} className="rounded" />
              <span className="text-sm text-foreground">Set as default address</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={saveAddress} className="rounded-xl">{editingAddress ? "Save Changes" : "Add Address"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPayment ? "Edit Payment Method" : "Add Payment Method"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={paymentForm.type} onValueChange={(v) => setPaymentForm({ ...paymentForm, type: v as PaymentMethod["type"] })}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">💳 Credit/Debit Card</SelectItem>
                    <SelectItem value="bank">🏦 Bank Account</SelectItem>
                    <SelectItem value="wallet">👛 Digital Wallet</SelectItem>
                    <SelectItem value="cod">📦 Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Label</Label>
                <Input value={paymentForm.label} onChange={(e) => setPaymentForm({ ...paymentForm, label: e.target.value })} placeholder="e.g. Visa Personal" className="rounded-xl" />
              </div>
            </div>
            {paymentForm.type === "card" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Last 4 Digits</Label>
                  <Input value={paymentForm.lastFour} onChange={(e) => setPaymentForm({ ...paymentForm, lastFour: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="1234" maxLength={4} className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label>Expiry Date</Label>
                  <Input value={paymentForm.expiryDate} onChange={(e) => setPaymentForm({ ...paymentForm, expiryDate: e.target.value })} placeholder="MM/YY" className="rounded-xl" />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Additional Details</Label>
              <Input value={paymentForm.details} onChange={(e) => setPaymentForm({ ...paymentForm, details: e.target.value })} placeholder="Any notes about this payment method" className="rounded-xl" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={paymentForm.isDefault} onChange={(e) => setPaymentForm({ ...paymentForm, isDefault: e.target.checked })} className="rounded" />
              <span className="text-sm text-foreground">Set as default payment method</span>
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={savePayment} className="rounded-xl">{editingPayment ? "Save Changes" : "Add Method"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
