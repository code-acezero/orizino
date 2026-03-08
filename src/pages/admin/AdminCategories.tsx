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
import { Plus, Pencil, Trash2, ChevronRight, Check, X } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/lib/app-toast";
import ImageUpload from "@/components/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";

const AdminCategories = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter((c) => c.parent_id === parentId);

  const saveMutation = useMutation({
    mutationFn: async (cat: any) => {
      const slug = cat.slug || cat.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const payload = { ...cat, slug };
      delete payload.children;
      if (cat.id) {
        const { error } = await supabase.from("categories").update(payload as any).eq("id", cat.id);
        if (error) throw error;
      } else {
        delete payload.id;
        const { error } = await supabase.from("categories").insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setDialogOpen(false);
      toast.success("Category saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkAction = useMutation({
    mutationFn: async ({ ids, action, status }: { ids: string[]; action: "delete" | "activate" | "deactivate"; status?: string }) => {
      if (action === "delete") {
        const { error } = await supabase.from("categories").delete().in("id", ids);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").update({ is_active: action === "activate" }).in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setSelected(new Set());
      toast.success("Bulk action completed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === categories.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(categories.map((c) => c.id)));
    }
  };

  const someSelected = selected.size > 0;

  const openEdit = (cat?: any) => {
    setEditing(
      cat
        ? { ...cat }
        : {
            name: "", slug: "", is_active: true, is_featured: false, sort_order: 0,
            icon: "", icon_url: "", image_url: "", description: "", parent_id: null,
            accent_color: "#6366f1", banner_url: "", banner_type: "image", youtube_url: "",
            meta_title: "", meta_description: "", meta_keywords: "",
          }
    );
    setDialogOpen(true);
  };

  const updateField = (field: string, value: any) => {
    setEditing((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Categories</h1>
        <Button onClick={() => openEdit()} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selected.size === categories.length && categories.length > 0}
                  onCheckedChange={toggleSelectAll}
                  disabled={categories.length === 0}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No categories yet.</TableCell>
              </TableRow>
            ) : (
              parentCategories.map((c) => {
                const children = getChildren(c.id);
                return (
                  <tbody key={c.id}>
                    <TableRow>
                      <TableCell className="w-12">
                        <Checkbox
                          checked={selected.has(c.id)}
                          onCheckedChange={() => toggleSelect(c.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium flex items-center gap-2">
                        {c.icon_url ? (
                          <img src={c.icon_url} alt="" className="w-6 h-6 rounded object-contain" />
                        ) : c.icon ? (
                          <span>{c.icon}</span>
                        ) : null}
                        {c.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.slug}</TableCell>
                      <TableCell>
                        <div className="w-6 h-6 rounded-full border border-border" style={{ background: c.accent_color || "#6366f1" }} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">—</TableCell>
                      <TableCell>
                        <Badge variant={c.is_featured ? "default" : "outline"}>
                          {c.is_featured ? "Featured" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.is_active ? "default" : "secondary"}>
                          {c.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete category?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete "{c.name}". This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(c.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                    {children.map((sub) => (
                      <TableRow key={sub.id} className="bg-secondary/10">
                        <TableCell className="font-medium pl-8 flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 text-muted-foreground" />
                          {sub.icon_url ? (
                            <img src={sub.icon_url} alt="" className="w-5 h-5 rounded object-contain" />
                          ) : sub.icon ? (
                            <span>{sub.icon}</span>
                          ) : null}
                          {sub.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{sub.slug}</TableCell>
                        <TableCell>
                          <div className="w-5 h-5 rounded-full border border-border" style={{ background: sub.accent_color || "#6366f1" }} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{c.name}</TableCell>
                        <TableCell>
                          <Badge variant={sub.is_featured ? "default" : "outline"}>
                            {sub.is_featured ? "Featured" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sub.is_active ? "default" : "secondary"}>
                            {sub.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(sub)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete subcategory?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete "{sub.name}". This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(sub.id)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit" : "Add"} Category</DialogTitle>
          </DialogHeader>
          {editing && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
                <TabsTrigger value="appearance" className="flex-1">Appearance</TabsTrigger>
                <TabsTrigger value="seo" className="flex-1">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div>
                  <Label>Name</Label>
                  <Input value={editing.name ?? ""} onChange={(e) => updateField("name", e.target.value)} />
                </div>
                <div>
                  <Label>Slug</Label>
                  <Input value={editing.slug ?? ""} onChange={(e) => updateField("slug", e.target.value)} placeholder="auto-generated" />
                </div>
                <div>
                  <Label>Parent Category</Label>
                  <Select
                    value={editing.parent_id ?? "none"}
                    onValueChange={(v) => updateField("parent_id", v === "none" ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None (top-level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (top-level)</SelectItem>
                      {parentCategories
                        .filter((p) => p.id !== editing.id)
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={editing.description ?? ""} onChange={(e) => updateField("description", e.target.value)} rows={2} />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <Input type="number" value={editing.sort_order ?? 0} onChange={(e) => updateField("sort_order", +e.target.value)} />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch checked={editing.is_active ?? true} onCheckedChange={(v) => updateField("is_active", v)} />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editing.is_featured ?? false} onCheckedChange={(v) => updateField("is_featured", v)} />
                    <Label>Featured</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-4 mt-4">
                <div>
                  <Label>Custom Icon (upload image)</Label>
                  <ImageUpload
                    bucket="banners"
                    folder="category-icons"
                    value={editing.icon_url ?? ""}
                    onUploaded={(url) => updateField("icon_url", url)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Or use an emoji fallback:</p>
                  <Input value={editing.icon ?? ""} onChange={(e) => updateField("icon", e.target.value)} placeholder="🛍️" className="mt-1" />
                </div>
                <div>
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3 mt-1">
                    <input
                      type="color"
                      value={editing.accent_color || "#6366f1"}
                      onChange={(e) => updateField("accent_color", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
                    />
                    <Input
                      value={editing.accent_color || "#6366f1"}
                      onChange={(e) => updateField("accent_color", e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Used as theme accent on the category page</p>
                </div>
                <div>
                  <Label>Category Image</Label>
                  <ImageUpload bucket="banners" folder="categories" value={editing.image_url ?? ""} onUploaded={(url) => updateField("image_url", url)} />
                </div>

                {/* Banner Section */}
                <div className="border-t border-border pt-4">
                  <Label className="text-base font-semibold">Category Banner</Label>
                  <p className="text-xs text-muted-foreground mb-3">Shows at the top of the category page with a fading shadow overlay</p>

                  <div className="space-y-3">
                    <div>
                      <Label>Banner Type</Label>
                      <Select
                        value={editing.banner_type ?? "image"}
                        onValueChange={(v) => updateField("banner_type", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image / GIF</SelectItem>
                          <SelectItem value="youtube">YouTube Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(editing.banner_type ?? "image") === "image" ? (
                      <div>
                        <Label>Banner Image / GIF</Label>
                        <ImageUpload
                          bucket="banners"
                          folder="category-banners"
                          value={editing.banner_url ?? ""}
                          onUploaded={(url) => updateField("banner_url", url)}
                          accept="image/*,.gif"
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>YouTube URL</Label>
                        <Input
                          value={editing.youtube_url ?? ""}
                          onChange={(e) => updateField("youtube_url", e.target.value)}
                          placeholder="https://youtube.com/watch?v=..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4 mt-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input value={editing.meta_title ?? ""} onChange={(e) => updateField("meta_title", e.target.value)} placeholder="Category page title (max 60 chars)" maxLength={60} />
                  <p className="text-xs text-muted-foreground mt-1">{(editing.meta_title ?? "").length}/60</p>
                </div>
                <div>
                  <Label>Meta Description</Label>
                  <Textarea value={editing.meta_description ?? ""} onChange={(e) => updateField("meta_description", e.target.value)} placeholder="Category page description (max 160 chars)" rows={3} maxLength={160} />
                  <p className="text-xs text-muted-foreground mt-1">{(editing.meta_description ?? "").length}/160</p>
                </div>
                <div>
                  <Label>Meta Keywords</Label>
                  <Input value={editing.meta_keywords ?? ""} onChange={(e) => updateField("meta_keywords", e.target.value)} placeholder="keyword1, keyword2, keyword3" />
                </div>
              </TabsContent>

              <Button className="w-full mt-4" onClick={() => saveMutation.mutate(editing)} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : "Save Category"}
              </Button>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
