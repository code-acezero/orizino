import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/lib/app-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical, Tag, Clock, Sparkles, Image, Bell, Layout } from "lucide-react";
import { useDragReorder } from "@/hooks/use-drag-reorder";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import ImageUpload from "@/components/ImageUpload";

interface LayoutConfig {
  section_spacing: string;
  container_max_width: string;
  section_animation: string;
  animation_delay: number;
  show_section_dividers: boolean;
  divider_style: string;
  featured_bg: string;
  arrivals_bg: string;
  categories_bg: string;
  featured_columns: number;
  arrivals_columns: number;
  card_style: string;
  section_title_size: string;
  section_title_align: string;
  page_bg: string;
  page_bg_pattern: string;
}

const defaultLayoutConfig: LayoutConfig = {
  section_spacing: "16",
  container_max_width: "1440px",
  section_animation: "fade-up",
  animation_delay: 0.05,
  show_section_dividers: false,
  divider_style: "line",
  featured_bg: "none",
  arrivals_bg: "none",
  categories_bg: "none",
  featured_columns: 4,
  arrivals_columns: 4,
  card_style: "default",
  section_title_size: "3xl",
  section_title_align: "left",
  page_bg: "none",
  page_bg_pattern: "none",
};

interface SaleConfig {
  id: string;
  enabled: boolean;
  title: string;
  subtitle: string;
  icon: string;
  custom_icon_url: string;
  banner_image: string;
  color: string;
  button_text: string;
  button_link: string;
  position: string;
  starts_at: string;
  ends_at: string;
  show_countdown: boolean;
  show_products: boolean;
  product_source: string;
  product_count: number;
  sort_order: number;
  trigger_popup: boolean;
}

const defaultSale = (): SaleConfig => ({
  id: crypto.randomUUID(),
  enabled: true,
  title: "Sale Live!",
  subtitle: "Limited time offer",
  icon: "⚡",
  custom_icon_url: "",
  banner_image: "",
  color: "280 70% 55%",
  button_text: "Shop Now",
  button_link: "/shop",
  position: "after-featured",
  starts_at: "",
  ends_at: "",
  show_countdown: false,
  show_products: false,
  product_source: "",
  product_count: 4,
  sort_order: 0,
  trigger_popup: false,
});

const iconOptions = ["⚡", "🔥", "💎", "🎯", "🏷️", "💥", "🌟", "❄️", "🎁", "🛒", "🎉", "💰", "🚀", "🎪"];
const colorOptions = [
  { label: "Primary", value: "var(--primary)" },
  { label: "Purple", value: "280 70% 55%" },
  { label: "Red", value: "0 85% 55%" },
  { label: "Orange", value: "25 95% 55%" },
  { label: "Gold", value: "45 90% 50%" },
  { label: "Green", value: "160 84% 45%" },
  { label: "Blue", value: "200 90% 50%" },
  { label: "Pink", value: "340 82% 55%" },
  { label: "Teal", value: "175 80% 40%" },
  { label: "Indigo", value: "240 70% 50%" },
];
const positionOptions = [
  { value: "after-slider", label: "After Showcase Slider" },
  { value: "after-categories", label: "After Categories" },
  { value: "after-featured", label: "After Featured" },
  { value: "after-arrivals", label: "After New Arrivals" },
  { value: "bottom", label: "Bottom" },
];

