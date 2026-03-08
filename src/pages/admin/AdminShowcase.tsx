import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ImageUpload from "@/components/ImageUpload";
import { toast } from "@/lib/app-toast";
import { Plus, Pencil, Trash2, Settings2, Layers, GripVertical, Copy, Link2, Palette, Sparkles } from "lucide-react";
import { useDragReorder } from "@/hooks/use-drag-reorder";

interface ShowcaseConfig {
  autoplay_speed: number;
  transition_duration: number;
  height: string;
  overlay_style: string;
  overlay_opacity: number;
  text_position: string;
  text_max_width: string;
  ken_burns: boolean;
  show_dots: boolean;
  show_arrows: boolean;
  dot_style: string;
  title_size: string;
  subtitle_style: string;
  cta_style: string;
  border_radius: string;
  autoplay: boolean;
  pause_on_hover: boolean;
  transition_type: string;
  parallax_intensity: number;
  content_animation: string;
  slide_gap: string;
}

const defaultConfig: ShowcaseConfig = {
  autoplay_speed: 6000,
  transition_duration: 800,
  height: "85vh",
  overlay_style: "gradient-left",
  overlay_opacity: 80,
  text_position: "left",
  text_max_width: "2xl",
  ken_burns: true,
  show_dots: true,
  show_arrows: true,
  dot_style: "pill",
  title_size: "7xl",
  subtitle_style: "badge",
  cta_style: "gradient",
  border_radius: "3xl",
  autoplay: true,
  pause_on_hover: true,
  transition_type: "fade",
  parallax_intensity: 20,
  content_animation: "slide-up",
  slide_gap: "0",
};

const emptySlide = {
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  cta_text: "Shop Now",
  cta_link: "/shop",
  sort_order: 0,
  is_active: true,
  text_color: "",
  transition_type: "fade",
  product_id: null as string | null,
};

