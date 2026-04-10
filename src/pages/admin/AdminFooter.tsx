import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/app-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save, Eye } from "lucide-react";

interface FooterConfig {
  show_newsletter: boolean;
  show_social: boolean;
  show_categories: boolean;
  show_quick_links: boolean;
  show_trust_badges: boolean;
  copyright_text: string;
  footer_style: "minimal" | "compact" | "expanded";
  bg_style: "transparent" | "glass" | "solid";
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_tiktok: string;
  social_youtube: string;
}

const defaultConfig: FooterConfig = {
  show_newsletter: true,
  show_social: true,
  show_categories: true,
  show_quick_links: true,
  show_trust_badges: true,
  copyright_text: "",
  footer_style: "compact",
  bg_style: "glass",
  social_facebook: "",
  social_instagram: "",
  social_twitter: "",
  social_tiktok: "",
  social_youtube: "",
};

const AdminFooter: React.FC = () => {
  const queryClient = useQueryClient();
  const [config, setConfig] = useState<FooterConfig>(defaultConfig);

  const { isLoading } = useQuery({
    queryKey: ["admin-footer-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "footer_config").maybeSingle();
      return data?.value as FooterConfig | null;
    },
    staleTime: 0,
    refetchOnMount: true,
    meta: {
      onSuccess: (data: FooterConfig | null) => {
        if (data) setConfig({ ...defaultConfig, ...data });
      },
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await supabase.from("site_settings").upsert({ key: "footer_config", value: config as any }, { onConflict: "key" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["footer-config"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-footer"] });
      toast.success("Footer settings saved!");
    },
    onError: () => toast.error("Failed to save"),
  });

  const update = <K extends keyof FooterConfig>(key: K, val: FooterConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: val }));

  const styles: { id: FooterConfig["footer_style"]; label: string; desc: string }[] = [
    { id: "minimal", label: "Minimal", desc: "Single line, brand + copyright only" },
    { id: "compact", label: "Compact", desc: "Two rows with inline links" },
    { id: "expanded", label: "Expanded", desc: "Full sections with categories" },
  ];

  const bgStyles: { id: FooterConfig["bg_style"]; label: string }[] = [
    { id: "transparent", label: "Transparent" },
    { id: "glass", label: "Glass" },
    { id: "solid", label: "Solid" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Footer Settings</h1>
          <p className="text-sm text-muted-foreground">Customize the site footer appearance and content</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Layout Style */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Layout Style</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {styles.map((s) => (
              <button
                key={s.id}
                onClick={() => update("footer_style", s.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${config.footer_style === s.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}
              >
                <p className="font-medium text-sm text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Background Style */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Background</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              {bgStyles.map((b) => (
                <button
                  key={b.id}
                  onClick={() => update("bg_style", b.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium border transition-all ${config.bg_style === b.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section Toggles */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Sections</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {([
              ["show_newsletter", "Newsletter"],
              ["show_social", "Social Links"],
              ["show_categories", "Categories"],
              ["show_quick_links", "Quick Links"],
              ["show_trust_badges", "Trust Badges"],
            ] as const).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-sm">{label}</Label>
                <Switch checked={config[key]} onCheckedChange={(v) => update(key, v)} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Copyright */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Copyright Text</CardTitle></CardHeader>
          <CardContent>
            <Input
              value={config.copyright_text}
              onChange={(e) => update("copyright_text", e.target.value)}
              placeholder="Leave empty for default (© 2024 SiteName)"
            />
            <p className="text-xs text-muted-foreground mt-1">Custom copyright text for the footer</p>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm">Social Media URLs</CardTitle></CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {([
                ["social_facebook", "Facebook"],
                ["social_instagram", "Instagram"],
                ["social_twitter", "Twitter / X"],
                ["social_tiktok", "TikTok"],
                ["social_youtube", "YouTube"],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <Label className="text-xs">{label}</Label>
                  <Input
                    value={config[key]}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={`https://${label.toLowerCase()}.com/...`}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminFooter;
