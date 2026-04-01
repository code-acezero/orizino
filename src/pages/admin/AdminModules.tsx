import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/app-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot, Globe, Truck, Tag, Bell, MessageSquare, Palette, BarChart3,
  Shield, Headphones, Gift, Send, Puzzle, Search, Zap, Layers,
} from "lucide-react";
import { motion } from "framer-motion";

interface ModuleConfig {
  id: string;
  label: string;
  description: string;
  icon: any;
  category: "core" | "commerce" | "communication" | "analytics" | "integration";
  enabled: boolean;
  premium?: boolean;
}

const DEFAULT_MODULES: ModuleConfig[] = [
  { id: "ai_chat", label: "AI Chat Agent", description: "AI-powered customer support chatbot with product knowledge", icon: Bot, category: "communication", enabled: true },
  { id: "live_support", label: "Live Support", description: "Real-time human support with WebRTC voice calling", icon: Headphones, category: "communication", enabled: true },
  { id: "notifications", label: "Push Notifications", description: "In-app and device notifications for orders and promos", icon: Bell, category: "communication", enabled: true },
  { id: "telegram", label: "Telegram Bot", description: "2-way sync with Telegram for order alerts and support", icon: Send, category: "integration", enabled: false },
  { id: "multilingual", label: "Multi-Language (i18n)", description: "23+ language support with RTL for the entire site", icon: Globe, category: "core", enabled: true },
  { id: "delivery_offers", label: "Delivery Offers", description: "Free delivery promotions and shipping discounts", icon: Truck, category: "commerce", enabled: true },
  { id: "coupons", label: "Coupon System", description: "Discount codes with usage limits and auto-expiry", icon: Tag, category: "commerce", enabled: true },
  { id: "user_promos", label: "User Promos", description: "Targeted promotional popups for specific user segments", icon: Gift, category: "commerce", enabled: true },
  { id: "reviews", label: "Product Reviews", description: "Customer reviews with image uploads and moderation", icon: MessageSquare, category: "core", enabled: true },
  { id: "analytics", label: "Site Analytics", description: "Page views, geo tracking, device breakdown, and funnels", icon: BarChart3, category: "analytics", enabled: true },
  { id: "seo", label: "SEO Tools", description: "Meta tags, sitemaps, OG images, and audit tools", icon: Search, category: "core", enabled: true },
  { id: "theme_customizer", label: "Theme Customizer", description: "Visual no-code site customization with live preview", icon: Palette, category: "core", enabled: true },
  { id: "cms", label: "CMS Pages", description: "Custom static pages with Markdown editor", icon: Layers, category: "core", enabled: true },
  { id: "flash_sales", label: "Flash Sales", description: "Time-limited sale events with countdown timers", icon: Zap, category: "commerce", enabled: false },
  { id: "rbac", label: "Role-Based Access", description: "Admin, moderator, and user role management", icon: Shield, category: "core", enabled: true },
  { id: "webhooks", label: "Webhooks", description: "Custom webhook endpoints for third-party integrations", icon: Puzzle, category: "integration", enabled: false, premium: true },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: any }> = {
  core: { label: "Core", icon: Layers },
  commerce: { label: "Commerce", icon: Tag },
  communication: { label: "Communication", icon: MessageSquare },
  analytics: { label: "Analytics", icon: BarChart3 },
  integration: { label: "Integrations", icon: Puzzle },
};

const AdminModules: React.FC = () => {
  const qc = useQueryClient();
  const [modules, setModules] = useState<ModuleConfig[]>(DEFAULT_MODULES);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: savedModules } = useQuery({
    queryKey: ["admin-modules-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("key", "modules_config").maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (savedModules?.value) {
      const saved = (savedModules.value as any)?.value ?? savedModules.value;
      if (typeof saved === "object" && !Array.isArray(saved)) {
        setModules((prev) =>
          prev.map((m) => ({
            ...m,
            enabled: saved[m.id] !== undefined ? saved[m.id] : m.enabled,
          }))
        );
      }
    }
  }, [savedModules]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const config: Record<string, boolean> = {};
      modules.forEach((m) => { config[m.id] = m.enabled; });
      const jsonVal = { value: config } as any;
      if (savedModules) {
        await supabase.from("site_settings").update({ value: jsonVal }).eq("id", savedModules.id);
      } else {
        await supabase.from("site_settings").insert({ key: "modules_config", value: jsonVal });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-modules-config"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Module configuration saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleModule = (id: string) => {
    setModules((prev) => prev.map((m) => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const filteredModules = modules.filter((m) =>
    m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const enabledCount = modules.filter((m) => m.enabled).length;
  const categories = Object.keys(CATEGORY_LABELS);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-display font-bold">Modules & Apps</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {enabledCount} of {modules.length} modules active
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-[200px] rounded-xl"
            />
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All ({filteredModules.length})</TabsTrigger>
          {categories.map((cat) => {
            const count = filteredModules.filter((m) => m.category === cat).length;
            if (count === 0) return null;
            const CatIcon = CATEGORY_LABELS[cat].icon;
            return (
              <TabsTrigger key={cat} value={cat} className="gap-1.5">
                <CatIcon className="w-3.5 h-3.5" />
                {CATEGORY_LABELS[cat].label} ({count})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {["all", ...categories].map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredModules
                .filter((m) => tab === "all" || m.category === tab)
                .map((mod, i) => (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className={`group transition-all hover:border-primary/30 ${mod.enabled ? "border-primary/20 bg-primary/[0.02]" : "opacity-70"}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                              mod.enabled ? "bg-primary/10 text-primary" : "bg-secondary/60 text-muted-foreground"
                            }`}>
                              <mod.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold">{mod.label}</h3>
                                {mod.premium && (
                                  <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">
                                    PRO
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
                              <Badge variant="outline" className="text-[9px] mt-2">
                                {CATEGORY_LABELS[mod.category]?.label}
                              </Badge>
                            </div>
                          </div>
                          <Switch
                            checked={mod.enabled}
                            onCheckedChange={() => toggleModule(mod.id)}
                            disabled={mod.premium}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default AdminModules;
