import { useState } from "react";
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
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";
import ImageUpload from "@/components/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminProducts = () => {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);

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

  const saveMutation = useMutation({
    mutationFn: async (product: Record<string, any>) => {
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
        ? { ...product }
        : {
            name: "", slug: "", price: 0, stock_quantity: 0, description: "",
            short_description: "", is_active: true, is_featured: false,
            thumbnail: "", images: [], tags: [], category_id: null,
            video_url: "", meta_title: "", meta_description: "", meta_keywords: "",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Products</h1>
        <Button onClick={() => openEdit()} className="gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
      </div>

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
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No products found</TableCell></TableRow>
            ) : filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{p.categories?.name || "—"}</TableCell>
                <TableCell>${Number(p.price).toFixed(2)}</TableCell>
                <TableCell>{p.stock_quantity}</TableCell>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
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
