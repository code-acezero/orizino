import React, { useState } from "react";
import { Star, Send, PackageCheck } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/lib/app-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ReviewFormProps {
  productId: string;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ productId }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Check if user has a delivered order containing this product
  const { data: hasDeliveredOrder, isLoading: checkingEligibility } = useQuery({
    queryKey: ["review-eligibility", user?.id, productId],
    queryFn: async () => {
      // Check orders with status 'delivered' then verify order_items contain this product
      const { data: deliveredOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("user_id", user!.id)
        .eq("status", "delivered");
      if (!deliveredOrders || deliveredOrders.length === 0) return false;
      const orderIds = deliveredOrders.map((o) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("id")
        .in("order_id", orderIds)
        .eq("product_id", productId)
        .limit(1);
      return (items && items.length > 0) || false;
    },
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="glass-strong rounded-3xl p-6 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Sign in to leave a review for this product.</p>
        <a href="/auth" className="btn-pill bg-gradient-primary text-primary-foreground font-semibold py-2 px-5 text-sm whitespace-nowrap">
          Sign In
        </a>
      </div>
    );
  }

  if (checkingEligibility) return null;

  if (!hasDeliveredOrder) {
    return (
      <div className="glass-strong rounded-3xl p-6 flex items-center gap-3 text-muted-foreground">
        <PackageCheck className="w-5 h-5 shrink-0" />
        <p className="text-sm">You can write a review after your order has been delivered.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({ title: "Please select a rating", variant: "destructive" });
      return;
    }
    if (!comment.trim()) {
      toast({ title: "Please write a comment", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: user.id,
      rating,
      title: title.trim() || null,
      comment: comment.trim(),
    });

    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Review submitted!", description: "It will appear after admin approval." });
      setRating(0);
      setTitle("");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    }
  };

  const displayRating = hoveredRating || rating;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-3xl p-6"
    >
      <h3 className="font-display font-semibold text-foreground text-lg mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Star Rating */}
        <div>
          <Label className="text-sm text-muted-foreground mb-2 block">Your Rating</Label>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i + 1)}
                onMouseEnter={() => setHoveredRating(i + 1)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-0.5 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-7 h-7 transition-colors ${
                    i < displayRating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
            {displayRating > 0 && (
              <span className="text-sm text-muted-foreground ml-2 self-center">
                {displayRating}/5
              </span>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="review-title" className="text-sm text-muted-foreground">
            Title (optional)
          </Label>
          <Input
            id="review-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength={100}
            className="mt-1 rounded-xl"
          />
        </div>

        {/* Comment */}
        <div>
          <Label htmlFor="review-comment" className="text-sm text-muted-foreground">
            Your Review
          </Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you like or dislike about this product?"
            maxLength={1000}
            rows={4}
            className="mt-1 rounded-xl"
          />
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={submitting}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-pill bg-gradient-primary text-primary-foreground font-semibold py-2.5 px-6 flex items-center gap-2 disabled:opacity-50"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Submit Review
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ReviewForm;
