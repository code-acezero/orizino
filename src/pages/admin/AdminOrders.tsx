import { useState } from "react";
import FilterChips from "@/components/admin/FilterChips";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Trash2 } from "lucide-react";
import { toast } from "@/lib/app-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

const statusColors: Record<string, string> = {
  pending: "secondary",
  processing: "default",
  shipped: "outline",
  delivered: "default",
  cancelled: "destructive",
};

const AdminOrders = () => {
  const qc = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const { data: orderItems = [] } = useQuery({
    queryKey: ["admin-order-items", selectedOrder?.id],
    queryFn: async () => {
      if (!selectedOrder) return [];
      const { data, error } = await supabase.from("order_items").select("*").eq("order_id", selectedOrder.id);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedOrder,
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

  const bulkAction = useMutation({
    mutationFn: async ({ ids, action, status }: { ids: string[]; action: "delete" | "status"; status?: string }) => {
      if (action === "delete") {
        // Delete order items first, then orders
        const { error: itemsErr } = await supabase.from("order_items").delete().in("order_id", ids);
        if (itemsErr) throw itemsErr;
        const { error } = await supabase.from("orders").delete().in("id", ids);
        if (error) throw error;
      } else if (action === "status" && status) {
        const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).in("id", ids);
        if (error) throw error;
      }
    },
    onSuccess: (_, { ids, action, status }) => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      setSelected(new Set());
      setBulkStatus(null);
      toast.success(
        action === "delete"
          ? `${ids.length} order${ids.length > 1 ? "s" : ""} deleted`
          : `${ids.length} order${ids.length > 1 ? "s" : ""} updated to ${status}`
      );
    },
    onError: (e: any) => toast.error(e.message),
  });

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  const filterOptions = [
    { value: "all", label: "All", count: orders.length },
    { value: "pending", label: "Pending", count: statusCounts["pending"] || 0 },
    { value: "processing", label: "Processing", count: statusCounts["processing"] || 0 },
    { value: "shipped", label: "Shipped", count: statusCounts["shipped"] || 0 },
    { value: "delivered", label: "Delivered", count: statusCounts["delivered"] || 0 },
    { value: "cancelled", label: "Cancelled", count: statusCounts["cancelled"] || 0 },
  ];

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((o) => o.id)));
  };

  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold">Orders</h1>
      </div>

      <FilterChips options={filterOptions} value={filterStatus} onChange={(v) => { setFilterStatus(v); setSelected(new Set()); }} />

      {/* Bulk action bar */}
      <AnimatePresence>
        {someSelected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 glass rounded-2xl px-4 py-3"
          >
            <span className="text-sm text-foreground font-medium">
              {selected.size} selected
            </span>
            <div className="flex gap-2 ml-auto">
              {/* Bulk status update */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <div className="flex gap-2 items-center">
                    <Select value={bulkStatus ?? ""} onValueChange={setBulkStatus}>
                      <SelectTrigger className="h-9 w-[140px] text-sm">
                        <SelectValue placeholder="Set status..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" disabled={!bulkStatus || bulkAction.isPending}>
                      Update Status
                    </Button>
                  </div>
                </AlertDialogTrigger>
                {bulkStatus && (
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Update order status?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will change the status of {selected.size} order{selected.size > 1 ? "s" : ""} to "{bulkStatus}".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => bulkAction.mutate({ ids: Array.from(selected), action: "status", status: bulkStatus })}>
                        Update
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                )}
              </AlertDialog>

              {/* Bulk delete */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" disabled={bulkAction.isPending}>
                    <Trash2 className="w-4 h-4" /> Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete orders?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selected.size} order{selected.size > 1 ? "s" : ""} and their items. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => bulkAction.mutate({ ids: Array.from(selected), action: "delete" })}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} aria-label="Select all" />
              </TableHead>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No orders found</TableCell></TableRow>
            ) : filtered.map((o) => (
              <TableRow key={o.id} className={selected.has(o.id) ? "bg-primary/5" : ""}>
                <TableCell>
                  <Checkbox checked={selected.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} aria-label={`Select order ${o.order_number}`} />
                </TableCell>
                <TableCell className="font-medium">{o.order_number}</TableCell>
                <TableCell>{format(new Date(o.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell>${Number(o.total).toFixed(2)}</TableCell>
                <TableCell><Badge variant={(statusColors[o.status] as any) ?? "secondary"}>{o.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(o)}><Eye className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Order {selectedOrder?.order_number}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Subtotal:</span> ${Number(selectedOrder.subtotal).toFixed(2)}</div>
                <div><span className="text-muted-foreground">Shipping:</span> ${Number(selectedOrder.shipping_fee).toFixed(2)}</div>
                <div><span className="text-muted-foreground">Total:</span> ${Number(selectedOrder.total).toFixed(2)}</div>
                <div><span className="text-muted-foreground">Payment:</span> {selectedOrder.payment_method}</div>
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
                  value={selectedOrder.status}
                  onValueChange={(v) => {
                    updateStatus.mutate({ id: selectedOrder.id, status: v });
                    setSelectedOrder({ ...selectedOrder, status: v });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tracking Number</Label>
                <div className="flex gap-2">
                  <Input
                    defaultValue={selectedOrder.tracking_number ?? ""}
                    id="tracking-input"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const val = (document.getElementById("tracking-input") as HTMLInputElement)?.value;
                      updateStatus.mutate({ id: selectedOrder.id, status: selectedOrder.status, tracking: val });
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
