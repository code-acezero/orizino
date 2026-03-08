import React, { useState } from "react";
import { Star, Pencil, Trash2, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/lib/app-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    created_at: string;
    is_approved?: boolean;
    images?: string[];
  };
  isOwn: boolean;
  productId: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, isOwn, productId }) => {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title || "");
  const [comment, setComment] = useState(review.comment || "");
  const [saving, setSaving] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const images = review.images || [];

  const handleSave = async () => {
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("reviews")
      .update({ rating, title: title.trim() || null, comment: comment.trim() || null, is_approved: false })
      .eq("id", review.id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to update review", variant: "destructive" });
    } else {
      toast({ title: "Review updated!", description: "It will appear after admin re-approval." });
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["own-reviews", productId] });
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this review?")) return;
    const { error } = await supabase.from("reviews").delete().eq("id", review.id);
    if (error) {
      toast({ title: "Failed to delete review", variant: "destructive" });
    } else {
      toast({ title: "Review deleted" });
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      queryClient.invalidateQueries({ queryKey: ["own-reviews", productId] });
    }
  };

  if (editing) {
    return (
      <div className="glass rounded-3xl p-6 space-y-3 ring-1 ring-primary/20">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => setRating(i + 1)} className="p-0.5">
              <Star className={`w-5 h-5 transition-colors ${i < rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
            </button>
          ))}
        </div>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)" maxLength={100} className="rounded-xl" />
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Your review" maxLength={1000} rows={3} className="rounded-xl" />
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-pill bg-gradient-primary text-primary-foreground text-sm py-1.5 px-4 flex items-center gap-1.5 disabled:opacity-50">
            <Check className="w-3.5 h-3.5" /> Save
          </button>
          <button onClick={() => { setEditing(false); setRating(review.rating); setTitle(review.title || ""); setComment(review.comment || ""); }} className="btn-pill bg-secondary text-secondary-foreground text-sm py-1.5 px-4 flex items-center gap-1.5">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="glass rounded-3xl p-6 relative group">
        {isOwn && (
          <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-full hover:bg-secondary/50 text-muted-foreground hover:text-foreground">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={handleDelete} className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
          ))}
        </div>
        {review.title && <h4 className="font-semibold text-foreground mb-1">{review.title}</h4>}
        {review.comment && <p className="text-muted-foreground text-sm">{review.comment}</p>}

        {/* Review Images */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setLightboxImg(img)}
                className="w-16 h-16 rounded-xl overflow-hidden hover:ring-2 ring-primary/40 transition-all"
              >
                <img src={img} alt={`Review photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <p className="text-xs text-muted-foreground/60">{new Date(review.created_at).toLocaleDateString()}</p>
          {isOwn && review.is_approved === false && (
            <span className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full">Pending approval</span>
          )}
          {isOwn && review.is_approved !== false && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Your review</span>
          )}
        </div>
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
            <button
              className="absolute top-6 right-6 glass rounded-full p-3 text-foreground hover:text-primary z-10"
              onClick={() => setLightboxImg(null)}
            >
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
    </>
  );
};

export default ReviewCard;
