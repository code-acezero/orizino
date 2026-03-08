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
import { DollarSign, Globe, Check, RefreshCw, Clock, Zap } from "lucide-react";

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

const defaultSettings = {
  site_name: "Zero Marketplace",
  site_description: "Your premium online marketplace",
  logo_url: "",
  site_icon_url: "",
  currency: "BDT",
  shipping_fee: "5.00",
  site_theme: "default",
  site_mode: "dark",
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

      <Tabs defaultValue="general" className="max-w-3xl">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="theme">Site Theme</TabsTrigger>
          <TabsTrigger value="currency" className="flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Currency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="glass">
            <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Site Name</Label><Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} /></div>
              <div><Label>Description</Label><Input value={form.site_description} onChange={(e) => setForm({ ...form, site_description: e.target.value })} /></div>
              <div>
                <Label>Default Shipping Fee</Label>
                <Input type="number" value={form.shipping_fee} onChange={(e) => setForm({ ...form, shipping_fee: e.target.value })} />
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
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
    </div>
  );
};

export default AdminSettings;
