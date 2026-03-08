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

const AdminHome = () => {
  const qc = useQueryClient();

  // Featured categories
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Home Page Management</h1>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">Featured Categories</TabsTrigger>
          <TabsTrigger value="products">Featured Products</TabsTrigger>
        </TabsList>

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
