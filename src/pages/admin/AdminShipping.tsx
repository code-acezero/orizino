import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit3, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/app-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const emptyMethod = { name: "", description: "", price: 0, estimated_days: "", is_active: true, sort_order: 0, min_order_free: null as number | null };

const AdminShipping: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyMethod);

  const { data: methods, isLoading } = useQuery({
    queryKey: ["admin-shipping"],
    queryFn: async () => {
      const { data } = await supabase.from("shipping_methods").select("*").order("sort_order");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, min_order_free: form.min_order_free || null };
      if (editing) await supabase.from("shipping_methods").update(payload).eq("id", editing.id);
      else await supabase.from("shipping_methods").insert(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
      setDialogOpen(false);
      toast({ title: editing ? "Method updated" : "Method created" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await supabase.from("shipping_methods").delete().eq("id", id); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-shipping"] }); toast({ title: "Deleted" }); },
  });

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("shipping_methods").update({ is_active: !current }).eq("id", id);
    queryClient.invalidateQueries({ queryKey: ["admin-shipping"] });
  };

  const openAdd = () => { setEditing(null); setForm(emptyMethod); setDialogOpen(true); };
  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      name: m.name, description: m.description || "", price: Number(m.price),
      estimated_days: m.estimated_days || "", is_active: m.is_active,
      sort_order: m.sort_order, min_order_free: m.min_order_free ? Number(m.min_order_free) : null,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Shipping Methods</h1>
          <p className="text-sm text-muted-foreground">{methods?.length || 0} methods configured</p>
        </div>
        <Button onClick={openAdd} className="gap-1.5"><Plus className="w-4 h-4" /> Add Method</Button>
      </div>

      <div className="border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Est. Days</TableHead>
              <TableHead>Free Above</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>}
            {methods?.map((m) => (
              <TableRow key={m.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">{m.name}</p>
                      {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>৳{Number(m.price).toFixed(0)}</TableCell>
                <TableCell className="text-sm">{m.estimated_days || "—"}</TableCell>
                <TableCell className="text-sm">{m.min_order_free ? `৳${Number(m.min_order_free).toFixed(0)}` : "—"}</TableCell>
                <TableCell><Switch checked={m.is_active} onCheckedChange={() => toggleActive(m.id, m.is_active)} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(m)}><Edit3 className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteMutation.mutate(m.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Shipping Method" : "New Shipping Method"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Standard Delivery" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Regular delivery across Bangladesh" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Price (৳)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Estimated Days</Label>
                <Input value={form.estimated_days} onChange={(e) => setForm({ ...form, estimated_days: e.target.value })} placeholder="3-5 business days" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Free Above (৳, optional)</Label>
                <Input type="number" value={form.min_order_free ?? ""} onChange={(e) => setForm({ ...form, min_order_free: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="space-y-1.5">
                <Label>Sort Order</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminShipping;
