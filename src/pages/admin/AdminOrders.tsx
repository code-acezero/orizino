import { useState } from "react";
import FilterChips from "@/components/admin/FilterChips";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye } from "lucide-react";
import { toast } from "@/lib/app-toast";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

const statusColors: Record<string, string> = {
  pending: "secondary",
  processing: "default",
  shipped: "outline",
  delivered: "default",
  cancelled: "destructive",
};

const AdminOrders = () => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["admin-order-items", selected?.id],
    queryFn: async () => {
      if (!selected) return [];
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", selected.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selected,
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, tracking }: { id: string; status: string; tracking?: string }) => {
      const update: any = { status, updated_at: new Date().toISOString() };
      if (tracking) update.tracking_number = tracking;
      const { error } = await supabase.from("orders").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Order updated"); },
    onError: (e) => toast.error(e.message),
  });

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  const statuses = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Orders</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => {
          const count = s.value === "all" ? orders.length : (statusCounts[s.value] || 0);
          const isActive = filterStatus === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                isActive
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:bg-secondary/50 hover:border-primary/30"
              }`}
            >
              {s.label}
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold ${
                isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.order_number}</TableCell>
                <TableCell>{format(new Date(o.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell>${Number(o.total).toFixed(2)}</TableCell>
                <TableCell><Badge variant={(statusColors[o.status] as any) ?? "secondary"}>{o.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setSelected(o)}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Order {selected?.order_number}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Subtotal:</span> ${Number(selected.subtotal).toFixed(2)}</div>
                <div><span className="text-muted-foreground">Shipping:</span> ${Number(selected.shipping_fee).toFixed(2)}</div>
                <div><span className="text-muted-foreground">Total:</span> ${Number(selected.total).toFixed(2)}</div>
                <div><span className="text-muted-foreground">Payment:</span> {selected.payment_method}</div>
              </div>

              <div>
                <Label>Items</Label>
                <div className="space-y-2 mt-1">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm p-2 rounded-md bg-muted/50">
                      <span>{item.product_name} × {item.quantity}</span>
                      <span>${Number(item.total_price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Update Status</Label>
                <Select
                  value={selected.status}
                  onValueChange={(v) => {
                    updateStatus.mutate({ id: selected.id, status: v });
                    setSelected({ ...selected, status: v });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tracking Number</Label>
                <div className="flex gap-2">
                  <Input
                    defaultValue={selected.tracking_number ?? ""}
                    id="tracking-input"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const val = (document.getElementById("tracking-input") as HTMLInputElement)?.value;
                      updateStatus.mutate({ id: selected.id, status: selected.status, tracking: val });
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
