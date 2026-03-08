import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ChevronRight, Check, X, FolderTree, Search, Eye, EyeOff, Star } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "@/lib/app-toast";
import ImageUpload from "@/components/ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

const AdminCategories = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

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

  // Filter by search
  const filteredParents = parentCategories.filter((c) => {
    const q = search.toLowerCase();
    if (!q) return true;
    const children = getChildren(c.id);
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || children.some((ch) => ch.name.toLowerCase().includes(q));
  });

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
    mutationFn: async ({ ids, action }: { ids: string[]; action: "delete" | "activate" | "deactivate" }) => {
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
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === categories.length) setSelected(new Set());
    else setSelected(new Set(categories.map((c) => c.id)));
  };

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

  const totalActive = categories.filter((c) => c.is_active).length;
  const totalFeatured = categories.filter((c) => c.is_featured).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <FolderTree className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold">Categories</h1>
            <p className="text-xs text-muted-foreground">{categories.length} total · {totalActive} active · {totalFeatured} featured</p>
          </div>
        </div>
        <Button onClick={() => openEdit()} className="gap-2">
          <Plus className="h-4 w-4" /> Add Category
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Category Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass animate-pulse h-40" />
          ))}
        </div>
      ) : filteredParents.length === 0 ? (
        <Card className="glass">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderTree className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{search ? "No categories match your search" : "No categories yet"}</p>
            {!search && (
              <Button variant="outline" className="mt-3 gap-2" onClick={() => openEdit()}>
                <Plus className="w-4 h-4" /> Create your first category
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredParents.map((c) => {
            const children = getChildren(c.id);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <Card className={`glass group hover:border-primary/30 transition-all relative overflow-hidden ${selected.has(c.id) ? "ring-2 ring-primary/50 border-primary/40" : ""}`}>
                  {/* Accent strip */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c.accent_color || "hsl(var(--primary))" }} />

                  <CardContent className="pt-5 pb-4 px-5">
                    {/* Top row: checkbox + icon + name + actions */}
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selected.has(c.id)}
                        onCheckedChange={() => toggleSelect(c.id)}
                        className="mt-1"
                      />
                      <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.icon_url ? (
                          <img src={c.icon_url} alt="" className="w-full h-full object-contain" />
                        ) : c.icon ? (
                          <span className="text-lg">{c.icon}</span>
                        ) : (
                          <FolderTree className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">/{c.slug}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{c.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete this category and cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(c.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <Badge variant={c.is_active ? "default" : "secondary"} className="text-[10px] gap-1">
                        {c.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {c.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {c.is_featured && (
                        <Badge variant="outline" className="text-[10px] gap-1 text-amber-400 border-amber-500/30">
                          <Star className="w-3 h-3 fill-amber-400" /> Featured
                        </Badge>
                      )}
                      <div className="w-4 h-4 rounded-full border border-border shrink-0 ml-auto" style={{ background: c.accent_color || "#6366f1" }} />
                    </div>

                    {/* Description */}
                    {c.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{c.description}</p>
                    )}

                    {/* Subcategories */}
                    {children.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Subcategories ({children.length})</p>
                        {children.map((sub) => (
                          <div
                            key={sub.id}
                            className={`flex items-center gap-2 p-2 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-colors ${selected.has(sub.id) ? "ring-1 ring-primary/40" : ""}`}
                          >
                            <Checkbox
                              checked={selected.has(sub.id)}
                              onCheckedChange={() => toggleSelect(sub.id)}
                              className="scale-90"
                            />
                            <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                            {sub.icon_url ? (
                              <img src={sub.icon_url} alt="" className="w-5 h-5 rounded object-contain shrink-0" />
                            ) : sub.icon ? (
                              <span className="text-sm">{sub.icon}</span>
                            ) : null}
                            <span className="text-xs font-medium text-foreground flex-1 truncate">{sub.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <Badge variant={sub.is_active ? "default" : "secondary"} className="text-[9px] px-1.5 py-0">
                                {sub.is_active ? "Active" : "Off"}
                              </Badge>
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(sub)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete "{sub.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription>This will permanently delete this subcategory.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate(sub.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 glass-strong border border-border rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-3 z-50"
          >
            <Checkbox
              checked={selected.size === categories.length && categories.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium">{selected.size} selected</span>
            <div className="w-px h-6 bg-border" />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> Activate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Activate {selected.size} categories?</AlertDialogTitle>
                  <AlertDialogDescription>These categories will become visible on the storefront.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => bulkAction.mutate({ ids: Array.from(selected), action: "activate" })} disabled={bulkAction.isPending}>
                    {bulkAction.isPending ? "Activating..." : "Activate"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <EyeOff className="w-3.5 h-3.5" /> Deactivate
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deactivate {selected.size} categories?</AlertDialogTitle>
                  <AlertDialogDescription>These categories will be hidden from the storefront.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => bulkAction.mutate({ ids: Array.from(selected), action: "deactivate" })} disabled={bulkAction.isPending}>
                    {bulkAction.isPending ? "Deactivating..." : "Deactivate"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selected.size} categories?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => bulkAction.mutate({ ids: Array.from(selected), action: "delete" })} disabled={bulkAction.isPending}>
                    {bulkAction.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelected(new Set())}>
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

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
                </div>
                <div>
                  <Label>Category Image</Label>
                  <ImageUpload bucket="banners" folder="categories" value={editing.image_url ?? ""} onUploaded={(url) => updateField("image_url", url)} />
                </div>
                <div className="border-t border-border pt-4">
                  <Label className="text-base font-semibold">Category Banner</Label>
                  <p className="text-xs text-muted-foreground mb-3">Shows at the top of the category page</p>
                  <div className="space-y-3">
                    <div>
                      <Label>Banner Type</Label>
                      <Select
                        value={editing.banner_type ?? "image"}
                        onValueChange={(v) => updateField("banner_type", v)}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image">Image / GIF</SelectItem>
                          <SelectItem value="youtube">YouTube Video</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(editing.banner_type ?? "image") === "image" ? (
                      <div>
                        <Label>Banner Image / GIF</Label>
                        <ImageUpload bucket="banners" folder="category-banners" value={editing.banner_url ?? ""} onUploaded={(url) => updateField("banner_url", url)} accept="image/*,.gif" />
                      </div>
                    ) : (
                      <div>
                        <Label>YouTube URL</Label>
                        <Input value={editing.youtube_url ?? ""} onChange={(e) => updateField("youtube_url", e.target.value)} placeholder="https://youtube.com/watch?v=..." />
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
