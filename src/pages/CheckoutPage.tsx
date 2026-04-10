import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  MapPin, CreditCard, Truck, Check, ArrowRight, Gift, Tag, Shield,
  Smartphone, Building2, Wallet, ChevronDown, ChevronUp, Home, MapPinned
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/app-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSeoMeta } from "@/hooks/use-seo-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const paymentGateways = [
  { id: "cod", name: "Cash on Delivery", desc: "Pay when you receive", icon: Truck, color: "text-green-500" },
  { id: "bkash", name: "bKash", desc: "Mobile payment", icon: Smartphone, color: "text-pink-500" },
  { id: "nagad", name: "Nagad", desc: "Mobile payment", icon: Smartphone, color: "text-orange-500" },
  { id: "upay", name: "Upay", desc: "Mobile payment", icon: Smartphone, color: "text-blue-500" },
  { id: "card", name: "Credit/Debit Card", desc: "Visa, Mastercard, AMEX", icon: CreditCard, color: "text-purple-500" },
  { id: "bank", name: "Bank Transfer", desc: "BD bank accounts", icon: Building2, color: "text-teal-500" },
];

const addressTypeIcons: Record<string, any> = { home: Home, office: Building2, other: MapPinned };

const CheckoutPage: React.FC = () => {
  useSeoMeta("checkout", "Checkout | Ace Marketplace");
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();
  const location = useLocation();
  const cartState = location.state as any || {};
  const isBuyNow = !!cartState.buyNow;

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [address, setAddress] = useState({ full_name: "", phone: "", street: "", city: "", state: "", zip: "", country: "Bangladesh" });
  const [notes, setNotes] = useState(cartState.orderNotes || "");
  const [giftWrap, setGiftWrap] = useState(cartState.giftWrap || false);
  const [giftMessage, setGiftMessage] = useState(cartState.giftMessage || "");
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(true);
  const [step, setStep] = useState(1);

  // Load saved addresses and profile
  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone, address, preferences").eq("id", user.id).single().then(({ data }) => {
      if (data) {
        const prefs = (data.preferences as Record<string, any>) || {};
        if (prefs.addresses && prefs.addresses.length > 0) {
          setSavedAddresses(prefs.addresses);
          const defaultAddr = prefs.addresses.find((a: any) => a.isDefault) || prefs.addresses[0];
          if (defaultAddr) {
            setSelectedSavedAddress(defaultAddr.id);
            setAddress({
              full_name: defaultAddr.name || data.full_name || "",
              phone: defaultAddr.phone || data.phone || "",
              street: defaultAddr.street || "",
              city: defaultAddr.city || "",
              state: defaultAddr.state || "",
              zip: defaultAddr.zip || "",
              country: defaultAddr.country || "Bangladesh",
            });
            setShowAddressForm(false);
          }
        } else {
          const addr = (data.address as Record<string, string>) || {};
          setAddress({
            full_name: data.full_name || "",
            phone: data.phone || "",
            street: addr.street || "",
            city: addr.city || "",
            state: addr.state || "",
            zip: addr.zip || "",
            country: addr.country || "Bangladesh",
          });
        }
      }
    });
  }, [user]);

  const selectSavedAddress = (addr: any) => {
    setSelectedSavedAddress(addr.id);
    setAddress({
      full_name: addr.name || "",
      phone: addr.phone || "",
      street: addr.street || "",
      city: addr.city || "",
      state: addr.state || "",
      zip: addr.zip || "",
      country: addr.country || "Bangladesh",
    });
    setShowAddressForm(false);
  };

  // For buy-now mode, create a synthetic cart item
  const buyNowItems = isBuyNow && cartState.buyNowItem ? [{
    id: "buy-now",
    product_id: cartState.buyNowItem.productId,
    quantity: cartState.buyNowItem.quantity,
    variant_id: cartState.buyNowItem.variantId,
    products: {
      id: cartState.buyNowItem.productId,
      name: cartState.buyNowItem.name,
      price: cartState.buyNowItem.price,
      thumbnail: cartState.buyNowItem.thumbnail,
      stock_quantity: 999,
    },
    product_variants: cartState.buyNowItem.variantId ? {
      id: cartState.buyNowItem.variantId,
      size: cartState.buyNowItem.selectedSize ?? null,
      color: cartState.buyNowItem.selectedColor ?? null,
      price_override: cartState.buyNowItem.price,
    } : null,
  }] : null;

  const { data: fetchedCartItems } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("*, products(id, name, price, thumbnail, stock_quantity), product_variants(id, size, color, price_override)")
        .eq("user_id", user!.id);
      return data || [];
    },
    enabled: !!user && !isBuyNow,
  });

  const cartItems = isBuyNow ? buyNowItems : fetchedCartItems;

  const { data: shippingMethods } = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: async () => {
      const { data } = await supabase.from("shipping_methods").select("*").eq("is_active", true).order("sort_order");
      return data || [];
    },
  });

  // Fetch active delivery offers
  const { data: deliveryOffers } = useQuery({
    queryKey: ["delivery-offers"],
    queryFn: async () => {
      const { data } = await supabase.from("delivery_offers").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const subtotal = cartItems?.reduce((sum, item) => {
    const variant = (item as any).product_variants as any;
    const price = variant?.price_override ?? (item.products as any)?.price ?? 0;
    return sum + price * item.quantity;
  }, 0) || 0;

  // Coupon from cart
  const appliedCoupon = cartState.coupon;
  let couponDiscount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === "percentage") {
      couponDiscount = subtotal * (Number(appliedCoupon.discount_value) / 100);
      if (appliedCoupon.max_discount_amount) couponDiscount = Math.min(couponDiscount, Number(appliedCoupon.max_discount_amount));
    } else couponDiscount = Number(appliedCoupon.discount_value);
  }

  const shippingMethodId = cartState.shippingMethodId;
  const selectedShipping = shippingMethods?.find((m) => m.id === shippingMethodId) || shippingMethods?.[0];
  let baseShippingFee = selectedShipping ? (selectedShipping.min_order_free && subtotal >= Number(selectedShipping.min_order_free) ? 0 : Number(selectedShipping.price)) : 0;

  // Apply best delivery offer
  let deliveryDiscount = 0;
  let appliedDeliveryOffer: any = null;
  if (deliveryOffers && baseShippingFee > 0) {
    for (const offer of deliveryOffers) {
      if (Number(offer.min_order_amount) > 0 && subtotal < Number(offer.min_order_amount)) continue;
      const areas: string[] = offer.target_areas || [];
      if (areas.length > 0 && address.city) {
        const cityLower = address.city.toLowerCase();
        if (!areas.some((a: string) => cityLower.includes(a.toLowerCase()))) continue;
      }
      let disc = 0;
      if (offer.offer_type === "free_delivery") disc = baseShippingFee;
      else if (offer.offer_type === "reduced_delivery") disc = Math.min(Number(offer.discount_value), baseShippingFee);
      else if (offer.offer_type === "flat_rate") disc = Math.max(0, baseShippingFee - Number(offer.discount_value));
      if (disc > deliveryDiscount) { deliveryDiscount = disc; appliedDeliveryOffer = offer; }
    }
  }

  const shippingFee = Math.max(0, baseShippingFee - deliveryDiscount);
  const giftWrapFee = giftWrap ? 50 : 0;
  const total = Math.max(0, subtotal - couponDiscount + shippingFee + giftWrapFee);

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !cartItems?.length) return;
    if (!address.full_name || !address.phone || !address.street || !address.city) {
      toast({ title: "Please fill in all required address fields", variant: "destructive" });
      setStep(1);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.functions.invoke("create-order", {
      body: {
        shipping_address: address,
        notes,
        payment_method: paymentMethod,
        coupon_code: appliedCoupon?.code,
        coupon_discount: couponDiscount,
        gift_wrap: giftWrap,
        gift_message: giftMessage,
        shipping_method_id: selectedShipping?.id,
        buy_now_item: isBuyNow ? cartState.buyNowItem : null,
      },
    });
    setLoading(false);

    if (error || !data?.success) {
      toast({ title: "Order failed", description: data?.error || "Something went wrong", variant: "destructive" });
      return;
    }

    toast({ title: "🎉 Order placed!", description: `Order ${data.order_number} confirmed.` });
    navigate("/orders");
  };

  if (!user) { navigate("/auth"); return null; }

  const steps = [
    { num: 1, label: "Address", icon: MapPin },
    { num: 2, label: "Payment", icon: CreditCard },
    { num: 3, label: "Review", icon: Check },
  ];

  return (
    <div className="min-h-screen pb-20 lg:pb-0">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold font-display text-foreground mb-6">Checkout</h1>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <button onClick={() => setStep(s.num)} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s.num ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-sm font-medium hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && <div className={`h-0.5 w-8 sm:w-16 ${step > s.num ? "bg-primary" : "bg-border"}`} />}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleOrder} className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-6">
            {/* Step 1: Address */}
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                {/* Saved Addresses */}
                {savedAddresses.length > 0 && (
                  <div className="glass-strong rounded-3xl p-5 space-y-3">
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Saved Addresses</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {savedAddresses.map((addr: any) => {
                        const TypeIcon = addressTypeIcons[addr.type] || MapPinned;
                        return (
                          <button key={addr.id} type="button" onClick={() => selectSavedAddress(addr)}
                            className={`text-left p-3 rounded-2xl border transition-all ${selectedSavedAddress === addr.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <TypeIcon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-foreground">{addr.label || addr.type}</span>
                              {addr.isDefault && <Badge className="text-[9px]">Default</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{addr.street}, {addr.city}</p>
                          </button>
                        );
                      })}
                    </div>
                    <button type="button" onClick={() => { setSelectedSavedAddress(null); setShowAddressForm(true); }} className="text-sm text-primary hover:underline">
                      + Use a different address
                    </button>
                  </div>
                )}

                {/* Address Form */}
                {(showAddressForm || savedAddresses.length === 0) && (
                  <div className="glass-strong rounded-3xl p-5 space-y-4">
                    <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Shipping Address</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Full Name *</Label>
                        <Input value={address.full_name} onChange={(e) => setAddress({ ...address, full_name: e.target.value })} required className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Phone *</Label>
                        <Input value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} required className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs text-muted-foreground">Street Address *</Label>
                        <Input value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} required className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">City *</Label>
                        <Input value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} required className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">District / State</Label>
                        <Input value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">ZIP Code</Label>
                        <Input value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} className="rounded-xl" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Country</Label>
                        <Input value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} className="rounded-xl" />
                      </div>
                    </div>
                  </div>
                )}

                <Button type="button" onClick={() => setStep(2)} className="w-full rounded-xl h-12">Continue to Payment <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </motion.div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="glass-strong rounded-3xl p-5 space-y-3">
                  <h3 className="font-display font-semibold text-foreground flex items-center gap-2"><CreditCard className="w-5 h-5 text-primary" /> Payment Method</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {paymentGateways.map((gw) => (
                      <button key={gw.id} type="button" onClick={() => setPaymentMethod(gw.id)}
                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${paymentMethod === gw.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}>
                        <div className={`w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center`}>
                          <gw.icon className={`w-5 h-5 ${gw.color}`} />
                        </div>
                        <div className="text-left flex-1">
                          <p className="text-sm font-medium text-foreground">{gw.name}</p>
                          <p className="text-[11px] text-muted-foreground">{gw.desc}</p>
                        </div>
                        {paymentMethod === gw.id && <Check className="w-5 h-5 text-primary" />}
                      </button>
                    ))}
                  </div>

                  {paymentMethod !== "cod" && (
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border">
                      <p className="text-sm text-muted-foreground text-center">
                        {paymentMethod === "bkash" && "You'll receive a bKash payment prompt after placing your order."}
                        {paymentMethod === "nagad" && "You'll receive a Nagad payment prompt after placing your order."}
                        {paymentMethod === "upay" && "You'll receive a Upay payment prompt after placing your order."}
                        {paymentMethod === "card" && "You'll be redirected to SSLCommerz for secure card payment."}
                        {paymentMethod === "bank" && "Bank transfer details will be provided after placing your order."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Notes */}
                <div className="glass-strong rounded-3xl p-5 space-y-3">
                  <h3 className="text-sm font-medium text-foreground">Order Notes (optional)</h3>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Special instructions..." rows={2}
                    className="w-full px-4 py-3 rounded-2xl bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm" />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl h-12">Back</Button>
                  <Button type="button" onClick={() => setStep(3)} className="flex-1 rounded-xl h-12">Review Order <ArrowRight className="w-4 h-4 ml-2" /></Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <div className="glass-strong rounded-3xl p-5 space-y-4">
                  <h3 className="font-display font-semibold text-foreground">Order Review</h3>

                  {/* Address Summary */}
                  <div className="p-3 rounded-2xl bg-secondary/30 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Shipping to:</p>
                    <p className="text-sm text-foreground font-medium">{address.full_name} — {address.phone}</p>
                    <p className="text-sm text-muted-foreground">{address.street}, {address.city}, {address.state} {address.zip}</p>
                  </div>

                  {/* Payment Summary */}
                  <div className="p-3 rounded-2xl bg-secondary/30">
                    <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><CreditCard className="w-3 h-3" /> Payment:</p>
                    <p className="text-sm text-foreground font-medium">{paymentGateways.find((g) => g.id === paymentMethod)?.name}</p>
                  </div>

                  {/* Shipping Summary */}
                  {selectedShipping && (
                    <div className="p-3 rounded-2xl bg-secondary/30">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Truck className="w-3 h-3" /> Shipping:</p>
                      <p className="text-sm text-foreground font-medium">{selectedShipping.name} — {selectedShipping.estimated_days}</p>
                    </div>
                  )}

                  {giftWrap && (
                    <div className="p-3 rounded-2xl bg-secondary/30">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Gift className="w-3 h-3" /> Gift wrapped</p>
                      {giftMessage && <p className="text-xs text-muted-foreground mt-1">"{giftMessage}"</p>}
                    </div>
                  )}

                  {appliedCoupon && (
                    <div className="p-3 rounded-2xl bg-green-500/10 border border-green-500/20">
                      <p className="text-xs font-medium text-green-500 flex items-center gap-1"><Tag className="w-3 h-3" /> Coupon: {appliedCoupon.code} — {formatPrice(couponDiscount)} off</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 rounded-xl h-12">Back</Button>
                  <Button type="submit" disabled={loading || !cartItems?.length} className="flex-1 rounded-xl h-12">
                    {loading ? <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <>Place Order <ArrowRight className="w-4 h-4 ml-2" /></>}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1"><Shield className="w-3 h-3" /> Your payment information is secure and encrypted</p>
              </motion.div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-2">
            <div className="glass-strong rounded-3xl p-5 sticky top-24 space-y-4">
              <h3 className="font-display font-semibold text-foreground text-lg">Order Summary</h3>

              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {cartItems?.map((item) => {
                  const product = item.products as any;
                  const variant = (item as any).product_variants as any;
                  if (!product) return null;
                  const price = variant?.price_override ?? product.price;
                  const variantLabel = [variant?.size, variant?.color].filter(Boolean).join(" / ");
                  return (
                    <div key={item.id} className="flex gap-3">
                      <img src={product.thumbnail || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-1">{product.name}</p>
                        {variantLabel && <p className="text-xs text-muted-foreground">{variantLabel}</p>}
                        <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-foreground whitespace-nowrap">{formatPrice(price * item.quantity)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border pt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="text-foreground">{formatPrice(subtotal)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-green-500"><span>Discount</span><span>-{formatPrice(couponDiscount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-foreground">{baseShippingFee === 0 ? <Badge variant="secondary" className="text-[10px]">Free</Badge> : formatPrice(baseShippingFee)}</span></div>
                {deliveryDiscount > 0 && (
                  <div className="flex justify-between text-green-500">
                    <span className="flex items-center gap-1 text-xs"><Truck className="w-3 h-3" /> {appliedDeliveryOffer?.title || "Delivery Offer"}</span>
                    <span>-{formatPrice(deliveryDiscount)}</span>
                  </div>
                )}
                {giftWrap && <div className="flex justify-between"><span className="text-muted-foreground">Gift Wrap</span><span className="text-foreground">{formatPrice(giftWrapFee)}</span></div>}
              </div>

              <div className="border-t border-border pt-3 flex justify-between font-bold text-foreground text-lg">
                <span>Total</span><span>{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CheckoutPage;
