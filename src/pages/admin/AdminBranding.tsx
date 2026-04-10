import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/lib/app-toast";
import { Badge } from "@/components/ui/badge";
import { Palette, Monitor, Smartphone, Globe } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import ColorPicker from "@/components/ui/color-picker";
import { Textarea } from "@/components/ui/textarea";

const LOGO_STYLES = [
  { id: "rounded", label: "Rounded", desc: "Soft rounded corners", cls: "rounded-lg" },
  { id: "circle", label: "Circle", desc: "Perfect circle", cls: "rounded-full" },
  { id: "square", label: "Square", desc: "Sharp edges", cls: "rounded-none" },
  { id: "pill", label: "Pill", desc: "Wide capsule", cls: "rounded-full" },
  { id: "shield", label: "Shield", desc: "Hex badge", cls: "rounded-lg [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)]" },
  { id: "hexagon", label: "Hexagon", desc: "6-sided shape", cls: "[clip-path:polygon(25%_0%,75%_0%,100%_50%,75%_100%,25%_100%,0%_50%)]" },
  { id: "diamond", label: "Diamond", desc: "Rotated square", cls: "rotate-45 rounded-lg" },
  { id: "blob", label: "Blob", desc: "Organic shape", cls: "rounded-[30%_70%_70%_30%/30%_30%_70%_70%]" },
];

const LOGO_EFFECTS = [
  { id: "none", label: "None", desc: "No effect" },
  { id: "glossy", label: "Glossy", desc: "Shiny glass overlay" },
  { id: "glow", label: "Glow", desc: "Outer glow ring" },
  { id: "shadow", label: "Shadow", desc: "Drop shadow" },
  { id: "border", label: "Border", desc: "Thin border accent" },
  { id: "grayscale", label: "Grayscale", desc: "Muted colors" },
  { id: "negative", label: "Negative", desc: "Inverted colors" },
  { id: "blur-bg", label: "Frosted", desc: "Blurred background" },
];

const CUSTOM_FONTS = [
  "Agraham", "Bilderberg", "Nevera", "OrangeAvenue", "PrimorStylish",
  "ProdesStencil", "Rostex", "SingleGrinch", "Transcity", "Zaslia",
];

