import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/lib/app-toast";
import { Rocket, Sparkles, Type, BarChart3, MessageCircle, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";

const iconOptions = ["ShoppingBag", "Shield", "Truck", "Sparkles", "Star", "Zap", "Globe", "Package", "Users", "Heart"];

interface LandingConfig {
  hero_title_line1: string;
  hero_title_line2: string;
  hero_subtitle: string;
  hero_badge: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;
  hero_bg_url: string;
  features: { icon: string; title: string; desc: string }[];
  stats: { value: string; label: string }[];
  show_stats: boolean;
  show_features: boolean;
  show_categories: boolean;
  show_testimonials: boolean;
  show_cta: boolean;
  cta_title: string;
  cta_subtitle: string;
  cta_button: string;
  testimonials: { name: string; text: string; rating: number }[];
}

const DEFAULT: LandingConfig = {
  hero_title_line1: "Shop Smarter.",
  hero_title_line2: "Live Better.",
  hero_subtitle: "Discover a curated marketplace where quality meets affordability.",
  hero_badge: "Welcome to the Future of Shopping",
  hero_cta_primary: "Start Shopping",
  hero_cta_secondary: "Explore Categories",
  hero_bg_url: "",
  features: [
    { icon: "Truck", title: "Free Shipping", desc: "On qualifying orders" },
    { icon: "Shield", title: "Secure Payment", desc: "100% protected" },
    { icon: "ShoppingBag", title: "Easy Returns", desc: "Hassle-free returns" },
    { icon: "Sparkles", title: "Premium Quality", desc: "Curated products" },
  ],
  stats: [
    { value: "10K+", label: "Products" },
    { value: "50K+", label: "Happy Customers" },
    { value: "99%", label: "Satisfaction" },
    { value: "24/7", label: "Support" },
  ],
  show_stats: true,
  show_features: true,
  show_categories: true,
  show_testimonials: false,
  show_cta: true,
  cta_title: "",
  cta_subtitle: "Join thousands of satisfied shoppers. Create your account today.",
  cta_button: "Create Account",
  testimonials: [],
};

const AdminLanding = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<LandingConfig>(DEFAULT);

  const { data: config } = useQuery({
    queryKey: ["admin-landing-config"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("value").eq("key", "landing_config").maybeSingle();
      return (data?.value as any) || {};
    },
  });

  useEffect(() => {
    if (config && typeof config === "object") setForm({ ...DEFAULT, ...config });
  }, [config]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("site_settings").upsert({
        key: "landing_config",
        value: form as any,
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-landing-config"] });
      qc.invalidateQueries({ queryKey: ["site-settings-landing"] });
      toast.success("Landing page saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateFeature = (idx: number, field: string, value: string) => {
    const features = [...form.features];
    features[idx] = { ...features[idx], [field]: value };
    setForm({ ...form, features });
  };

  const addFeature = () => setForm({ ...form, features: [...form.features, { icon: "Sparkles", title: "", desc: "" }] });
  const removeFeature = (idx: number) => setForm({ ...form, features: form.features.filter((_, i) => i !== idx) });

  const updateStat = (idx: number, field: string, value: string) => {
    const stats = [...form.stats];
    stats[idx] = { ...stats[idx], [field]: value };
    setForm({ ...form, stats });
  };

  const addStat = () => setForm({ ...form, stats: [...form.stats, { value: "", label: "" }] });
  const removeStat = (idx: number) => setForm({ ...form, stats: form.stats.filter((_, i) => i !== idx) });

  const updateTestimonial = (idx: number, field: string, value: any) => {
    const testimonials = [...form.testimonials];
    testimonials[idx] = { ...testimonials[idx], [field]: value };
    setForm({ ...form, testimonials });
  };

  const addTestimonial = () => setForm({ ...form, testimonials: [...form.testimonials, { name: "", text: "", rating: 5 }] });
  const removeTestimonial = (idx: number) => setForm({ ...form, testimonials: form.testimonials.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Landing Page</h1>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="hero" className="space-y-4">
        <TabsList>
          <TabsTrigger value="hero"><Rocket className="w-4 h-4 mr-1" /> Hero</TabsTrigger>
          <TabsTrigger value="features"><Sparkles className="w-4 h-4 mr-1" /> Features</TabsTrigger>
          <TabsTrigger value="stats"><BarChart3 className="w-4 h-4 mr-1" /> Stats</TabsTrigger>
          <TabsTrigger value="testimonials"><MessageCircle className="w-4 h-4 mr-1" /> Testimonials</TabsTrigger>
          <TabsTrigger value="cta"><Type className="w-4 h-4 mr-1" /> CTA</TabsTrigger>
          <TabsTrigger value="sections"><ImageIcon className="w-4 h-4 mr-1" /> Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>Configure the main hero area of the landing page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Title Line 1</Label>
                  <Input value={form.hero_title_line1} onChange={(e) => setForm({ ...form, hero_title_line1: e.target.value })} placeholder="Shop Smarter." />
                </div>
                <div className="space-y-2">
                  <Label>Title Line 2 (gradient)</Label>
                  <Input value={form.hero_title_line2} onChange={(e) => setForm({ ...form, hero_title_line2: e.target.value })} placeholder="Live Better." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Textarea value={form.hero_subtitle} onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })} rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Badge Text</Label>
                <Input value={form.hero_badge} onChange={(e) => setForm({ ...form, hero_badge: e.target.value })} placeholder="✨ Welcome..." />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary CTA</Label>
                  <Input value={form.hero_cta_primary} onChange={(e) => setForm({ ...form, hero_cta_primary: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Secondary CTA</Label>
                  <Input value={form.hero_cta_secondary} onChange={(e) => setForm({ ...form, hero_cta_secondary: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hero Background Image</Label>
                <ImageUpload bucket="banners" folder="landing" value={form.hero_bg_url} onUploaded={(url) => setForm({ ...form, hero_bg_url: url })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
              <CardDescription>Highlight key selling points</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.features.map((f, i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-secondary/30">
                  <select value={f.icon} onChange={(e) => updateFeature(i, "icon", e.target.value)} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm">
                    {iconOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                  <Input value={f.title} onChange={(e) => updateFeature(i, "title", e.target.value)} placeholder="Title" className="flex-1" />
                  <Input value={f.desc} onChange={(e) => updateFeature(i, "desc", e.target.value)} placeholder="Description" className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeFeature(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFeature}><Plus className="w-4 h-4 mr-1" /> Add Feature</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats">
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
              <CardDescription>Show impressive numbers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.stats.map((s, i) => (
                <div key={i} className="flex gap-3 items-center p-3 rounded-xl bg-secondary/30">
                  <Input value={s.value} onChange={(e) => updateStat(i, "value", e.target.value)} placeholder="10K+" className="w-32" />
                  <Input value={s.label} onChange={(e) => updateStat(i, "label", e.target.value)} placeholder="Products" className="flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeStat(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addStat}><Plus className="w-4 h-4 mr-1" /> Add Stat</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials">
          <Card>
            <CardHeader>
              <CardTitle>Testimonials</CardTitle>
              <CardDescription>Customer reviews on the landing page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {form.testimonials.map((t, i) => (
                <div key={i} className="p-3 rounded-xl bg-secondary/30 space-y-2">
                  <div className="flex gap-3">
                    <Input value={t.name} onChange={(e) => updateTestimonial(i, "name", e.target.value)} placeholder="Customer name" className="w-48" />
                    <select value={t.rating} onChange={(e) => updateTestimonial(i, "rating", Number(e.target.value))} className="bg-background border border-border rounded-lg px-2 py-1.5 text-sm">
                      {[1,2,3,4,5].map((r) => <option key={r} value={r}>{r} stars</option>)}
                    </select>
                    <Button variant="ghost" size="icon" onClick={() => removeTestimonial(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                  <Textarea value={t.text} onChange={(e) => updateTestimonial(i, "text", e.target.value)} placeholder="What they said..." rows={2} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addTestimonial}><Plus className="w-4 h-4 mr-1" /> Add Testimonial</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta">
          <Card>
            <CardHeader>
              <CardTitle>Call to Action</CardTitle>
              <CardDescription>Bottom CTA section</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>CTA Title</Label>
                <Input value={form.cta_title} onChange={(e) => setForm({ ...form, cta_title: e.target.value })} placeholder="Ready to Start Shopping?" />
              </div>
              <div className="space-y-2">
                <Label>CTA Subtitle</Label>
                <Input value={form.cta_subtitle} onChange={(e) => setForm({ ...form, cta_subtitle: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input value={form.cta_button} onChange={(e) => setForm({ ...form, cta_button: e.target.value })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle>Section Visibility</CardTitle>
              <CardDescription>Toggle sections on/off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: "show_stats", label: "Stats Section" },
                { key: "show_features", label: "Features Section" },
                { key: "show_categories", label: "Categories Preview" },
                { key: "show_testimonials", label: "Testimonials" },
                { key: "show_cta", label: "CTA Section" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <p className="text-sm font-medium">{label}</p>
                  <Switch checked={(form as any)[key]} onCheckedChange={(v) => setForm({ ...form, [key]: v })} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLanding;
