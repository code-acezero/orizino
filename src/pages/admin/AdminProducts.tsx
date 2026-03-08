import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Search, X, LayoutTemplate } from "lucide-react";
import { toast } from "@/lib/app-toast";
import ImageUpload from "@/components/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const PRODUCT_TYPES = [
  { value: "general", label: "General" },
  { value: "clothing", label: "Clothing & Apparel" },
  { value: "shoes", label: "Shoes & Footwear" },
  { value: "electronics", label: "Electronics" },
  { value: "grocery", label: "Grocery & Food" },
] as const;

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const COMMON_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#22C55E" },
  { name: "Yellow", hex: "#EAB308" },
  { name: "Purple", hex: "#A855F7" },
  { name: "Pink", hex: "#EC4899" },
  { name: "Orange", hex: "#F97316" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Brown", hex: "#92400E" },
  { name: "Navy", hex: "#1E3A5F" },
];

const AdminProducts = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [activeMainTab, setActiveMainTab] = useState("list");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, categories(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, parent_id").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  // Product page layout settings
  const { data: layoutSettingsRow } = useQuery({
    queryKey: ["admin-product-page-layout"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "product_page_layout").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [pageLayout, setPageLayout] = useState("premium");

  useState(() => {
    if (layoutSettingsRow?.value) {
      const val = layoutSettingsRow.value as any;
      setPageLayout(val?.value ?? val ?? "premium");
    }
  });

  const saveLayoutMutation = useMutation({
    mutationFn: async () => {
      const jsonValue = { value: pageLayout } as any;
      if (layoutSettingsRow) {
        await supabase.from("site_settings").update({ value: jsonValue }).eq("id", layoutSettingsRow.id);
      } else {
        await supabase.from("site_settings").insert({ key: "product_page_layout", value: jsonValue });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product-page-layout"] });
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
      toast.success("Product page layout saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveMutation = useMutation({
    mutationFn: async (product: any) => {
      const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const payload = { ...product, slug };
      delete payload.categories;
      if (product.id) {
        const { error } = await supabase.from("products").update(payload as any).eq("id", product.id);
        if (error) throw error;
      } else {
        delete payload.id;
        const { error } = await supabase.from("products").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setDialogOpen(false);
      setEditing(null);
      toast.success("Product saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filtered = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  const openEdit = (product?: any) => {
    setEditing(
      product
        ? { ...product, specifications: product.specifications || {} }
        : {
            name: "", slug: "", price: 0, stock_quantity: 0, description: "",
            short_description: "", is_active: true, is_featured: false,
            thumbnail: "", images: [], tags: [], category_id: null,
            video_url: "", meta_title: "", meta_description: "", meta_keywords: "",
            specifications: { product_type: "general", sizes: [], colors: [], weight: "", weight_unit: "kg", specs: [] },
          }
    );
    setDialogOpen(true);
  };

  const updateField = (field: string, value: any) => {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Get selected parent category id for subcategory filtering
  const selectedCategoryId = editing?.category_id;
  const selectedParent = categories.find((c) => c.id === selectedCategoryId);
  const isSubcategory = selectedParent?.parent_id != null;
  const effectiveParentId = isSubcategory ? selectedParent?.parent_id : selectedCategoryId;

  const addImage = (url: string) => {
    if (!editing) return;
    const current = editing.images || [];
    if (current.length >= 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    updateField("images", [...current, url]);
  };

  const removeImage = (index: number) => {
    if (!editing) return;
    const current = [...(editing.images || [])];
    current.splice(index, 1);
    updateField("images", current);
  };

  const specs = editing?.specifications || {};
  const productType = specs.product_type || "general";

  const updateSpec = (key: string, value: any) => {
    updateField("specifications", { ...specs, [key]: value });
  };

  const toggleSize = (size: string) => {
    const current = specs.sizes || [];
    updateSpec("sizes", current.includes(size) ? current.filter((s: string) => s !== size) : [...current, size]);
  };

  const toggleColor = (color: string) => {
    const current = specs.colors || [];
    updateSpec("colors", current.includes(color) ? current.filter((c: string) => c !== color) : [...current, color]);
  };

  const addSpecRow = () => {
    const current = specs.specs || [];
    updateSpec("specs", [...current, { key: "", value: "" }]);
  };

  const updateSpecRow = (index: number, field: string, value: string) => {
    const current = [...(specs.specs || [])];
    current[index] = { ...current[index], [field]: value };
    updateSpec("specs", current);
  };

  const removeSpecRow = (index: number) => {
    const current = [...(specs.specs || [])];
    current.splice(index, 1);
    updateSpec("specs", current);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Products</h1>
        <Button onClick={() => openEdit()} className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

      <Tabs value={activeMainTab} onValueChange={setActiveMainTab}>
        <TabsList>
          <TabsTrigger value="list">All Products</TabsTrigger>
          <TabsTrigger value="page-layout" className="flex items-center gap-1">
            <LayoutTemplate className="w-3.5 h-3.5" /> Page Layout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>

          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
                ) : filtered.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.categories?.name || "—"}</TableCell>
                    <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                    <TableCell>{p.stock_quantity}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {(p.specifications as any)?.product_type || "general"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Product Page Layout */}
        <TabsContent value="page-layout" className="mt-4">
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
                      onClick={() => setPageLayout(opt.id)}
                      className={`text-left p-4 rounded-2xl border-2 transition-all ${
                        pageLayout === opt.id
                          ? "border-primary bg-primary/10"
                          : "border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <p className="font-semibold text-foreground text-sm">{opt.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
                      {pageLayout === opt.id && (
                        <Badge variant="default" className="mt-2">Active</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Button className="w-full" onClick={() => saveLayoutMutation.mutate()} disabled={saveLayoutMutation.isPending}>
              {saveLayoutMutation.isPending ? "Saving..." : "Save Product Page Settings"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full flex-wrap">
                <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
                <TabsTrigger value="attributes" className="flex-1">Attributes</TabsTrigger>
                <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
                <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div><Label>Name</Label><Input value={editing.name ?? ""} onChange={(e) => updateField("name", e.target.value)} /></div>
                <div><Label>Slug</Label><Input value={editing.slug ?? ""} onChange={(e) => updateField("slug", e.target.value)} placeholder="auto-generated" /></div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={effectiveParentId ?? "none"}
                      onValueChange={(v) => updateField("category_id", v === "none" ? null : v)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {parentCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Subcategory</Label>
                    <Select
                      value={isSubcategory ? selectedCategoryId : "none"}
                      onValueChange={(v) => updateField("category_id", v === "none" ? effectiveParentId : v)}
                      disabled={!effectiveParentId || effectiveParentId === "none"}
                    >
                      <SelectTrigger><SelectValue placeholder="Select subcategory" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {effectiveParentId && effectiveParentId !== "none" && getChildren(effectiveParentId).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Price</Label><Input type="number" value={editing.price ?? 0} onChange={(e) => updateField("price", +e.target.value)} /></div>
                  <div><Label>Compare Price</Label><Input type="number" value={editing.compare_at_price ?? ""} onChange={(e) => updateField("compare_at_price", e.target.value ? +e.target.value : null)} /></div>
                  <div><Label>Stock</Label><Input type="number" value={editing.stock_quantity ?? 0} onChange={(e) => updateField("stock_quantity", +e.target.value)} /></div>
                </div>

                <div><Label>Short Description</Label><Input value={editing.short_description ?? ""} onChange={(e) => updateField("short_description", e.target.value)} /></div>
                <div><Label>Description</Label><Textarea value={editing.description ?? ""} onChange={(e) => updateField("description", e.target.value)} rows={3} /></div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2"><Switch checked={editing.is_active ?? true} onCheckedChange={(v) => updateField("is_active", v)} /><Label>Active</Label></div>
                  <div className="flex items-center gap-2"><Switch checked={editing.is_featured ?? false} onCheckedChange={(v) => updateField("is_featured", v)} /><Label>Featured</Label></div>
                </div>
              </TabsContent>

              {/* Attributes Tab */}
              <TabsContent value="attributes" className="space-y-4 mt-4">
                <div>
                  <Label>Product Type</Label>
                  <Select value={productType} onValueChange={(v) => updateSpec("product_type", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRODUCT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Select the product type to show relevant attribute fields.</p>
                </div>

                {/* Colors — available for all types except grocery */}
                {productType !== "grocery" && (
                  <div>
                    <Label>Available Colors</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {COMMON_COLORS.map((c) => {
                        const selected = (specs.colors || []).includes(c.name);
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => toggleColor(c.name)}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                              selected ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            <span className="w-3.5 h-3.5 rounded-full border border-border/50 shrink-0" style={{ background: c.hex }} />
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-2">
                      <Input
                        placeholder="Add custom color name..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                            toggleColor((e.target as HTMLInputElement).value.trim());
                            (e.target as HTMLInputElement).value = "";
                          }
                        }}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Sizes — for clothing */}
                {(productType === "clothing") && (
                  <div>
                    <Label>Available Sizes</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {CLOTHING_SIZES.map((size) => {
                        const selected = (specs.sizes || []).includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
                              selected ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sizes — for shoes */}
                {(productType === "shoes") && (
                  <div>
                    <Label>Available Sizes (EU)</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {SHOE_SIZES.map((size) => {
                        const selected = (specs.sizes || []).includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => toggleSize(size)}
                            className={`px-3 py-1.5 rounded-lg border-2 text-xs font-bold transition-all ${
                              selected ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-primary/30"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Weight — for grocery */}
                {(productType === "grocery") && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Weight</Label>
                      <Input
                        type="number"
                        value={specs.weight || ""}
                        onChange={(e) => updateSpec("weight", e.target.value)}
                        placeholder="e.g. 500"
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <Select value={specs.weight_unit || "kg"} onValueChange={(v) => updateSpec("weight_unit", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="g">Grams (g)</SelectItem>
                          <SelectItem value="kg">Kilograms (kg)</SelectItem>
                          <SelectItem value="lb">Pounds (lb)</SelectItem>
                          <SelectItem value="oz">Ounces (oz)</SelectItem>
                          <SelectItem value="ml">Milliliters (ml)</SelectItem>
                          <SelectItem value="l">Liters (L)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Specifications — for electronics */}
                {(productType === "electronics") && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Technical Specifications</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSpecRow} className="gap-1">
                        <Plus className="w-3 h-3" /> Add Spec
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(specs.specs || []).map((spec: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={spec.key}
                            onChange={(e) => updateSpecRow(i, "key", e.target.value)}
                            placeholder="e.g. Processor"
                            className="h-9 flex-1"
                          />
                          <Input
                            value={spec.value}
                            onChange={(e) => updateSpecRow(i, "value", e.target.value)}
                            placeholder="e.g. Snapdragon 8 Gen 3"
                            className="h-9 flex-1"
                          />
                          <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => removeSpecRow(i)}>
                            <X className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      {(specs.specs || []).length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No specs added yet. Click "Add Spec" to start.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Custom key-value pairs for any type */}
                {productType === "general" && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Custom Attributes</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addSpecRow} className="gap-1">
                        <Plus className="w-3 h-3" /> Add Attribute
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(specs.specs || []).map((spec: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input value={spec.key} onChange={(e) => updateSpecRow(i, "key", e.target.value)} placeholder="Attribute name" className="h-9 flex-1" />
                          <Input value={spec.value} onChange={(e) => updateSpecRow(i, "value", e.target.value)} placeholder="Value" className="h-9 flex-1" />
                          <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={() => removeSpecRow(i)}>
                            <X className="w-3.5 h-3.5 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="media" className="space-y-4 mt-4">
                <div>
                  <Label>Thumbnail</Label>
                  <ImageUpload bucket="products" folder="thumbnails" value={editing.thumbnail ?? ""} onUploaded={(url) => updateField("thumbnail", url)} />
                </div>

                <div>
                  <Label>Product Images (up to 5)</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {(editing.images || []).map((img: string, i: number) => (
                      <div key={i} className="relative group">
                        <img src={img} alt={`Product ${i + 1}`} className="w-full h-24 object-cover rounded-xl border border-border" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {(editing.images || []).length < 5 && (
                      <ImageUpload bucket="products" folder="images" value="" onUploaded={addImage} />
                    )}
                  </div>
                </div>

                <div>
                  <Label>Video URL</Label>
                  <Input
                    value={editing.video_url ?? ""}
                    onChange={(e) => updateField("video_url", e.target.value)}
                    placeholder="YouTube or direct video URL"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Paste a YouTube link or direct video file URL</p>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input value={editing.meta_title ?? ""} onChange={(e) => updateField("meta_title", e.target.value)} placeholder="Product page title (max 60 chars)" maxLength={60} />
                  <p className="text-xs text-muted-foreground mt-1">{(editing.meta_title ?? "").length}/60</p>
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea value={editing.meta_description ?? ""} onChange={(e) => updateField("meta_description", e.target.value)} placeholder="Product page description (max 160 chars)" rows={3} maxLength={160} />
                  <p className="text-xs text-muted-foreground mt-1">{(editing.meta_description ?? "").length}/160</p>
                </div>
                <div>
                  <Label>Meta Keywords</Label>
                  <Input value={editing.meta_keywords ?? ""} onChange={(e) => updateField("meta_keywords", e.target.value)} placeholder="keyword1, keyword2, keyword3" />
                </div>
              </TabsContent>

              <Button className="w-full mt-4" onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Product"}
              </Button>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProducts;
