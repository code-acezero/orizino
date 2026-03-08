import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminHome = () => {
  const qc = useQueryClient();

  // Featured categories (Shop by Category grid)
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name, slug, is_featured, sort_order, is_active").is("parent_id", null).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  // Featured products
  const { data: products = [] } = useQuery({
    queryKey: ["admin-home-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, slug, is_featured, is_active, thumbnail, price").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Home category sections (from site_settings)
  const { data: settingsRow } = useQuery({
    queryKey: ["admin-home-cat-sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("key", "home_category_sections").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [catSections, setCatSections] = useState<{ category_id: string; sort_order: number; product_count: number }[]>([]);

  useEffect(() => {
    if (settingsRow?.value) {
      const val = settingsRow.value as any;
      const sections = val?.value ?? val;
      if (Array.isArray(sections)) setCatSections(sections);
    }
  }, [settingsRow]);

  const saveCatSections = useMutation({
    mutationFn: async (sections: typeof catSections) => {
      const jsonValue = { value: sections } as any;
      if (settingsRow) {
        const { error } = await supabase.from("site_settings").update({ value: jsonValue }).eq("id", settingsRow.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key: "home_category_sections", value: jsonValue });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-home-cat-sections"] });
      qc.invalidateQueries({ queryKey: ["home-category-sections"] });
      toast.success("Category sections saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const addSection = () => {
    setCatSections([...catSections, { category_id: "", sort_order: catSections.length, product_count: 8 }]);
  };

  const removeSection = (index: number) => {
    setCatSections(catSections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: string, value: any) => {
    const updated = [...catSections];
    updated[index] = { ...updated[index], [field]: value };
    setCatSections(updated);
  };

  const toggleCatFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase.from("categories").update({ is_featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-home-categories"] });
      toast.success("Updated");
    },
  });

  const updateCatOrder = useMutation({
    mutationFn: async ({ id, sort_order }: { id: string; sort_order: number }) => {
      const { error } = await supabase.from("categories").update({ sort_order }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-home-categories"] }),
  });

  const toggleProdFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase.from("products").update({ is_featured }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-home-products"] });
      toast.success("Updated");
    },
  });

  // Get category name by id
  const getCatName = (id: string) => categories.find((c) => c.id === id)?.name || "Unknown";
  // Categories not yet added
  const availableCategories = categories.filter((c) => !catSections.some((s) => s.category_id === c.id));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Home Page Management</h1>

      <Tabs defaultValue="cat-sections">
        <TabsList>
          <TabsTrigger value="cat-sections">Category Sections</TabsTrigger>
          <TabsTrigger value="categories">Featured Categories</TabsTrigger>
          <TabsTrigger value="products">Featured Products</TabsTrigger>
        </TabsList>

        {/* Category Sections - which category products show on home */}
        <TabsContent value="cat-sections">
          <Card className="glass">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Home Category Product Sections</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Choose which categories display their products on the home page and in what order.
                  </p>
                </div>
                <Button onClick={addSection} size="sm" disabled={availableCategories.length === 0}>
                  <Plus className="w-4 h-4 mr-1" />Add Section
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {catSections.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No category sections added yet. Click "Add Section" to show a category's products on the home page.</p>
              )}
              {catSections.map((section, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/20">
                  <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Select
                        value={section.category_id}
                        onValueChange={(v) => updateSection(index, "category_id", v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {section.category_id && (
                            <SelectItem value={section.category_id}>{getCatName(section.category_id)}</SelectItem>
                          )}
                          {availableCategories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Position</Label>
                      <Input
                        type="number"
                        value={section.sort_order}
                        onChange={(e) => updateSection(index, "sort_order", Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Products to Show</Label>
                      <Input
                        type="number"
                        value={section.product_count}
                        onChange={(e) => updateSection(index, "product_count", Number(e.target.value))}
                        min={1}
                        max={20}
                      />
                    </div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeSection(index)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
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

        <TabsContent value="categories">
          <Card className="glass">
            <CardHeader>
              <CardTitle>Categories on Home Page</CardTitle>
              <p className="text-sm text-muted-foreground">Toggle which categories appear in the "Shop by Category" section and set their display order.</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Sort Order</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-20"
                          defaultValue={cat.sort_order}
                          onBlur={(e) => updateCatOrder.mutate({ id: cat.id, sort_order: Number(e.target.value) })}
                        />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={cat.is_featured}
                          onCheckedChange={(v) => toggleCatFeatured.mutate({ id: cat.id, is_featured: v })}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={cat.is_active ? "default" : "secondary"}>{cat.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
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
              <p className="text-sm text-muted-foreground">Toggle which products appear in the "Featured Products" section.</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell>
                        {prod.thumbnail && <img src={prod.thumbnail} alt="" className="w-10 h-10 object-cover rounded-lg" />}
                      </TableCell>
                      <TableCell className="font-medium">{prod.name}</TableCell>
                      <TableCell>${Number(prod.price).toFixed(2)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={prod.is_featured}
                          onCheckedChange={(v) => toggleProdFeatured.mutate({ id: prod.id, is_featured: v })}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={prod.is_active ? "default" : "secondary"}>{prod.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminHome;
