import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FilterChips from "@/components/admin/FilterChips";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Trash2, Star, Image as ImageIcon } from "lucide-react";
import { toast } from "@/lib/app-toast";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

const AdminReviews = () => {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*, products(name)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleApproval = useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase.from("reviews").update({ is_approved: approved }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); toast.success("Updated"); },
    onError: (e) => toast.error(e.message),
  });

  const deleteReview = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-reviews"] }); toast.success("Deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const statusCounts = {
    approved: reviews.filter((r: any) => r.is_approved).length,
    pending: reviews.filter((r: any) => !r.is_approved).length,
  };

  const filtered = filterStatus === "all"
    ? reviews
    : filterStatus === "approved"
      ? reviews.filter((r: any) => r.is_approved)
      : reviews.filter((r: any) => !r.is_approved);

  const ratingCounts: Record<string, number> = {};
  reviews.forEach((r: any) => {
    const key = `${r.rating}★`;
    ratingCounts[key] = (ratingCounts[key] || 0) + 1;
  });

  const filterOptions = [
    { value: "all", label: "All", count: reviews.length },
    { value: "pending", label: "Pending", count: statusCounts.pending },
    { value: "approved", label: "Approved", count: statusCounts.approved },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold">Reviews</h1>

      <FilterChips options={filterOptions} value={filterStatus} onChange={setFilterStatus} />

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.products?.name ?? "—"}</TableCell>
                <TableCell><div className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />{r.rating}</div></TableCell>
                <TableCell className="max-w-xs truncate">{r.comment || r.title || "—"}</TableCell>
                <TableCell><Badge variant={r.is_approved ? "default" : "secondary"}>{r.is_approved ? "Approved" : "Pending"}</Badge></TableCell>
                <TableCell>{format(new Date(r.created_at), "MMM d")}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => toggleApproval.mutate({ id: r.id, approved: !r.is_approved })}>
                    {r.is_approved ? <X className="h-4 w-4" /> : <Check className="h-4 w-4 text-primary" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteReview.mutate(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminReviews;