const AdminShowcase = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [config, setConfig] = useState<ShowcaseConfig>({ ...defaultConfig });

  const { data: slides = [] } = useQuery({
    queryKey: ["admin-showcase"],
    queryFn: async () => {
      const { data, error } = await supabase.from("showcase_slides").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, thumbnail, slug").eq("is_active", true).order("name").limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: configRow } = useQuery({
    queryKey: ["admin-showcase-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "showcase_config").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (configRow?.value) {
      const val = configRow.value as any;
      const c = val?.value ?? val;
      if (c && typeof c === "object") setConfig((prev) => ({ ...prev, ...c }));
    }
  }, [configRow]);

  const saveMutation = useMutation({
    mutationFn: async (slide: any) => {
      const { id, created_at, ...rest } = slide;
      if (id) {
        const { error } = await supabase.from("showcase_slides").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("showcase_slides").insert(rest);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-showcase"] });
      qc.invalidateQueries({ queryKey: ["showcase-slides"] });
      setDialogOpen(false);
      toast.success("Slide saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("showcase_slides").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-showcase"] });
      qc.invalidateQueries({ queryKey: ["showcase-slides"] });
      toast.success("Slide deleted");
    },
  });

  const saveConfig = useMutation({
    mutationFn: async () => {
      const jsonValue = { value: config } as any;
      if (configRow) {
        await supabase.from("site_settings").update({ value: jsonValue }).eq("id", configRow.id);
      } else {
        await supabase.from("site_settings").insert({ key: "showcase_config", value: jsonValue });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-showcase-config"] });
      qc.invalidateQueries({ queryKey: ["showcase-config"] });
      toast.success("Showcase settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const openEdit = (slide?: any) => {
    setEditing(slide ? { ...slide } : { ...emptySlide, sort_order: slides.length });
    setDialogOpen(true);
  };

  const duplicateSlide = (slide: any) => {
    const { id, created_at, ...rest } = slide;
    setEditing({ ...rest, title: `${rest.title} (copy)`, sort_order: slides.length });
    setDialogOpen(true);
  };

  const reorderSlides = async (reordered: any[]) => {
    const updated = reordered.map((s, i) => ({ ...s, sort_order: i }));
    qc.setQueryData(["admin-showcase"], updated);
    for (const s of updated) {
      await supabase.from("showcase_slides").update({ sort_order: s.sort_order }).eq("id", s.id);
    }
    qc.invalidateQueries({ queryKey: ["admin-showcase"] });
    qc.invalidateQueries({ queryKey: ["showcase-slides"] });
  };

  const { dragIndex: slideDragIdx, overIndex: slideOverIdx, getDragProps: getSlideDragProps } = useDragReorder(slides, reorderSlides);

  const linkedProduct = (productId: string | null) => {
    if (!productId) return null;
    return products.find((p) => p.id === productId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Showcase Slider</h1>
          <p className="text-sm text-muted-foreground mt-1">{slides.length} slide{slides.length !== 1 ? "s" : ""} · {slides.filter(s => s.is_active).length} active</p>
        </div>
        <Button onClick={() => openEdit()}><Plus className="w-4 h-4 mr-2" />Add Slide</Button>
      </div>

      <Tabs defaultValue="slides">
        <TabsList>
          <TabsTrigger value="slides" className="flex items-center gap-1"><Layers className="w-4 h-4" /> Slides</TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1"><Settings2 className="w-4 h-4" /> Settings</TabsTrigger>
          <TabsTrigger value="effects" className="flex items-center gap-1"><Sparkles className="w-4 h-4" /> Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="slides">
          <Card className="glass">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Linked Product</TableHead>
                    <TableHead>Transition</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slides.map((slide: any, idx) => {
                    const product = linkedProduct(slide.product_id);
                    return (
                      <TableRow
                        key={slide.id}
                        {...getSlideDragProps(idx)}
                        className={`cursor-grab active:cursor-grabbing transition-colors ${slideOverIdx === idx && slideDragIdx !== idx ? "bg-primary/10" : ""}`}
                      >
                        <TableCell><GripVertical className="w-4 h-4 text-muted-foreground" /></TableCell>
                        <TableCell>
                          {slide.image_url && <img src={slide.image_url} alt="" className="w-20 h-12 object-cover rounded-lg" />}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{slide.title}</p>
                            {slide.subtitle && <p className="text-xs text-muted-foreground">{slide.subtitle}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {product ? (
                            <div className="flex items-center gap-2">
                              <Link2 className="w-3 h-3 text-primary" />
                              <span className="text-xs">{product.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{slide.transition_type || "fade"}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={slide.is_active ? "text-primary" : "text-muted-foreground"}>{slide.is_active ? "✓" : "✗"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(slide)} title="Edit"><Pencil className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => duplicateSlide(slide)} title="Duplicate"><Copy className="w-4 h-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" title="Delete"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete slide?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete "{slide.title}". This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(slide.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {slides.length === 0 && (
                    <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No slides yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Timing & Animation */}
            <Card className="glass">
              <CardHeader><CardTitle className="text-lg">Timing & Playback</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <Label>Autoplay</Label>
                  <Switch checked={config.autoplay} onCheckedChange={(v) => setConfig({ ...config, autoplay: v })} />
                </div>
                <div>
                  <Label>Autoplay Speed: {(config.autoplay_speed / 1000).toFixed(1)}s</Label>
                  <Slider value={[config.autoplay_speed]} onValueChange={([v]) => setConfig({ ...config, autoplay_speed: v })} min={2000} max={15000} step={500} className="mt-2" />
                </div>
                <div>
                  <Label>Transition Duration: {config.transition_duration}ms</Label>
                  <Slider value={[config.transition_duration]} onValueChange={([v]) => setConfig({ ...config, transition_duration: v })} min={200} max={2000} step={100} className="mt-2" />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Pause on Hover</Label>
                  <Switch checked={config.pause_on_hover} onCheckedChange={(v) => setConfig({ ...config, pause_on_hover: v })} />
                </div>
              </CardContent>
            </Card>

            {/* Layout */}
            <Card className="glass">
              <CardHeader><CardTitle className="text-lg">Layout & Dimensions</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Height</Label>
                  <Select value={config.height} onValueChange={(v) => setConfig({ ...config, height: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="60vh">Short (60vh)</SelectItem>
                      <SelectItem value="70vh">Medium (70vh)</SelectItem>
                      <SelectItem value="85vh">Tall (85vh)</SelectItem>
                      <SelectItem value="100vh">Full Screen (100vh)</SelectItem>
                      <SelectItem value="500px">500px Fixed</SelectItem>
                      <SelectItem value="700px">700px Fixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Border Radius</Label>
                  <Select value={config.border_radius} onValueChange={(v) => setConfig({ ...config, border_radius: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="xl">Small (xl)</SelectItem>
                      <SelectItem value="2xl">Medium (2xl)</SelectItem>
                      <SelectItem value="3xl">Large (3xl)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Text Position</Label>
                  <Select value={config.text_position} onValueChange={(v) => setConfig({ ...config, text_position: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Text Max Width</Label>
                  <Select value={config.text_max_width} onValueChange={(v) => setConfig({ ...config, text_max_width: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lg">Narrow (lg)</SelectItem>
                      <SelectItem value="xl">Medium (xl)</SelectItem>
                      <SelectItem value="2xl">Wide (2xl)</SelectItem>
                      <SelectItem value="4xl">Extra Wide (4xl)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Overlay & Style */}
            <Card className="glass">
              <CardHeader><CardTitle className="text-lg">Overlay & Style</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Overlay Style</Label>
                  <Select value={config.overlay_style} onValueChange={(v) => setConfig({ ...config, overlay_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gradient-left">Gradient Left</SelectItem>
                      <SelectItem value="gradient-right">Gradient Right</SelectItem>
                      <SelectItem value="gradient-bottom">Gradient Bottom</SelectItem>
                      <SelectItem value="gradient-center">Gradient Center (Vignette)</SelectItem>
                      <SelectItem value="solid">Solid Overlay</SelectItem>
                      <SelectItem value="none">No Overlay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Overlay Opacity: {config.overlay_opacity}%</Label>
                  <Slider value={[config.overlay_opacity]} onValueChange={([v]) => setConfig({ ...config, overlay_opacity: v })} min={0} max={100} step={5} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Typography & Controls */}
            <Card className="glass">
              <CardHeader><CardTitle className="text-lg">Typography & Controls</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Title Size</Label>
                  <Select value={config.title_size} onValueChange={(v) => setConfig({ ...config, title_size: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4xl">Small (4xl)</SelectItem>
                      <SelectItem value="5xl">Medium (5xl)</SelectItem>
                      <SelectItem value="6xl">Large (6xl)</SelectItem>
                      <SelectItem value="7xl">Extra Large (7xl)</SelectItem>
                      <SelectItem value="8xl">Huge (8xl)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Subtitle Style</Label>
                  <Select value={config.subtitle_style} onValueChange={(v) => setConfig({ ...config, subtitle_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="badge">Badge / Pill</SelectItem>
                      <SelectItem value="text">Plain Text</SelectItem>
                      <SelectItem value="underline">Underlined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CTA Button Style</Label>
                  <Select value={config.cta_style} onValueChange={(v) => setConfig({ ...config, cta_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Navigation Dots</Label>
                  <Switch checked={config.show_dots} onCheckedChange={(v) => setConfig({ ...config, show_dots: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Arrows</Label>
                  <Switch checked={config.show_arrows} onCheckedChange={(v) => setConfig({ ...config, show_arrows: v })} />
                </div>
                <div>
                  <Label>Dot Style</Label>
                  <Select value={config.dot_style} onValueChange={(v) => setConfig({ ...config, dot_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pill">Pill (expanding)</SelectItem>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="dash">Dash</SelectItem>
                      <SelectItem value="number">Numbered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button className="w-full mt-6" onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
            {saveConfig.isPending ? "Saving..." : "Save Showcase Settings"}
          </Button>
        </TabsContent>

        {/* New Effects Tab */}
        <TabsContent value="effects">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Transition Effects</CardTitle>
                <CardDescription>Global default transition applied to all slides (can be overridden per slide)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Default Transition Type</Label>
                  <Select value={config.transition_type} onValueChange={(v) => setConfig({ ...config, transition_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="flip">Flip</SelectItem>
                      <SelectItem value="blur">Blur Fade</SelectItem>
                      <SelectItem value="cube">Cube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Content Animation</Label>
                  <Select value={config.content_animation} onValueChange={(v) => setConfig({ ...config, content_animation: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slide-up">Slide Up</SelectItem>
                      <SelectItem value="slide-left">Slide Left</SelectItem>
                      <SelectItem value="fade-in">Fade In</SelectItem>
                      <SelectItem value="scale-up">Scale Up</SelectItem>
                      <SelectItem value="typewriter">Typewriter</SelectItem>
                      <SelectItem value="none">No Animation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-lg">Visual Effects</CardTitle>
                <CardDescription>Parallax and image effects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <Label>Ken Burns Effect (zoom)</Label>
                  <Switch checked={config.ken_burns} onCheckedChange={(v) => setConfig({ ...config, ken_burns: v })} />
                </div>
                <div>
                  <Label>Parallax Intensity: {config.parallax_intensity}%</Label>
                  <Slider value={[config.parallax_intensity]} onValueChange={([v]) => setConfig({ ...config, parallax_intensity: v })} min={0} max={50} step={5} className="mt-2" />
                </div>
                <div>
                  <Label>Slide Gap</Label>
                  <Select value={config.slide_gap} onValueChange={(v) => setConfig({ ...config, slide_gap: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No Gap</SelectItem>
                      <SelectItem value="4">Small (4px)</SelectItem>
                      <SelectItem value="8">Medium (8px)</SelectItem>
                      <SelectItem value="16">Large (16px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Live preview hint */}
            <Card className="glass lg:col-span-2 border-primary/20">
              <CardContent className="py-4 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  Changes are previewed in real-time on the homepage. Save your settings to persist them.
                </p>
              </CardContent>
            </Card>
          </div>

          <Button className="w-full mt-6" onClick={() => saveConfig.mutate()} disabled={saveConfig.isPending}>
            {saveConfig.isPending ? "Saving..." : "Save Effects Settings"}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Slide editor dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Slide" : "Add Slide"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-5">
              {/* Preview */}
              {editing.image_url && (
                <div className="relative rounded-xl overflow-hidden h-40 bg-secondary/30">
                  <img src={editing.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-background/60 to-transparent flex items-end p-4">
                    <div>
                      {editing.subtitle && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{editing.subtitle}</span>}
                      <h3 className="text-lg font-display font-bold mt-1" style={editing.text_color ? { color: editing.text_color } : undefined}>{editing.title || "Slide Title"}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Title</Label><Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
                <div><Label>Subtitle</Label><Input value={editing.subtitle || ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></div>
                <div>
                  <Label>Transition Override</Label>
                  <Select value={editing.transition_type || "fade"} onValueChange={(v) => setEditing({ ...editing, transition_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fade">Fade (default)</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="flip">Flip</SelectItem>
                      <SelectItem value="blur">Blur Fade</SelectItem>
                      <SelectItem value="cube">Cube</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Description</Label><Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div>
                <Label>Image</Label>
                <ImageUpload bucket="banners" folder="showcase" value={editing.image_url} onUploaded={(url) => setEditing({ ...editing, image_url: url })} />
              </div>

              {/* Product Linking */}
              <Card className="border-border/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-primary" />
                    <Label className="font-medium">Link to Product</Label>
                  </div>
                  <Select
                    value={editing.product_id || "none"}
                    onValueChange={(v) => {
                      const product = products.find(p => p.id === v);
                      setEditing({
                        ...editing,
                        product_id: v === "none" ? null : v,
                        cta_link: product ? `/product/${product.slug}` : editing.cta_link,
                      });
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="No product linked" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No product linked</SelectItem>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div><Label>CTA Text</Label><Input value={editing.cta_text || ""} onChange={(e) => setEditing({ ...editing, cta_text: e.target.value })} /></div>
                <div><Label>CTA Link</Label><Input value={editing.cta_link || ""} onChange={(e) => setEditing({ ...editing, cta_link: e.target.value })} /></div>
              </div>

              {/* Style overrides */}
              <Card className="border-border/50">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-accent" />
                    <Label className="font-medium">Style Overrides</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Text Color (hex)</Label>
                      <div className="flex gap-2 items-center">
                        <Input
                          value={editing.text_color || ""}
                          onChange={(e) => setEditing({ ...editing, text_color: e.target.value })}
                          placeholder="e.g. #ffffff"
                          className="flex-1"
                        />
                        {editing.text_color && (
                          <div className="w-8 h-8 rounded-lg border border-border" style={{ backgroundColor: editing.text_color }} />
                        )}
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Sort Order</Label>
                        <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center gap-2">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Active</Label>
              </div>
              <Button className="w-full" onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Slide"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShowcase;
