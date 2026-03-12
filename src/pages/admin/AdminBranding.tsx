import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/app-toast";
import { Palette } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

const LOGO_STYLES = [
  { id: "rounded", label: "Rounded", desc: "Smooth rounded corners", preview: "rounded-lg" },
  { id: "circle", label: "Circle", desc: "Perfect circle frame", preview: "rounded-full" },
  { id: "square", label: "Square", desc: "Sharp square edges", preview: "rounded-none" },
  { id: "pill", label: "Pill", desc: "Wide pill shape", preview: "rounded-full px-2" },
  { id: "shield", label: "Shield", desc: "Hexagonal shield shape", preview: "rounded-lg [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]" },
];

const AdminBranding = () => {
  const qc = useQueryClient();
  const [logoUrl, setLogoUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [logoStyle, setLogoStyle] = useState("rounded");

  const { data: settings } = useQuery({
    queryKey: ["admin-branding"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["logo_url", "site_icon_url", "logo_display_style"]);
      const map: Record<string, any> = {};
      data?.forEach((s) => {
        const val = s.value;
        map[s.key] = typeof val === "object" && val !== null ? (val as any).value ?? val : val;
      });
      return map;
    },
  });

  useEffect(() => {
    if (settings) {
      setLogoUrl((settings.logo_url as string) || "");
      setIconUrl((settings.site_icon_url as string) || "");
      setLogoStyle((settings.logo_display_style as string) || "rounded");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = [
        { key: "logo_url", value: logoUrl },
        { key: "site_icon_url", value: iconUrl },
        { key: "logo_display_style", value: logoStyle },
      ];
      for (const item of items) {
        const { error } = await supabase.from("site_settings").upsert({
          key: item.key,
          value: item.value as any,
          updated_at: new Date().toISOString(),
        }, { onConflict: "key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-branding"] });
      qc.invalidateQueries({ queryKey: ["site-settings-nav"] });
      qc.invalidateQueries({ queryKey: ["site-settings-footer"] });
      qc.invalidateQueries({ queryKey: ["site-settings-landing"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Branding saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const currentStyle = LOGO_STYLES.find((s) => s.id === logoStyle) || LOGO_STYLES[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Logo & Branding</h1>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" /> Logo Upload</CardTitle>
            <CardDescription>Upload your site logo and favicon</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site Logo</Label>
              <ImageUpload bucket="avatars" folder="branding" value={logoUrl} onUploaded={(url) => setLogoUrl(url)} />
              <p className="text-xs text-muted-foreground">Recommended: 256×256px or higher, PNG/SVG</p>
            </div>
            <div className="space-y-2">
              <Label>Site Icon (Favicon)</Label>
              <ImageUpload bucket="avatars" folder="branding" value={iconUrl} onUploaded={(url) => setIconUrl(url)} />
              <p className="text-xs text-muted-foreground">Recommended: 128×128px, PNG. This appears in the browser tab.</p>
            </div>
          </CardContent>
        </Card>

        {/* Live Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>See how your logo appears in the navbar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                {logoUrl ? (
                  <img src={logoUrl} alt="" className={`w-10 h-10 object-cover ${currentStyle.preview}`} />
                ) : (
                  <div className={`w-10 h-10 bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold ${currentStyle.preview}`}>
                    S
                  </div>
                )}
                <span className="font-display font-bold text-lg text-foreground">Site Name</span>
              </div>
            </div>

            <div className="mt-6">
              <Label className="mb-3 block">Logo Display Style</Label>
              <div className="grid grid-cols-5 gap-3">
                {LOGO_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setLogoStyle(style.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                      logoStyle === style.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className={`w-10 h-10 bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm ${style.preview}`}>
                      {logoUrl ? <img src={logoUrl} alt="" className={`w-full h-full object-cover ${style.preview}`} /> : "L"}
                    </div>
                    <span className="text-[10px] font-medium text-foreground">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Favicon preview */}
            {iconUrl && (
              <div className="mt-6">
                <Label className="mb-3 block">Favicon Preview</Label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border">
                    <img src={iconUrl} alt="" className="w-4 h-4 rounded-sm" />
                    <span className="text-xs text-muted-foreground">Browser Tab</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBranding;