const AdminBranding = () => {
  const qc = useQueryClient();
  const [logoUrl, setLogoUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [logoStyle, setLogoStyle] = useState("rounded");
  const [logoEffect, setLogoEffect] = useState("none");
  const [siteName, setSiteName] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [supportUrl, setSupportUrl] = useState("");
  const [address, setAddress] = useState("");
  const [titleColors, setTitleColors] = useState<Record<number, string>>({});
  const [titleFont, setTitleFont] = useState("");

  const { data: settings } = useQuery({
    queryKey: ["admin-branding"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value").in("key", ["logo_url", "site_icon_url", "logo_display_style", "logo_effect", "site_name", "site_description", "contact_email", "contact_phone", "support_url", "address", "title_letter_colors", "title_font"]);
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
      setLogoEffect((settings.logo_effect as string) || "none");
      const rawName = settings.site_name;
      setSiteName(String(typeof rawName === "object" && rawName !== null ? (rawName as any).value ?? "" : rawName ?? ""));
      const rawDesc = settings.site_description;
      setSiteDescription(String(typeof rawDesc === "object" && rawDesc !== null ? (rawDesc as any).value ?? "" : rawDesc ?? ""));
      setContactEmail(String(settings.contact_email || ""));
      setContactPhone(String(settings.contact_phone || ""));
      setSupportUrl(String(settings.support_url || ""));
      setAddress(String(settings.address || ""));
      if (settings.title_letter_colors && typeof settings.title_letter_colors === "object") {
        setTitleColors(settings.title_letter_colors as Record<number, string>);
      }
      setTitleFont((settings.title_font as string) || "");
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const items: { key: string; value: any }[] = [
        { key: "site_name", value: siteName },
        { key: "site_description", value: siteDescription },
        { key: "contact_email", value: contactEmail },
        { key: "contact_phone", value: contactPhone },
        { key: "support_url", value: supportUrl },
        { key: "address", value: address },
        { key: "logo_url", value: logoUrl },
        { key: "site_icon_url", value: iconUrl },
        { key: "logo_display_style", value: logoStyle },
        { key: "logo_effect", value: logoEffect },
        { key: "title_letter_colors", value: titleColors },
        { key: "title_font", value: titleFont },
      ];
      for (const item of items) {
        await supabase.from("site_settings").upsert({ key: item.key, value: item.value as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
      }
    },
    onSuccess: () => {
      ["admin-branding", "site-settings-nav", "site-settings-footer", "site-settings-landing", "site-settings"].forEach(k => qc.invalidateQueries({ queryKey: [k] }));
      toast.success("Branding saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getEffectClass = (effect: string) => {
    switch (effect) {
      case "glossy": return "after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/20 after:to-transparent after:rounded-inherit";
      case "glow": return "ring-2 ring-primary/40 shadow-[0_0_16px_hsl(var(--primary)/0.3)]";
      case "shadow": return "shadow-[0_4px_16px_hsl(0_0%_0%/0.4)]";
      case "border": return "ring-2 ring-primary/60";
      case "grayscale": return "grayscale";
      case "negative": return "invert";
      case "blur-bg": return "backdrop-blur-sm bg-background/30";
      default: return "";
    }
  };

  const styleObj = LOGO_STYLES.find(s => s.id === logoStyle) || LOGO_STYLES[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Logo & Branding</h1>
          <p className="text-sm text-muted-foreground">Customize your site's visual identity</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Site Identity */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Site Identity</CardTitle>
          <CardDescription className="text-xs">Name, description, and contact info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label className="text-xs">Site Name</Label><Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Your Brand Name" /></div>
            <div><Label className="text-xs">Contact Email</Label><Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="support@yoursite.com" /></div>
          </div>
          <div><Label className="text-xs">Site Description</Label><Textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} rows={2} placeholder="Your premium online marketplace" /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label className="text-xs">Contact Phone</Label><Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+1 234 567 890" /></div>
            <div><Label className="text-xs">Support URL</Label><Input value={supportUrl} onChange={(e) => setSupportUrl(e.target.value)} placeholder="https://support.yoursite.com" /></div>
          </div>
          <div><Label className="text-xs">Business Address</Label><Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="123 Main St, City, Country" /></div>
        </CardContent>
      </Card>

        {/* Left: Upload */}
        <div className="space-y-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Site Logo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 shrink-0 overflow-hidden relative ${styleObj.cls} ${getEffectClass(logoEffect)}`}>
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl">
                      {siteName?.charAt(0) || "L"}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <ImageUpload bucket="avatars" folder="branding" value={logoUrl} onUploaded={(url) => setLogoUrl(url)} />
                  <p className="text-[10px] text-muted-foreground mt-1">256×256px+, PNG/SVG</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Favicon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="shrink-0">
                  {iconUrl ? (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 border border-border/50">
                      <img src={iconUrl} alt="" className="w-4 h-4 rounded-sm" />
                      <span className="text-[10px] text-muted-foreground">Tab</span>
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <ImageUpload bucket="avatars" folder="branding" value={iconUrl} onUploaded={(url) => setIconUrl(url)} />
                  <p className="text-[10px] text-muted-foreground mt-1">128×128px, PNG</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center: Style & Effect selectors */}
        <div className="space-y-4">
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Logo Shape</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {LOGO_STYLES.map((style) => (
                  <button key={style.id} onClick={() => setLogoStyle(style.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${logoStyle === style.id ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"}`}>
                    <div className={`w-9 h-9 bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs overflow-hidden ${style.cls}`}>
                      {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : "L"}
                    </div>
                    <span className="text-[9px] font-medium text-foreground">{style.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Logo Effect</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {LOGO_EFFECTS.map((effect) => (
                  <button key={effect.id} onClick={() => setLogoEffect(effect.id)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all ${logoEffect === effect.id ? "border-primary bg-primary/10" : "border-border/50 hover:border-primary/30"}`}>
                    <div className={`w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs overflow-hidden relative ${getEffectClass(effect.id)}`}>
                      {logoUrl ? <img src={logoUrl} alt="" className="w-full h-full object-cover" /> : "L"}
                    </div>
                    <span className="text-[9px] font-medium text-foreground">{effect.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Title Font + Live previews */}
        <div className="space-y-4">
          {/* Title Font Picker */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Title Display Font</CardTitle>
              <CardDescription className="text-xs">Used for site name, category & product titles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
                <button onClick={() => setTitleFont("")}
                  className={`text-left px-2.5 py-2 rounded-lg text-xs transition-all ${!titleFont ? "border-primary bg-primary/10 border" : "border border-border/50 hover:border-primary/30"}`}>
                  <span className="font-medium">Default</span>
                </button>
                {CUSTOM_FONTS.map((f) => (
                  <button key={f} onClick={() => setTitleFont(f)}
                    className={`text-left px-2.5 py-2 rounded-lg text-xs transition-all ${titleFont === f ? "border-primary bg-primary/10 border" : "border border-border/50 hover:border-primary/30"}`}>
                    <span style={{ fontFamily: `'${f}', sans-serif` }} className="text-sm">{f}</span>
                  </button>
                ))}
              </div>
              {titleFont && (
                <div className="mt-3 p-3 rounded-xl bg-secondary/30 border border-border/30">
                  <p className="text-[10px] text-muted-foreground mb-1">Preview</p>
                  <p className="text-2xl font-bold" style={{ fontFamily: `'${titleFont}', sans-serif` }}>
                    {siteName || "Your Brand"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Monitor className="w-4 h-4" /> Live Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Navbar preview */}
              <div className="rounded-xl bg-card border border-border/50 p-3">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 overflow-hidden relative shrink-0 ${styleObj.cls} ${getEffectClass(logoEffect)}`}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                        {siteName?.charAt(0) || "L"}
                      </div>
                    )}
                  </div>
                  {siteName && (
                    <span className="font-display font-bold text-foreground">
                      {siteName.split("").map((char, i) => (
                        <span key={i} style={titleColors[i] ? { color: titleColors[i] } : undefined}>{char}</span>
                      ))}
                    </span>
                  )}
                  <div className="flex-1" />
                  <div className="flex gap-1.5">
                    {["Home", "Shop"].map(l => (
                      <span key={l} className="text-[9px] text-muted-foreground px-2 py-1 rounded-full bg-secondary/30">{l}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mobile preview */}
              <div className="rounded-xl bg-card border border-border/50 p-3 max-w-[200px] mx-auto">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground">Mobile</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div className={`w-6 h-6 overflow-hidden relative shrink-0 ${styleObj.cls} ${getEffectClass(logoEffect)}`}>
                    {logoUrl ? (
                      <img src={logoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-[8px]">
                        {siteName?.charAt(0) || "L"}
                      </div>
                    )}
                  </div>
                  <span className="font-display font-bold text-xs text-foreground truncate">{siteName || "Site"}</span>
                </div>
              </div>

              {/* Favicon preview */}
              <div className="rounded-xl bg-card border border-border/50 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-secondary/50 border border-border/50">
                    {iconUrl ? <img src={iconUrl} alt="" className="w-3.5 h-3.5 rounded-sm" /> : <Globe className="w-3.5 h-3.5 text-muted-foreground" />}
                    <span className="text-[9px] text-muted-foreground truncate max-w-[80px]">{siteName || "Site"}</span>
                    <span className="text-[8px] text-muted-foreground">×</span>
                  </div>
                  <Badge variant="outline" className="text-[8px]">Browser Tab</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Title letter colors */}
          {siteName && (
            <Card className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2"><Palette className="w-4 h-4" /> Title Colors</CardTitle>
                <CardDescription className="text-xs">Set individual letter colors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {siteName.split("").map((char, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <span className="text-lg font-display font-bold" style={titleColors[i] ? { color: titleColors[i] } : undefined}>{char}</span>
                      <input type="color" value={titleColors[i] || "#ffffff"}
                        onChange={(e) => setTitleColors(prev => ({ ...prev, [i]: e.target.value }))}
                        className="w-6 h-6 rounded border-none cursor-pointer" />
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => setTitleColors({})}>
                  Reset Colors
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBranding;
