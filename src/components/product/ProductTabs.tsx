import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, MessageSquare, FileText, Sparkles } from "lucide-react";
import ReviewForm from "@/components/ReviewForm";
import ReviewCard from "@/components/ReviewCard";

interface Review {
  id: string;
  product_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  is_approved?: boolean;
}

interface ProductTabsProps {
  product: {
    id: string;
    description?: string | null;
    specifications?: Record<string, string> | null;
  };
  reviews: Review[];
  ownReviewIds: Set<string>;
  layout?: "minimal" | "premium" | "editorial";
}

const ProductTabs: React.FC<ProductTabsProps> = ({ product, reviews, ownReviewIds, layout = "premium" }) => {
  const specs = product.specifications;
  const isMinimal = layout === "minimal";

  return (
    <Tabs defaultValue="description" className="w-full overflow-visible">
      <TabsList className="w-full justify-start gap-0 bg-transparent border-b border-border/50 rounded-none p-0 h-auto overflow-x-auto scrollbar-none">
        {[
          { value: "description", icon: FileText, label: "Description" },
          { value: "specs", icon: Sparkles, label: "Specs" },
          { value: "reviews", icon: Star, label: `Reviews (${reviews.length})` },
        ].map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2.5 sm:px-4 pb-2.5 sm:pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm whitespace-nowrap shrink-0"
          >
            <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Description */}
      <TabsContent value="description" className="mt-4 sm:mt-6">
        {product.description ? (
          <div className={`${isMinimal ? "" : "glass-strong rounded-2xl sm:rounded-3xl p-3 sm:p-6"}`}>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words">{product.description}</p>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs sm:text-sm">No description available.</p>
        )}
      </TabsContent>

      {/* Specifications */}
      <TabsContent value="specs" className="mt-4 sm:mt-6">
        {specs && Object.keys(specs).length > 0 ? (
          <div className={`${isMinimal ? "divide-y divide-border/50" : "glass-strong rounded-2xl sm:rounded-3xl overflow-hidden"}`}>
            {Object.entries(specs).map(([key, val], i) => (
              <div key={key} className={`flex justify-between gap-2 text-xs sm:text-sm px-3 sm:px-6 py-2.5 sm:py-3.5 ${
                !isMinimal && i % 2 === 0 ? "bg-secondary/20" : ""
              }`}>
                <span className="text-muted-foreground font-medium shrink-0">{key}</span>
                <span className="text-foreground font-semibold text-right break-words min-w-0">{val}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-xs sm:text-sm">No specifications available.</p>
        )}
      </TabsContent>

      {/* Reviews */}
      <TabsContent value="reviews" className="mt-4 sm:mt-6 space-y-4 sm:space-y-6">
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          <ReviewForm productId={product.id} />
        </div>
        {reviews.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                isOwn={ownReviewIds.has(review.id)}
                productId={product.id}
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ProductTabs;
