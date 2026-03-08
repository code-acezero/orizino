import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/app-toast";
import ImageUpload from "@/components/ImageUpload";
import { ALL_CURRENCIES, type CurrencyConfig } from "@/contexts/CurrencyContext";
import { DollarSign, Globe, Check, RefreshCw, Clock, Zap, PaintBucket, Search, LayoutTemplate } from "lucide-react";
import SiteCustomizer from "@/components/admin/SiteCustomizer";
import AdminSeoSettings from "@/components/admin/AdminSeoSettings";
import { Textarea } from "@/components/ui/textarea";

const themes = [
  { id: "default", label: "Cyber Emerald", color: "160 84% 45%" },
  { id: "ocean", label: "Ocean Blue", color: "200 90% 50%" },
  { id: "sunset", label: "Sunset Orange", color: "25 95% 55%" },
  { id: "rose", label: "Rose Pink", color: "340 82% 55%" },
  { id: "violet", label: "Royal Violet", color: "270 80% 60%" },
  { id: "crimson", label: "Crimson Red", color: "0 85% 55%" },
  { id: "gold", label: "Golden Hour", color: "45 90% 50%" },
  { id: "mint", label: "Fresh Mint", color: "170 70% 45%" },
];

const defaultSettings: Record<string, any> = {
  site_name: "Zero Marketplace",
  site_description: "Your premium online marketplace",
  logo_url: "",
  site_icon_url: "",
  currency: "BDT",
  shipping_fee: "5.00",
  site_theme: "default",
  site_mode: "dark",
  // New general fields
  contact_email: "",
  contact_phone: "",
  support_url: "",
  address: "",
  maintenance_mode: false,
  announcement_bar_text: "",
  announcement_bar_enabled: false,
  free_shipping_threshold: "",
  tax_rate: "0",
  order_prefix: "ORD",
  items_per_page: "12",
  allow_guest_checkout: true,
  show_stock_count: true,
  low_stock_threshold: "5",
  social_facebook: "",
  social_instagram: "",
  social_twitter: "",
  social_youtube: "",
  social_tiktok: "",
  terms_url: "",
  privacy_url: "",
  refund_policy_url: "",
  product_page_layout: "premium",
};

const defaultCurrencyConfig: CurrencyConfig = {
  default_currency: "BDT",
  enabled_currencies: ["BDT"],
  exchange_rates: {},
};

