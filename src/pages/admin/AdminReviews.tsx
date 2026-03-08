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
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

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
              <TableHead>Images</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
            ) : filtered.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.products?.name ?? "—"}</TableCell>
                <TableCell><div className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />{r.rating}</div></TableCell>
                <TableCell className="max-w-xs truncate">{r.comment || r.title || "—"}</TableCell>
                <TableCell>
                  {r.images && r.images.length > 0 ? (
                    <div className="flex gap-1">
                      {r.images.slice(0, 3).map((img: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setLightboxImg(img)}
                          className="w-10 h-10 rounded-lg overflow-hidden hover:ring-2 ring-primary/40 transition-all shrink-0"
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ))}
                      {r.images.length > 3 && (
                        <span className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground font-medium">
                          +{r.images.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground/40"><ImageIcon className="w-4 h-4" /></span>
                  )}
                </TableCell>
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

      {/* Image Lightbox */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-xl flex items-center justify-center"
            onClick={() => setLightboxImg(null)}
          >
            <button className="absolute top-6 right-6 glass rounded-full p-3 text-foreground hover:text-primary z-10" onClick={() => setLightboxImg(null)}>
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={lightboxImg}
              alt="Review photo"
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminReviews;