const AdminHome = () => {
  const qc = useQueryClient();

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug, is_featured, sort_order, is_active").is("parent_id", null).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-home-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, slug, is_featured, is_active, thumbnail, price").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: settingsRow } = useQuery({
    queryKey: ["admin-home-cat-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "home_category_sections").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: salesRow } = useQuery({
    queryKey: ["admin-sales-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "home_sales_config").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: arrivalsRow } = useQuery({
    queryKey: ["admin-new-arrivals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "home_new_arrivals").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: layoutRow } = useQuery({
    queryKey: ["admin-home-layout"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "home_layout_config").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [catSections, setCatSections] = useState<{ category_id: string; sort_order: number; product_count: number }[]>([]);
  const [sales, setSales] = useState<SaleConfig[]>([]);
  const [newArrivals, setNewArrivals] = useState({ enabled: true, title: "New Arrivals", subtitle: "Fresh drops just landed", product_count: 8 });
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({ ...defaultLayoutConfig });

  useEffect(() => {
    if (settingsRow?.value) {
      const val = settingsRow.value as any;
      const sections = val?.value ?? val;
      if (Array.isArray(sections)) setCatSections(sections);
    }
  }, [settingsRow]);

  useEffect(() => {
    if (salesRow?.value) {
      const val = salesRow.value as any;
      const config = val?.value ?? val;
      if (Array.isArray(config)) setSales(config);
    }
  }, [salesRow]);

  useEffect(() => {
    if (arrivalsRow?.value) {
      const val = arrivalsRow.value as any;
      const config = val?.value ?? val;
      if (config && typeof config === "object") setNewArrivals((prev) => ({ ...prev, ...config }));
    }
  }, [arrivalsRow]);

  useEffect(() => {
    if (layoutRow?.value) {
      const val = layoutRow.value as any;
      const config = val?.value ?? val;
      if (config && typeof config === "object") setLayoutConfig((prev) => ({ ...prev, ...config }));
    }
  }, [layoutRow]);

  const saveCatSections = useMutation({
    mutationFn: async (sections: typeof catSections) => {
      const jsonValue = { value: sections } as any;
      if (settingsRow) {
        await supabase.from("site_settings").update({ value: jsonValue }).eq("id", settingsRow.id);
      } else {
        await supabase.from("site_settings").insert({ key: "home_category_sections", value: jsonValue });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-home-cat-sections"] });
      qc.invalidateQueries({ queryKey: ["home-category-sections"] });
      toast.success("Category sections saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const saveSales = useMutation({
    mutationFn: async () => {
      const jsonValue = { value: sales } as any;
      if (salesRow) {
        await supabase.from("site_settings").update({ value: jsonValue }).eq("id", salesRow.id);
      } else {
        await supabase.from("site_settings").insert({ key: "home_sales_config", value: jsonValue });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sales-config"] });
      qc.invalidateQueries({ queryKey: ["home-sales-config"] });
      toast.success("Sale sections saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const saveNewArrivals = useMutation({
    mutationFn: async () => {
      const jsonValue = { value: newArrivals } as any;
      if (arrivalsRow) {
        await supabase.from("site_settings").update({ value: jsonValue }).eq("id", arrivalsRow.id);
      } else {
        await supabase.from("site_settings").insert({ key: "home_new_arrivals", value: jsonValue });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-new-arrivals"] });
      qc.invalidateQueries({ queryKey: ["home-new-arrivals"] });
      toast.success("New arrivals settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const saveLayout = useMutation({
    mutationFn: async () => {
      const jsonValue = { value: layoutConfig } as any;
      if (layoutRow) {
        await supabase.from("site_settings").update({ value: jsonValue }).eq("id", layoutRow.id);
      } else {
        await supabase.from("site_settings").insert({ key: "home_layout_config", value: jsonValue });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-home-layout"] });
      qc.invalidateQueries({ queryKey: ["home-layout-config"] });
      toast.success("Layout settings saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const addSection = () => setCatSections([...catSections, { category_id: "", sort_order: catSections.length, product_count: 8 }]);
  const removeSection = (index: number) => setCatSections(catSections.filter((_, i) => i !== index));
  const updateSection = (index: number, field: string, value: any) => {
    const updated = [...catSections];
    updated[index] = { ...updated[index], [field]: value };
    setCatSections(updated);
  };

  const addSale = () => setSales([...sales, defaultSale()]);
  const removeSale = (id: string) => setSales(sales.filter((s) => s.id !== id));
  const updateSale = (id: string, field: string, value: any) => {
    setSales(sales.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const toggleCatFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      await supabase.from("categories").update({ is_featured }).eq("id", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-home-categories"] }); toast.success("Updated"); },
  });

  const updateCatOrder = useMutation({
    mutationFn: async ({ id, sort_order }: { id: string; sort_order: number }) => {
      await supabase.from("categories").update({ sort_order }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-home-categories"] }),
  });

  const toggleProdFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      await supabase.from("products").update({ is_featured }).eq("id", id);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-home-products"] }); toast.success("Updated"); },
  });

  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name || "Unknown";
  const availableCategories = categories.filter((c) => !catSections.some((s) => s.category_id === c.id));

  const getSaleColor = (sale: SaleConfig) => sale.color?.startsWith("var") ? `hsl(var(--primary))` : `hsl(${sale.color})`;

  const handleCatReorder = useCallback((reordered: typeof catSections) => {
    setCatSections(reordered.map((s, i) => ({ ...s, sort_order: i })));
  }, []);

  const handleSaleReorder = useCallback((reordered: SaleConfig[]) => {
    setSales(reordered.map((s, i) => ({ ...s, sort_order: i })));
  }, []);

  const [localCategories, setLocalCategories] = useState(categories);
  const [localProducts, setLocalProducts] = useState(products);
  useEffect(() => { setLocalCategories(categories); }, [categories]);
  useEffect(() => { setLocalProducts(products); }, [products]);

  const handleFeatCatReorder = useCallback(async (reordered: typeof categories) => {
    setLocalCategories(reordered);
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from("categories").update({ sort_order: i }).eq("id", reordered[i].id);
    }
    qc.invalidateQueries({ queryKey: ["admin-home-categories"] });
  }, [qc]);

  const handleFeatProdReorder = useCallback((reordered: typeof products) => {
    setLocalProducts(reordered);
  }, []);

  const { dragIndex: catDragIdx, overIndex: catOverIdx, getDragProps: getCatDragProps } = useDragReorder(catSections, handleCatReorder);
  const { dragIndex: saleDragIdx, overIndex: saleOverIdx, getDragProps: getSaleDragProps } = useDragReorder(sales, handleSaleReorder);
  const { dragIndex: featCatDragIdx, overIndex: featCatOverIdx, getDragProps: getFeatCatDragProps } = useDragReorder(localCategories, handleFeatCatReorder);
  const { dragIndex: featProdDragIdx, overIndex: featProdOverIdx, getDragProps: getFeatProdDragProps } = useDragReorder(localProducts, handleFeatProdReorder);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Home Page Management</h1>

      <Tabs defaultValue="cat-sections">
        <TabsList className="flex-wrap">
          <TabsTrigger value="cat-sections">Category Sections</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="new-arrivals">New Arrivals</TabsTrigger>
          <TabsTrigger value="layout">Layout & Style</TabsTrigger>
          <TabsTrigger value="categories">Featured Categories</TabsTrigger>
          <TabsTrigger value="products">Featured Products</TabsTrigger>
        </TabsList>

        {/* Category Sections */}
        <TabsContent value="cat-sections">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Home Category Product Sections</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Choose which categories display their products on the home page.</p>
                </div>
                <Button onClick={addSection} size="sm" disabled={availableCategories.length === 0}>
                  <Plus className="w-4 h-4 mr-1" />Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {catSections.length === 0 && <p className="text-center text-muted-foreground py-8">No category sections added yet.</p>}
              {catSections.map((section, index) => (
                <div key={index} {...getCatDragProps(index)} className={`flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20 cursor-grab active:cursor-grabbing transition-colors ${catOverIdx === index && catDragIdx !== index ? "border-primary bg-primary/10" : ""}`}>
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Select value={section.category_id} onValueChange={(v) => updateSection(index, "category_id", v)}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {section.category_id && <SelectItem value={section.category_id}>{getCatName(section.category_id)}</SelectItem>}
                          {availableCategories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Position</Label>
                      <Input type="number" value={section.sort_order} onChange={(e) => updateSection(index, "sort_order", Number(e.target.value))} />
                    </div>
                    <div>
                      <Label className="text-xs">Products to Show</Label>
                      <Input type="number" value={section.product_count} onChange={(e) => updateSection(index, "product_count", Number(e.target.value))} min={1} max={20} />
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeSection(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              {catSections.length > 0 && (
                <Button className="w-full" onClick={() => saveCatSections.mutate(catSections)} disabled={saveCatSections.isPending}>
                  {saveCatSections.isPending ? "Saving..." : "Save Category Sections"}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales (multi) */}
        <TabsContent value="sales">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                    <Tag className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <CardTitle>Sale Banners</CardTitle>
                    <p className="text-sm text-muted-foreground">Add multiple customizable sale sections to the home page.</p>
                  </div>
                </div>
                <Button onClick={addSale} size="sm"><Plus className="w-4 h-4 mr-1" />Add Sale</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {sales.length === 0 && <p className="text-center text-muted-foreground py-8">No sale sections added. Click "Add Sale" to create one.</p>}

              {sales.map((sale, idx) => (
                <div key={sale.id} {...getSaleDragProps(idx)} className={`border border-border rounded-2xl p-4 space-y-4 bg-secondary/10 cursor-grab active:cursor-grabbing transition-colors ${saleOverIdx === idx && saleDragIdx !== idx ? "border-primary bg-primary/10" : ""}`}>
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                      {sale.custom_icon_url ? <img src={sale.custom_icon_url} className="w-6 h-6 object-contain" alt="" /> : <span className="text-xl">{sale.icon}</span>}
                      Sale #{idx + 1}: {sale.title || "Untitled"}
                    </h4>
                    <div className="flex items-center gap-2">
                      <Switch checked={sale.enabled} onCheckedChange={(v) => updateSale(sale.id, "enabled", v)} />
                      <Button size="icon" variant="ghost" onClick={() => removeSale(sale.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><Label>Title</Label><Input value={sale.title} onChange={(e) => updateSale(sale.id, "title", e.target.value)} /></div>
                    <div><Label>Subtitle</Label><Input value={sale.subtitle} onChange={(e) => updateSale(sale.id, "subtitle", e.target.value)} /></div>
                  </div>

                  {/* Icon, Color, Sort, Position */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <Label>Emoji Icon</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {iconOptions.map((ic) => (
                          <button key={ic} onClick={() => updateSale(sale.id, "icon", ic)}
                            className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center border transition-all ${sale.icon === ic ? "border-primary bg-primary/10" : "border-border hover:border-primary/30"}`}>
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Color</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {colorOptions.map((c) => (
                          <button key={c.value} onClick={() => updateSale(sale.id, "color", c.value)}
                            className={`w-6 h-6 rounded-full border-2 transition-all ${sale.color === c.value ? "border-foreground scale-110" : "border-transparent"}`}
                            style={{ background: c.value.startsWith("var") ? `hsl(var(--primary))` : `hsl(${c.value})` }}
                            title={c.label} />
                        ))}
                      </div>
                    </div>
                    <div><Label>Sort Order</Label><Input type="number" value={sale.sort_order} onChange={(e) => updateSale(sale.id, "sort_order", Number(e.target.value))} /></div>
                    <div>
                      <Label>Position</Label>
                      <Select value={sale.position} onValueChange={(v) => updateSale(sale.id, "position", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {positionOptions.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Custom Icon Upload & Banner Image */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-1"><Image className="w-3 h-3" /> Custom Icon (optional, overrides emoji)</Label>
                      <ImageUpload bucket="banners" folder="sale-icons" value={sale.custom_icon_url || ""} onUploaded={(url) => updateSale(sale.id, "custom_icon_url", url)} />
                      {sale.custom_icon_url && <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => updateSale(sale.id, "custom_icon_url", "")}>Remove custom icon</Button>}
                    </div>
                    <div>
                      <Label className="flex items-center gap-1"><Image className="w-3 h-3" /> Banner Image (optional background)</Label>
                      <ImageUpload bucket="banners" folder="sale-banners" value={sale.banner_image || ""} onUploaded={(url) => updateSale(sale.id, "banner_image", url)} />
                      {sale.banner_image && <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => updateSale(sale.id, "banner_image", "")}>Remove banner</Button>}
                    </div>
                  </div>

                  {/* Button */}
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Button Text</Label><Input value={sale.button_text} onChange={(e) => updateSale(sale.id, "button_text", e.target.value)} /></div>
                    <div><Label>Button Link</Label><Input value={sale.button_link} onChange={(e) => updateSale(sale.id, "button_link", e.target.value)} /></div>
                  </div>

                  {/* Time limits */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center gap-1"><Clock className="w-3 h-3" /> Starts At (optional)</Label>
                      <Input type="datetime-local" value={sale.starts_at} onChange={(e) => updateSale(sale.id, "starts_at", e.target.value)} />
                    </div>
                    <div>
                      <Label className="flex items-center gap-1"><Clock className="w-3 h-3" /> Ends At (optional)</Label>
                      <Input type="datetime-local" value={sale.ends_at} onChange={(e) => updateSale(sale.id, "ends_at", e.target.value)} />
                    </div>
                  </div>

                  {/* Toggles row */}
                  <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch checked={sale.show_countdown} onCheckedChange={(v) => updateSale(sale.id, "show_countdown", v)} />
                      <Label className="text-sm">Show Countdown Timer</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={sale.trigger_popup} onCheckedChange={(v) => updateSale(sale.id, "trigger_popup", v)} />
                      <Label className="text-sm flex items-center gap-1"><Bell className="w-3 h-3" /> Trigger Popup on Visit</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={sale.show_products} onCheckedChange={(v) => updateSale(sale.id, "show_products", v)} />
                      <Label className="text-sm">Show Product Row</Label>
                    </div>
                  </div>

                  {/* Product source */}
                  {sale.show_products && (
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <Select value={sale.product_source} onValueChange={(v) => updateSale(sale.id, "product_source", v)}>
                          <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="featured">Featured Products</SelectItem>
                            <SelectItem value="latest">Latest Products</SelectItem>
                            {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-20">
                        <Input type="number" value={sale.product_count} onChange={(e) => updateSale(sale.id, "product_count", Number(e.target.value))} min={1} max={12} />
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
                    <div className="rounded-2xl p-5 relative overflow-hidden" style={sale.banner_image ? { backgroundImage: `url(${sale.banner_image})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                      <div className="absolute inset-0 opacity-20" style={{ background: sale.color.startsWith("var") ? `hsl(var(--primary))` : `linear-gradient(135deg, hsl(${sale.color}), hsl(${sale.color} / 0.6))` }} />
                      {sale.banner_image && <div className="absolute inset-0 bg-background/60" />}
                      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {sale.custom_icon_url ? (
                            <img src={sale.custom_icon_url} className="w-10 h-10 object-contain" alt="" />
                          ) : (
                            <span className="text-2xl">{sale.icon}</span>
                          )}
                          <div>
                            <h4 className="text-lg font-bold font-display text-foreground">{sale.title || "Sale"}</h4>
                            <p className="text-sm text-muted-foreground">{sale.subtitle || "Limited time"}</p>
                            {sale.show_countdown && sale.ends_at && <p className="text-xs text-primary font-mono mt-1">⏱ Countdown will show here</p>}
                          </div>
                        </div>
                        <span className="btn-pill font-semibold px-6 py-2 text-sm text-white" style={{ background: getSaleColor(sale) }}>
                          {sale.button_text || "Shop Now"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {sales.length > 0 && (
                <Button className="w-full" onClick={() => saveSales.mutate()} disabled={saveSales.isPending}>
                  {saveSales.isPending ? "Saving..." : "Save All Sales"}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Arrivals */}
        <TabsContent value="new-arrivals">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle>New Arrivals Section</CardTitle>
                  <p className="text-sm text-muted-foreground">Show the latest added products on the home page.</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Show New Arrivals</Label>
                <Switch checked={newArrivals.enabled} onCheckedChange={(v) => setNewArrivals({ ...newArrivals, enabled: v })} />
              </div>
              <div><Label>Title</Label><Input value={newArrivals.title} onChange={(e) => setNewArrivals({ ...newArrivals, title: e.target.value })} /></div>
              <div><Label>Subtitle</Label><Input value={newArrivals.subtitle} onChange={(e) => setNewArrivals({ ...newArrivals, subtitle: e.target.value })} /></div>
              <div><Label>Number of Products</Label><Input type="number" value={newArrivals.product_count} onChange={(e) => setNewArrivals({ ...newArrivals, product_count: Number(e.target.value) })} min={1} max={20} /></div>
              <Button className="w-full" onClick={() => saveNewArrivals.mutate()} disabled={saveNewArrivals.isPending}>
                {saveNewArrivals.isPending ? "Saving..." : "Save New Arrivals"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Categories on Home Page</CardTitle>
              <p className="text-sm text-muted-foreground">Toggle which categories appear in the "Shop by Category" section. Drag to reorder.</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-8"></TableHead><TableHead>Name</TableHead><TableHead>Sort Order</TableHead><TableHead>Featured</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {categories.map((cat, idx) => (
                    <TableRow key={cat.id} {...getFeatCatDragProps(idx)} className={`cursor-grab active:cursor-grabbing transition-colors ${featCatOverIdx === idx && featCatDragIdx !== idx ? "bg-primary/10" : ""}`}>
                      <TableCell><GripVertical className="w-4 h-4 text-muted-foreground" /></TableCell>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>{cat.sort_order}</TableCell>
                      <TableCell><Switch checked={cat.is_featured} onCheckedChange={(v) => toggleCatFeatured.mutate({ id: cat.id, is_featured: v })} /></TableCell>
                      <TableCell><Badge variant={cat.is_active ? "default" : "secondary"}>{cat.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Products on Home Page</CardTitle>
              <p className="text-sm text-muted-foreground">Toggle which products appear in the "Featured Products" section. Drag to reorder.</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="w-8"></TableHead><TableHead>Image</TableHead><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Featured</TableHead><TableHead>Status</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {localProducts.map((prod, idx) => (
                    <TableRow key={prod.id} {...getFeatProdDragProps(idx)} className={`cursor-grab active:cursor-grabbing transition-colors ${featProdOverIdx === idx && featProdDragIdx !== idx ? "bg-primary/10" : ""}`}>
                      <TableCell><GripVertical className="w-4 h-4 text-muted-foreground" /></TableCell>
                      <TableCell>{prod.thumbnail && <img src={prod.thumbnail} alt="" className="w-10 h-10 object-cover rounded-lg" />}</TableCell>
                      <TableCell className="font-medium">{prod.name}</TableCell>
                      <TableCell>${Number(prod.price).toFixed(2)}</TableCell>
                      <TableCell><Switch checked={prod.is_featured} onCheckedChange={(v) => toggleProdFeatured.mutate({ id: prod.id, is_featured: v })} /></TableCell>
                      <TableCell><Badge variant={prod.is_active ? "default" : "secondary"}>{prod.is_active ? "Active" : "Inactive"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Layout & Style */}
        <TabsContent value="layout">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spacing & Container */}
            <Card className="glass">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Layout className="w-5 h-5" /> Spacing & Container</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Section Spacing (Tailwind gap): {layoutConfig.section_spacing}</Label>
                  <Select value={layoutConfig.section_spacing} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, section_spacing: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="8">Compact (8 / 2rem)</SelectItem>
                      <SelectItem value="12">Normal (12 / 3rem)</SelectItem>
                      <SelectItem value="16">Spacious (16 / 4rem)</SelectItem>
                      <SelectItem value="20">Wide (20 / 5rem)</SelectItem>
                      <SelectItem value="24">Extra Wide (24 / 6rem)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Container Max Width</Label>
                  <Select value={layoutConfig.container_max_width} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, container_max_width: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1200px">Narrow (1200px)</SelectItem>
                      <SelectItem value="1440px">Default (1440px)</SelectItem>
                      <SelectItem value="1600px">Wide (1600px)</SelectItem>
                      <SelectItem value="100%">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Section Dividers</Label>
                  <Switch checked={layoutConfig.show_section_dividers} onCheckedChange={(v) => setLayoutConfig({ ...layoutConfig, show_section_dividers: v })} />
                </div>
                {layoutConfig.show_section_dividers && (
                  <div>
                    <Label>Divider Style</Label>
                    <Select value={layoutConfig.divider_style} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, divider_style: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Thin Line</SelectItem>
                        <SelectItem value="dashed">Dashed</SelectItem>
                        <SelectItem value="gradient">Gradient Fade</SelectItem>
                        <SelectItem value="dots">Dotted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Animations */}
            <Card className="glass">
              <CardHeader><CardTitle className="text-lg">Animations</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Section Entrance Animation</Label>
                  <Select value={layoutConfig.section_animation} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, section_animation: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="fade-up">Fade Up</SelectItem>
                      <SelectItem value="fade-in">Fade In</SelectItem>
                      <SelectItem value="scale-up">Scale Up</SelectItem>
                      <SelectItem value="slide-left">Slide from Left</SelectItem>
                      <SelectItem value="slide-right">Slide from Right</SelectItem>
                      <SelectItem value="stagger">Stagger Children</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Animation Stagger Delay: {layoutConfig.animation_delay}s</Label>
                  <Slider value={[layoutConfig.animation_delay]} onValueChange={([v]) => setLayoutConfig({ ...layoutConfig, animation_delay: v })} min={0} max={0.2} step={0.01} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Section Backgrounds */}
            <Card className="glass">
              <CardHeader><CardTitle className="text-lg">Section Backgrounds</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {[
                  { key: "categories_bg" as const, label: "Categories Section" },
                  { key: "featured_bg" as const, label: "Featured Products Section" },
                  { key: "arrivals_bg" as const, label: "New Arrivals Section" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Select value={layoutConfig[key]} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, [key]: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Transparent</SelectItem>
                        <SelectItem value="subtle">Subtle Tint</SelectItem>
                        <SelectItem value="glass">Glassmorphism</SelectItem>
                        <SelectItem value="primary-tint">Primary Color Tint</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="dark">Dark Panel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div>
                  <Label>Page Background Pattern</Label>
                  <Select value={layoutConfig.page_bg_pattern} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, page_bg_pattern: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="dots">Dots</SelectItem>
                      <SelectItem value="grid">Grid</SelectItem>
                      <SelectItem value="diagonal">Diagonal Lines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Grid & Typography */}
            <Card className="glass">
              <CardHeader><CardTitle className="text-lg">Grid & Typography</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <Label>Featured Products Columns (desktop)</Label>
                  <Select value={String(layoutConfig.featured_columns)} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, featured_columns: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                      <SelectItem value="5">5 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>New Arrivals Columns (desktop)</Label>
                  <Select value={String(layoutConfig.arrivals_columns)} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, arrivals_columns: Number(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 Columns</SelectItem>
                      <SelectItem value="4">4 Columns</SelectItem>
                      <SelectItem value="5">5 Columns</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section Title Size</Label>
                  <Select value={layoutConfig.section_title_size} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, section_title_size: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2xl">Small (2xl)</SelectItem>
                      <SelectItem value="3xl">Medium (3xl)</SelectItem>
                      <SelectItem value="4xl">Large (4xl)</SelectItem>
                      <SelectItem value="5xl">Extra Large (5xl)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Section Title Alignment</Label>
                  <Select value={layoutConfig.section_title_align} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, section_title_align: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Product Card Style</Label>
                  <Select value={layoutConfig.card_style} onValueChange={(v) => setLayoutConfig({ ...layoutConfig, card_style: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                      <SelectItem value="bordered">Bordered</SelectItem>
                      <SelectItem value="elevated">Elevated Shadow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button className="w-full mt-6" onClick={() => saveLayout.mutate()} disabled={saveLayout.isPending}>
            {saveLayout.isPending ? "Saving..." : "Save Layout Settings"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHome;