const AdminSettings = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState(defaultSettings);
  const [currencyConfig, setCurrencyConfig] = useState<CurrencyConfig>({ ...defaultCurrencyConfig });

  const { data: settings } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (settings) {
      const map: Record<string, any> = {};
      settings.forEach((s) => {
        map[s.key] = typeof s.value === "object" && s.value !== null ? (s.value as any).value ?? s.value : s.value;
      });
      setForm((prev) => ({ ...prev, ...map }));

      // Load currency config
      const ccRow = settings.find((s) => s.key === "currency_config");
      if (ccRow?.value) {
        const val = (ccRow.value as any)?.value ?? ccRow.value;
        if (val && typeof val === "object") {
          setCurrencyConfig((prev) => ({ ...prev, ...val }));
        }
      }
    }
  }, [settings]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", form.site_mode === "light");
    document.documentElement.className = document.documentElement.className.replace(/theme-\w+/g, "");
    if (form.site_theme !== "default") document.documentElement.classList.add(`theme-${form.site_theme}`);
  }, [form.site_theme, form.site_mode]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(form)) {
        const existing = settings?.find((s) => s.key === key);
        const jsonValue = { value } as any;
        if (existing) {
          await supabase.from("site_settings").update({ value: jsonValue }).eq("id", existing.id);
        } else {
          await supabase.from("site_settings").insert({ key, value: jsonValue });
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings-nav"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const saveCurrencyConfig = useMutation({
    mutationFn: async () => {
      const existing = settings?.find((s) => s.key === "currency_config");
      const jsonValue = { value: currencyConfig } as any;
      if (existing) {
        await supabase.from("site_settings").update({ value: jsonValue }).eq("id", existing.id);
      } else {
        await supabase.from("site_settings").insert({ key: "currency_config", value: jsonValue });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["currency-config"] });
      toast.success("Currency settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const fetchRatesMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-exchange-rates");
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to fetch rates");
      return data;
    },
    onSuccess: (data) => {
      setCurrencyConfig((prev) => ({
        ...prev,
        exchange_rates: data.rates,
      }));
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      qc.invalidateQueries({ queryKey: ["currency-config"] });
      toast.success("Exchange rates updated from live API");
    },
    onError: (e) => toast.error(`Failed to fetch rates: ${e.message}`),
  });

  const toggleCurrency = (code: string) => {
    const enabled = currencyConfig.enabled_currencies.includes(code);
    if (enabled && code === currencyConfig.default_currency) {
      toast.error("Cannot disable the default currency");
      return;
    }
    setCurrencyConfig((prev) => ({
      ...prev,
      enabled_currencies: enabled
        ? prev.enabled_currencies.filter((c) => c !== code)
        : [...prev.enabled_currencies, code],
    }));
  };

  const setExchangeRate = (code: string, rate: string) => {
    setCurrencyConfig((prev) => ({
      ...prev,
      exchange_rates: { ...prev.exchange_rates, [code]: parseFloat(rate) || 0 },
    }));
  };

  const setDefaultCurrency = (code: string) => {
    setCurrencyConfig((prev) => ({
      ...prev,
      default_currency: code,
      enabled_currencies: prev.enabled_currencies.includes(code)
        ? prev.enabled_currencies
        : [...prev.enabled_currencies, code],
    }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Site Settings</h1>

      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="commerce">Commerce</TabsTrigger>
          <TabsTrigger value="social">Social & Links</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="theme">Site Theme</TabsTrigger>
          <TabsTrigger value="customizer" className="flex items-center gap-1">
            <PaintBucket className="w-3.5 h-3.5" /> Customizer
          </TabsTrigger>
          <TabsTrigger value="seo" className="flex items-center gap-1">
            <Search className="w-3.5 h-3.5" /> SEO
          </TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Currency
          </TabsTrigger>
          <TabsTrigger value="product-page" className="flex items-center gap-1">
            <LayoutTemplate className="w-3.5 h-3.5" /> Product Page
          </TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general">
          <div className="space-y-6 max-w-3xl">
            <Card className="glass">
              <CardHeader><CardTitle>Site Identity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Site Name</Label><Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} /></div>
                <div>
                  <Label>Site Description</Label>
                  <Textarea value={form.site_description} onChange={(e) => setForm({ ...form, site_description: e.target.value })} rows={2} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Contact Email</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} placeholder="support@yoursite.com" /></div>
                  <div><Label>Contact Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} placeholder="+1 234 567 890" /></div>
                </div>
                <div><Label>Support URL</Label><Input value={form.support_url} onChange={(e) => setForm({ ...form, support_url: e.target.value })} placeholder="https://support.yoursite.com" /></div>
                <div><Label>Business Address</Label><Textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={2} placeholder="123 Main St, City, Country" /></div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader><CardTitle>Site Behavior</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/30">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-xs text-muted-foreground">Show a maintenance page to all non-admin visitors</p>
                  </div>
                  <Switch checked={!!form.maintenance_mode} onCheckedChange={(v) => setForm({ ...form, maintenance_mode: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/30">
                  <div>
                    <Label>Announcement Bar</Label>
                    <p className="text-xs text-muted-foreground">Show a message bar at the top of the site</p>
                  </div>
                  <Switch checked={!!form.announcement_bar_enabled} onCheckedChange={(v) => setForm({ ...form, announcement_bar_enabled: v })} />
                </div>
                {form.announcement_bar_enabled && (
                  <div>
                    <Label>Announcement Text</Label>
                    <Input value={form.announcement_bar_text} onChange={(e) => setForm({ ...form, announcement_bar_text: e.target.value })} placeholder="🎉 Free shipping on orders over $50!" />
                  </div>
                )}
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save General Settings"}
            </Button>
          </div>
        </TabsContent>

        {/* ── Commerce ── */}
        <TabsContent value="commerce">
          <div className="space-y-6 max-w-3xl">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Shipping & Tax</CardTitle>
                <CardDescription>Configure shipping fees and tax rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Default Shipping Fee</Label><Input type="number" value={form.shipping_fee} onChange={(e) => setForm({ ...form, shipping_fee: e.target.value })} /></div>
                  <div><Label>Free Shipping Threshold</Label><Input type="number" value={form.free_shipping_threshold} onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })} placeholder="Orders above this get free shipping" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tax Rate (%)</Label><Input type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} step="0.1" /></div>
                  <div><Label>Order Number Prefix</Label><Input value={form.order_prefix} onChange={(e) => setForm({ ...form, order_prefix: e.target.value })} /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Store Behavior</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Products Per Page</Label><Input type="number" value={form.items_per_page} onChange={(e) => setForm({ ...form, items_per_page: e.target.value })} /></div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/30">
                  <div>
                    <Label>Allow Guest Checkout</Label>
                    <p className="text-xs text-muted-foreground">Let users checkout without creating an account</p>
                  </div>
                  <Switch checked={!!form.allow_guest_checkout} onCheckedChange={(v) => setForm({ ...form, allow_guest_checkout: v })} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/30">
                  <div>
                    <Label>Show Stock Count</Label>
                    <p className="text-xs text-muted-foreground">Display remaining stock on product pages</p>
                  </div>
                  <Switch checked={!!form.show_stock_count} onCheckedChange={(v) => setForm({ ...form, show_stock_count: v })} />
                </div>
                <div><Label>Low Stock Threshold</Label><Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} placeholder="Alert when stock is below this number" /></div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Commerce Settings"}
            </Button>
          </div>
        </TabsContent>

        {/* ── Social & Links ── */}
        <TabsContent value="social">
          <div className="space-y-6 max-w-3xl">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Social Media Links</CardTitle>
                <CardDescription>Add your social profiles — shown in footer and OG tags</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Facebook</Label><Input value={form.social_facebook} onChange={(e) => setForm({ ...form, social_facebook: e.target.value })} placeholder="https://facebook.com/yourpage" /></div>
                  <div><Label>Instagram</Label><Input value={form.social_instagram} onChange={(e) => setForm({ ...form, social_instagram: e.target.value })} placeholder="https://instagram.com/yourpage" /></div>
                  <div><Label>Twitter / X</Label><Input value={form.social_twitter} onChange={(e) => setForm({ ...form, social_twitter: e.target.value })} placeholder="https://x.com/yourhandle" /></div>
                  <div><Label>YouTube</Label><Input value={form.social_youtube} onChange={(e) => setForm({ ...form, social_youtube: e.target.value })} placeholder="https://youtube.com/@channel" /></div>
                  <div><Label>TikTok</Label><Input value={form.social_tiktok} onChange={(e) => setForm({ ...form, social_tiktok: e.target.value })} placeholder="https://tiktok.com/@yourpage" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle>Legal Pages</CardTitle>
                <CardDescription>Links to your legal & policy pages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div><Label>Terms & Conditions URL</Label><Input value={form.terms_url} onChange={(e) => setForm({ ...form, terms_url: e.target.value })} placeholder="https://yoursite.com/terms" /></div>
                <div><Label>Privacy Policy URL</Label><Input value={form.privacy_url} onChange={(e) => setForm({ ...form, privacy_url: e.target.value })} placeholder="https://yoursite.com/privacy" /></div>
                <div><Label>Refund Policy URL</Label><Input value={form.refund_policy_url} onChange={(e) => setForm({ ...form, refund_policy_url: e.target.value })} placeholder="https://yoursite.com/refund" /></div>
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Social & Links"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="branding">
          <Card className="glass">
            <CardHeader><CardTitle>Branding</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Site Logo</Label>
                <ImageUpload bucket="banners" folder="branding" value={form.logo_url} onUploaded={(url) => setForm({ ...form, logo_url: url })} />
              </div>
              <div>
                <Label>Site Icon / Favicon</Label>
                <ImageUpload bucket="banners" folder="branding" value={form.site_icon_url} onUploaded={(url) => setForm({ ...form, site_icon_url: url })} />
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Branding"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme">
          <Card className="glass">
            <CardHeader><CardTitle>Site-wide Theme</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">This theme applies to the entire site (excluding category pages which use their own accent colors).</p>
              <div>
                <Label className="mb-2 block">Mode</Label>
                <div className="flex gap-2">
                  {["dark", "light"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setForm({ ...form, site_mode: m })}
                      className={`flex-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all capitalize ${
                        form.site_mode === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30 text-muted-foreground"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-2 block">Color Theme</Label>
                <div className="grid grid-cols-2 gap-2">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setForm({ ...form, site_theme: t.id })}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        form.site_theme === t.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-full" style={{ background: `hsl(${t.color})` }} />
                      <span className="text-sm">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Theme"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Customizer Tab ── */}
        <TabsContent value="customizer">
          <SiteCustomizer />
        </TabsContent>

        {/* ── SEO Tab ── */}
        <TabsContent value="seo">
          <AdminSeoSettings />
        </TabsContent>

        {/* ── Currency Tab ── */}
        <TabsContent value="currency">
          <div className="space-y-6">
            {/* Default Currency */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="w-5 h-5 text-primary" /> Default Currency</CardTitle>
                <CardDescription>
                  All product prices are stored in this currency. Other currencies are converted using the exchange rates below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {ALL_CURRENCIES.slice(0, 12).map((c) => (
                    <button
                      key={c.code}
                      onClick={() => setDefaultCurrency(c.code)}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        currencyConfig.default_currency === c.code
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <span className="text-lg font-display">{c.symbol}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{c.code}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
                      </div>
                      {currencyConfig.default_currency === c.code && (
                        <Check className="w-4 h-4 text-primary ml-auto shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Live Exchange Rates */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-primary" /> Live Exchange Rates</CardTitle>
                <CardDescription>
                  Fetch live rates from open.er-api.com (free, no API key). Rates are relative to {currencyConfig.default_currency}.
                  {(currencyConfig as any).rates_last_updated && (
                    <span className="flex items-center gap-1 mt-1 text-primary">
                      <Clock className="w-3 h-3" />
                      Last updated: {new Date((currencyConfig as any).rates_last_updated).toLocaleString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => fetchRatesMutation.mutate()}
                  disabled={fetchRatesMutation.isPending || currencyConfig.enabled_currencies.length <= 1}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${fetchRatesMutation.isPending ? "animate-spin" : ""}`} />
                  {fetchRatesMutation.isPending ? "Fetching live rates..." : "Fetch Live Rates"}
                </Button>
                {currencyConfig.enabled_currencies.length <= 1 && (
                  <p className="text-xs text-muted-foreground mt-2">Enable at least 2 currencies to fetch exchange rates.</p>
                )}
              </CardContent>
            </Card>

            {/* Enabled Currencies */}
            <Card className="glass">
              <CardHeader>
                <CardTitle>Enabled Currencies</CardTitle>
                <CardDescription>
                  Toggle currencies on/off. Enabled currencies will automatically show for users from matching countries.
                  {currencyConfig.enabled_currencies.length} of {ALL_CURRENCIES.length} enabled.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {ALL_CURRENCIES.map((c) => {
                  const isEnabled = currencyConfig.enabled_currencies.includes(c.code);
                  const isDefault = currencyConfig.default_currency === c.code;
                  return (
                    <div key={c.code} className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${isEnabled ? "border-primary/20 bg-primary/5" : "border-border/30"}`}>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleCurrency(c.code)}
                        disabled={isDefault}
                      />
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-lg font-display w-8">{c.symbol}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{c.code}</span>
                            <span className="text-xs text-muted-foreground">{c.name}</span>
                            {isDefault && <Badge variant="outline" className="text-[10px]">Default</Badge>}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Countries: {c.countries.join(", ")}
                          </p>
                        </div>
                      </div>
                      {/* Exchange rate (only for non-default enabled currencies) */}
                      {isEnabled && !isDefault && (
                        <div className="flex items-center gap-2 shrink-0">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">
                            1 {currencyConfig.default_currency} =
                          </Label>
                          <Input
                            type="number"
                            step="0.0001"
                            className="w-28 h-8 text-sm"
                            value={currencyConfig.exchange_rates[c.code] || ""}
                            onChange={(e) => setExchangeRate(c.code, e.target.value)}
                            placeholder="Rate"
                          />
                          <span className="text-xs text-muted-foreground">{c.code}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Button className="w-full" onClick={() => saveCurrencyConfig.mutate()} disabled={saveCurrencyConfig.isPending}>
              {saveCurrencyConfig.isPending ? "Saving..." : "Save Currency Settings"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
        {/* ── Product Page Layout ── */}
        <TabsContent value="product-page">
          <div className="space-y-6 max-w-3xl">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Product Page Layout</CardTitle>
                <CardDescription>Choose the visual style for product detail pages.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {([
                    { id: "minimal", label: "Apple-Style Minimal", desc: "Clean whitespace, large typography, no glass effects" },
                    { id: "premium", label: "Premium E-Commerce", desc: "Glassmorphism, gradient accents, trust badges, micro-interactions" },
                    { id: "editorial", label: "Editorial / Magazine", desc: "Full-width imagery, asymmetric layout, storytelling format" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setForm((p) => ({ ...p, product_page_layout: opt.id }))}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${
                        form.product_page_layout === opt.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                      {form.product_page_layout === opt.id && (
                        <Badge variant="default" className="mt-2">Active</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save Product Page Settings"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
